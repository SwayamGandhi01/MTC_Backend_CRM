export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, code = "INTERNAL_ERROR", statusCode = 500, details?: any) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied: insufficient privileges") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Requested entity not found") {
    super(message, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: any) {
    super(message, "VALIDATION_ERROR", 422, details);
  }
}
