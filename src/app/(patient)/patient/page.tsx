import { DoctorCard } from '@/components/patient/DoctorCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getPatientDashboardData } from '@/lib/actions'
import Link from 'next/link'

export default async function PatientDashboard() {
    const { doctors, activeTokens } = await getPatientDashboardData()

    return (
        <div className="space-y-6">
            <section className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-primary">Find a Doctor</h2>
                <p className="text-muted-foreground">Select a specialist to book your token.</p>
            </section>

            <div className="grid gap-4">
                {doctors.length === 0 && (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No doctors are currently available for booking.
                    </div>
                )}
                {doctors.map((doctor) => {
                    const nextSession = doctor.sessions[0]
                    const schedule = nextSession
                        ? `${nextSession.type}: ${nextSession.startTime} - ${nextSession.endTime}`
                        : 'No open session today'

                    return (
                        <DoctorCard
                            key={doctor.id}
                            id={doctor.id}
                            name={doctor.name}
                            qualification={doctor.qualification}
                            specialization={doctor.specialization}
                            fee={doctor.fee}
                            schedule={schedule}
                            status={nextSession ? 'Active' : 'On Leave'}
                        />
                    )
                })}
            </div>

            <section className="mt-8 rounded-xl border border-dashed bg-muted/50 p-4">
                <h3 className="mb-3 font-semibold">My Active Tokens</h3>
                {activeTokens.length === 0 ? (
                    <p className="text-sm text-muted-foreground">You have no active tokens. Book one above.</p>
                ) : (
                    <div className="space-y-3">
                        {activeTokens.map((token) => (
                            <div key={token.id} className="flex items-center justify-between rounded-lg border bg-background p-3">
                                <div>
                                    <p className="font-medium">#{token.number} {token.doctor.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {token.session.type} · {token.appointmentType.label}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{token.status.replace('_', ' ')}</Badge>
                                    <Button size="sm" asChild>
                                        <Link href={`/token/${token.id}`}>View</Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
