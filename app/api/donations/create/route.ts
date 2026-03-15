import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { createDonation } from '@/services/donationService';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const POST = asyncHandler(async (req: Request) => {
  // Authentication
  const authGate = await authMiddleware(req);
  if (authGate.status !== 200) return authGate;

  // Authorization
  const roleGate = await allowRoles('donor')(authGate);
  if (roleGate.status !== 200) return roleGate;

  const userId = authGate.headers.get('x-user-id');
  const body = await req.json();
  const { foodType, quantity, expiryTime, pickupAddress, city, state, pincode, description, latitude, longitude } = body;

  if (!foodType || !quantity || !expiryTime || !pickupAddress || !city) {
    return errorResponse('Missing required fields', 400);
  }

  const donation = await createDonation({
    donorId: userId,
    foodType,
    quantity,
    expiryTime,
    pickupAddress,
    city,
    state,
    pincode,
    description,
    latitude,
    longitude,
    status: 'pending',
  });

  return successResponse(donation, 'Donation created successfully', 201);
});
