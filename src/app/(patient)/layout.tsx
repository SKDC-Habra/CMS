import { requireRole } from '@/lib/auth'
import { Role } from '@prisma/client'

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
    const user = await requireRole(Role.PATIENT)

    return (
        <div className="min-h-[100dvh] bg-background text-foreground">
            <header className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center justify-between px-4">
                    <h1 className="text-xl font-bold tracking-tight">Smart Clinic</h1>
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {(user.name || 'ME').slice(0, 2).toUpperCase()}
                    </div>
                </div>
            </header>
            <main className="container max-w-md mx-auto p-4 pb-24 safe-area-bottom">
                {children}
            </main>
        </div>
    )
}
