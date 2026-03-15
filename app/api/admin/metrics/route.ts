import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Donation from '@/models/Donation';
import Delivery from '@/models/Delivery';
import Report from '@/models/Report';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const GET = asyncHandler(async (req: Request) => {
  const authGate = await authMiddleware(req);
  if (authGate.status !== 200) return authGate;

  const userRole = authGate.headers.get('x-user-role');
  if (userRole !== 'admin') return errorResponse('Forbidden: Admin only', 403);

  await dbConnect();

  const [totalUsers, totalDonors, totalNGOs, totalDonations, successfulDeliveries, totalReports] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'donor' }),
    User.countDocuments({ role: 'ngo' }),
    Donation.countDocuments(),
    Delivery.countDocuments({ status: 'completed' }),
    Report.countDocuments({ status: 'pending' }),
  ]);

  return successResponse({
    totalUsers,
    totalDonors,
    totalNGOs,
    totalDonations,
    successfulDeliveries,
    totalReports,
  }, 'Metrics retrieved');
});
