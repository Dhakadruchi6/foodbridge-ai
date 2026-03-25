import dbConnect from '@/lib/db';
import User from '@/models/User';
import { errorResponse, successResponse } from '@/lib/apiResponse';
// In a real app, we'd get the userId from the session
// For now, we'll assume the client passes a way to identify the user (e.g., email or current session)

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { phone, city, state, address, pincode, role, email, name, ngoRegNo, latitude, longitude, donationPreferences, description } = data;

        if (!email) {
            return errorResponse('User identification (email) required', 400);
        }

        await dbConnect();

        const user = await User.findOneAndUpdate(
            { email },
            {
                name,
                phone,
                city,
                state,
                address,
                pincode,
                latitude,
                longitude,
                role,
                isActive: true,
                donationPreferences
            },
            { new: true }
        );

        if (!user) {
            return errorResponse('User not found', 404);
        }

        // Handle NGO Profile
        if (role === 'ngo') {
            const NGOProfile = (await import('@/models/NGOProfile')).default;
            await NGOProfile.findOneAndUpdate(
                { userId: user._id },
                {
                    $set: {
                        ngoName: name,
                        registrationNumber: ngoRegNo || 'Pending',
                        address,
                        city,
                        state,
                        pincode,
                        latitude,
                        longitude,
                        contactPhone: phone,
                        description,
                        certificateUrl: data.certificateUrl || '',
                        idProofUrl: data.idProofUrl || '',
                    },
                    $setOnInsert: {
                        isVerified: false,
                        ngo_verified: false,
                        verificationStatus: 'pending',
                        status: 'pending',
                    }
                },
                { upsert: true, new: true }
            );
        }

        return successResponse(user, 'Profile updated successfully');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}
