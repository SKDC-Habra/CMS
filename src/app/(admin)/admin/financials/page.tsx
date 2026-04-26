import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import { getFinancialReportData } from "@/lib/actions"

export default async function FinancialsPage() {
    const report = await getFinancialReportData()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-primary">Financial Reports</h2>
                <div className="flex gap-2">
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                    <Button asChild>
                        <a href="/admin/financials/export"><Download className="mr-2 h-4 w-4" /> Export CSV</a>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue Today</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">₹{report.total.toLocaleString('en-IN')}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Cash Collection</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">₹{report.cash.toLocaleString('en-IN')}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">UPI / Online</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">₹{report.online.toLocaleString('en-IN')}</div></CardContent>
                </Card>
            </div>

            <Tabs defaultValue="daily" className="w-full">
                <TabsList>
                    <TabsTrigger value="daily">Daily View</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
                </TabsList>
                <TabsContent value="daily" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Today&apos;s Transactions</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Patient Name</TableHead>
                                        <TableHead>Doctor</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Mode</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.payments.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                                No payments recorded today.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {report.payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{payment.token.patient.name}</TableCell>
                                            <TableCell>{payment.token.doctor.name}</TableCell>
                                            <TableCell>{payment.token.appointmentType.label}</TableCell>
                                            <TableCell>{payment.mode}</TableCell>
                                            <TableCell>{payment.status}</TableCell>
                                            <TableCell className="text-right">₹{payment.amount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="weekly"><div className="p-12 text-center text-muted-foreground">Weekly aggregation is ready for a chart layer.</div></TabsContent>
                <TabsContent value="monthly"><div className="p-12 text-center text-muted-foreground">Monthly aggregation is ready for a chart layer.</div></TabsContent>
            </Tabs>
        </div>
    )
}
