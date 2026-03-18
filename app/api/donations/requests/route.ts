import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import dbConnect from '@/lib/db';
import Delivery from '@/models/Delivery';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const GET = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('ngo')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const ngoId = authGate.headers.get('x-user-id');

    await dbConnect();

    // Fetch all pending deliveries for this NGO
    const requests = await Delivery.find({
        ngoId,
        status: 'pending'
    }).populate({
        path: 'donationId',
        match: { status: 'pending_request' },
        populate: {
            path: 'donorId',
            select: 'name email phone'
        }
    }).lean();

    // Filter out deliveries where donationId is null (meaning it didn't match 'pending_request')
    const validRequests = requests.filter(req => req.donationId !== null);

    // Unique-ify by donationId to prevent duplicate cards
    const uniqueMap = new Map();
    validRequests.forEach(req => {
        const dId = req.donationId?._id?.toString();
        if (dId && !uniqueMap.has(dId)) {
            uniqueMap.set(dId, req);
        }
    });
    const uniqueRequests = Array.from(uniqueMap.values());

    // Sort by priority logic: combined rank (ML score + expiry urgency)
    const sortedRequests = uniqueRequests.sort((a: any, b: any) => {
        const donA = a.donationId;
        const donB = b.donationId;

        if (!donA || !donB) return 0;

        // Primary: prioritizationRank (ML Score)
        const rankA = donA.prioritizationRank || 0;
        const rankB = donB.prioritizationRank || 0;

        if (rankB !== rankA) return rankB - rankA;

        // Secondary: Expiry Time (sooner first)
        const expiryA = new Date(donA.expiryTime).getTime();
        const expiryB = new Date(donB.expiryTime).getTime();
        return expiryA - expiryB;
    });

    return successResponse(sortedRequests, 'Incoming requests retrieved successfully');
});
