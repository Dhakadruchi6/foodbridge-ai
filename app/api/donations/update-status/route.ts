import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import dbConnect from '@/lib/db';
import Delivery from '@/models/Delivery';
import Donation from '@/models/Donation';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('ngo')(authGate);
    if (roleGate.status !== 200) return roleGate;

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

    if (!delivery) {
        return errorResponse('Delivery not found', 404);
    }

    // Sync the Donation status to match the delivery lifecycle
    const donationStatusMap: Record<string, string> = {
        'picked_up': 'picked_up',
        'completed': 'delivered',
    };

    if (donationStatusMap[status]) {
        await Donation.findByIdAndUpdate(delivery.donationId, {
            status: donationStatusMap[status],
        });
    }

    return successResponse(delivery, 'Delivery status updated successfully');
});
