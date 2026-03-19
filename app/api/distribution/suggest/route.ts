import dbConnect from '@/lib/db';
import HungerSpot from '@/models/HungerSpot';
import HungerReport from '@/models/HungerReport';
import NGOProfile from '@/models/NGOProfile';
import { authMiddleware } from '@/middleware/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const GET = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const ngoId = authGate.headers.get('x-user-id');
    await dbConnect();

    const ngoProfile = await NGOProfile.findOne({ userId: ngoId });
    if (!ngoProfile) return errorResponse('NGO Profile not found', 404);

    const lat = ngoProfile.latitude;
    const lng = ngoProfile.longitude;

    if (!lat || !lng) return errorResponse('NGO location not set', 400);

    // 1. Fetch Hunger Spots and Active Reports
    const [spots, reports] = await Promise.all([
        HungerSpot.find({ isActive: true }),
        HungerReport.find({ status: 'pending' })
    ]);

    // 2. Map Reports to Spot objects for consistent processing
    const combined = [
        ...spots.map(s => ({
            _id: s._id,
            name: s.name,
            lat: s.lat,
            lng: s.lng,
            peopleCount: s.peopleCount,
            urgency: s.urgency || 'medium',
            type: 'managed'
        })),
        ...reports.map(r => ({
            _id: r._id,
            name: `Reported: ${r.locationName}`,
            lat: r.lat,
            lng: r.lng,
            peopleCount: r.peopleCount,
            urgency: r.urgency,
            type: 'reported'
        }))
    ];

    // 3. Simple Ranking Algorithm
    const suggestions = combined.map(spot => {
        // Haversine-ish distance (simple approximation for small distances)
        const distance = Math.sqrt(
            Math.pow(spot.lat - lat, 2) + Math.pow(spot.lng - lng, 2)
        ) * 111.32; // Approx km

        // Score based on distance (closer is better), peopleCount (more is better), urgency
        const weights: Record<string, number> = { high: 2, medium: 1, low: 0.5 };
        const urgencyWeight = weights[spot.urgency] || 1;
        const score = (spot.peopleCount * urgencyWeight) / (distance + 0.1);

        return { ...spot, distance, score };
    });

    // Sort by score descending
    suggestions.sort((a, b) => b.score - a.score);

    return successResponse(suggestions.slice(0, 5), 'Distribution suggestions generated');
});
