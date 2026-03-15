import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import dbConnect from '@/lib/db';
import Delivery from '@/models/Delivery';
import Donation from '@/models/Donation';
import Notification from '@/models/Notification';
import NGOProfile from '@/models/NGOProfile';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendNotification } from '@/services/notificationService';

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('ngo')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const ngoUserId = authGate.headers.get('x-user-id');
    const { deliveryId, status } = await req.json();

    if (!deliveryId || !status) {
        return errorResponse('Delivery ID and status are required', 400);
    }

    if (!['assigned', 'picked_up', 'completed'].includes(status)) {
        return errorResponse('Invalid status', 400);
    }

    await dbConnect();

    // Build update object with timestamps
    const updateData: any = { status };
    if (status === 'picked_up') {
        updateData.pickupTime = new Date();
    } else if (status === 'completed') {
        updateData.deliveryTime = new Date();
    }

    const delivery = await Delivery.findByIdAndUpdate(deliveryId, updateData, { new: true });
    if (!delivery) return errorResponse('Delivery not found', 404);

    // Sync the Donation status
    const donationStatusMap: Record<string, string> = {
        'picked_up': 'picked_up',
        'completed': 'delivered',
    };
    if (donationStatusMap[status]) {
        await Donation.findByIdAndUpdate(delivery.donationId, { status: donationStatusMap[status] });
    }

    // Create notification for the donor
    try {
        const donation = await Donation.findById(delivery.donationId);
        if (donation) {
            const ngoProfile = await NGOProfile.findOne({ userId: ngoUserId });
            const ngoName = ngoProfile?.ngoName || 'an NGO partner';

            const notificationMessages: Record<string, { message: string; type: string }> = {
                assigned: {
                    message: `Your food donation has been accepted by ${ngoName}.`,
                    type: 'donation_accepted',
                },
                picked_up: {
                    message: `Food pickup is in progress. ${ngoName} is on the way to collect your donation.`,
                    type: 'pickup_started',
                },
                completed: {
                    message: `Your donation has been successfully delivered to beneficiaries by ${ngoName}. Thank you for your generosity! 🙏`,
                    type: 'delivered',
                },
            };

            const notif = notificationMessages[status];
            if (notif) {
                await sendNotification({
                    userId: donation.donorId.toString(),
                    donationId: donation._id.toString(),
                    message: notif.message,
                    type: notif.type,
                    data: { url: `/dashboard/donor` }
                });
            }
        }
    } catch (notifErr) {
        console.error('[NOTIFICATION] Failed to create notification:', notifErr);
        // Non-fatal — don't block the status update
    }

    return successResponse(delivery, 'Delivery status updated successfully');
});
