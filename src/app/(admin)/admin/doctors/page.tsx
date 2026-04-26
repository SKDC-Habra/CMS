import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2 } from "lucide-react"
import { deactivateDoctor, getDoctorManagementData, saveDoctor } from "@/lib/actions"

export default async function DoctorManagementPage() {
    const doctors = await getDoctorManagementData()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">Doctor Management</h2>
                    <p className="text-muted-foreground">Manage doctors, pricing, status, and saved schedules.</p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Doctor</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Add or Update Doctor</DialogTitle>
                            <DialogDescription>
                                A doctor account is matched by phone number and can log in with the doctor OTP.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={async (formData) => {
                            'use server'
                            await saveDoctor(formData)
                        }} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input id="phone" name="phone" placeholder="7777777777" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Doctor Name</Label>
                                    <Input id="name" name="name" placeholder="Dr. Sharma" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="qualification">Qualification</Label>
                                    <Input id="qualification" name="qualification" placeholder="MBBS, MD" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="specialization">Specialization</Label>
                                    <Input id="specialization" name="specialization" placeholder="General Physician" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fee">Consultation Fee</Label>
                                    <Input id="fee" name="fee" type="number" defaultValue="500" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="commission">Clinic Commission %</Label>
                                    <Input id="commission" name="commission" type="number" defaultValue="0" required />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Save Doctor</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Specialization</TableHead>
                                <TableHead>Schedules</TableHead>
                                <TableHead>Fee</TableHead>
                                <TableHead>Commission</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {doctors.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                        No doctors have been created yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {doctors.map((doctor) => (
                                <TableRow key={doctor.id}>
                                    <TableCell>
                                        <div className="font-medium">{doctor.name}</div>
                                        <div className="text-xs text-muted-foreground">{doctor.qualification} · {doctor.user.phone}</div>
                                    </TableCell>
                                    <TableCell>{doctor.specialization}</TableCell>
                                    <TableCell className="text-sm">{doctor.schedules.filter((schedule) => schedule.active).length} active</TableCell>
                                    <TableCell className="font-bold">₹{doctor.fee}</TableCell>
                                    <TableCell>{doctor.commission}%</TableCell>
                                    <TableCell>
                                        <Badge variant={doctor.active ? 'default' : 'secondary'}>
                                            {doctor.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <form action={async () => {
                                            'use server'
                                            await deactivateDoctor(doctor.id)
                                        }}>
                                            <Button variant="ghost" size="icon" className="text-destructive" disabled={!doctor.active}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
