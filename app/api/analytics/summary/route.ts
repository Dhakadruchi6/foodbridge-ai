import { authMiddleware } from '@/middleware/authMiddleware';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import Delivery from '@/models/Delivery';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const GET = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const userId = authGate.headers.get('x-user-id');
    const userRole = authGate.headers.get('x-user-role');

    await dbConnect();

    if (userRole === 'donor') {
        const donations = await Donation.find({ donorId: userId });
        const totalKg = donations.reduce((acc, d) => acc + (Number(d.quantity) || 0), 0);
        const co2 = (totalKg * 1.9).toFixed(1);
        const deliveredCount = await Donation.countDocuments({ donorId: userId, status: 'delivered' });

        return successResponse({
            totalKg,
            co2,
            activeSurplus: donations.filter(d => d.status === 'pending').length,
            networkRank: deliveredCount > 50 ? "#12" : (deliveredCount > 10 ? "#84" : "#245")
        }, 'Donor analytics retrieved');
    }

    if (userRole === 'ngo') {
        const deliveries = await Delivery.find({ ngoId: userId }).populate('donationId');
        const totalRecovered = deliveries
            .filter(d => d.status === 'completed')
            .reduce((acc, d: { donationId?: { quantity?: number } }) => acc + (Number(d.donationId?.quantity) || 0), 0);

        const completed = deliveries.filter(d => d.status === 'completed').length;
        const total = deliveries.length;
        const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";

        return successResponse({
            totalRecovered,
            successRate,
            activeMissions: deliveries.filter(d => d.status !== 'completed').length,
            efficiency: "98.4%" // Mocked for now but based on time analysis later
        }, 'NGO analytics retrieved');
    }

    return errorResponse('Invalid role for analytics', 400);
});
