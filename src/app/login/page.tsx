
import { LoginForm } from '@/components/auth/LoginForm'
import { Store } from 'lucide-react'

export default function LoginPage() {
    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-muted/30">
            <div className="mb-8 flex flex-col items-center gap-2">
                <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                    <Store className="h-8 w-8 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Smart Clinic</h1>
            </div>
            <LoginForm />
        </div>
    )
}
