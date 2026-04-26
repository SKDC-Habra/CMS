import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, MapPin, QrCode } from 'lucide-react'
import Link from 'next/link'

type TokenDetails = {
    id: string
    number: number
    status: string
    patient: { name: string | null }
    doctor: { name: string }
    session: { type: string; startTime: string | null; endTime: string | null }
    appointmentType: { label: string }
}

export function DigitalToken({ token }: { token: TokenDetails }) {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            <Card className="relative w-full overflow-hidden border-2 border-primary/20 shadow-xl">
                <div className="absolute top-0 h-2 w-full bg-primary" />

                <CardHeader className="pb-2 text-center">
                    <Badge variant="outline" className="mx-auto mb-2 w-fit text-xs uppercase tracking-widest">
                        Token ID: {token.id}
                    </Badge>
                    <h1 className="text-6xl font-black tracking-tighter text-primary">
                        #{token.number}
                    </h1>
                    <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        Queue Number
                    </p>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                    <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3 text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" /> Session
                        </span>
                        <span className="font-mono text-lg font-bold">{token.session.startTime} - {token.session.endTime}</span>
                    </div>

                    <div className="space-y-1 text-center">
                        <p className="text-sm text-muted-foreground">Patient</p>
                        <p className="text-lg font-semibold">{token.patient.name || 'Patient'}</p>
                        <p className="text-sm text-muted-foreground">{token.doctor.name}</p>
                    </div>

                    <div className="flex justify-center gap-2">
                        <Badge className="bg-green-100 px-3 py-1 text-green-800 hover:bg-green-100">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> {token.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="secondary" className="px-3 py-1">
                            {token.appointmentType.label}
                        </Badge>
                    </div>
                </CardContent>

                <CardFooter className="flex-col gap-3 bg-muted/10 pt-6">
                    <Button variant="outline" className="w-full gap-2 py-6">
                        <QrCode className="h-5 w-5" /> Show QR for Reception
                    </Button>
                    <Button variant="ghost" className="w-full text-muted-foreground" asChild>
                        <Link href="/patient">Back to Dashboard</Link>
                    </Button>
                </CardFooter>
            </Card>

            <div className="flex items-start gap-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                    <p className="mb-1 font-semibold">Clinic Address</p>
                    <p className="opacity-80">
                        Plot 42, Sector 18, Smart City.<br />
                        Opposite Central Mall.
                    </p>
                    <a
                        href="https://maps.google.com"
                        target="_blank"
                        className="mt-2 inline-block font-medium text-primary hover:underline"
                    >
                        Get Directions
                    </a>
                </div>
            </div>
        </div>
    )
}
