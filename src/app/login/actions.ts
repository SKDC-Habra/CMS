'use server'

import { db } from '@/lib/db'
import { login, safeHomeForRole } from '@/lib/auth'
import { sendSMS } from '@/lib/notifications'
import { Role } from '@prisma/client'
import { addMinutes } from 'date-fns'
import { redirect } from 'next/navigation'

function normalizePhone(phone: string) {
    return phone.replace(/\D/g, '').slice(-10)
}

function developmentCodeForRole(role: Role) {
    if (role === Role.ADMIN) return 'admin'
    if (role === Role.SUPER_ADMIN) return 'super'
    if (role === Role.DOCTOR) return 'doctor'
    return '1234'
}

export async function requestOTP(formData: FormData) {
    const phone = normalizePhone(String(formData.get('phone') || ''))

    if (phone.length !== 10) {
        return { success: false, message: 'Enter a valid 10 digit mobile number.' }
    }

    const user = await db.user.findUnique({ where: { phone } })

    if (!user) {
        return { success: false, message: 'No account found for this mobile number.' }
    }

    const code = developmentCodeForRole(user.role)

    await db.otpChallenge.create({
        data: {
            phone,
            code,
            userId: user.id,
            expiresAt: addMinutes(new Date(), 10),
        },
    })

    await sendSMS(phone, `Your Smart Clinic login code is ${code}`)

    return { success: true }
}

export async function verifyOTPAndLogin(rawPhone: string, code: string) {
    const phone = normalizePhone(rawPhone)
    const normalizedCode = code.trim()

    const challenge = await db.otpChallenge.findFirst({
        where: {
            phone,
            code: normalizedCode,
            consumedAt: null,
            expiresAt: { gt: new Date() },
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
    })

    if (!challenge?.user) {
        return { success: false, message: 'Invalid or expired code.' }
    }

    await db.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
    })

    await login(challenge.user.id, challenge.user.role)
    redirect(safeHomeForRole(challenge.user.role))
}
