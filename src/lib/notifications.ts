export async function sendSMS(to: string, message: string) {
    console.log(`[SMS Stub] To: ${to}, Message: ${message}`)
    // TODO: Integrate with Twilio / msg91
    return true
}

export async function sendEmail(to: string, subject: string, body: string) {
    console.log(`[Email Stub] To: ${to}, Subject: ${subject}`)
    console.log(`Body: ${body}`)
    // TODO: Integrate with Resend / SendGrid
    return true
}
