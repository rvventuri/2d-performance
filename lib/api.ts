import { NextResponse } from "next/server";

/** Standard success envelope for all API route handlers. */
export interface ApiSuccess<T> {
  data: T;
  error?: never;
}

/** Standard error envelope for all API route handlers. */
export interface ApiError {
  data?: never;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/** Helpers to create consistently shaped Next.js JSON responses. */

export function apiOk<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data }, { status });
}

export function apiError(
  message: string,
  status = 500
): NextResponse<ApiError> {
  return NextResponse.json({ error: message }, { status });
}
