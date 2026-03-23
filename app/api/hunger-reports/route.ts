import dbConnect from '@/lib/db';
import HungerReport from '@/models/HungerReport';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { authMiddleware } from '@/middleware/authMiddleware';

export const POST = asyncHandler(async (req: Request) => {
    // Optional auth — capture user if logged in
    let userId = null;
    try {
        const authGate = await authMiddleware(req);
        if (authGate.status === 200) {
            userId = authGate.headers.get('x-user-id');
        }
    } catch {
        // Public reporting allowed
    }

    const { name, phone, locationName, lat, lng, address, quantity, peopleCount, description, urgency } = await req.json();

    if (!name || !phone || !locationName || !lat || !lng || !quantity) {
        return errorResponse('Name, phone, location, and food quantity are required', 400);
    }

    // Basic phone validation
    if (phone.replace(/\D/g, '').length < 7) {
        return errorResponse('Please enter a valid phone number', 400);
    }

    await dbConnect();

    const report = await HungerReport.create({
        name,
        phone,
        locationName,
        lat,
        lng,
        address: address || '',
        quantity: Number(quantity),
        peopleCount: peopleCount ? Number(peopleCount) : 0,
        description: description || '',
        urgency: urgency || 'medium',
        status: 'pending',
        reportedBy: userId,
    });

    return successResponse(report, 'Your request has been submitted. Nearby NGOs will be notified.', 201);
});

export const GET = asyncHandler(async (req: Request) => {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radiusKm = parseFloat(searchParams.get('radius') || '25');

    let query: Record<string, unknown> = { status: 'pending' };

    // Filter by radius if coordinates provided
    if (lat && lng) {
        const radiusDeg = radiusKm / 111; // rough deg conversion
        query = {
            status: 'pending',
            lat: { $gte: lat - radiusDeg, $lte: lat + radiusDeg },
            lng: { $gte: lng - radiusDeg, $lte: lng + radiusDeg },
        };
    }

    const reports = await HungerReport.find(query).sort({ createdAt: -1 }).limit(50);

    // Add distance if coords provided
    const withDistance = reports.map(r => {
        const obj = r.toObject();
        if (lat && lng) {
            const dLat = (r.lat - lat) * (Math.PI / 180);
            const dLng = (r.lng - lng) * (Math.PI / 180);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(r.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
            const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            obj.distanceKm = Math.round(distKm * 10) / 10;
        }
        return obj;
    });

    return successResponse(withDistance, 'Hunger requests retrieved');
});
