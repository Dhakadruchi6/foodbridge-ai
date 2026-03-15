import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Check Legacy Token
  const token = request.cookies.get('token')?.value;

  // 2. Check NextAuth Token (Standard)
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const isAuthenticated = !!(token || session);

  console.log(`[MIDDLEWARE] ${path} - Authenticated: ${isAuthenticated} (Legacy: ${!!token}, Social: ${!!session})`);

  if (path.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      console.log(`[MIDDLEWARE] Redirecting to /login from ${path}`);
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
