import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_PORT || process.env.EMAIL_SERVER_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER || process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_PASS || process.env.EMAIL_SERVER_PASSWORD,
    },
});

const OTP_TEMPLATE = (otp: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; }
        .logo { font-size: 24px; font-weight: 900; color: #2563eb; margin-bottom: 24px; }
        .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .text { font-size: 16px; color: #64748b; margin-bottom: 24px; }
        .otp-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-size: 32px; font-weight: 900; color: #2563eb; letter-spacing: 8px; }
        .footer { font-size: 12px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">⚡ FOODBRIDGE AI</div>
        <div class="title">Verify your identity</div>
        <p class="text">Use the security code below to complete your registration or login process.</p>
        <div class="otp-box">
            <div class="otp-code">${otp}</div>
        </div>
        <p class="text">This code will expire in 5 minutes. If you didn't request this, please ignore this email.</p>
        <div class="footer">
            &copy; 2026 FoodBridge AI Protocol. Humanitarian Redistribution Network.
        </div>
    </div>
</body>
</html>
`;

export async function sendOtpEmail(email: string, otp: string) {
    const isSandbox = process.env.EMAIL_SANDBOX_MODE === 'true';

    if (isSandbox) {
        console.log(`[EMAIL SANDBOX] OTP for ${email}: ${otp}`);
        return { success: true, isSandbox: true };
    }

    const emailUser = process.env.EMAIL_USER || process.env.EMAIL_SERVER_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_SERVER_PASSWORD;

    if (!emailUser || !emailPass) {
        console.error('[EMAIL ERROR] SMTP credentials missing. Set EMAIL_USER and EMAIL_PASS in .env.local');
        throw new Error('Email service not configured');
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || `"FoodBridge AI" <${emailUser}>`,
            to: email,
            subject: `${otp} is your FoodBridge AI security code`,
            html: OTP_TEMPLATE(otp),
        });
        return { success: true };
    } catch (error) {
        console.error('[EMAIL ERROR] Failed to send email:', error);
        throw new Error('Failed to deliver OTP email');
    }
}
