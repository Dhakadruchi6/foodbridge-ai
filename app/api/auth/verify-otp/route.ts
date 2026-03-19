import dbConnect from '@/lib/db';
import Verification from '@/models/Verification';
import User from '@/models/User';
import { errorResponse, successResponse } from '@/lib/apiResponse';

export async function POST(req: Request) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return errorResponse('Email and OTP are required', 400);
        }

        email = email.toLowerCase().trim();

        await dbConnect();

        // 1. Get Verification record
        const verification = await Verification.findOne({ email });

        if (!verification) {
            return errorResponse('No OTP request found for this email.', 404);
        }

        // Expiry check (5 mins)
        if (new Date() > verification.expiresAt) {
            return errorResponse('OTP has expired. Please request a new one.', 400);
        }

        // Attempt count check (Max 3)
        if (verification.attemptCount >= 3) {
            return errorResponse('Too many incorrect attempts. Please request a new OTP.', 429);
        }

        // Verify OTP
        if (verification.otp !== otp) {
            // Increment attempt count
            verification.attemptCount = (verification.attemptCount || 0) + 1;
            await verification.save();

            // Also sync to user if exists
            const user = await User.findOne({ email });
            if (user) {
                user.otpAttemptCount = (user.otpAttemptCount || 0) + 1;
                await user.save();
            }

            return errorResponse('Incorrect OTP. Please try again.', 400);
        }

        // --- Success ---
        // Cleanup verification record
        await Verification.deleteOne({ _id: verification._id });

        // Update User
        const user = await User.findOne({ email });
        if (user) {
            user.emailVerified = true;
            user.otp = undefined;
            user.otpExpires = undefined;
            user.otpAttemptCount = 0;
            await user.save();
        }

        return successResponse({}, 'Email verified successfully');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('[VERIFY-OTP ERROR]', error);
        return errorResponse(error.message, 500);
    }
}
