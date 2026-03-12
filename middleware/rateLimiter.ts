import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number, lastReset: number }>();

export function rateLimiter(request: NextRequest) {
  const ip = request.ip || 'anonymous';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  const rateLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - rateLimit.lastReset > windowMs) {
    rateLimit.count = 1;
    rateLimit.lastReset = now;
  } else {
    rateLimit.count++;
  }

  rateLimitMap.set(ip, rateLimit);

  if (rateLimit.count > maxRequests) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Too many requests, please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null;
}
