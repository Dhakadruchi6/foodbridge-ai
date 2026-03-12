import { NextResponse } from 'next/server';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (err: any) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status: statusCode }
  );
};
