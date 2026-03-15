import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { errorResponse, successResponse } from '@/lib/apiResponse';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return errorResponse('Email is required', 400);
        }

        await dbConnect();

        const user = await User.findOne({ email });
        if (!user) {
            // Security best practice: don't reveal if user exists, but for demo we can.
            return errorResponse('User not found', 404);
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        // REAL EMAIL SENDING
        const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`;
        const emailResult = await import('@/services/emailService').then(m => m.sendPasswordResetEmail(email, resetUrl));

        if (!emailResult.success) {
            console.error('[FORGOT-PASSWORD] Email delivery failed:', emailResult.error);
            // We still return success to the UI for security (don't reveal failure), 
            // but we log it for the developer.
        }

        return successResponse({}, 'Password reset link sent to your email');
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}
