import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Stethoscope, IndianRupee } from 'lucide-react'
import Link from 'next/link'

interface DoctorCardProps {
    id: string
    name: string
    qualification: string
    specialization: string
    fee: number
    schedule?: string
    status?: string
}

export function DoctorCard({
    id, name, qualification, specialization, fee, schedule, status
}: DoctorCardProps) {

    const isAvailable = status !== 'On Leave'

    return (
        <Card className="w-full touch-target shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold text-primary">{name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{qualification}</p>
                    </div>
                    <Badge variant={isAvailable ? "default" : "secondary"} className={isAvailable ? "bg-green-600 hover:bg-green-700" : ""}>
                        {status || 'Active'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pb-2 text-sm text-muted-foreground space-y-2">
                <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-foreground">{specialization}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{schedule || 'Today'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" />
                    <span>Consultation: <span className="font-bold text-foreground">₹{fee}</span></span>
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    disabled={!isAvailable}
                    asChild={isAvailable}
                >
                    {isAvailable ? (
                        <Link href={`/booking?doctorId=${id}`}>Book Token</Link>
                    ) : (
                        'Unavailable'
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
