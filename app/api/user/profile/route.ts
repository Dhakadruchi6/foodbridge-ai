import { authMiddleware } from '@/middleware/authMiddleware';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import NGOProfile from '@/models/NGOProfile';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const GET = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const userId = authGate.headers.get('x-user-id');
    const userRole = authGate.headers.get('x-user-role');

    console.log(`[PROFILE-API] Fetching for userId: ${userId}, role: ${userRole}`);

    await dbConnect();

    const user = await User.findById(userId, '-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires');
    if (!user) {
        console.warn(`[PROFILE-API] User not found in DB: ${userId}`);
        return errorResponse('User not found', 404);
    }

    let ngoProfile = null;
    if (user.role === 'ngo') {
        ngoProfile = await NGOProfile.findOne({ userId });
        console.log(`[PROFILE-API] NGO profile status for ${userId}: ${!!ngoProfile}`);
    }

    return successResponse({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || ngoProfile?.contactPhone || '',
        city: user.city || ngoProfile?.city || '',
        state: user.state || ngoProfile?.state || '',
        address: user.address || ngoProfile?.address || '',
        pincode: user.pincode || ngoProfile?.pincode || '',
        role: user.role,
        createdAt: user.createdAt,
        isActive: user.isActive,
        // NGO specific
        ngoName: ngoProfile?.ngoName || '',
        registrationNumber: ngoProfile?.registrationNumber || '',
        verificationStatus: ngoProfile?.verificationStatus || null,
        description: ngoProfile?.description || '',
        donationPreferences: user.donationPreferences || '',
        smsEnabled: user.smsEnabled ?? true,
    }, 'Profile fetched successfully');
});

export const PATCH = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const userId = authGate.headers.get('x-user-id');
    const userRole = authGate.headers.get('x-user-role');
    const body = await req.json();

    const { name, phone, city, state, address, pincode, description, ngoName, latitude, longitude, smsEnabled } = body;

    await dbConnect();

    // Update User model
    const userUpdate: any = {};
    if (name) userUpdate.name = name;
    if (phone) userUpdate.phone = phone;
    if (city) userUpdate.city = city;
    if (state) userUpdate.state = state;
    if (address) userUpdate.address = address;
    if (pincode) userUpdate.pincode = pincode;
    if (typeof smsEnabled === 'boolean') userUpdate.smsEnabled = smsEnabled;

    const updatedUser = await User.findByIdAndUpdate(userId, userUpdate, { new: true, select: '-password -otp -otpExpires' });
    if (!updatedUser) return errorResponse('User not found', 404);

    // For NGOs — also update NGOProfile
    if (userRole === 'ngo') {
        const ngoUpdate: any = {};
        if (city) ngoUpdate.city = city;
        if (state) ngoUpdate.state = state;
        if (address) ngoUpdate.address = address;
        if (pincode) ngoUpdate.pincode = pincode;
        if (phone) ngoUpdate.contactPhone = phone;
        if (description) ngoUpdate.description = description;
        if (ngoName) ngoUpdate.ngoName = ngoName;
        if (typeof latitude === 'number') ngoUpdate.latitude = latitude;
        if (typeof longitude === 'number') ngoUpdate.longitude = longitude;

        await NGOProfile.findOneAndUpdate({ userId }, ngoUpdate, { new: true });
    }

    return successResponse({ name: updatedUser.name, email: updatedUser.email }, 'Profile updated successfully');
});
