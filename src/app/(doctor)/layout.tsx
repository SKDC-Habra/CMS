import { requireDoctor } from "@/lib/auth"

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
    const doctor = await requireDoctor()

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <header className="bg-white dark:bg-slate-950 border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <h1 className="font-bold text-xl text-primary">Dr. Smart Clinic</h1>
                <div className="text-sm text-muted-foreground">
                    Welcome, {doctor.name || 'Doctor'}
                </div>
            </header>
            <main className="p-4 md:p-8 max-w-5xl mx-auto">
                {children}
            </main>
        </div>
    )
}
