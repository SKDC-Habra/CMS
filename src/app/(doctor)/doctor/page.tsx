import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { completeToken, getQueueData, startConsultation } from "@/lib/actions"
import { FileText, Clock, ChevronRight } from "lucide-react"

export default async function DoctorDashboard() {
    const session = await getQueueData(undefined, true)
    const currentPatient = session?.tokens.find((token) => token.status === "IN_CONSULTATION")
    const firstBooked = session?.tokens.find((token) => token.status === "BOOKED")
    const upcomingPatients = session?.tokens.filter((token) => token.id !== currentPatient?.id && token.id !== firstBooked?.id) || []

    return (
        <div className="space-y-8">
            <section>
                <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-muted-foreground">
                    In Consultation
                </h2>
                {currentPatient ? (
                    <Card className="border-l-4 border-l-primary bg-white shadow-lg dark:bg-slate-950">
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div>
                                <Badge variant="outline" className="mb-2">Token #{currentPatient.number}</Badge>
                                <CardTitle className="text-3xl font-bold">{currentPatient.patient.name}</CardTitle>
                                <p className="mt-1 text-lg text-muted-foreground">{currentPatient.appointmentType.label}</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {session?.startTime}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="mt-4 flex gap-4 border-t pt-4">
                            <Button size="lg" className="gap-2" variant="outline">
                                <FileText className="h-4 w-4" /> View History
                            </Button>
                            <form action={async () => {
                                'use server'
                                await completeToken(currentPatient.id, 'Completed by doctor', true)
                            }}>
                                <Button size="lg" className="gap-2" type="submit">Complete Consultation</Button>
                            </form>
                        </CardContent>
                    </Card>
                ) : firstBooked ? (
                    <Card className="border-l-4 border-l-primary bg-white shadow-lg dark:bg-slate-950">
                        <CardHeader>
                            <Badge variant="outline" className="mb-2 w-fit">Token #{firstBooked.number}</Badge>
                            <CardTitle className="text-3xl font-bold">{firstBooked.patient.name}</CardTitle>
                            <p className="text-lg text-muted-foreground">{firstBooked.appointmentType.label}</p>
                        </CardHeader>
                        <CardContent>
                            <form action={async () => {
                                'use server'
                                await startConsultation(firstBooked.id)
                            }}>
                                <Button size="lg" type="submit">Start Consultation</Button>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="rounded-xl border-2 border-dashed p-12 text-center text-muted-foreground">
                        No patient currently assigned to your active queue.
                    </div>
                )}
            </section>

            <section>
                <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-muted-foreground">
                    Up Next
                </h2>
                <div className="grid gap-3">
                    {upcomingPatients.map((patient) => (
                        <div key={patient.id} className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm dark:bg-slate-950">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                                    {patient.number}
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">{patient.patient.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Badge variant="secondary" className="text-xs font-normal">{patient.appointmentType.label}</Badge>
                                        <span>{patient.status.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                    ))}
                    {upcomingPatients.length === 0 && (
                        <p className="text-sm text-muted-foreground">No more patients in queue.</p>
                    )}
                </div>
            </section>
        </div>
    )
}
