import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import NGOProfile from '@/models/NGOProfile';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export async function POST(req: Request) {
  try {
    const { name, email, password, role, address, city, ngoRegNo } = await req.json();

    if (!name || !email || !password || !role) {
      return errorResponse('Missing required fields', 400);
    }

    if (!['donor', 'ngo', 'admin'].includes(role)) {
      return errorResponse('Invalid role', 400);
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse('User already exists', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Create NGO Profile immediately to capture location data
    if (role === 'ngo') {
      await NGOProfile.create({
        userId: user._id,
        ngoName: name,
        city: city || 'Not specified',
        address: address || 'Not specified',
        contactPhone: 'Not specified',
        registrationNumber: ngoRegNo || 'Pending',
        verificationStatus: 'pending',
      });
    }

    // Generate JWT for automatic login
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return successResponse(
      { token, user: { userId: user._id, email: user.email, role: user.role } },
      'User registered successfully',
      201
    );
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
