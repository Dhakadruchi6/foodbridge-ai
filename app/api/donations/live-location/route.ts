import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

// DONOR: Push their live GPS coordinates for an accepted donation
export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const donorId = authGate.headers.get('x-user-id');
    const { donationId, latitude, longitude } = await req.json();

    if (!donationId || latitude === undefined || longitude === undefined) {
        return errorResponse('donationId, latitude, and longitude are required', 400);
    }

    await dbConnect();

    const donation = await Donation.findOne({ _id: donationId, donorId });
    if (!donation) {
        return errorResponse('Donation not found or not owned by this donor', 404);
    }

    // Update live location
    donation.liveLatitude = latitude;
    donation.liveLongitude = longitude;
    donation.liveLocationUpdatedAt = new Date();
    await donation.save();

    console.log(`[LIVE LOCATION] Updated for donation ${donationId}: ${latitude},${longitude}`);

    return successResponse({ liveLatitude: latitude, liveLongitude: longitude }, 'Live location updated');
});

// NGO: Poll donor's live location for an accepted donation
export const GET = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const url = new URL((req as any).url);
    const donationId = url.searchParams.get('donationId');

    if (!donationId) {
        return errorResponse('donationId query parameter is required', 400);
    }

    await dbConnect();

    const donation = await Donation.findById(donationId, 'liveLatitude liveLongitude liveLocationUpdatedAt status donorId')
        .populate('donorId', 'name');

    if (!donation) {
        return errorResponse('Donation not found', 404);
    }

    const ageSeconds = donation.liveLocationUpdatedAt
        ? Math.floor((Date.now() - new Date(donation.liveLocationUpdatedAt).getTime()) / 1000)
        : null;

    return successResponse({
        liveLatitude: donation.liveLatitude,
        liveLongitude: donation.liveLongitude,
        liveLocationUpdatedAt: donation.liveLocationUpdatedAt,
        ageSeconds,
        isLive: ageSeconds !== null && ageSeconds < 60, // "live" if updated in last 60s
        donorName: (donation.donorId as any)?.name || 'Donor',
    }, 'Live location fetched');
});
