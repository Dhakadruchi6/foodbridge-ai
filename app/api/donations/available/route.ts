import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { getDonations } from '@/services/donationService';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import NGOProfile from '@/models/NGOProfile';
import { getHaversineDistance } from '@/lib/utils';
import dbConnect from '@/lib/db';

export const GET = asyncHandler(async (req: Request) => {
  const authGate = await authMiddleware(req);
  if (authGate.status !== 200) return authGate;

  const roleGate = await allowRoles('ngo', 'admin')(authGate);
  if (roleGate.status !== 200) return roleGate;

  const userId = authGate.headers.get('x-user-id');
  const userRole = authGate.headers.get('x-user-role');

  await dbConnect();
  const allDonations = await getDonations({ status: 'pending' });

  // Admins see everything
  if (userRole === 'admin') {
    return successResponse(allDonations, 'All available donations retrieved (Admin)');
  }

  // NGO-specific filtering
  const ngoProfile = await NGOProfile.findOne({ userId });
  if (!ngoProfile) {
    return errorResponse('NGO Profile not found', 404);
  }

  const filteredDonations = allDonations.map((donation: any) => {
    let distance = null;
    if (ngoProfile.latitude && ngoProfile.longitude && donation.latitude && donation.longitude) {
      distance = getHaversineDistance(
        ngoProfile.latitude,
        ngoProfile.longitude,
        donation.latitude,
        donation.longitude
      );
    }
    return { ...donation.toObject(), distance: distance ? Math.round(distance * 10) / 10 : null };
  }).filter((donation: any) => {
    // 1. Strict Geospatial Match (50km radius)
    if (donation.distance !== null) {
      return donation.distance <= 50;
    }

    // 2. City-based Fallback (for older data or if browser geolocation fails)
    return ngoProfile.city.toLowerCase() === donation.city.toLowerCase();
  });

  return successResponse(filteredDonations, `Donations within 50km or same city retrieved (${filteredDonations.length} found)`);
});
