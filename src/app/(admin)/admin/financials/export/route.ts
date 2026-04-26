import { getFinancialReportData } from '@/lib/actions'

export async function GET() {
    const report = await getFinancialReportData()
    const rows = [
        ['Patient', 'Doctor', 'Service', 'Mode', 'Status', 'Amount'],
        ...report.payments.map((payment) => [
            payment.token.patient.name || '',
            payment.token.doctor.name,
            payment.token.appointmentType.label,
            payment.mode,
            payment.status,
            String(payment.amount),
        ]),
    ]

    const csv = rows
        .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
        .join('\n')

    return new Response(csv, {
        headers: {
            'content-type': 'text/csv; charset=utf-8',
            'content-disposition': 'attachment; filename="smart-clinic-financials.csv"',
        },
    })
}
