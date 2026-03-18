import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import NGOProfile from '@/models/NGOProfile';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendNotification } from '@/services/notificationService';
import { updateDeliveryLifecycle } from '@/services/donationService';
import User from '@/models/User';
import { sendSMS } from '@/lib/sms';

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

    await dbConnect();

    // Use the centralized service logic for strict lifecycle management
    const delivery = await updateDeliveryLifecycle(deliveryId, status, ngoUserId!);

    // Side Effect: Notify Donor (already partly handled in service, but let's keep notification here for flexibility)
    try {
        const donation = await Donation.findById(delivery.donationId);
        if (donation) {
            const ngoProfile = await NGOProfile.findOne({ userId: ngoUserId });
            const ngoName = ngoProfile?.ngoName || 'an NGO partner';

            const notificationMessages: Record<string, { message: string; type: string }> = {
                accepted: {
                    message: `Your food donation has been accepted by ${ngoName}.`,
                    type: 'donation_accepted',
                },
                pickup_in_progress: {
                    message: `Food pickup is in progress. ${ngoName} is on the way to collect your donation.`,
                    type: 'pickup_started',
                },
                delivered: {
                    message: `Your donation has been successfully delivered by ${ngoName}.`,
                    type: 'delivered',
                },
                collected: {
                    message: `Food collected! Your donation is now being transported by ${ngoName}.`,
                    type: 'collected',
                },
                completed: {
                    message: `Mission Complete! Your donation reaches beneficiaries. Thank you! 🙏`,
                    type: 'mission_complete',
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

                // SMS Notification
                const donor = await User.findById(donation.donorId);
                if (donor && donor.smsEnabled && donor.phone) {
                    await sendSMS(
                        donor.phone,
                        notif.message,
                        'status_update',
                        donor._id.toString()
                    );
                }
            }
        }
    } catch (notifErr) {
        console.error('[NOTIFICATION] Failed to create notification:', notifErr);
    }

    return successResponse(delivery, 'Delivery status updated successfully');
});
