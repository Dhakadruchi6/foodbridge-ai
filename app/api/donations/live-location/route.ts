import { authMiddleware } from '@/middleware/authMiddleware';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import Delivery from '@/models/Delivery';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

// PUSH: NGOs and Donors push their live GPS coordinates
export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const userId = authGate.headers.get('x-user-id');
    const userRole = authGate.headers.get('x-user-role');
    const { donationId, latitude, longitude } = await req.json();

    if (!donationId || latitude === undefined || longitude === undefined) {
        return errorResponse('donationId, latitude, and longitude are required', 400);
    }

    await dbConnect();

    if (userRole === 'ngo') {
        const delivery = await Delivery.findOne({ donationId, ngoId: userId });
        if (!delivery) return errorResponse('Active delivery not found for this NGO', 404);

        delivery.liveLatitude = latitude;
        delivery.liveLongitude = longitude;
        delivery.liveLocationUpdatedAt = new Date();
        delivery.isLive = true;
        await delivery.save();

        console.log(`[NGO LIVE] Updated for delivery ${delivery._id}: ${latitude},${longitude}`);
        return successResponse({ liveLatitude: latitude, liveLongitude: longitude }, 'NGO live location updated');
    } else {
        const donation = await Donation.findOne({ _id: donationId, donorId: userId });
        if (!donation) return errorResponse('Donation not found or not owned by this donor', 404);

        donation.liveLatitude = latitude;
        donation.liveLongitude = longitude;
        donation.liveLocationUpdatedAt = new Date();
        await donation.save();

        console.log(`[DONOR LIVE] Updated for donation ${donationId}: ${latitude},${longitude}`);
        return successResponse({ liveLatitude: latitude, liveLongitude: longitude }, 'Donor live location updated');
    }
});

// FETCH: NGOs fetch Donor location, Donors fetch NGO location
export const GET = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const userRole = authGate.headers.get('x-user-role');
    const url = new URL((req as Request & { url: string }).url);
    const donationId = url.searchParams.get('donationId');

    if (!donationId) {
        return errorResponse('donationId query parameter is required', 400);
    }

    await dbConnect();

    if (userRole === 'donor') {
        // Donor wants to track the NGO
        const delivery = await Delivery.findOne({ donationId })
            .populate('ngoId', 'name');

        if (!delivery || !delivery.liveLocationUpdatedAt) {
            return successResponse({ isLive: false }, 'No NGO live location available yet');
        }

        const ageSeconds = Math.floor((Date.now() - new Date(delivery.liveLocationUpdatedAt).getTime()) / 1000);

        return successResponse({
            liveLatitude: delivery.liveLatitude,
            liveLongitude: delivery.liveLongitude,
            liveLocationUpdatedAt: delivery.liveLocationUpdatedAt,
            ageSeconds,
            isLive: ageSeconds < 60,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ngoName: (delivery.ngoId as any)?.name || 'NGO Partner',
        }, 'NGO live location fetched');
    } else {
        // NGO wants to track the Donor
        const donation = await Donation.findById(donationId, 'liveLatitude liveLongitude liveLocationUpdatedAt status donorId')
            .populate('donorId', 'name');

        if (!donation) return errorResponse('Donation not found', 404);

        const ageSeconds = donation.liveLocationUpdatedAt
            ? Math.floor((Date.now() - new Date(donation.liveLocationUpdatedAt).getTime()) / 1000)
            : null;

        return successResponse({
            liveLatitude: donation.liveLatitude,
            liveLongitude: donation.liveLongitude,
            liveLocationUpdatedAt: donation.liveLocationUpdatedAt,
            ageSeconds,
            isLive: ageSeconds !== null && ageSeconds < 60,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            donorName: (donation.donorId as any)?.name || 'Donor',
        }, 'Donor live location fetched');
    }
});
