import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import Report from '@/models/Report';
import Donation from '@/models/Donation';
import User from '@/models/User';
import dbConnect from '@/lib/db';

// Create a report (NGOs reporting a donation)
export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('ngo')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const userId = authGate.headers.get('x-user-id');
    const body = await req.json();
    const { donationId, reason } = body;

    if (!donationId) {
        return errorResponse('Donation ID is required', 400);
    }

    await dbConnect();

    const existingReport = await Report.findOne({ donationId, reportedByNgoId: userId });

    if (existingReport) {
        return errorResponse('You have already reported this donation.', 400);
    }

    const report = await Report.create({
        donationId,
        reportedByNgoId: userId,
        reason: reason || 'not_food',
        status: 'pending'
    });

    return successResponse(report, 'Report submitted successfully. Thank you for keeping the ecosystem safe.', 201);
});

// Get all reports (Admin only)
export const GET = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('admin')(authGate);
    if (roleGate.status !== 200) return roleGate;

    await dbConnect();

    // Populate the donation details (specifically foodImage and donor details)
    const reports = await Report.find({})
        .populate({
            path: 'donationId',
            select: 'foodType quantity foodImage expiryTime status city pickupAddress description donorId',
            populate: {
                path: 'donorId',
                select: 'name email phone'
            }
        })
        .populate('reportedByNgoId', 'name email phone')
        .sort({ createdAt: -1 });

    return successResponse(reports, 'Reports retrieved successfully for moderation', 200);
});

export const PATCH = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('admin')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const body = await req.json();
    const { reportId, status, adminNotes, adminAction } = body;

    if (!reportId || !status) {
        return errorResponse('Report ID and status are required', 400);
    }

    await dbConnect();

    const report = await Report.findByIdAndUpdate(
        reportId,
        { status, adminNotes, adminAction: adminAction || 'none' },
        { new: true }
    ).populate({
        path: 'donationId',
        select: 'donorId',
    });

    if (!report) {
        return errorResponse('Report not found', 404);
    }

    // --- Feature 8: Admin Moderation Actions ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const donorId = (report.donationId as any)?.donorId;

    if (status === 'resolved' && donorId) {
        // Flag the donation
        await Donation.findByIdAndUpdate(report.donationId, { status: 'flagged' });

        if (adminAction === 'warning') {
            await User.findByIdAndUpdate(donorId, { $inc: { warnings: 1 } });
        } else if (adminAction === 'suspension') {
            await User.findByIdAndUpdate(donorId, { isSuspended: true, $inc: { warnings: 1 } });
        } else if (adminAction === 'deletion') {
            await Donation.findByIdAndDelete(report.donationId);
        }
    }

    return successResponse(report, `Report marked as ${status}${adminAction && adminAction !== 'none' ? ` with action: ${adminAction}` : ''}`, 200);
});
