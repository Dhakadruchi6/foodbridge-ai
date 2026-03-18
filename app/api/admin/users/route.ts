import { authMiddleware } from '@/middleware/authMiddleware';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const GET = asyncHandler(async (req: Request) => {
  const authGate = await authMiddleware(req);
  if (authGate.status !== 200) return authGate;

  const userRole = authGate.headers.get('x-user-role');
  if (userRole !== 'admin') return errorResponse('Forbidden: Admin only', 403);

  await dbConnect();

  const users = await User.find({}, 'name email role createdAt isActive').sort({ createdAt: -1 });

  return successResponse(users, 'Users retrieved');
});
