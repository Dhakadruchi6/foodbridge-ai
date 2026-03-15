import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"FoodBridge AI" <noreply@foodbridge.com>',
            to,
            subject,
            html,
        });
        console.log(`[EMAIL SERVICE] Email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('[EMAIL SERVICE] Send Error:', error);
        return { success: false, error: error.message };
    }
};

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
    const subject = 'Reset Your FoodBridge AI Password';
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 24px;">
            <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Recover Your Keys</h1>
            <p style="color: #64748b; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                You requested to reset your password. Click the secure button below to choose a new one. This link will expire in 1 hour.
            </p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 16px 32px; font-size: 16px; font-weight: 800; text-decoration: none; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);">
                Reset Password
            </a>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                If you didn't request this, you can safely ignore this email.
            </p>
        </div>
    `;
    return sendEmail(email, subject, html);
};
