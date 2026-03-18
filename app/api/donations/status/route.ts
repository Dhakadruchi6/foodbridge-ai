import { authMiddleware } from '@/middleware/authMiddleware';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const { donationId } = await req.json();

    if (!donationId) {
        return errorResponse('Donation ID is required', 400);
    }

    await dbConnect();

    const donation = await Donation.findById(donationId).select('status');
    if (!donation) {
        return errorResponse('Donation not found', 404);
    }

    return successResponse({ status: donation.status }, 'Status fetched successfully');
});
