'use server'

import {
    PaymentMode,
    PaymentStatus,
    Prisma,
    QueueAction,
    Role,
    SessionStatus,
    TokenStatus,
} from '@prisma/client'
import { addMinutes } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { db } from './db'
import { requireAdmin, requireDoctor, requireRole, requireSuperAdmin } from './auth'
import { canCompleteQueueToken, canConfirmBooking, isFollowUpEligible, nextTokenNumber } from './domain-rules'

const ACTIVE_TOKEN_STATUSES = [
    TokenStatus.LOCKED,
    TokenStatus.BOOKED,
    TokenStatus.IN_CONSULTATION,
] as const

export type ActionResponse<T = unknown> = {
    success: boolean
    message?: string
    data?: T
}

function today() {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
}

async function getSettings() {
    return db.clinicSettings.upsert({
        where: { id: 'default' },
        update: {},
        create: { id: 'default' },
    })
}

export async function checkReportEligibility(userId: string): Promise<boolean> {
    const [user, settings] = await Promise.all([
        db.user.findUnique({ where: { id: userId }, select: { lastVisit: true } }),
        getSettings(),
    ])

    return isFollowUpEligible(user?.lastVisit, new Date(), settings.followUpValidityDays)
}

export async function releaseExpiredTokens(sessionId?: string) {
    const expired = await db.token.findMany({
        where: {
            sessionId,
            status: TokenStatus.LOCKED,
            expiresAt: { lt: new Date() },
        },
        select: { id: true, sessionId: true },
    })

    if (expired.length === 0) return 0

    await db.$transaction([
        db.token.updateMany({
            where: { id: { in: expired.map((token) => token.id) } },
            data: { status: TokenStatus.EXPIRED, expiresAt: null },
        }),
        db.queueEvent.createMany({
            data: expired.map((token) => ({
                action: QueueAction.TOKEN_EXPIRED,
                tokenId: token.id,
                sessionId: token.sessionId,
                note: 'Locked token expired before confirmation.',
            })),
        }),
    ])

    return expired.length
}

export async function getPatientDashboardData() {
    const user = await requireRole(Role.PATIENT)
    await releaseExpiredTokens()

    const [doctors, activeTokens, appointmentTypes] = await Promise.all([
        db.doctor.findMany({
            where: { active: true },
            include: {
                sessions: {
                    where: { date: today() },
                    include: {
                        _count: {
                            select: {
                                tokens: { where: { status: { in: [...ACTIVE_TOKEN_STATUSES, TokenStatus.COMPLETED] } } },
                            },
                        },
                    },
                    orderBy: [{ type: 'asc' }],
                },
            },
            orderBy: { name: 'asc' },
        }),
        db.token.findMany({
            where: {
                patientId: user.id,
                status: { in: [...ACTIVE_TOKEN_STATUSES] },
            },
            include: { doctor: true, session: true, appointmentType: true },
            orderBy: { createdAt: 'desc' },
        }),
        db.appointmentType.findMany({ where: { active: true }, orderBy: { fee: 'desc' } }),
    ])

    return { doctors, activeTokens, appointmentTypes }
}

export async function getBookingOptions(doctorId?: string) {
    await requireRole(Role.PATIENT)
    await releaseExpiredTokens()

    const [doctors, appointmentTypes] = await Promise.all([
        db.doctor.findMany({
            where: { active: true, id: doctorId ? doctorId : undefined },
            include: {
                sessions: {
                    where: { date: today(), status: { in: [SessionStatus.OPEN, SessionStatus.HOUSE_FULL] } },
                    include: {
                        _count: {
                            select: {
                                tokens: { where: { status: { in: [...ACTIVE_TOKEN_STATUSES, TokenStatus.COMPLETED] } } },
                            },
                        },
                    },
                    orderBy: [{ type: 'asc' }],
                },
            },
            orderBy: { name: 'asc' },
        }),
        db.appointmentType.findMany({ where: { active: true }, orderBy: { fee: 'desc' } }),
    ])

    return { doctors, appointmentTypes }
}

export async function validateBookingRequest(userId: string, sessionId: string) {
    await releaseExpiredTokens(sessionId)

    const existingToken = await db.token.findFirst({
        where: {
            patientId: userId,
            sessionId,
            status: { in: [...ACTIVE_TOKEN_STATUSES] },
        },
    })

    if (existingToken) {
        return { success: false, message: 'You already have an active token for this session.' }
    }

    return { success: true }
}

export async function lockToken(formData: FormData): Promise<ActionResponse<{ tokenId: string }>> {
    const user = await requireRole(Role.PATIENT)
    const sessionId = String(formData.get('sessionId') || '')
    const appointmentTypeId = String(formData.get('appointmentTypeId') || '')
    const maxRetries = 3

    if (!sessionId || !appointmentTypeId) {
        return { success: false, message: 'Select a session and appointment type.' }
    }

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
            const validation = await validateBookingRequest(user.id, sessionId)
            if (!validation.success) return validation

            const settings = await getSettings()

            const token = await db.$transaction(async (tx) => {
                const session = await tx.session.findUnique({
                    where: { id: sessionId },
                    include: { doctor: true },
                })

                if (!session || session.status !== SessionStatus.OPEN) {
                    throw new Error('This session is not open for booking.')
                }

                const appointmentType = await tx.appointmentType.findUnique({
                    where: { id: appointmentTypeId },
                })

                if (!appointmentType?.active) {
                    throw new Error('Selected appointment type is unavailable.')
                }

                if (appointmentType.isFollowUp) {
                    const eligible = await checkReportEligibility(user.id)
                    if (!eligible) throw new Error('Follow-up is available only within the configured validity window.')
                }

                const activeCount = await tx.token.count({
                    where: {
                        sessionId,
                        status: { in: [...ACTIVE_TOKEN_STATUSES, TokenStatus.COMPLETED] },
                    },
                })

                if (activeCount >= session.capacity) {
                    await tx.session.update({ where: { id: sessionId }, data: { status: SessionStatus.HOUSE_FULL } })
                    throw new Error('House full: session capacity reached.')
                }

                const lastToken = await tx.token.findFirst({
                    where: { sessionId },
                    orderBy: { number: 'desc' },
                    select: { number: true },
                })

                const created = await tx.token.create({
                    data: {
                        sessionId,
                        doctorId: session.doctorId,
                        patientId: user.id,
                        appointmentTypeId,
                number: nextTokenNumber(lastToken?.number),
                        status: TokenStatus.LOCKED,
                        expiresAt: addMinutes(new Date(), settings.tokenLockMinutes),
                    },
                })

                await tx.queueEvent.create({
                    data: {
                        action: QueueAction.TOKEN_LOCKED,
                        tokenId: created.id,
                        sessionId,
                        actorId: user.id,
                    },
                })

                return created
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

            revalidatePath('/patient')
            return { success: true, data: { tokenId: token.id } }
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && attempt < maxRetries) {
                continue
            }

            const message = error instanceof Error ? error.message : 'Failed to lock token.'
            return { success: false, message }
        }
    }

    return { success: false, message: 'High traffic. Please try again.' }
}

export async function confirmBooking(tokenId: string, mode: PaymentMode = PaymentMode.CASH) {
    const user = await requireRole(Role.PATIENT)
    await releaseExpiredTokens()

    const token = await db.token.findFirst({
        where: { id: tokenId, patientId: user.id, status: TokenStatus.LOCKED },
        include: { appointmentType: true },
    })

    if (!token || !canConfirmBooking(token.status, token.expiresAt, new Date())) {
        return { success: false, message: 'Token is unavailable or expired.' }
    }

    await db.$transaction(async (tx) => {
        await tx.token.update({
            where: { id: token.id },
            data: { status: TokenStatus.BOOKED, expiresAt: null },
        })

        await tx.payment.upsert({
            where: { tokenId: token.id },
            update: {
                amount: token.appointmentType.fee,
                mode,
                status: token.appointmentType.fee === 0 ? PaymentStatus.WAIVED : PaymentStatus.PAID,
                paidAt: new Date(),
            },
            create: {
                tokenId: token.id,
                amount: token.appointmentType.fee,
                mode: token.appointmentType.fee === 0 ? PaymentMode.WAIVED : mode,
                status: token.appointmentType.fee === 0 ? PaymentStatus.WAIVED : PaymentStatus.PAID,
                paidAt: new Date(),
            },
        })

        await tx.queueEvent.create({
            data: {
                action: QueueAction.TOKEN_BOOKED,
                tokenId: token.id,
                sessionId: token.sessionId,
                actorId: user.id,
            },
        })
    })

    revalidatePath('/patient')
    revalidatePath(`/token/${token.id}`)
    return { success: true }
}

export async function getTokenForCurrentPatient(tokenId: string) {
    const user = await requireRole(Role.PATIENT)
    await releaseExpiredTokens()

    return db.token.findFirst({
        where: { id: tokenId, patientId: user.id },
        include: {
            patient: true,
            doctor: true,
            session: true,
            appointmentType: true,
            payment: true,
        },
    })
}

export async function getAdminDashboardData() {
    await requireAdmin()
    await releaseExpiredTokens()

    const day = today()
    const [patientsToday, activeTokens, paidPayments, sessions] = await Promise.all([
        db.token.count({ where: { session: { date: day }, status: { notIn: [TokenStatus.CANCELLED, TokenStatus.EXPIRED] } } }),
        db.token.count({ where: { session: { date: day }, status: { in: [...ACTIVE_TOKEN_STATUSES] } } }),
        db.payment.findMany({ where: { token: { session: { date: day } }, status: { in: [PaymentStatus.PAID, PaymentStatus.WAIVED] } } }),
        db.session.findMany({
            where: { date: day },
            include: {
                doctor: true,
                _count: {
                    select: {
                        tokens: { where: { status: { notIn: [TokenStatus.CANCELLED, TokenStatus.EXPIRED] } } },
                    },
                },
            },
            orderBy: [{ startTime: 'asc' }],
        }),
    ])

    return {
        patientsToday,
        activeTokens,
        revenue: paidPayments.reduce((sum, payment) => sum + payment.amount, 0),
        sessions,
    }
}

export async function getQueueData(sessionId?: string, doctorOnly = false) {
    const user = doctorOnly ? await requireDoctor() : await requireAdmin()
    await releaseExpiredTokens(sessionId)

    const doctor = doctorOnly
        ? await db.doctor.findUnique({ where: { userId: user.id } })
        : null

    const session = await db.session.findFirst({
        where: {
            id: sessionId || undefined,
            date: sessionId ? undefined : today(),
            doctorId: doctor?.id,
        },
        include: {
            doctor: true,
            tokens: {
                where: { status: { in: [TokenStatus.BOOKED, TokenStatus.IN_CONSULTATION, TokenStatus.SKIPPED] } },
                include: { patient: true, appointmentType: true },
                orderBy: { number: 'asc' },
            },
        },
        orderBy: [{ startTime: 'asc' }],
    })

    return session
}

async function updateTokenStatus(tokenId: string, status: TokenStatus, action: QueueAction, note?: string, doctorOnly = false) {
    const user = doctorOnly ? await requireDoctor() : await requireAdmin()
    const doctor = doctorOnly ? await db.doctor.findUnique({ where: { userId: user.id } }) : null

    const token = await db.token.findFirst({
        where: { id: tokenId, doctorId: doctor?.id },
        include: { patient: true },
    })

    if (!token) return { success: false, message: 'Token not found or permission denied.' }
    if (status === TokenStatus.COMPLETED && !canCompleteQueueToken(token.status)) {
        return { success: false, message: 'Token cannot be completed from its current state.' }
    }

    await db.$transaction(async (tx) => {
        await tx.token.update({
            where: { id: token.id },
            data: { status, notes: note || token.notes },
        })

        if (status === TokenStatus.COMPLETED) {
            await tx.user.update({
                where: { id: token.patientId },
                data: { lastVisit: new Date() },
            })
        }

        await tx.queueEvent.create({
            data: { action, tokenId: token.id, sessionId: token.sessionId, actorId: user.id, note },
        })
    })

    revalidatePath('/admin/queue')
    revalidatePath('/doctor')
    return { success: true }
}

export async function startConsultation(tokenId: string) {
    return updateTokenStatus(tokenId, TokenStatus.IN_CONSULTATION, QueueAction.CONSULTATION_STARTED, undefined, true)
}

export async function completeToken(tokenId: string, note?: string, doctorOnly = false) {
    return updateTokenStatus(tokenId, TokenStatus.COMPLETED, QueueAction.TOKEN_COMPLETED, note, doctorOnly)
}

export async function skipToken(tokenId: string) {
    return updateTokenStatus(tokenId, TokenStatus.SKIPPED, QueueAction.TOKEN_SKIPPED)
}

export async function markNoShow(tokenId: string) {
    return updateTokenStatus(tokenId, TokenStatus.NO_SHOW, QueueAction.TOKEN_NO_SHOW)
}

export async function createEmergencyToken(sessionId: string, patientPhone: string, patientName: string) {
    const actor = await requireSuperAdmin()
    const phone = patientPhone.replace(/\D/g, '').slice(-10)

    if (phone.length !== 10 || !patientName.trim()) {
        return { success: false, message: 'Patient name and valid phone are required.' }
    }

    const consultation = await db.appointmentType.findFirst({ where: { code: 'CONSULTATION' } })
    if (!consultation) return { success: false, message: 'Consultation appointment type is missing.' }

    const token = await db.$transaction(async (tx) => {
        const session = await tx.session.findUnique({ where: { id: sessionId } })
        if (!session) throw new Error('Session not found.')

        const patient = await tx.user.upsert({
            where: { phone },
            update: { name: patientName, role: Role.PATIENT },
            create: { phone, name: patientName, role: Role.PATIENT },
        })

        const firstToken = await tx.token.findFirst({ where: { sessionId }, orderBy: { number: 'asc' } })
        const emergencyNumber = firstToken ? firstToken.number - 1 : 1

        const created = await tx.token.create({
            data: {
                sessionId,
                doctorId: session.doctorId,
                patientId: patient.id,
                appointmentTypeId: consultation.id,
                number: emergencyNumber,
                status: TokenStatus.BOOKED,
            },
        })

        await tx.queueEvent.create({
            data: {
                action: QueueAction.EMERGENCY_CREATED,
                tokenId: created.id,
                sessionId,
                actorId: actor.id,
                note: 'Emergency token created by super admin.',
            },
        })

        return created
    })

    revalidatePath('/admin/queue')
    return { success: true, data: { tokenId: token.id } }
}

export async function updateSessionStatus(sessionId: string, status: SessionStatus) {
    const actor = await requireAdmin()

    await db.$transaction([
        db.session.update({ where: { id: sessionId }, data: { status } }),
        db.queueEvent.create({
            data: {
                action: status === SessionStatus.OPEN
                    ? QueueAction.SESSION_OPENED
                    : status === SessionStatus.HOUSE_FULL
                        ? QueueAction.SESSION_HOUSE_FULL
                        : QueueAction.SESSION_CLOSED,
                sessionId,
                actorId: actor.id,
            },
        }),
    ])

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/queue')
    return { success: true }
}

export async function getDoctorManagementData() {
    await requireAdmin()

    return db.doctor.findMany({
        include: { user: true, schedules: true },
        orderBy: { name: 'asc' },
    })
}

export async function saveDoctor(formData: FormData) {
    await requireAdmin()

    const phone = String(formData.get('phone') || '').replace(/\D/g, '').slice(-10)
    const name = String(formData.get('name') || '').trim()
    const qualification = String(formData.get('qualification') || '').trim()
    const specialization = String(formData.get('specialization') || '').trim()
    const fee = Number(formData.get('fee') || 0)
    const commission = Number(formData.get('commission') || 0)

    if (!phone || !name || !qualification || !specialization || fee < 0 || commission < 0) {
        return { success: false, message: 'Complete all doctor fields with valid values.' }
    }

    await db.$transaction(async (tx) => {
        const user = await tx.user.upsert({
            where: { phone },
            update: { name, role: Role.DOCTOR },
            create: { phone, name, role: Role.DOCTOR },
        })

        await tx.doctor.upsert({
            where: { userId: user.id },
            update: { name, qualification, specialization, fee, commission, active: true },
            create: { userId: user.id, name, qualification, specialization, fee, commission },
        })
    })

    revalidatePath('/admin/doctors')
    return { success: true }
}

export async function deactivateDoctor(doctorId: string) {
    await requireAdmin()
    await db.doctor.update({ where: { id: doctorId }, data: { active: false } })
    revalidatePath('/admin/doctors')
    return { success: true }
}

export async function getClinicSettings() {
    await requireAdmin()
    return getSettings()
}

export async function saveClinicSettings(formData: FormData) {
    await requireAdmin()

    await db.clinicSettings.upsert({
        where: { id: 'default' },
        update: {
            clinicName: String(formData.get('clinicName') || 'Smart Clinic'),
            address: String(formData.get('address') || ''),
            phone: String(formData.get('phone') || ''),
            email: String(formData.get('email') || ''),
            tokenLockMinutes: Number(formData.get('tokenLockMinutes') || 10),
            followUpValidityDays: Number(formData.get('followUpValidityDays') || 15),
            standardConsultFee: Number(formData.get('standardConsultFee') || 500),
        },
        create: {
            id: 'default',
            clinicName: String(formData.get('clinicName') || 'Smart Clinic'),
            address: String(formData.get('address') || ''),
            phone: String(formData.get('phone') || ''),
            email: String(formData.get('email') || ''),
            tokenLockMinutes: Number(formData.get('tokenLockMinutes') || 10),
            followUpValidityDays: Number(formData.get('followUpValidityDays') || 15),
            standardConsultFee: Number(formData.get('standardConsultFee') || 500),
        },
    })

    revalidatePath('/admin/settings')
    return { success: true }
}

export async function getFinancialReportData() {
    await requireAdmin()
    const day = today()

    const payments = await db.payment.findMany({
        where: { token: { session: { date: day } } },
        include: {
            token: { include: { patient: true, appointmentType: true, doctor: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return {
        payments,
        total: payments.reduce((sum, payment) => sum + payment.amount, 0),
        cash: payments.filter((payment) => payment.mode === PaymentMode.CASH).reduce((sum, payment) => sum + payment.amount, 0),
        online: payments.filter((payment) => payment.mode !== PaymentMode.CASH).reduce((sum, payment) => sum + payment.amount, 0),
    }
}
