
import { BookingForm } from '@/components/patient/BookingForm'
import { getBookingOptions } from '@/lib/actions'
import { Suspense } from 'react'

export default async function BookingPage({
    searchParams,
}: {
    searchParams: Promise<{ doctorId?: string }>
}) {
    const { doctorId } = await searchParams
    const options = await getBookingOptions(doctorId)
    const doctors = options.doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        fee: doctor.fee,
        sessions: doctor.sessions.map((session) => ({
            id: session.id,
            type: session.type,
            startTime: session.startTime,
            endTime: session.endTime,
            capacity: session.capacity,
            status: session.status,
            _count: session._count,
        })),
    }))
    const appointmentTypes = options.appointmentTypes.map((type) => ({
        id: type.id,
        label: type.label,
        fee: type.fee,
        isFollowUp: type.isFollowUp,
    }))

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">Select Patient</h2>
            <Suspense fallback={<div>Loading options...</div>}>
                <BookingForm doctors={doctors} appointmentTypes={appointmentTypes} />
            </Suspense>
        </div>
    )
}
