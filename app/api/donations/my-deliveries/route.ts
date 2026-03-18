import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import dbConnect from '@/lib/db';
import Delivery from '@/models/Delivery';
import { successResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const GET = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('ngo')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const ngoId = authGate.headers.get('x-user-id');
    await dbConnect();

    const deliveries = await Delivery.find({ ngoId })
        .populate({
            path: 'donationId',
            select: 'foodType quantity pickupAddress city status expiryTime donorId latitude longitude description verificationCode',
            populate: {
                path: 'donorId',
                select: 'name phone'
            },
            match: { status: { $ne: 'flagged' } }
        })
        .sort({ createdAt: -1 });

    // Filter out deliveries where the donation was flagged (resulting in null donationId due to match clause)
    const validDeliveries = deliveries.filter(d => d.donationId !== null);

    return successResponse(validDeliveries, 'Your active deliveries retrieved successfully');
});
