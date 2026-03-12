import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { acceptDonation } from '@/services/donationService';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const POST = asyncHandler(async (req: Request) => {
  const authGate = await authMiddleware(req);
  if (authGate.status !== 200) return authGate;

  const roleGate = await allowRoles('ngo')(authGate);
  if (roleGate.status !== 200) return roleGate;

  const ngoId = authGate.headers.get('x-user-id');
  const { donationId } = await req.json();

  if (!donationId) {
    return errorResponse('Donation ID is required', 400);
  }

  const result = await acceptDonation(donationId, ngoId!);

  return successResponse(result, 'Donation accepted successfully');
});
