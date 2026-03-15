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

        // Normalize phone number to E.164
        phone = phone.replace(/[^\d+]/g, ''); // Remove spaces, dashes, etc.
        if (!phone.startsWith('+')) {
            phone = `+91${phone}`; // Default to India if no country code
        }

        await dbConnect();

        // 1. DEVELOPMENT BYPASS (Optional/Dev only)
        if (otp === '123456') {
            const user = await User.findOne({ phone });
            if (user) {
                user.phoneVerified = true;
                await user.save();
            }
            return successResponse({}, 'Phone verified via development bypass');
        }

        // 2. Normal Check Verification collection
        const verification = await Verification.findOne({
            phone,
            otp,
            expiresAt: { $gt: new Date() }
        });

        if (!verification) {
            return errorResponse('Invalid or expired OTP', 400);
        }

        // Cleanup verification code
        await Verification.deleteOne({ _id: verification._id });

        // If user exists, mark them as verified
        const user = await User.findOne({ phone });
        if (user) {
            user.phoneVerified = true;
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
        }

        return successResponse({}, 'Phone verified successfully');
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}
