import dbConnect from '@/lib/db';
import HungerReport from '@/models/HungerReport';
import { authMiddleware } from '@/middleware/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

const VALID_STATUSES = ['on_the_way', 'arrived', 'completed'];

export const PATCH = asyncHandler(async (req: Request, { params }: { params: { id: string } }) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const ngoId = authGate.headers.get('x-user-id');
    const { id } = params;
    const { status } = await req.json();

    if (!VALID_STATUSES.includes(status)) {
        return errorResponse('Invalid status. Must be on_the_way, arrived, or completed', 400);
    }

    await dbConnect();

    const report = await HungerReport.findById(id);
    if (!report) return errorResponse('Request not found', 404);
    if (String(report.acceptedByNgo) !== String(ngoId)) {
        return errorResponse('You are not authorized to update this request', 403);
    }

    report.status = status;
    await report.save();

    return successResponse(report, `Status updated to ${status}`);
});
