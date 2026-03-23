import dbConnect from '@/lib/db';
import User from '@/models/User';
import { errorResponse, successResponse } from '@/lib/apiResponse';

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) {
            return errorResponse('Token is required', 400);
        }

        await dbConnect();

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return errorResponse('Invalid or expired reset token', 400);
        }

        return successResponse({ valid: true }, 'Token is valid');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}
