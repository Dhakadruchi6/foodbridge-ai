import { authMiddleware } from '@/middleware/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import User from '@/models/User';
import dbConnect from '@/lib/db';

export const GET = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const userId = authGate.headers.get('x-user-id');

    await dbConnect();
    await User.findByIdAndUpdate(userId, { isFirstLogin: false });

    return successResponse(null, 'Onboarding tour marked as complete');
});

export const PATCH = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const userId = authGate.headers.get('x-user-id');
    const { isFirstLogin } = await req.json();

    await dbConnect();
    await User.findByIdAndUpdate(userId, { isFirstLogin });

    return successResponse(null, `isFirstLogin updated to ${isFirstLogin}`);
});
