import type { APIError, ErrorCode } from "./types";

const RETRYABLE_ERROR_CODES = new Set<ErrorCode>([
  "TIMEOUT_ERROR",
  "OUT_OF_MEMORY",
  "RESOURCE_EXHAUSTED",
  "TRITON_CONNECTION_ERROR",
  "BILLING_TRANSACTION_FAILED",
  "DATABASE_ERROR",
]);

export class FaimError extends Error {
  constructor(
    public error_code: ErrorCode,
    message: string,
    public detail?: string,
    public request_id?: string,
  ) {
    super(message);
    this.name = "FaimError";
    Object.setPrototypeOf(this, FaimError.prototype);
  }

  toJSON(): Omit<APIError, "message"> & { message?: string } {
    return {
      error_code: this.error_code,
      message: this.message,
      detail: this.detail,
      request_id: this.request_id,
    };
  }
}

export function isRetryable(error: APIError | FaimError): boolean {
  const errorCode = error instanceof FaimError ? error.error_code : error.error_code;
  return RETRYABLE_ERROR_CODES.has(errorCode);
}

export function isAuthError(error: APIError | FaimError): boolean {
  const errorCode = error instanceof FaimError ? error.error_code : error.error_code;
  return [
    "AUTHENTICATION_REQUIRED",
    "AUTHENTICATION_FAILED",
    "INVALID_API_KEY",
    "AUTHORIZATION_FAILED",
  ].includes(errorCode);
}

export function isValidationError(error: APIError | FaimError): boolean {
  const errorCode = error instanceof FaimError ? error.error_code : error.error_code;
  return [
    "MISSING_REQUIRED_FIELD",
    "INVALID_PARAMETER",
    "INVALID_SHAPE",
    "INVALID_DTYPE",
    "INVALID_VALUE_RANGE",
    "VALIDATION_ERROR",
  ].includes(errorCode);
}

export function isTimeoutError(error: APIError | FaimError): boolean {
  const errorCode = error instanceof FaimError ? error.error_code : error.error_code;
  return errorCode === "TIMEOUT_ERROR";
}

export function isBillingError(error: APIError | FaimError): boolean {
  const errorCode = error instanceof FaimError ? error.error_code : error.error_code;
  return ["INSUFFICIENT_FUNDS", "BILLING_TRANSACTION_FAILED"].includes(errorCode);
}

export function isInferenceError(error: APIError | FaimError): boolean {
  const errorCode = error instanceof FaimError ? error.error_code : error.error_code;
  return [
    "INFERENCE_ERROR",
    "OUT_OF_MEMORY",
    "TIMEOUT_ERROR",
    "MODEL_INITIALIZATION_ERROR",
  ].includes(errorCode);
}
