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
        .populate('donationId', 'foodType quantity pickupAddress city status expiryTime')
        .sort({ createdAt: -1 });

    return successResponse(deliveries, 'Your active deliveries retrieved successfully');
});
