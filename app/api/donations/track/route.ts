import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import dbConnect from '@/lib/db';
import Delivery from '@/models/Delivery';
import Donation from '@/models/Donation';
import NGOProfile from '@/models/NGOProfile';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const GET = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const { searchParams } = new URL(req.url);
    const donationId = searchParams.get('donationId');

    if (!donationId) return errorResponse('Donation ID is required', 400);

    await dbConnect();

    const delivery = await Delivery.findOne({ donationId })
        .populate('ngoId', 'name email')
        .sort({ createdAt: -1 });

    if (!delivery) {
        return errorResponse('No delivery tracking found for this donation', 404);
    }

    // Get donation details
    const donation = await Donation.findById(donationId);

    // Get NGO profile for contact details
    let ngoProfile = null;
    if (delivery.ngoId) {
        const ngoUserId = delivery.ngoId._id || delivery.ngoId;
        ngoProfile = await NGOProfile.findOne({ userId: ngoUserId });
    }

    const trackingData = {
        _id: delivery._id,
        status: delivery.status,
        ngoId: delivery.ngoId,
        ngoProfile: ngoProfile ? {
            ngoName: ngoProfile.ngoName,
            contactPhone: ngoProfile.contactPhone,
            address: ngoProfile.address,
            city: ngoProfile.city,
        } : null,
        donation: donation ? {
            foodType: donation.foodType,
            quantity: donation.quantity,
            city: donation.city,
            pickupAddress: donation.pickupAddress,
            expiryTime: donation.expiryTime,
        } : null,
        pickupTime: delivery.pickupTime || null,
        deliveryTime: delivery.deliveryTime || null,
        createdAt: delivery.createdAt,
        updatedAt: delivery.updatedAt,
    };

    return successResponse(trackingData, 'Tracking info retrieved');
});
