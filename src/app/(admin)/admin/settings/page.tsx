import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getClinicSettings, saveClinicSettings } from "@/lib/actions"

export default async function SettingsPage() {
    const settings = await getClinicSettings()

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-primary">Configuration</h2>
                <p className="text-muted-foreground">Manage clinic details and system policies.</p>
            </div>

            <Tabs defaultValue="clinic" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="clinic">Clinic Info</TabsTrigger>
                    <TabsTrigger value="policies">Rules & Policies</TabsTrigger>
                </TabsList>

                <TabsContent value="clinic">
                    <form action={async (formData) => {
                        'use server'
                        await saveClinicSettings(formData)
                    }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Clinic Details</CardTitle>
                                <CardDescription>Visible on patient tokens and receipts.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="clinicName">Clinic Name</Label>
                                    <Input id="clinicName" name="clinicName" defaultValue={settings.clinicName} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input id="address" name="address" defaultValue={settings.address} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Contact Phone</Label>
                                        <Input id="phone" name="phone" defaultValue={settings.phone} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" defaultValue={settings.email} />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button>Save Changes</Button>
                            </CardFooter>
                        </Card>
                    </form>
                </TabsContent>

                <TabsContent value="policies">
                    <form action={async (formData) => {
                        'use server'
                        await saveClinicSettings(formData)
                    }}>
                        <Card>
                            <CardHeader>
                                <CardTitle>System Policies</CardTitle>
                                <CardDescription>Configure rules for queue management and fees.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <input type="hidden" name="clinicName" value={settings.clinicName} />
                                <input type="hidden" name="address" value={settings.address} />
                                <input type="hidden" name="phone" value={settings.phone} />
                                <input type="hidden" name="email" value={settings.email} />
                                <div className="grid gap-2">
                                    <Label htmlFor="tokenLockMinutes">Token Lock Window</Label>
                                    <Input id="tokenLockMinutes" name="tokenLockMinutes" type="number" defaultValue={settings.tokenLockMinutes} className="max-w-[220px]" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="followUpValidityDays">Follow-up Validity Days</Label>
                                    <Input id="followUpValidityDays" name="followUpValidityDays" type="number" defaultValue={settings.followUpValidityDays} className="max-w-[220px]" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="standardConsultFee">Standard Consultation Fee (₹)</Label>
                                    <Input id="standardConsultFee" name="standardConsultFee" type="number" defaultValue={settings.standardConsultFee} className="max-w-[220px]" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button>Update Policies</Button>
                            </CardFooter>
                        </Card>
                    </form>
                </TabsContent>
            </Tabs>
        </div>
    )
}
