import { NextResponse } from 'next/server';
import { DomainError, ValidationError } from '@/lib/errors';
import type { ApiResponse } from '@/types/api';

export function success<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: ReadonlyArray<{ readonly field: string; readonly message: string }>,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}

export function handleError(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof ValidationError) {
    return errorResponse(error.code, error.message, error.statusCode, error.fieldErrors);
  }

  if (error instanceof DomainError) {
    return errorResponse(error.code, error.message, error.statusCode);
  }

  console.error('Unhandled error:', error);
  return errorResponse('INTERNAL_ERROR', 'Terjadi kesalahan internal', 500);
}
