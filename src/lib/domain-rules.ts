import { Role, TokenStatus } from '@prisma/client'

export function canRoleAccess(actualRole: Role, allowedRoles: Role[]) {
    return allowedRoles.includes(actualRole)
}

export function isFollowUpEligible(lastVisit: Date | null | undefined, now: Date, validityDays: number) {
    if (!lastVisit) return false
    const elapsedMs = now.getTime() - lastVisit.getTime()
    const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000))
    return elapsedDays <= validityDays
}

export function isLockedTokenExpired(status: TokenStatus, expiresAt: Date | null, now: Date) {
    return status === TokenStatus.LOCKED && Boolean(expiresAt && expiresAt < now)
}

export function canConfirmBooking(status: TokenStatus, expiresAt: Date | null, now: Date) {
    return status === TokenStatus.LOCKED && !isLockedTokenExpired(status, expiresAt, now)
}

export function nextTokenNumber(lastTokenNumber: number | null | undefined) {
    return (lastTokenNumber || 0) + 1
}

export function canCompleteQueueToken(status: TokenStatus) {
    return status === TokenStatus.BOOKED || status === TokenStatus.IN_CONSULTATION || status === TokenStatus.SKIPPED
}
