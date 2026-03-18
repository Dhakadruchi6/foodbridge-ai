import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import NGOProfile from '@/models/NGOProfile';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export async function POST(req: Request) {
  try {
    const { name, email, password, role, address, city, state, pincode, ngoRegNo, contactPhone, phone, latitude, longitude } = await req.json();

    let finalPhone = phone || contactPhone;

    // Normalize phone number to E.164
    if (finalPhone) {
      finalPhone = finalPhone.replace(/[^\d+]/g, '');
      if (!finalPhone.startsWith('+')) {
        finalPhone = `+91${finalPhone}`;
      }
    }

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

    // Create user with full profile and verified status
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone: finalPhone, // Use consolidated phone variable
      city,
      state,
      address,
      pincode,
      phoneVerified: true, // Registration enforces verification
    });

    // Create NGO Profile immediately to capture location data
    if (role === 'ngo') {
      await NGOProfile.create({
        userId: user._id,
        ngoName: name,
        city: city || 'Not specified',
        state: state || 'Not specified',
        pincode: pincode || 'Not specified',
        address: address || 'Not specified',
        contactPhone: finalPhone, // Use consolidated phone variable
        registrationNumber: ngoRegNo || 'Pending',
        verificationStatus: 'pending',
        latitude: latitude || null,
        longitude: longitude || null,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
