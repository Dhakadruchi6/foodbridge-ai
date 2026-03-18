import dbConnect from '@/lib/db';
import User from '@/models/User';
import { errorResponse, successResponse } from '@/lib/apiResponse';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return errorResponse('Token and new password are required', 400);
        }

        await dbConnect();

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return errorResponse('Invalid or expired reset token', 400);
        }

        // Hash and update password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return successResponse({}, 'Password has been reset successfully');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}
