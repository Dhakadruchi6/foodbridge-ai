import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { createDonation } from '@/services/donationService';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendNotification } from '@/services/notificationService';
import User from '@/models/User';

export const POST = asyncHandler(async (req: Request) => {
  // Authentication
  const authGate = await authMiddleware(req);
  if (authGate.status !== 200) return authGate;

  // Authorization
  const roleGate = await allowRoles('donor')(authGate);
  if (roleGate.status !== 200) return roleGate;

  const userId = authGate.headers.get('x-user-id');
  const body = await req.json();
  const {
    foodType,
    quantity,
    expiryTime,
    preparedTime,
    foodImage,
    pickupAddress,
    city,
    state,
    pincode,
    description,
    latitude,
    longitude,
    verificationCode,
    imageVerification
  } = body;

  if (!foodType || !quantity || !expiryTime || !pickupAddress || !city || !preparedTime || !foodImage) {
    return errorResponse('Missing required fields', 400);
  }

  const donation = await createDonation({
    donorId: userId,
    foodType,
    quantity,
    expiryTime,
    preparedTime,
    foodImage,
    pickupAddress,
    city,
    state,
    pincode,
    description,
    latitude,
    longitude,
    verificationCode,
    imageVerification,
    status: 'pending',
  });

  // 1. Identify nearby NGOs (same city for now as per requirement)
  const nearbyNgos = await User.find({
    role: 'ngo',
    city: { $regex: new RegExp(`^${city}$`, 'i') }
  });

  // 2. Alert them
  const notificationPromises = nearbyNgos.map(ngo =>
    sendNotification({
      userId: ngo._id.toString(),
      message: `${foodType} - ${quantity} units available in ${city}.`,
      type: 'new_donation',
      donationId: donation._id.toString(),
      data: { url: `/dashboard/ngo` }
    })
  );

  await Promise.all(notificationPromises);

  return successResponse(donation, 'Donation created successfully', 201);
});
