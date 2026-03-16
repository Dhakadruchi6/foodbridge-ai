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
  let requestedRadius = parseInt(searchParams.get('radius') || '100');
  if (requestedRadius > 100) requestedRadius = 100; // Hard cap for NGO missions

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
    const hasNgoCoords = typeof ngoProfile.latitude === 'number' && typeof ngoProfile.longitude === 'number';
    const hasDonationCoords = typeof donation.latitude === 'number' && typeof donation.longitude === 'number';

    if (hasNgoCoords && hasDonationCoords) {
      distance = calculateHaversineDistance(
        ngoProfile.latitude,
        ngoProfile.longitude,
        donation.latitude,
        donation.longitude
      );
    }

    // Fix: distance 0 was being treated as falsy and becoming null
    const finalDistance = (distance !== null) ? Math.round(distance * 10) / 10 : null;

    return {
      ...donation.toObject(),
      distance: finalDistance
    };
  }).filter((donation: any) => {
    // 1. Strict Geospatial Match (requested radius)
    if (donation.distance !== null) {
      const inRadius = donation.distance <= requestedRadius;
      if (inRadius) return true;
    }

    // 2. City-based Fallback (trimmed & lowercase)
    const donorCity = (donation.city || "").trim().toLowerCase();
    const isCityMatch = donorCity !== "" && donorCity === ngoCity;

    return isCityMatch;
  });

  console.log(`[API-AVAILABLE] NGO: ${userId}, Radius: ${requestedRadius}km, City: ${ngoCity}, Valid: ${validDonations.length}, Filtered: ${filteredDonations.length}`);
  if (filteredDonations.length === 0 && validDonations.length > 0) {
    console.log(`[API-DEBUG] No matches for NGO ${userId}. First pend donation: ${validDonations[0].city} (${validDonations[0].latitude},${validDonations[0].longitude})`);
  }

  return successResponse(filteredDonations, `Donations within ${requestedRadius}km or same city retrieved`);
});
