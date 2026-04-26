import assert from 'node:assert/strict'
import test from 'node:test'
import { Role, TokenStatus } from '@prisma/client'
import {
    canCompleteQueueToken,
    canConfirmBooking,
    canRoleAccess,
    isFollowUpEligible,
    isLockedTokenExpired,
    nextTokenNumber,
} from '../src/lib/domain-rules.ts'

test('role guards allow only configured roles', () => {
    assert.equal(canRoleAccess(Role.ADMIN, [Role.ADMIN, Role.SUPER_ADMIN]), true)
    assert.equal(canRoleAccess(Role.PATIENT, [Role.ADMIN, Role.SUPER_ADMIN]), false)
})

test('follow-up eligibility honors validity window', () => {
    const now = new Date('2026-04-26T10:00:00.000Z')

    assert.equal(isFollowUpEligible(new Date('2026-04-12T10:00:00.000Z'), now, 15), true)
    assert.equal(isFollowUpEligible(new Date('2026-04-01T10:00:00.000Z'), now, 15), false)
    assert.equal(isFollowUpEligible(null, now, 15), false)
})

test('locked token expiry and confirmation rules are consistent', () => {
    const now = new Date('2026-04-26T10:00:00.000Z')
    const future = new Date('2026-04-26T10:05:00.000Z')
    const past = new Date('2026-04-26T09:55:00.000Z')

    assert.equal(isLockedTokenExpired(TokenStatus.LOCKED, past, now), true)
    assert.equal(canConfirmBooking(TokenStatus.LOCKED, future, now), true)
    assert.equal(canConfirmBooking(TokenStatus.LOCKED, past, now), false)
    assert.equal(canConfirmBooking(TokenStatus.BOOKED, future, now), false)
})

test('token allocation increments from the last issued number', () => {
    assert.equal(nextTokenNumber(undefined), 1)
    assert.equal(nextTokenNumber(12), 13)
})

test('queue completion accepts active queue states only', () => {
    assert.equal(canCompleteQueueToken(TokenStatus.BOOKED), true)
    assert.equal(canCompleteQueueToken(TokenStatus.IN_CONSULTATION), true)
    assert.equal(canCompleteQueueToken(TokenStatus.SKIPPED), true)
    assert.equal(canCompleteQueueToken(TokenStatus.CANCELLED), false)
})
