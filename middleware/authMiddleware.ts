import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { errorResponse } from '@/lib/apiResponse';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const authMiddleware = async (req: Request) => {
  try {
    const authHeader = req.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;

      if (decoded) {
        const response = NextResponse.next();
        response.headers.set('x-user-id', decoded.userId);
        response.headers.set('x-user-role', decoded.role);
        return response;
      }
    }

    // NextAuth Fallback
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const response = NextResponse.next();
      response.headers.set('x-user-id', (session.user as any).id);
      response.headers.set('x-user-role', (session.user as any).role);
      return response;
    }

    // Legacy Cookie Fallback
    const cookies = req.headers.get('cookie');
    if (cookies) {
      const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
      if (tokenCookie) {
        const token = tokenCookie.split('=')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
          if (decoded) {
            const response = NextResponse.next();
            response.headers.set('x-user-id', decoded.userId || decoded.id);
            response.headers.set('x-user-role', decoded.role);
            return response;
          }
        } catch (err) {
          console.error("[AUTH] Legacy token verification failed");
        }
      }
    }

    return errorResponse('Authentication failed', 401);
  } catch (error: any) {
    return errorResponse('Authentication failed', 401);
  }
};
