'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { confirmBooking, lockToken } from '@/lib/actions'

type BookingDoctor = {
    id: string
    name: string
    fee: number
    sessions: {
        id: string
        type: 'MORNING' | 'EVENING'
        startTime: string | null
        endTime: string | null
        capacity: number
        status: string
        _count: { tokens: number }
    }[]
}

type AppointmentTypeOption = {
    id: string
    label: string
    fee: number
    isFollowUp: boolean
}

export function BookingForm({
    doctors,
    appointmentTypes,
}: {
    doctors: BookingDoctor[]
    appointmentTypes: AppointmentTypeOption[]
}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const doctorId = searchParams.get('doctorId')

    const initialDoctor = doctors.find((doctor) => doctor.id === doctorId) || doctors[0]
    const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctor?.id || '')
    const [selectedSessionId, setSelectedSessionId] = useState(initialDoctor?.sessions[0]?.id || '')
    const [selectedAppointmentTypeId, setSelectedAppointmentTypeId] = useState(appointmentTypes[0]?.id || '')
    const [isBooking, setIsBooking] = useState(false)
    const [error, setError] = useState('')

    const handleBook = async () => {
        setIsBooking(true)
        setError('')

        const formData = new FormData()
        formData.append('sessionId', selectedSessionId)
        formData.append('appointmentTypeId', selectedAppointmentTypeId)

        const locked = await lockToken(formData)
        if (!locked.success || !locked.data) {
            setError(locked.message || 'Unable to lock token.')
            setIsBooking(false)
            return
        }

        const confirmed = await confirmBooking(locked.data.tokenId)
        if (!confirmed.success) {
            setError(confirmed.message || 'Unable to confirm booking.')
            setIsBooking(false)
            return
        }

        router.push(`/token/${locked.data.tokenId}`)
    }

    const selectedDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId)
    const selectedAppointment = appointmentTypes.find((type) => type.id === selectedAppointmentTypeId)

    return (
        <Card className="w-full shadow-md touch-target">
            <CardHeader>
                <CardTitle>Confirm Booking</CardTitle>
                <CardDescription>Select a doctor, available session, and appointment type.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="space-y-2">
                    <Label htmlFor="doctor">Doctor</Label>
                    <select
                        id="doctor"
                        className="w-full rounded-md border bg-background px-3 py-3 text-base"
                        value={selectedDoctorId}
                        onChange={(event) => {
                            const nextDoctor = doctors.find((doctor) => doctor.id === event.target.value)
                            setSelectedDoctorId(event.target.value)
                            setSelectedSessionId(nextDoctor?.sessions[0]?.id || '')
                        }}
                    >
                        {doctors.map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="session">Session</Label>
                    <select
                        id="session"
                        className="w-full rounded-md border bg-background px-3 py-3 text-base"
                        value={selectedSessionId}
                        onChange={(event) => setSelectedSessionId(event.target.value)}
                    >
                        {selectedDoctor?.sessions.map((session) => {
                            const remaining = session.capacity - session._count.tokens
                            return (
                                <option key={session.id} value={session.id} disabled={remaining <= 0 || session.status !== 'OPEN'}>
                                    {session.type} ({session.startTime} - {session.endTime}) - {Math.max(remaining, 0)} left
                                </option>
                            )
                        })}
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="appointmentType">Appointment Type</Label>
                    <select
                        id="appointmentType"
                        className="w-full rounded-md border bg-background px-3 py-3 text-base"
                        value={selectedAppointmentTypeId}
                        onChange={(event) => setSelectedAppointmentTypeId(event.target.value)}
                    >
                        {appointmentTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.label} - ₹{type.fee}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Consultation Fee</span>
                        <span className="font-medium">₹{selectedAppointment?.fee ?? selectedDoctor?.fee ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Booking Charge</span>
                        <span className="font-medium">₹0</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-base">
                        <span>Total Pay</span>
                        <span>₹{selectedAppointment?.fee ?? selectedDoctor?.fee ?? 0}</span>
                    </div>
                </div>

                {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            </CardContent>
            <CardFooter>
                <Button
                    className="w-full py-6 text-lg"
                    onClick={handleBook}
                    disabled={isBooking || !selectedSessionId || !selectedAppointmentTypeId}
                >
                    {isBooking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    {isBooking ? 'Locking Token...' : 'Pay & Book'}
                </Button>
            </CardFooter>
        </Card>
    )
}
