import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import Delivery from '@/models/Delivery';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('ngo')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const ngoId = authGate.headers.get('x-user-id');
    const { donationId } = await req.json();

    if (!donationId) {
        return errorResponse('Donation ID is required', 400);
    }

    await dbConnect();

    // 1. Reset Donation status back to pending so it can be picked up by others or rematched
    const donation = await Donation.findOneAndUpdate(
        { _id: donationId, status: 'pending_request' },
        { status: 'pending' },
        { new: true }
    );

    if (!donation) {
        return errorResponse('Donation request not found or already processed', 400);
    }

    // 2. Mark the delivery as rejected
    await Delivery.findOneAndUpdate(
        { donationId: donation._id, ngoId, status: 'pending' },
        { status: 'rejected' },
        { new: true }
    );

    return successResponse({ donationId }, 'Donation request rejected successfully');
});
