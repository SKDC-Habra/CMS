import { StatsCard } from "@/components/admin/StatsCard"
import { Activity, CreditCard, Users, CalendarCheck } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getAdminDashboardData, updateSessionStatus } from "@/lib/actions"
import { SessionStatus } from "@prisma/client"

export default async function AdminDashboard() {
    const data = await getAdminDashboardData()

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total Patients Today" value={String(data.patientsToday)} description="Tokens issued today" icon={Users} />
                <StatsCard title="Active Tokens" value={String(data.activeTokens)} description="Waiting or in consultation" icon={Activity} />
                <StatsCard title="Revenue" value={`₹${data.revenue.toLocaleString('en-IN')}`} description="Paid and waived bookings" icon={CreditCard} />
                <StatsCard title="Sessions" value={String(data.sessions.length)} description="Doctor sessions today" icon={CalendarCheck} />
            </div>

            <div className="rounded-md border">
                <div className="border-b p-4">
                    <h3 className="text-lg font-semibold">Live Sessions</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Booked</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.sessions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                    No sessions are scheduled for today.
                                </TableCell>
                            </TableRow>
                        )}
                        {data.sessions.map((session) => (
                            <TableRow key={session.id}>
                                <TableCell className="font-medium">{session.doctor.name}</TableCell>
                                <TableCell>{session.type}</TableCell>
                                <TableCell>
                                    <Badge variant={session.status === 'OPEN' ? 'default' : session.status === 'HOUSE_FULL' ? 'destructive' : 'secondary'}>
                                        {session.status.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell>{session.capacity}</TableCell>
                                <TableCell>{session._count.tokens}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/admin/queue?sessionId=${session.id}`}>Manage</Link>
                                        </Button>
                                        <form action={async () => {
                                            'use server'
                                            await updateSessionStatus(session.id, session.status === 'OPEN' ? SessionStatus.CLOSED : SessionStatus.OPEN)
                                        }}>
                                            <Button variant="outline" size="sm" type="submit">
                                                {session.status === 'OPEN' ? 'Close' : 'Open'}
                                            </Button>
                                        </form>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
