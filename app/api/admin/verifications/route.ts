import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import dbConnect from '@/lib/db';
import NGOProfile from '@/models/NGOProfile';
import User from '@/models/User';

export const GET = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('admin')(authGate);
    if (roleGate.status !== 200) return roleGate;

    await dbConnect();

    // Fetch all NGOs that are pending verification
    const pendingNGOs = await NGOProfile.find({ verificationStatus: 'pending' })
        .populate('userId', 'email name phone')
        .sort({ createdAt: -1 });

    return successResponse(pendingNGOs, 'Pending NGO verifications retrieved');
});

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('admin')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const { ngoId, action } = await req.json();

    if (!ngoId || !['approve', 'reject'].includes(action)) {
        return errorResponse('Valid NGO ID and action (approve/reject) are required', 400);
    }

    await dbConnect();

    const profile = await NGOProfile.findById(ngoId);
    if (!profile) return errorResponse('NGO Profile not found', 404);

    if (action === 'approve') {
        profile.verificationStatus = 'approved';
        profile.isVerified = true;
    } else {
        profile.verificationStatus = 'rejected';
        profile.isVerified = false;
        // Optional: Could send automated rejection email here
    }

    await profile.save();

    return successResponse(profile, `NGO successfully ${action}d`);
});
