import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import Delivery from '@/models/Delivery';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const { donationId, ngoId } = await req.json();

    if (!donationId || !ngoId) {
        return errorResponse('Donation ID and NGO ID are required', 400);
    }

    await dbConnect();

    const donation = await Donation.findById(donationId);
    if (!donation) {
        return errorResponse('Donation not found', 404);
    }

    if (donation.status !== 'pending') {
        return errorResponse('Donation is already assigned or completed', 400);
    }

    // Update donation status
    donation.status = 'accepted';
    await donation.save();

    // Create delivery record
    const delivery = await Delivery.create({
        donationId,
        ngoId,
        status: 'assigned'
    });

    return successResponse({ donation, delivery }, 'Donation successfully assigned to NGO');
});
