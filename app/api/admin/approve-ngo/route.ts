import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import dbConnect from '@/lib/db';
import NGOProfile from '@/models/NGOProfile';
import User from '@/models/User';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export const PATCH = asyncHandler(async (req: Request) => {
  const authGate = await authMiddleware(req);
  if (authGate.status !== 200) return authGate;

  const userRole = authGate.headers.get('x-user-role');
  if (userRole !== 'admin') return errorResponse('Forbidden: Admin only', 403);

  const { ngoId, action } = await req.json();

  if (!ngoId || !['approve', 'reject'].includes(action)) {
    return errorResponse('Invalid ngoId or action', 400);
  }

  await dbConnect();

  // Try to find and update existing profile
  let ngo = await NGOProfile.findByIdAndUpdate(
    ngoId,
    { verificationStatus: action === 'approve' ? 'approved' : 'rejected' },
    { new: true }
  );

  // If not found by profile _id, it might be a user _id without a profile
  if (!ngo) {
    // Auto-create a profile for the user then update it
    const user = await User.findById(ngoId);
    if (user && user.role === 'ngo') {
      ngo = await NGOProfile.findOneAndUpdate(
        { userId: ngoId },
        { verificationStatus: action === 'approve' ? 'approved' : 'rejected' },
        { new: true }
      );
      if (!ngo) {
        ngo = await NGOProfile.create({
          userId: ngoId,
          ngoName: user.name,
          city: 'Not specified',
          address: 'Not specified',
          contactPhone: 'Not specified',
          registrationNumber: 'Pending',
          verificationStatus: action === 'approve' ? 'approved' : 'rejected',
        });
      }
    } else {
      return errorResponse('NGO not found', 404);
    }
  }

  return successResponse(ngo, `NGO ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
});

// GET: list all NGO users + profiles merged
export const GET = asyncHandler(async (req: Request) => {
  const authGate = await authMiddleware(req);
  if (authGate.status !== 200) return authGate;

  const userRole = authGate.headers.get('x-user-role');
  if (userRole !== 'admin') return errorResponse('Forbidden: Admin only', 403);

  await dbConnect();

  // Get all NGO profiles with user info
  const profiles = await NGOProfile.find({}).populate('userId', 'name email').sort({ createdAt: -1 });

  // Get all NGO users
  const ngoUsers = await User.find({ role: 'ngo' }, 'name email createdAt').sort({ createdAt: -1 });

  // Find NGO users who don't have a profile yet
  const profileUserIds = new Set(profiles.map((p: any) => p.userId?._id?.toString() || p.userId?.toString()));

  const unregisteredNGOs = ngoUsers
    .filter((u: any) => !profileUserIds.has(u._id.toString()))
    .map((u: any) => ({
      _id: u._id.toString(),  // Use user ID as the identifier
      ngoName: u.name,
      city: 'Profile not completed',
      verificationStatus: 'pending',
      userId: { _id: u._id, name: u.name, email: u.email },
      createdAt: u.createdAt,
      _isUserOnly: true, // Flag to indicate this is a user without a profile
    }));

  const merged = [...profiles.map((p: any) => p.toObject()), ...unregisteredNGOs];

  return successResponse(merged, 'NGO profiles retrieved');
});
