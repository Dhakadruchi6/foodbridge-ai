import { authMiddleware } from '@/middleware/authMiddleware';
import dbConnect from '@/lib/db';
import Donation from '@/models/Donation';
import Delivery from '@/models/Delivery';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const POST = asyncHandler(async (req: Request) => {
    console.log("[API-REQUEST] Incoming request to /api/donations/request");

    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) {
        console.warn("[API-REQUEST] Auth failed", authGate.status);
        return authGate;
    }

    let requestData;
    try {
        requestData = await req.json();
        console.log("[API-REQUEST] Body parsed:", requestData);
    } catch (err) {
        console.error("[API-REQUEST] Failed to parse JSON body:", err);
        return errorResponse('Invalid JSON payload', 400);
    }

    const userId = authGate.headers.get('x-user-id');
    const userRole = authGate.headers.get('x-user-role');

    const donationId = requestData.donationId;
    let ngoId = requestData.ngoId;

    // Robustness: If an NGO is logged in and ngoId is missing, use their own ID
    if (!ngoId && userRole === 'ngo') {
        ngoId = userId;
        console.log("[API-REQUEST] NGO identified from session:", ngoId);
    }

    if (!donationId || !ngoId) {
        console.warn("[API-REQUEST] Missing IDs:", { donationId, ngoId, userRole });
        return errorResponse('Donation ID and NGO ID are required', 400);
    }

    await dbConnect();
    console.log("[API-REQUEST] Searching for donation:", donationId);

    const donation = await Donation.findById(donationId);
    if (!donation) {
        console.warn("[API-REQUEST] Donation not found:", donationId);
        return errorResponse('Donation not found', 404);
    }

    console.log("[API-REQUEST] Donation found, status:", donation.status);
    if (donation.status !== 'pending' && donation.status !== 'pending_request') {
        return errorResponse('Donation is already assigned or completed', 400);
    }

    // Update donation status to indicate a request is active
    donation.status = 'request_sent';
    await donation.save();
    console.log("[API-REQUEST] Donation status updated to request_sent");

    // Use findOneAndUpdate with upsert to prevent duplicates
    const delivery = await Delivery.findOneAndUpdate(
        { donationId, ngoId },
        {
            $set: { status: 'pending' },
            $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true, new: true }
    );
    console.log("[API-REQUEST] Delivery record upserted:", delivery._id);

    return successResponse({ donation, delivery }, 'Request sent successfully');
});
