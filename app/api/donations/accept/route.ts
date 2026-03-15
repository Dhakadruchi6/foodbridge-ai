import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { acceptDonation } from '@/services/donationService';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendNotification } from '@/services/notificationService';
import Donation from '@/models/Donation';
import NGOProfile from '@/models/NGOProfile';
import dbConnect from '@/lib/db';

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

  // Side Effect: Notify Donor
  try {
    await dbConnect();
    const donation = await Donation.findById(donationId);
    if (donation) {
      const ngoProfile = await NGOProfile.findOne({ userId: ngoId });
      const ngoName = ngoProfile?.ngoName || 'an NGO partner';

      await sendNotification({
        userId: donation.donorId.toString(),
        message: `Your food donation has been accepted by ${ngoName}.`,
        type: 'donation_accepted',
        donationId: donation._id.toString(),
        data: { url: `/dashboard/donor` }
      });
    }
  } catch (err) {
    console.error("[NOTIFICATION] Failed to notify donor of acceptance:", err);
  }

  return successResponse(result, 'Donation accepted successfully');
});
