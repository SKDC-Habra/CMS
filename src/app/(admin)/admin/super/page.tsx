import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createEmergencyToken, getAdminDashboardData } from "@/lib/actions"
import { requireSuperAdmin } from "@/lib/auth"
import { AlertTriangle, Database, Trash2, Zap } from "lucide-react"

export default async function SuperAdminPage() {
    await requireSuperAdmin()
    const { sessions } = await getAdminDashboardData()

    async function createEmergency(formData: FormData) {
        'use server'
        await createEmergencyToken(
            String(formData.get('sessionId') || ''),
            String(formData.get('phone') || ''),
            String(formData.get('name') || ''),
        )
    }

    return (
        <div className="relative space-y-6">
            <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-destructive">
                    <Zap className="h-8 w-8 text-yellow-500" />
                    Super Admin Controls
                </h2>
                <p className="text-muted-foreground">Advanced system overrides. Use with caution.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" /> Emergency Override
                        </CardTitle>
                        <CardDescription>Inject a token into the front of a queue immediately.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={createEmergency} className="space-y-3">
                            <div className="grid gap-2">
                                <Label htmlFor="sessionId">Session</Label>
                                <select id="sessionId" name="sessionId" className="rounded-md border bg-background px-3 py-2 text-sm" required>
                                    {sessions.map((session) => (
                                        <option key={session.id} value={session.id}>
                                            {session.doctor.name} · {session.type} · {session.status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Patient Name</Label>
                                <Input id="name" name="name" required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Patient Phone</Label>
                                <Input id="phone" name="phone" required />
                            </div>
                            <Button variant="destructive" className="w-full">Inject Emergency Token</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" /> Database Maintenance
                        </CardTitle>
                        <CardDescription>Manual backup/reset actions should be handled by deployment tooling.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full" disabled>Backup Database</Button>
                        <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" disabled>
                            <Trash2 className="mr-2 h-4 w-4" /> Reset Mock Data
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
