import dbConnect from '@/lib/db';
import Verification from '@/models/Verification';
import User from '@/models/User';
import { errorResponse, successResponse } from '@/lib/apiResponse';

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

export async function POST(req: Request) {
    try {
        let { phone } = await req.json();

        if (!phone) {
            return errorResponse('Phone number is required', 400);
        }

        // Normalize phone number (E.164 without the plus for MSG91 usually, but let's see)
        // MSG91 mobile format: Country Code + Mobile Number (e.g. 919876543210)
        phone = phone.replace(/[^\d]/g, '');
        if (phone.length === 10) {
            phone = `91${phone}`; // Default to India
        }

        await dbConnect();

        // --- Feature 4: Rate Limiting (5 requests per hour) ---
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const verification = await Verification.findOne({ phone });

        if (verification) {
            // Filter history to last hour
            const history = verification.requestHistory || [];
            const recentRequests = history.filter((time: Date) => time > oneHourAgo);

            if (recentRequests.length >= 5) {
                return errorResponse('Too many OTP requests. Please try again in an hour.', 429);
            }

            verification.requestHistory = [...recentRequests, new Date()];
            await verification.save();
        } else {
            await Verification.create({
                phone,
                otp: '000000', // Placeholder
                expiresAt: new Date(),
                requestHistory: [new Date()]
            });
        }

        // --- Feature 3: Generate 6-digit OTP ---
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store OTP
        await Verification.findOneAndUpdate(
            { phone },
            { otp, expiresAt, attemptCount: 0 },
            { upsert: true }
        );

        // Sync to User if exists
        const user = await User.findOne({ phone });
        if (user) {
            user.otp = otp;
            user.otpExpires = expiresAt;
            user.otpAttemptCount = 0;
            await user.save();
        }
        // --- Feature 1: MSG91 Integration ---
        const isSandboxMode = process.env.MSG91_SANDBOX_MODE === 'true';

        if (MSG91_AUTH_KEY && MSG91_TEMPLATE_ID && !MSG91_AUTH_KEY.includes('YOUR_')) {
            try {
                const response = await fetch('https://control.msg91.com/api/v5/otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'authkey': MSG91_AUTH_KEY
                    },
                    body: JSON.stringify({
                        template_id: MSG91_TEMPLATE_ID,
                        mobile: phone,
                        otp: otp,
                        expiry: 5 // minutes
                    })
                });

                const result = await response.json();

                if (result.type !== 'success') {
                    console.error('[MSG91] Error:', result.message);

                    // Fallback to Sandbox if enabled
                    if (isSandboxMode) {
                        console.log(`[MSG91] SANDBOX MODE: SMS failed (${result.message}). Returning debugOtp.`);
                        return successResponse({
                            message: 'MSG91 Sandbox: SMS blocked by DLT/Auth. Use the code below for testing.',
                            debugOtp: otp,
                            isSandbox: true
                        });
                    }

                    return errorResponse(`SMS Delivery Failed: ${result.message}`, 500);
                }
                console.log(`[MSG91] OTP sent to ${phone}`);
            } catch (fetchError: any) {
                console.error('[MSG91] Fetch Error:', fetchError.message);
                if (isSandboxMode) {
                    return successResponse({
                        message: 'MSG91 Sandbox: Connection failed. Use the code below for testing.',
                        debugOtp: otp,
                        isSandbox: true
                    });
                }
                return errorResponse(`SMS Gateway Error: ${fetchError.message}`, 500);
            }
        } else {
            // Strictly NO on-screen fallback unless Sandbox mode is explicitly enabled
            if (isSandboxMode) {
                console.log('[MSG91] SANDBOX MODE: Credentials missing. Returning debugOtp.');
                return successResponse({
                    message: 'MSG91 Sandbox: API not configured. Use the code below for testing.',
                    debugOtp: otp,
                    isSandbox: true
                });
            }
            console.warn('[MSG91] AUTH KEY MISSING - SMS NOT SENT');
            return errorResponse('SMS gateway not configured', 503);
        }

        return successResponse({
            message: 'OTP sent successfully',
            ...(isSandboxMode ? { debugOtp: otp, isSandbox: true } : {})
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}
