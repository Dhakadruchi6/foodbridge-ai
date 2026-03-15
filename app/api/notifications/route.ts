import { authMiddleware } from '@/middleware/authMiddleware';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

// GET — fetch notifications for logged-in user
export const GET = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const userId = authGate.headers.get('x-user-id');
    await dbConnect();

    const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20);

    const unreadCount = notifications.filter(n => !n.read).length;

    return successResponse({ notifications, unreadCount }, 'Notifications fetched');
});

// PATCH — mark all as read
export const PATCH = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const userId = authGate.headers.get('x-user-id');
    await dbConnect();

    await Notification.updateMany({ userId, read: false }, { read: true });

    return successResponse({}, 'All notifications marked as read');
});
