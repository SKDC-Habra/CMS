import { Role, type User } from '@prisma/client'
import { jwtVerify, SignJWT, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from './db'
import { canRoleAccess } from './domain-rules'

const SESSION_COOKIE = 'session'
const SESSION_DAYS = 30

export type SessionPayload = JWTPayload & {
    userId: string
    role: Role
    expires: string
}

function getSessionSecret() {
    const secret = process.env.SESSION_SECRET

    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('SESSION_SECRET is required in production.')
    }

    return new TextEncoder().encode(secret || 'development-session-secret')
}

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DAYS}d`)
        .sign(getSessionSecret())
}

export async function decrypt(input: string): Promise<SessionPayload> {
    const { payload } = await jwtVerify(input, getSessionSecret(), {
        algorithms: ['HS256'],
    })

    return payload as SessionPayload
}

export async function login(userId: string, role: Role) {
    const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
    const session = await encrypt({ userId, role, expires: expires.toISOString() })
    const cookieStore = await cookies()

    cookieStore.set(SESSION_COOKIE, session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    })
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get(SESSION_COOKIE)?.value

    if (!session) return null

    try {
        const payload = await decrypt(session)
        if (new Date(payload.expires) <= new Date()) return null
        return payload
    } catch {
        return null
    }
}

export async function getCurrentUser() {
    const session = await getSession()
    if (!session) return null

    const user = await db.user.findUnique({
        where: { id: session.userId },
        include: { doctorProfile: true },
    })

    if (!user || user.role !== session.role) return null
    return user
}

export async function requireUser(redirectTo = '/login') {
    const user = await getCurrentUser()
    if (!user) redirect(redirectTo)
    return user
}

export async function requireRole(role: Role | Role[], redirectTo = '/login') {
    const user = await requireUser(redirectTo)
    const allowedRoles = Array.isArray(role) ? role : [role]

    if (!canRoleAccess(user.role, allowedRoles)) {
        redirect(safeHomeForRole(user.role))
    }

    return user
}

export async function requireAdmin() {
    return requireRole([Role.ADMIN, Role.SUPER_ADMIN])
}

export async function requireDoctor() {
    return requireRole(Role.DOCTOR)
}

export async function requireSuperAdmin() {
    return requireRole(Role.SUPER_ADMIN)
}

export function safeHomeForRole(role: User['role']) {
    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) return '/admin/dashboard'
    if (role === Role.DOCTOR) return '/doctor'
    return '/patient'
}
