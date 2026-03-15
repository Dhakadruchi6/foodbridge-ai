import webpush from 'web-push';
import Notification from '@/models/Notification';
import User from '@/models/User';
import dbConnect from '@/lib/db';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(
        'mailto:support@foodbridge.ai',
        publicVapidKey,
        privateVapidKey
    );
}

export const sendNotification = async ({
    userId,
    message,
    type,
    donationId,
    data = {}
}: {
    userId: string;
    message: string;
    type: string;
    donationId?: string;
    data?: any;
}) => {
    try {
        await dbConnect();

        // 1. Save to Database
        const notification = await Notification.create({
            userId,
            message,
            type,
            donationId,
        });

        // 2. Send Browser Push Notification if subscription exists
        const user = await User.findById(userId);
        if (user?.pushSubscription) {
            const payload = JSON.stringify({
                title: getNotificationTitle(type),
                body: message,
                data: {
                    url: `/dashboard/${user.role}`, // Generic redirection, specific if possible
                    donationId,
                    ...data
                }
            });

            await webpush.sendNotification(user.pushSubscription, payload).catch(err => {
                console.error("[PUSH] Error sending notification:", err);
                // If 410 Gone, remove invalid subscription
                if (err.statusCode === 410) {
                    user.pushSubscription = undefined;
                    user.save();
                }
            });
        }

        return notification;
    } catch (error) {
        console.error("[NOTIFICATION SERVICE] Failed to send:", error);
    }
};

const getNotificationTitle = (type: string) => {
    switch (type) {
        case 'new_donation': return '🍛 New Food Donation Available';
        case 'donation_accepted': return '✅ Donation Accepted';
        case 'pickup_started': return '🚚 NGO on the way';
        case 'collected': return '📦 Food Collected';
        case 'delivered': return '🎉 Food Delivered Successfully';
        default: return '📢 FoodBridge Alert';
    }
};

export default {
    sendNotification
};
