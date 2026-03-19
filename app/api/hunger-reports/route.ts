import dbConnect from '@/lib/db';
import HungerReport from '@/models/HungerReport';
import { authMiddleware } from '@/middleware/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const POST = asyncHandler(async (req: Request) => {
    // Public reporting allowed, but capture user if logged in
    let userId = null;
    try {
        const authGate = await authMiddleware(req);
        if (authGate.status === 200) {
            userId = authGate.headers.get('x-user-id');
        }
    } catch (err) {
        // Ignore auth failure for public reporting
    }

    const { locationName, lat, lng, peopleCount, urgency } = await req.json();

    if (!locationName || !lat || !lng || !peopleCount) {
        return errorResponse('Location and people count are required', 400);
    }

    await dbConnect();

    const report = await HungerReport.create({
        locationName,
        lat,
        lng,
        peopleCount,
        urgency: urgency || 'medium',
        reportedBy: userId,
    });

    return successResponse(report, 'Hunger report submitted successfully. Thank you!', 201);
});

export const GET = asyncHandler(async (req: Request) => {
    await dbConnect();
    const reports = await HungerReport.find({ status: 'pending' }).sort({ createdAt: -1 });
    return successResponse(reports, 'Active hunger reports retrieved');
});
