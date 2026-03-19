import dbConnect from '@/lib/db';
import HungerSpot from '@/models/HungerSpot';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const GET = asyncHandler(async () => {
    await dbConnect();
    const spots = await HungerSpot.find({ isActive: true }).sort({ createdAt: -1 });
    return successResponse(spots, 'Hunger spots retrieved successfully');
});

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('admin', 'ngo')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const { name, lat, lng, peopleCount, category, urgency } = await req.json();

    if (!name || !lat || !lng || !peopleCount) {
        return errorResponse('Name, location, and people count are required', 400);
    }

    await dbConnect();

    const userId = authGate.headers.get('x-user-id');
    const spot = await HungerSpot.create({
        name,
        lat,
        lng,
        peopleCount,
        category,
        urgency,
        addedBy: userId,
    });

    return successResponse(spot, 'Hunger spot created successfully', 201);
});
