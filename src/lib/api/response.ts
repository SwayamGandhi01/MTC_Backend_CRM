import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    message?: string;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export function apiSuccess<T>(
  data: T,
  meta?: ApiSuccessResponse<T>["meta"],
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function apiError(
  message: string,
  code = "BAD_REQUEST",
  status = 400,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

export function apiUnauthorized(message = "Unauthorized access"): NextResponse<ApiErrorResponse> {
  return apiError(message, "UNAUTHORIZED", 401);
}

export function apiForbidden(message = "Forbidden: insufficient permissions"): NextResponse<ApiErrorResponse> {
  return apiError(message, "FORBIDDEN", 403);
}

export function apiNotFound(message = "Resource not found"): NextResponse<ApiErrorResponse> {
  return apiError(message, "NOT_FOUND", 404);
}
