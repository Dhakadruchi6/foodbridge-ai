import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: unknown;
}

export const successResponse = (data: unknown, message: string = 'Success', status: number = 200) => {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
};

export const errorResponse = (message: string = 'Error', status: number = 500, error: unknown = null) => {
  return NextResponse.json(
    {
      success: false,
      message,
      error,
    },
    { status }
  );
};
