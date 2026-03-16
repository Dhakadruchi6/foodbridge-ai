import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { errorResponse } from '@/lib/apiResponse';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const authMiddleware = async (req: Request) => {
  const url = new URL(req.url);
  console.log(`[AUTH-MW] Checking access for: ${url.pathname}`);

  try {
    // 1. Try Bearer Token (Legacy/Mobile)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token !== 'undefined' && token !== 'null') {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
          if (decoded) {
            console.log("[AUTH-MW] Success via Bearer Token");
            const response = NextResponse.next();
            response.headers.set('x-user-id', decoded.userId || decoded.id);
            response.headers.set('x-user-role', decoded.role);
            return response;
          }
        } catch (err: any) {
          console.warn("[AUTH-MW] Bearer Token verification failed:", err.message);
        }
      }
    }

    // 2. Try NextAuth Session (Social Login)
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const userId = (session.user as any).id;
      const userRole = (session.user as any).role;

      console.log("[AUTH-MW] Success via NextAuth Session:", { userId, userRole });

      const response = NextResponse.next();
      if (userId) response.headers.set('x-user-id', userId);
      if (userRole) response.headers.set('x-user-role', userRole);
      return response;
    }

    // 3. Try Legacy Cookie Fallback
    const cookies = req.headers.get('cookie');
    if (cookies) {
      const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('token='));
      if (tokenCookie) {
        const token = tokenCookie.split('=')[1];
        if (token && token !== 'undefined' && token !== 'null') {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
            if (decoded) {
              console.log("[AUTH-MW] Success via Cookie Token");
              const response = NextResponse.next();
              response.headers.set('x-user-id', decoded.userId || decoded.id);
              response.headers.set('x-user-role', decoded.role);
              return response;
            }
          } catch (err: any) {
            console.warn("[AUTH-MW] Cookie Token verification failed:", err.message);
          }
        }
      }
    }

    console.warn(`[AUTH-MW] ❌ Access Denied: No valid session or token for ${url.pathname}`);
    return errorResponse('Authentication failed', 401);
  } catch (error: any) {
    console.error(`[AUTH-MW] 🔥 Critical Fallthrough Error for ${url.pathname}:`, error.message);
    return errorResponse('Authentication failed', 401);
  }
};
