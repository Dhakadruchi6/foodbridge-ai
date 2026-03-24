import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { createDonation } from '@/services/donationService';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import User from '@/models/User';
import { sendSMS } from '@/lib/sms';
import { sendNotification } from '@/services/notificationService';

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
    imageVerification,
    phone
  } = body;

  if (!foodType || !quantity || !expiryTime || !pickupAddress || !city || !preparedTime || !foodImage || !phone) {
    return errorResponse('Missing required fields', 400);
  }

  const donation = await createDonation({
    donorId: userId,
    foodType,
    quantity,
    phone,
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
  const notificationPromises = nearbyNgos.map(async (ngo) => {
    // Send in-app notification
    await sendNotification({
      userId: ngo._id.toString(),
      message: `${foodType} - ${quantity} units available in ${city}.`,
      type: 'new_donation',
      donationId: donation._id.toString(),
      data: { url: `/dashboard/ngo` }
    });

    // Send SMS if enabled and phone exists
    if (ngo.smsEnabled && ngo.phone) {
      const isUrgent = (new Date(expiryTime).getTime() - Date.now()) < 2 * 60 * 60 * 1000;
      const smsMessage = isUrgent
        ? `URGENT: Food donation expiring soon near you. ${foodType} (${quantity} units) in ${city}. Login to accept.`
        : `New food donation available near you. Food: ${foodType} (${quantity} units). Location: ${city}. Expires soon. Login to accept.`;

      await sendSMS(
        ngo.phone,
        smsMessage,
        isUrgent ? 'urgent_expiry' : 'new_donation',
        ngo._id.toString()
      );
    }
  });

  await Promise.all(notificationPromises);

  return successResponse(donation, 'Donation created successfully', 201);
});
