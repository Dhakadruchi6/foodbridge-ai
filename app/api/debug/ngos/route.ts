import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import NGOProfile from '@/models/NGOProfile';
import User from '@/models/User';
import { successResponse } from '@/lib/apiResponse';

export async function GET() {
    try {
        await dbConnect();
        const ngos = await NGOProfile.find({});
        const users = await User.find({ role: 'ngo' });
        return successResponse({ ngos, users }, 'Debug: NGO Audit Info');
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
