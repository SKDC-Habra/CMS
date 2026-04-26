
import { DigitalToken } from '@/components/patient/DigitalToken'
import { getTokenForCurrentPatient } from '@/lib/actions'
import { notFound } from 'next/navigation'

export default async function TokenPage({
    params,
}: {
    params: Promise<{ tokenId: string }>
}) {
    const { tokenId } = await params
    const token = await getTokenForCurrentPatient(tokenId)

    if (!token) notFound()

    return (
        <div className="pt-4">
            <DigitalToken token={token} />
        </div>
    )
}
