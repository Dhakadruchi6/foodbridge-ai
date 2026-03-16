import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import Donation from '@/models/Donation';
import dbConnect from '@/lib/db';

// --- Feature 7: NGO Human Verification ---
export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('ngo')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const ngoId = authGate.headers.get('x-user-id');
    const { donationId, vote } = await req.json();

    if (!donationId || !vote || !['valid', 'fake'].includes(vote)) {
        return errorResponse('donationId and vote (valid|fake) are required', 400);
    }

    await dbConnect();

    const donation = await Donation.findById(donationId);
    if (!donation) {
        return errorResponse('Donation not found', 404);
    }

    // Prevent duplicate votes
    const existingVote = donation.ngoVerification?.find(
        (v: any) => v.ngoId?.toString() === ngoId
    );
    if (existingVote) {
        return errorResponse('You have already verified this donation.', 400);
    }

    donation.ngoVerification.push({ ngoId, vote });
    await donation.save();

    const validCount = donation.ngoVerification.filter((v: any) => v.vote === 'valid').length;
    const fakeCount = donation.ngoVerification.filter((v: any) => v.vote === 'fake').length;

    return successResponse({
        validVotes: validCount,
        fakeVotes: fakeCount,
        totalVotes: donation.ngoVerification.length,
    }, `Verification recorded: ${vote}`);
});
