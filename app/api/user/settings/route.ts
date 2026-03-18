import { authMiddleware } from '@/middleware/authMiddleware';
import User from '@/models/User';
import dbConnect from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const PUT = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const userId = authGate.headers.get('x-user-id');
    const { smsEnabled } = await req.json();

    if (typeof smsEnabled !== 'boolean') {
        return errorResponse('smsEnabled must be a boolean', 400);
    }

    await dbConnect();

    const user = await User.findByIdAndUpdate(
        userId,
        { smsEnabled },
        { new: true }
    );

    if (!user) {
        return errorResponse('User not found', 404);
    }

    return successResponse({ smsEnabled: user.smsEnabled }, 'Settings updated successfully');
});

export const GET = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const userId = authGate.headers.get('x-user-id');

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
        return errorResponse('User not found', 404);
    }

    return successResponse({ smsEnabled: user.smsEnabled }, 'Settings fetched successfully');
});
