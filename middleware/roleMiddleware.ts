import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/apiResponse';

export const allowRoles = (...roles: string[]) => {
  return async (req: { headers: Headers }) => {
    // In a real application, we'd extract the user from the response headers set by authMiddleware
    // or use a context-based approach. For this phase, we assume the user is already authenticated.
    const userRole = req.headers.get('x-user-role');

    if (!userRole || !roles.includes(userRole)) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }
    return NextResponse.next();
  };
};
