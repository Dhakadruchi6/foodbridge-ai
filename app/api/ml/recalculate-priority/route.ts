import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import { getUrgencyScore } from '@/services/mlService';
import { successResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    // Accessible by NGO and Admin to refresh the "Priority Queue"
    const roleGate = await allowRoles('ngo', 'admin')(authGate);
    if (roleGate.status !== 200) return roleGate;

    await dbConnect();

    // Find all pending donations to recalculate their urgency
    const donations = await Donation.find({ status: 'pending' });

    const updatePromises = donations.map(async (donation) => {
        try {
            const expiryHours = Math.max(0, Math.floor((new Date(donation.expiryTime).getTime() - Date.now()) / (1000 * 60 * 60)));

            const foodType = String(donation.foodType).toLowerCase();
            const foodCategory = foodType.includes('cooked') ? 0 : foodType.includes('raw') ? 1 : 2;

            const quantity = parseFloat(String(donation.quantity)) || 10;
            const biodegradability = 0.5; // Default or stored value if we add it to model
            const distance = 10; // Normalized distance for global ranking

            const urgency = await getUrgencyScore(distance, quantity, expiryHours, foodCategory, biodegradability);

            return Donation.findByIdAndUpdate(donation._id, { prioritizationRank: urgency });
        } catch (err) {
            console.error(`Failed to recalculate priority for ${donation._id}:`, err);
            return null;
        }
    });

    await Promise.all(updatePromises);

    return successResponse(null, 'Priority queue successfully synchronized with real-time decay data');
});
