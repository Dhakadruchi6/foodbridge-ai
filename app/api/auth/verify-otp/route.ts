import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Verification from '@/models/Verification';
import User from '@/models/User';
import { errorResponse, successResponse } from '@/lib/apiResponse';

export async function POST(req: Request) {
    try {
        let { phone, otp } = await req.json();

        if (!phone || !otp) {
            return errorResponse('Phone and OTP are required', 400);
        }

        // Normalize phone number
        phone = phone.replace(/[^\d]/g, '');
        if (phone.length === 10) {
            phone = `91${phone}`;
        }

        await dbConnect();

        // 1. Get Verification record
        const verification = await Verification.findOne({ phone });

        if (!verification) {
            return errorResponse('No OTP request found for this number.', 404);
        }

        // --- Feature 4: Security Rules ---

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
            verification.attemptCount += 1;
            await verification.save();

            // Also sync to user if exists
            const user = await User.findOne({ phone });
            if (user) {
                user.otpAttemptCount = (user.otpAttemptCount || 0) + 1;
                await user.save();
            }

            return errorResponse('Incorrect OTP. Please try again.', 400);
        }

        // --- Success ---
        // Cleanup verification record
        await Verification.deleteOne({ _id: verification._id });

        // Update User (Feature 5: Database Fields)
        const user = await User.findOne({ phone });
        if (user) {
            user.phoneVerified = true;
            user.otp = undefined;
            user.otpExpires = undefined;
            user.otpAttemptCount = 0;
            await user.save();
        }

        return successResponse({}, 'Phone verified successfully');
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}
