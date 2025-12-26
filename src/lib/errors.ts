// ============================================================================
// DTD Phase 2: API Contract - Error Handling
// File: src/lib/errors.ts
// Description: Error handling utilities
// ============================================================================

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * API error codes
 */
export enum ErrorCode {
  // General errors (1000-1999)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Authentication errors (2000-2999)
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  MFA_REQUIRED = 'MFA_REQUIRED',
  MFA_INVALID = 'MFA_INVALID',
  MFA_NOT_SETUP = 'MFA_NOT_SETUP',
  MFA_ALREADY_ENABLED = 'MFA_ALREADY_ENABLED',

  // Trainer errors (3000-3999)
  TRAINER_NOT_FOUND = 'TRAINER_NOT_FOUND',
  TRAINER_ALREADY_EXISTS = 'TRAINER_ALREADY_EXISTS',
  TRAINER_NOT_VERIFIED = 'TRAINER_NOT_VERIFIED',
  TRAINER_NOT_CLAIMED = 'TRAINER_NOT_CLAIMED',
  FEATURED_NOT_AVAILABLE = 'FEATURED_NOT_AVAILABLE',
  FEATURED_ALREADY_ACTIVE = 'FEATURED_ALREADY_ACTIVE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // Admin errors (4000-4999)
  REVIEW_NOT_FOUND = 'REVIEW_NOT_FOUND',
  REVIEW_ALREADY_MODERATED = 'REVIEW_ALREADY_MODERATED',
  FEATURED_PLACEMENT_NOT_FOUND = 'FEATURED_PLACEMENT_NOT_FOUND',
  INVALID_STATUS_UPDATE = 'INVALID_STATUS_UPDATE',

  // Database errors (5000-5999)
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',

  // External service errors (6000-6999)
  STRIPE_ERROR = 'STRIPE_ERROR',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  SMS_SEND_FAILED = 'SMS_SEND_FAILED',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

/**
 * Base API error class
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Bad request error (400)
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', details?: Record<string, unknown>) {
    super(ErrorCode.BAD_REQUEST, message, 400, details);
    this.name = 'BadRequestError';
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: Record<string, unknown>) {
    super(ErrorCode.UNAUTHORIZED, message, 401, details);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: Record<string, unknown>) {
    super(ErrorCode.FORBIDDEN, message, 403, details);
    this.name = 'ForbiddenError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', details?: Record<string, unknown>) {
    super(ErrorCode.NOT_FOUND, message, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict', details?: Record<string, unknown>) {
    super(ErrorCode.CONFLICT, message, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * Validation error (422)
 */
export class ValidationError extends ApiError {
  public readonly errors: Array<{ field: string; message: string }>;

  constructor(
    message: string = 'Validation failed',
    errors: Array<{ field: string; message: string }> = []
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, 422, { errors });
    this.name = 'ValidationError';
    this.errors = errors;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      errors: this.errors,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Rate limit exceeded error (429)
 */
export class RateLimitError extends ApiError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429, { retryAfter });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      retry_after: this.retryAfter,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Internal server error (500)
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', details?: Record<string, unknown>) {
    super(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, details);
    this.name = 'InternalServerError';
  }
}

/**
 * Invalid credentials error (401)
 */
export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message: string = 'Invalid credentials') {
    super(ErrorCode.INVALID_CREDENTIALS, message);
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Token expired error (401)
 */
export class TokenExpiredError extends UnauthorizedError {
  constructor(message: string = 'Token expired') {
    super(ErrorCode.TOKEN_EXPIRED, message);
    this.name = 'TokenExpiredError';
  }
}

/**
 * MFA required error (403)
 */
export class MfaRequiredError extends ForbiddenError {
  constructor(message: string = 'MFA required') {
    super(ErrorCode.MFA_REQUIRED, message);
    this.name = 'MfaRequiredError';
  }
}

/**
 * MFA invalid error (401)
 */
export class MfaInvalidError extends UnauthorizedError {
  constructor(message: string = 'Invalid MFA code') {
    super(ErrorCode.MFA_INVALID, message);
    this.name = 'MfaInvalidError';
  }
}

/**
 * Trainer not found error (404)
 */
export class TrainerNotFoundError extends NotFoundError {
  constructor(trainerId: string) {
    super(ErrorCode.TRAINER_NOT_FOUND, `Trainer not found: ${trainerId}`, 404, { trainerId });
    this.name = 'TrainerNotFoundError';
  }
}

/**
 * Trainer already exists error (409)
 */
export class TrainerAlreadyExistsError extends ConflictError {
  constructor(email: string) {
    super(ErrorCode.TRAINER_ALREADY_EXISTS, `Trainer already exists: ${email}`, 409, { email });
    this.name = 'TrainerAlreadyExistsError';
  }
}

/**
 * Payment failed error (400)
 */
export class PaymentFailedError extends BadRequestError {
  constructor(message: string = 'Payment failed', details?: Record<string, unknown>) {
    super(ErrorCode.PAYMENT_FAILED, message, details);
    this.name = 'PaymentFailedError';
  }
}

/**
 * Stripe error (500)
 */
export class StripeError extends InternalServerError {
  constructor(message: string = 'Stripe error', details?: Record<string, unknown>) {
    super(ErrorCode.STRIPE_ERROR, message, details);
    this.name = 'StripeError';
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends InternalServerError {
  constructor(message: string = 'Database error', details?: Record<string, unknown>) {
    super(ErrorCode.DATABASE_ERROR, message, details);
    this.name = 'DatabaseError';
  }
}

// ============================================================================
// ERROR HANDLERS
// ============================================================================

/**
 * Handle Supabase error and convert to API error
 */
export function handleSupabaseError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  const supabaseError = error as {
    code?: string;
    message: string;
    details?: unknown;
    hint?: string;
  };

  // Handle specific Supabase error codes
  switch (supabaseError.code) {
    case '23505': // Unique violation
      return new ConflictError(
        'Duplicate entry',
        supabaseError.details as Record<string, unknown>
      );
    case '23503': // Foreign key violation
      return new BadRequestError(
        'Invalid reference',
        supabaseError.details as Record<string, unknown>
      );
    case '23502': // Not null violation
      return new BadRequestError(
        'Required field missing',
        supabaseError.details as Record<string, unknown>
      );
    case 'PGRST116': // Not found
      return new NotFoundError('Resource not found');
    case 'PGRST301': // Relation not found
      return new BadRequestError('Invalid relation');
    default:
      return new DatabaseError(
        supabaseError.message || 'Database error',
        {
          code: supabaseError.code,
          hint: supabaseError.hint,
        }
      );
  }
}

/**
 * Handle Stripe error and convert to API error
 */
export function handleStripeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  const stripeError = error as {
    type?: string;
    code?: string;
    message: string;
  };

  // Handle specific Stripe error types
  switch (stripeError.type) {
    case 'StripeCardError':
      return new PaymentFailedError(
        stripeError.message,
        { code: stripeError.code }
      );
    case 'StripeInvalidRequestError':
      return new BadRequestError(stripeError.message);
    case 'StripeAPIError':
      return new StripeError('Stripe API error');
    case 'StripeConnectionError':
      return new StripeError('Stripe connection error');
    case 'StripeRateLimitError':
      return new RateLimitError('Stripe rate limit exceeded');
    default:
      return new StripeError(stripeError.message || 'Stripe error');
  }
}

/**
 * Handle unknown error and convert to API error
 */
export function handleUnknownError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalServerError(error.message);
  }

  return new InternalServerError('An unknown error occurred');
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: ApiError): {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
} {
  return {
    success: false,
    error: error.toJSON() as {
      code: string;
      message: string;
      details?: Record<string, unknown>;
      timestamp: string;
    },
  };
}

/**
 * Log error for debugging
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const errorData = error instanceof ApiError ? error.toJSON() : { error: String(error) };

  console.error('[ERROR]', {
    timestamp,
    ...errorData,
    context,
  });

  // TODO: Send to error tracking service (e.g., Sentry)
}

/**
 * Create error response object
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  statusCode: number = 500,
  details?: Record<string, unknown>
): ApiError {
  return new ApiError(code, message, statusCode, details);
}

// ============================================================================
// ERROR MIDDLEWARE HELPERS
// ============================================================================

/**
 * Wrap async route handler with error handling
 */
export function withErrorHandler<T extends (...args: unknown[]) => Promise<unknown>>(
  handler: T
): T {
  return (async (...args: unknown[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      const apiError = handleUnknownError(error);
      logError(error);
      throw apiError;
    }
  }) as T;
}

/**
 * Wrap async route handler with validation error handling
 */
export function withValidationHandler<T extends (...args: unknown[]) => Promise<unknown>>(
  handler: T
): T {
  return (async (...args: unknown[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ValidationError) {
        logError(error);
        throw error;
      }
      const apiError = handleUnknownError(error);
      logError(error);
      throw apiError;
    }
  }) as T;
}

// ============================================================================
// EXPORT ALL CLASSES AND FUNCTIONS
// ============================================================================

export {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  InvalidCredentialsError,
  TokenExpiredError,
  MfaRequiredError,
  MfaInvalidError,
  TrainerNotFoundError,
  TrainerAlreadyExistsError,
  PaymentFailedError,
  StripeError,
  DatabaseError,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Error code enumeration for all API errors
// 2. Error classes for different error types
// 3. Error handlers for external services (Supabase, Stripe)
// 4. Error formatting and logging utilities
// 5. Middleware helpers for route error handling
// 6. Based on DOCS/05_DATA_AND_API_CONTRACTS.md
// ============================================================================
