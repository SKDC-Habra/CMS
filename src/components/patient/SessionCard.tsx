import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Users } from 'lucide-react'
import Link from 'next/link'

interface SessionCardProps {
    id: string
    type: 'MORNING' | 'EVENING'
    date: string
    startTime: string
    endTime: string
    status: 'OPEN' | 'CLOSED' | 'HOUSE_FULL'
    capacity: number
    bookedCount: number
}

export function SessionCard({
    id, type, startTime, endTime, status, capacity, bookedCount
}: SessionCardProps) {

    const isOpen = status === 'OPEN'
    const isFull = status === 'HOUSE_FULL' || bookedCount >= capacity

    return (
        <Card className="w-full touch-target">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold">
                        {type === 'MORNING' ? 'Morning Shift' : 'Evening Shift'}
                    </CardTitle>
                    {status === 'OPEN' && !isFull && <Badge variant="default" className="bg-green-600">Open</Badge>}
                    {status === 'CLOSED' && <Badge variant="secondary">Closed</Badge>}
                    {(status === 'HOUSE_FULL' || isFull) && <Badge variant="destructive">House Full</Badge>}
                </div>
            </CardHeader>
            <CardContent className="pb-2 text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{startTime} - {endTime}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                        {isFull ? 'Capacity Reached' : `${capacity - bookedCount} tokens remaining`}
                    </span>
                </div>
                {/* Progress Bar Mockup */}
                <div className="h-2 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                    <div
                        className={`h-full ${isFull ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${(bookedCount / capacity) * 100}%` }}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    disabled={!isOpen || isFull}
                    asChild={isOpen && !isFull}
                >
                    {isOpen && !isFull ? (
                        <Link href={`/booking?sessionId=${id}`}>Book Token</Link>
                    ) : (
                        'Unavailable'
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
