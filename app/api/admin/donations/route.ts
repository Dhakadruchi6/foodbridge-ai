import { authMiddleware } from '@/middleware/authMiddleware';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const GET = asyncHandler(async (req: Request) => {
  const authGate = await authMiddleware(req);
  if (authGate.status !== 200) return authGate;

  const userRole = authGate.headers.get('x-user-role');
  if (userRole !== 'admin') return errorResponse('Forbidden: Admin only', 403);

  await dbConnect();

  const donations = await Donation.find({})
    .populate('donorId', 'name email')
    .sort({ createdAt: -1 });

  return successResponse(donations, 'Donations retrieved');
});
