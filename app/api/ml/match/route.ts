import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import NGOProfile from '@/models/NGOProfile';
import MLMatchResult from '@/models/MLMatchResult';
import { getPredictionScore } from '@/services/mlService';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

// Simple city distance matrix (in km) for nearby Punjab/Haryana cities
const CITY_DISTANCES: Record<string, Record<string, number>> = {
  'phagwara': { 'jalandhar': 22, 'ludhiana': 55, 'amritsar': 100, 'chandigarh': 125, 'lpu': 8, 'kapurthala': 18, 'hoshiarpur': 30, 'hyderabad': 1800 },
  'jalandhar': { 'phagwara': 22, 'ludhiana': 60, 'amritsar': 80, 'chandigarh': 145, 'lpu': 15, 'kapurthala': 12, 'hoshiarpur': 45, 'hyderabad': 1750 },
  'ludhiana': { 'phagwara': 55, 'jalandhar': 60, 'amritsar': 140, 'chandigarh': 100, 'lpu': 48, 'kapurthala': 70, 'hyderabad': 1700 },
  'lpu': { 'phagwara': 8, 'jalandhar': 15, 'ludhiana': 48, 'amritsar': 95, 'chandigarh': 120, 'kapurthala': 22, 'hoshiarpur': 35 },
  'hyderabad': { 'secunderabad': 5, 'warangal': 150, 'phagwara': 1800, 'jalandhar': 1750, 'ludhiana': 1700, 'lpu': 1800 },
  'chandigarh': { 'phagwara': 125, 'jalandhar': 145, 'ludhiana': 100, 'lpu': 120, 'amritsar': 230 },
  'amritsar': { 'phagwara': 100, 'jalandhar': 80, 'ludhiana': 140, 'lpu': 95, 'chandigarh': 230 },
};

function getDistanceBetweenCities(city1: string, city2: string): number {
  const c1 = city1.toLowerCase().trim();
  const c2 = city2.toLowerCase().trim();

  if (c1 === c2) return 0;

  // Direct lookup
  if (CITY_DISTANCES[c1]?.[c2]) return CITY_DISTANCES[c1][c2];
  if (CITY_DISTANCES[c2]?.[c1]) return CITY_DISTANCES[c2][c1];

  // Fuzzy match: check if one city name contains the other
  for (const [key, distances] of Object.entries(CITY_DISTANCES)) {
    if (c1.includes(key) || key.includes(c1)) {
      for (const [dKey, dist] of Object.entries(distances)) {
        if (c2.includes(dKey) || dKey.includes(c2)) return dist;
      }
    }
  }

  // Unknown cities - estimate based on name similarity
  // If both seem like they could be nearby (short names), use moderate distance
  return 50; // default unknown distance
}

function getProfileCompletenessScore(ngo: any): number {
  let score = 0;
  if (ngo.ngoName && ngo.ngoName !== 'Not specified') score += 20;
  if (ngo.address && ngo.address !== 'Not specified') score += 20;
  if (ngo.contactPhone && ngo.contactPhone !== 'Not specified') score += 20;
  if (ngo.city && ngo.city !== 'Not specified') score += 20;
  if (ngo.registrationNumber && ngo.registrationNumber !== 'Pending') score += 20;
  return score;
}

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

  const donation = await Donation.findById(donationId);
  if (!donation) {
    return errorResponse('Donation not found', 404);
  }

  // Fetch only approved or pending NGOs
  const ngos = await NGOProfile.find({
    verificationStatus: { $in: ['approved', 'pending'] }
  });

  if (ngos.length === 0) {
    return successResponse([], 'No NGOs available for matching');
  }

  const matchPromises = ngos.map(async (ngo) => {
    // Real distance calculation using city matrix
    const distance = getDistanceBetweenCities(donation.city, ngo.city);

    // 🔴 STRATEGIC LIMIT: Skip NGOs that are too far away (>20km)
    if (distance > 20) return null;

    // Parse quantity
    const quantityStr = String(donation.quantity);
    const quantityMatch = quantityStr.match(/([0-9.]+)/);
    const quantity = quantityMatch ? parseFloat(quantityMatch[1]) : 10;

    // Calculate expiry urgency in hours
    const expiryHours = Math.max(
      0,
      Math.floor((new Date(donation.expiryTime).getTime() - Date.now()) / (1000 * 60 * 60))
    );

    // NGO capacity based on profile completeness
    const profileScore = getProfileCompletenessScore(ngo);
    const ngoCapacity = 50 + profileScore;

    const foodCategory = donation.foodType.toLowerCase().includes('cooked') ? 0 :
      donation.foodType.toLowerCase().includes('raw') ? 1 : 2;

    let finalScore = 0;

    try {
      // Try ML model first
      let score = await getPredictionScore(distance, quantity, expiryHours, ngoCapacity, foodCategory);

      // Apply modifiers
      const verificationBonus = ngo.verificationStatus === 'approved' ? 10 : 0;
      const proximityBonus = distance <= 10 ? 15 : distance <= 20 ? 10 : distance <= 40 ? 5 : 0;
      const profileBonus = Math.round(profileScore * 0.1);

      finalScore = Math.min(100, Math.round(score + verificationBonus + proximityBonus + profileBonus));
    } catch (err) {
      console.error(`ML model failed for NGO ${ngo.ngoName}, using smart fallback: `, err);

      let fallbackScore = 50;
      if (distance === 0) fallbackScore += 30;
      else if (distance <= 10) fallbackScore += 25;
      else if (distance <= 20) fallbackScore += 18;
      else if (distance <= 50) fallbackScore += 8;
      else fallbackScore -= 10;

      fallbackScore += ngo.verificationStatus === 'approved' ? 10 : 0;
      fallbackScore += Math.round(profileScore * 0.1);
      if (expiryHours < 24 && distance <= 25) fallbackScore += 5;

      finalScore = Math.min(100, Math.max(0, fallbackScore));
    }

    return {
      ngoId: ngo.userId.toString(),
      ngoName: ngo.ngoName,
      matchScore: finalScore,
      distance: Math.round(distance),
      city: ngo.city,
      verified: ngo.verificationStatus === 'approved',
    };
  });

  const results = (await Promise.all(matchPromises)).filter(r => r !== null);

  // 🔴 PRIORITY SORTING: Strict enforcement of the 20km "Green Zone"
  results.sort((a, b) => {
    const aIsGreen = a!.distance <= 20;
    const bIsGreen = b!.distance <= 20;

    if (aIsGreen && !bIsGreen) return -1; // 'a' wins because it's nearby
    if (!aIsGreen && bIsGreen) return 1;  // 'b' wins because it's nearby

    // Within the same zone, sort by ML match score
    return b!.matchScore - a!.matchScore;
  });

  // Save results to database
  await MLMatchResult.deleteMany({ donationId });
  if (results.length > 0) {
    await MLMatchResult.insertMany(results.map(r => ({
      donationId,
      ngoId: r!.ngoId,
      matchScore: r!.matchScore,
      distance: r!.distance,
      predictedPriority: r!.matchScore > 75 ? 'High' : r!.matchScore > 40 ? 'Medium' : 'Low'
    })));
  }

  return successResponse(results, 'NGO matching completed successfully');
});
