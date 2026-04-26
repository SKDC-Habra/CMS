import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { completeToken, getQueueData, markNoShow, skipToken } from '@/lib/actions'
import { AlertTriangle, CheckCircle, SkipForward, UserX } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"

export default async function QueueManagementPage({
    searchParams,
}: {
    searchParams: Promise<{ sessionId?: string }>
}) {
    const { sessionId } = await searchParams
    const session = await getQueueData(sessionId)
    const currentToken = session?.tokens.find((token) => token.status === 'IN_CONSULTATION') || session?.tokens.find((token) => token.status === 'BOOKED')
    const nextTokens = session?.tokens.filter((token) => token.id !== currentToken?.id) || []

    return (
        <div className="grid min-h-[calc(100vh-140px)] gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
                <Card className="flex h-full flex-col border-primary/20 shadow-md">
                    <CardHeader className="border-b bg-primary/5">
                        <CardTitle>Current Patient {session ? `· ${session.doctor.name}` : ''}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col items-center justify-center space-y-4 p-12 text-center">
                        {currentToken ? (
                            <>
                                <Badge className="mb-4 px-4 py-1 text-lg">Token #{currentToken.number}</Badge>
                                <h1 className="text-5xl font-bold tracking-tight">{currentToken.patient.name}</h1>
                                <p className="text-xl text-muted-foreground">{currentToken.appointmentType.label}</p>
                                <div className="mt-8 grid w-full max-w-xl gap-3 md:grid-cols-3">
                                    <form action={async () => {
                                        'use server'
                                        await completeToken(currentToken.id, undefined, false)
                                    }}>
                                        <Button size="lg" className="h-16 w-full text-lg" type="submit">
                                            <CheckCircle className="mr-2 h-6 w-6" /> Complete
                                        </Button>
                                    </form>
                                    <form action={async () => {
                                        'use server'
                                        await skipToken(currentToken.id)
                                    }}>
                                        <Button size="lg" variant="secondary" className="h-16 w-full text-lg" type="submit">
                                            <SkipForward className="mr-2 h-6 w-6" /> Skip
                                        </Button>
                                    </form>
                                    <form action={async () => {
                                        'use server'
                                        await markNoShow(currentToken.id)
                                    }}>
                                        <Button size="lg" variant="outline" className="h-16 w-full text-lg" type="submit">
                                            <UserX className="mr-2 h-6 w-6" /> No-show
                                        </Button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="text-muted-foreground">No active patients in queue.</div>
                        )}
                    </CardContent>

                    <div className="border-t bg-muted/20 p-4">
                        <Button variant="destructive" className="w-full" disabled>
                            <AlertTriangle className="mr-2 h-4 w-4" /> Emergency Override in Super Admin
                        </Button>
                    </div>
                </Card>
            </div>

            <div className="h-full">
                <Card className="flex h-full flex-col">
                    <CardHeader className="border-b">
                        <CardTitle>Up Next</CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-3">
                            {!session && (
                                <p className="py-4 text-center text-sm text-muted-foreground">No session selected.</p>
                            )}
                            {session && nextTokens.length === 0 && (
                                <p className="py-4 text-center text-sm text-muted-foreground">Queue is empty.</p>
                            )}
                            {nextTokens.map((token) => (
                                <div key={token.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                            {token.number}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{token.patient.name}</p>
                                            <p className="text-xs text-muted-foreground">{token.status.replace('_', ' ')} · {token.appointmentType.label}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    )
}
