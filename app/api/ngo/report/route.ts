import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import dbConnect from '@/lib/db';
import NGOReport from '@/models/NGOReport';
import NGOProfile from '@/models/NGOProfile';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('admin', 'donor')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const reporterId = authGate.headers.get('x-user-id');
    const { targetNgoId, reason, description } = await req.json();

    if (!targetNgoId || !reason) {
        return errorResponse('Target NGO ID and reason are strictly required', 400);
    }

    await dbConnect();

    // Log the formal Report onto the immutable ledger
    const newReport = await NGOReport.create({
        targetNgoId,
        reportedByUserId: reporterId,
        reason,
        description: description || ''
    });

    // Execute Trust Score Penalties Programmatically
    const profile = await NGOProfile.findOne({ userId: targetNgoId });
    if (profile) {
        profile.reportsCount = (profile.reportsCount || 0) + 1;
        profile.trustScore = Math.max(0, (profile.trustScore || 50) - 10);

        // Execute automated safety suspension checks
        if (profile.trustScore < 20 || profile.reportsCount >= 3) {
            profile.isVerified = false;
            profile.ngo_verified = false;
            profile.verificationStatus = 'rejected';
            profile.status = 'rejected';

            // Propagate strict ban to root Identity User object
            await User.findByIdAndUpdate(targetNgoId, { isActive: false });
        }

        await profile.save();
    }

    return successResponse({ reportId: newReport._id, appliedPenaltyStatus: true }, 'NGO formally reported and penalties assessed', 201);
});
