import dbConnect from '@/lib/db';
import Delivery from '@/models/Delivery';
import HungerReport from '@/models/HungerReport';
import { authMiddleware } from '@/middleware/authMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const authResult = await authMiddleware(req);
        if (authResult instanceof NextResponse) return authResult;

        const { deliveryId, hungerSpotId, spotType } = await req.json();

        if (!deliveryId || !hungerSpotId) {
            return errorResponse('Delivery ID and Hunger Spot ID are required', 400);
        }

        await dbConnect();

        const delivery = await Delivery.findOne({ _id: deliveryId, ngoId: authResult.id });

        if (!delivery) {
            return errorResponse('Delivery mission not found or unauthorized', 404);
        }

        delivery.status = 'delivered';
        delivery.distributionStatus = 'delivered';
        delivery.hungerSpotId = hungerSpotId;
        await delivery.save();

        // If it was a volunteer report, we could mark it as resolved
        if (spotType === 'report') {
            await HungerReport.findByIdAndUpdate(hungerSpotId, { status: 'resolved' });
        }

        return successResponse(delivery, 'Distribution completed successfully');
    } catch (error: any) {
        console.error('Distribution completion error:', error);
        return errorResponse(error.message);
    }
}
