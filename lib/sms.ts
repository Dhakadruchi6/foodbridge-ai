import SMSLog from '@/models/SMSLog';
import dbConnect from './db';

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_MSG_URL = "https://control.msg91.com/api/v5/sms/send";

/**
 * Sends an SMS using MSG91
 * @param phone Recipient's phone number
 * @param message The SMS message
 * @param type Type of SMS for logging
 * @param userId Optional user ID for rate limiting
 */
export async function sendSMS(phone: string, message: string, type: string, userId?: string) {
    if (!MSG91_AUTH_KEY) {
        console.warn("SMS System: No MSG91_AUTH_KEY found in environment.");
        return { success: false, error: "Configuration missing" };
    }

    try {
        await dbConnect();

        // 1. Rate Limiting Check (Max 5 per hour per user)
        if (userId) {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const smsCount = await SMSLog.countDocuments({
                userId,
                sentAt: { $gte: oneHourAgo },
                status: 'sent'
            });

            if (smsCount >= 5) {
                console.log(`SMS Rate Limit reached for user ${userId}`);
                await SMSLog.create({
                    userId,
                    phone,
                    message: "[RATE LIMITED] " + message,
                    type,
                    status: 'rate_limited'
                });
                return { success: false, error: "Rate limit reached" };
            }
        }

        // 2. Prepare Payload for MSG91
        // Using common v5 format
        const response = await fetch(MSG91_MSG_URL, {
            method: 'POST',
            headers: {
                'authkey': MSG91_AUTH_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "template_id": process.env.MSG91_TEMPLATE_ID || "",
                "short_url": "1",
                "realTime": 1,
                "recipients": [
                    {
                        "mobiles": phone.startsWith('91') ? phone : `91${phone}`,
                        "message": message, // This works if template is set up or for transactional
                        "var": message // Backup for some template configurations
                    }
                ]
            })
        });

        const result = await response.json();
        const isSuccess = result.type === 'success' || response.ok;

        // 3. Log the result
        await SMSLog.create({
            userId,
            phone,
            message,
            type,
            status: isSuccess ? 'sent' : 'failed'
        });

        return { success: isSuccess, data: result };

    } catch (err: any) {
        console.error("SMS Error:", err);
        await SMSLog.create({
            userId,
            phone,
            message: `[ERROR: ${err.message}] ` + message,
            type,
            status: 'failed'
        });
        return { success: false, error: err.message };
    }
}
