'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { requestOTP, verifyOTPAndLogin } from '@/app/login/actions'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
    const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE')
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        const formData = new FormData()
        formData.append('phone', phone)

        const result = await requestOTP(formData)
        setIsLoading(false)

        if (result.success) {
            setStep('OTP')
        } else {
            setError(result.message || 'Failed to send OTP')
        }
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        const result = await verifyOTPAndLogin(phone, otp)
        // If successful, it redirects. If returns, it failed.
        if (result && !result.success) {
            setError(result.message || 'Verification failed')
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-sm mx-auto shadow-lg touch-target">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                    {step === 'PHONE' ? 'Welcome Back' : 'Verify OTP'}
                </CardTitle>
                <CardDescription className="text-center">
                    {step === 'PHONE'
                        ? 'Enter your mobile number to continue.'
                        : `Enter the code sent to ${phone}`
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={step === 'PHONE' ? handleRequestOTP : handleVerify} className="space-y-4">

                    {step === 'PHONE' ? (
                        <div className="space-y-2">
                            <Label htmlFor="phone">Mobile Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="text-lg py-6" // Larger input for mobile
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="otp">One-Time Password</Label>
                            <Input
                                id="otp"
                                type="text"
                                placeholder="1 2 3 4"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                className="text-lg py-6 tracking-widest text-center"
                                autoFocus
                            />
                        </div>
                    )}

                    {error && <p className="text-sm text-destructive font-medium text-center">{error}</p>}

                    <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        {step === 'PHONE' ? 'Send Code' : 'Verify & Login'}
                    </Button>

                    {step === 'OTP' && (
                        <Button
                            variant="ghost"
                            type="button"
                            className="w-full"
                            onClick={() => setStep('PHONE')}
                        >
                            Change Number
                        </Button>
                    )}

                </form>
            </CardContent>
        </Card>
    )
}
