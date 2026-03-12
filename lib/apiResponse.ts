import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: any;
}

export const successResponse = (data: any, message: string = 'Success', status: number = 200) => {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
};

export const errorResponse = (message: string = 'Error', status: number = 500, error: any = null) => {
  return NextResponse.json(
    {
      success: false,
      message,
      error,
    },
    { status }
  );
};
