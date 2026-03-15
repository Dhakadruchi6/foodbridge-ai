import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Verification from '@/models/Verification';
import User from '@/models/User';
import { errorResponse, successResponse } from '@/lib/apiResponse';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function POST(req: Request) {
    try {
        let { phone } = await req.json();

        if (!phone) {
            return errorResponse('Phone number is required', 400);
        }

        // Normalize phone number to E.164
        phone = phone.replace(/[^\d+]/g, ''); // Remove spaces, dashes, etc.
        if (!phone.startsWith('+')) {
            phone = `+91${phone}`; // Default to India if no country code
        }

        await dbConnect();

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store OTP in Verification collection (handles both new and existing users)
        await Verification.findOneAndUpdate(
            { phone },
            { otp, expiresAt },
            { upsert: true, new: true }
        );

        // If user exists, also sync to User record for redundancy/legacy compatibility
        const user = await User.findOne({ phone });
        if (user) {
            user.otp = otp;
            user.otpExpires = expiresAt;
            await user.save();
        }

        // REAL SMS SENDING
        if (client && twilioPhone) {
            try {
                await client.messages.create({
                    body: `Your FoodBridge AI verification code is: ${otp}. Valid for 5 minutes.`,
                    from: twilioPhone,
                    to: phone
                });
                console.log(`[SMS GATEWAY] Real SMS sent to ${phone}`);
            } catch (smsError: any) {
                console.error('[SMS GATEWAY] Twilio Error:', smsError.message);

                // If it's a trial account error (unverified number), fallback to MOCK
                if (smsError.message.includes('unverified') || smsError.code === 21608) {
                    console.log(`[SMS GATEWAY] FALLBACK TO MOCK MODE: Sending OTP ${otp} to ${phone}`);
                    return successResponse({
                        message: 'Trial account: Use code below',
                        debugOtp: otp
                    });
                }

                return errorResponse(`Twilio Error: ${smsError.message}`, 500);
            }
        } else {
            console.log(`[SMS GATEWAY] MOCK MODE: Sending OTP ${otp} to ${phone}`);
            if (!accountSid || !authToken || !twilioPhone) {
                console.warn('TWILIO credentials partially or fully missing in .env.local');
            }
        }

        return successResponse({
            message: 'OTP sent successfully',
            debugOtp: client ? undefined : otp
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}
