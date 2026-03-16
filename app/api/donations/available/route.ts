import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { getDonations } from '@/services/donationService';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import NGOProfile from '@/models/NGOProfile';
import { calculateHaversineDistance } from '@/lib/utils';
import dbConnect from '@/lib/db';

export const GET = asyncHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const requestedRadius = parseInt(searchParams.get('radius') || '100');

  const authGate = await authMiddleware(req);
  if (authGate.status !== 200) return authGate;

  const roleGate = await allowRoles('ngo', 'admin')(authGate);
  if (roleGate.status !== 200) return roleGate;

  const userId = authGate.headers.get('x-user-id');
  const userRole = authGate.headers.get('x-user-role');

  await dbConnect();
  const allDonations = await getDonations({ status: 'pending' });
  const now = new Date();

  // Filter out expired donations at the database/API level
  const validDonations = allDonations.filter((d: any) => new Date(d.expiryTime) > now);

  // Admins see everything
  if (userRole === 'admin') {
    return successResponse(validDonations, 'All available donations retrieved (Admin)');
  }

  // NGO-specific filtering
  const ngoProfile = await NGOProfile.findOne({ userId });
  if (!ngoProfile) {
    return successResponse([], 'NGO Profile not found - setup required');
  }

  const ngoCity = (ngoProfile.city || "").trim().toLowerCase();


  const filteredDonations = validDonations.map((donation: any) => {
    let distance = null;
    if (ngoProfile.latitude && ngoProfile.longitude && donation.latitude && donation.longitude) {
      distance = calculateHaversineDistance(
        ngoProfile.latitude,
        ngoProfile.longitude,
        donation.latitude,
        donation.longitude
      );
    }
    return { ...donation.toObject(), distance: distance ? Math.round(distance * 10) / 10 : null };
  }).filter((donation: any) => {
    // 1. Strict Geospatial Match (requested radius)
    if (donation.distance !== null) {
      return donation.distance <= requestedRadius;
    }

    // 2. City-based Fallback (trimmed & lowercase)
    const donorCity = (donation.city || "").trim().toLowerCase();
    return donorCity !== "" && donorCity === ngoCity;
  });

  console.log(`[API-AVAILABLE] NGO: ${userId}, Radius: ${requestedRadius}km, City: ${ngoCity}, Found: ${filteredDonations.length}`);

  return successResponse(filteredDonations, `Donations within ${requestedRadius}km or same city retrieved`);
});
