import { authMiddleware } from '@/middleware/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import User from '@/models/User';
import dbConnect from '@/lib/db';

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const userId = authGate.headers.get('x-user-id');
    const { subscription } = await req.json();

    if (!subscription) {
        return errorResponse('Subscription is required', 400);
    }

    await dbConnect();
    await User.findByIdAndUpdate(userId, { pushSubscription: subscription });

    return successResponse(null, 'Push subscription saved successfully');
});
