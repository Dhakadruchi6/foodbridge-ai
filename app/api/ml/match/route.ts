import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import NGOProfile from '@/models/NGOProfile';
import MLMatchResult from '@/models/MLMatchResult';
import { calculateDistance } from '@/utils/geoUtils';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const POST = asyncHandler(async (req: Request) => {
  const authGate = await authMiddleware(req);
  if (authGate.status !== 200) return authGate;

  const roleGate = await allowRoles('donor')(authGate);
  if (roleGate.status !== 200) return roleGate;

  const { donationId } = await req.json();

  if (!donationId) {
    return errorResponse('Donation ID is required', 400);
  }

  await dbConnect();

  // 1. Fetch donation with location
  const donation = await Donation.findById(donationId);
  if (!donation) {
    return errorResponse('Donation not found', 404);
  }

  const donorLat = donation.latitude;
  const donorLon = donation.longitude;

  if (donorLat === null || donorLon === null) {
    return errorResponse('Donor location (coordinates) missing. Update donation info first.', 400);
  }

  // 2. Handle Expiry Rules
  const now = new Date();
  const expiryTime = new Date(donation.expiryTime);
  const diffMs = expiryTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs <= 0) {
    return successResponse({
      expired: true,
      action: "REDIRECT_ANIMAL_SHELTER",
      message: "This food has expired. Please redirect to an animal shelter or compost facility."
    }, "Food is expired.");
  }

  // 3. Fetch approved NGOs with coordinates
  const ngos = await NGOProfile.find({
    verificationStatus: 'approved',
    latitude: { $ne: null },
    longitude: { $ne: null }
  });

  if (ngos.length === 0) {
    return successResponse([], 'No approved NGOs available for matching');
  }

  // 4. Filter and Score NGOs
  let matchedNgoList = ngos.map(ngo => {
    const distance = calculateDistance(donorLat, donorLon, ngo.latitude, ngo.longitude);

    // Step 1: 10km Radius Filter
    if (distance > 10) return null;

    // Step 2: Calculate Priority Score (0-100)
    let score = 0;

    // A. Distance Component (Max 40 pts)
    // 0km = 40pts, 10km = 0pts
    const distScore = Math.max(0, 40 * (1 - distance / 10));
    score += distScore;

    // B. Urgency Component (Max 30 pts)
    const urgencyMap: Record<string, number> = { 'high': 30, 'medium': 15, 'low': 5 };
    score += urgencyMap[ngo.urgency] || 15;

    // C. Capacity Component (Max 30 pts)
    // Full capacity (>=100) = 30pts, 0 capacity = 0pts (scaled)
    const capScore = Math.min(30, (ngo.capacity / 100) * 30);
    score += capScore;

    return {
      ngoId: ngo.userId.toString(),
      ngoName: ngo.ngoName,
      distance: Math.round(distance * 10) / 10,
      score: Math.round(score),
      urgency: ngo.urgency,
      capacity: ngo.capacity,
      priorityLevel: score > 70 ? 'CRITICAL' : score > 40 ? 'HIGH' : 'STABLE'
    };
  }).filter(n => n !== null);

  if (matchedNgoList.length === 0) {
    return successResponse([], 'No NGOs available within 10km radius.');
  }

  // 5. Expiry Logic Override (< 4 hours)
  let selectedNgo;
  let reason = "";

  if (diffHours < 4) {
    // Choose absolute nearest NGO
    selectedNgo = matchedNgoList.sort((a, b) => a!.distance - b!.distance)[0];
    reason = "Critical: Nearest NGO selected due to fast expiry (< 4h)";
  } else {
    // Choose highest priority score
    selectedNgo = matchedNgoList.sort((a, b) => b!.score - a!.score)[0];
    reason = `${selectedNgo!.priorityLevel} Match: Optimized for ${selectedNgo!.distance}km distance and ${selectedNgo!.urgency} urgency.`;
  }

  // Save selection result for legacy compatibility if needed
  await MLMatchResult.deleteMany({ donationId });
  await MLMatchResult.create({
    donationId,
    ngoId: selectedNgo!.ngoId,
    matchScore: selectedNgo!.score,
    distance: selectedNgo!.distance,
    predictedPriority: selectedNgo!.priorityLevel
  });

  return successResponse({
    selectedNgo: {
      name: selectedNgo!.ngoName,
      id: selectedNgo!.ngoId,
      distance: selectedNgo!.distance,
      priorityLevel: selectedNgo!.priorityLevel,
      reason: reason
    },
    allMatches: matchedNgoList
  }, 'Optimal NGO identified successfully');
});
