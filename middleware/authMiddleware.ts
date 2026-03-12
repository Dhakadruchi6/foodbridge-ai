import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { errorResponse } from '@/lib/apiResponse';

export const authMiddleware = async (req: Request) => {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Authorization header missing or invalid', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

    if (!decoded) {
      return errorResponse('Invalid token', 401);
    }

    // Attach user information to request context
    // Note: Next.js App Router doesn't allow direct attachment to req.
    // We pass it to headers or use it in the response.
    const response = NextResponse.next();
    response.headers.set('x-user-id', decoded.userId);
    response.headers.set('x-user-role', decoded.role);

    return response;
  } catch (error: any) {
    return errorResponse('Authentication failed', 401);
  }
};
