import { NextResponse } from 'next/server';

export const asyncHandler = (handler: Function) => {
  return async (req: Request, ...args: any[]) => {
    try {
      return await handler(req, ...args);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal Server Error';

      return NextResponse.json(
        {
          success: false,
          message,
          error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        { status: statusCode }
      );
    }
  };
};
