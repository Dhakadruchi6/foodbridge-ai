import dbConnect from '@/lib/db';
import Verification from '@/models/Verification';
import User from '@/models/User';
import { errorResponse, successResponse } from '@/lib/apiResponse';
import { sendOtpEmail } from '@/services/emailService';

export async function POST(req: Request) {
    try {
        let { email } = await req.json();

        if (!email) {
            return errorResponse('Email is required', 400);
        }

        email = email.toLowerCase().trim();

        await dbConnect();

        // --- Rate Limiting (5 requests per hour per email) ---
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const verification = await Verification.findOne({ email });

        if (verification) {
            const history = verification.requestHistory || [];
            const recentRequests = history.filter((time: Date) => time > oneHourAgo);

            if (recentRequests.length >= 5) {
                return errorResponse('Too many OTP requests. Please try again in an hour.', 429);
            }

            verification.requestHistory = [...recentRequests, new Date()];
            await verification.save();
        } else {
            await Verification.create({
                email,
                otp: '000000', // Placeholder
                expiresAt: new Date(),
                requestHistory: [new Date()]
            });
        }

        // --- Generate 6-digit OTP ---
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store OTP
        await Verification.findOneAndUpdate(
            { email },
            { otp, expiresAt, attemptCount: 0 },
            { upsert: true }
        );

        // Sync to User if exists (though for registration they might not exist yet)
        const user = await User.findOne({ email });
        if (user) {
            user.otp = otp;
            user.otpExpires = expiresAt;
            user.otpAttemptCount = 0;
            await user.save();
        }

        // --- Send Email ---
        const emailResult = await sendOtpEmail(email, otp);

        return successResponse({
            message: 'OTP sent successfully to your email',
            isSandbox: emailResult.isSandbox
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('[SEND-OTP ERROR]', error);
        return errorResponse(error.message || 'Failed to send OTP', 500);
    }
}
