import dbConnect from '@/lib/db';
import HungerReport from '@/models/HungerReport';
import { authMiddleware } from '@/middleware/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const PATCH = asyncHandler(async (req: Request, { params }: { params: { id: string } }) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const ngoId = authGate.headers.get('x-user-id');
    const { id } = params;

    await dbConnect();

    const report = await HungerReport.findById(id);
    if (!report) return errorResponse('Request not found', 404);
    if (report.status !== 'pending') return errorResponse('This request has already been accepted', 409);

    report.status = 'accepted';
    report.acceptedByNgo = ngoId as unknown as typeof report.acceptedByNgo;
    report.ngoAcceptedAt = new Date();
    await report.save();

    return successResponse(report, 'Request accepted. Please proceed to the location.');
});
