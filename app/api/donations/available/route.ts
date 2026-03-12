import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { getDonations } from '@/services/donationService';
import { successResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const GET = asyncHandler(async (req: Request) => {
  const authGate = await authMiddleware(req);
  if (authGate.status !== 200) return authGate;

  const roleGate = await allowRoles('ngo', 'admin')(authGate);
  if (roleGate.status !== 200) return roleGate;

  const donations = await getDonations({ status: 'pending' });

  return successResponse(donations, 'Available donations retrieved successfully');
});
