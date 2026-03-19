import dbConnect from '@/lib/db';
import Delivery from '@/models/Delivery';
import HungerReport from '@/models/HungerReport';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('ngo')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const ngoId = authGate.headers.get('x-user-id');
    const { deliveryId, hungerSpotId, spotType } = await req.json();

    if (!deliveryId || !hungerSpotId) {
        return errorResponse('Delivery ID and Hunger Spot ID are required', 400);
    }

    await dbConnect();

    const delivery = await Delivery.findOne({ _id: deliveryId, ngoId });

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
});
