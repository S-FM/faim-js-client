import { describe, it, expect } from "vitest";
import {
  FaimError,
  isRetryable,
  isAuthError,
  isValidationError,
  isTimeoutError,
  isBillingError,
  isInferenceError,
} from "../src/errors";

describe("FaimError", () => {
  it("should create error with all fields", () => {
    const error = new FaimError(
      "INVALID_API_KEY",
      "API key not found",
      "The API key does not exist",
      "req_123",
    );

    expect(error.error_code).toBe("INVALID_API_KEY");
    expect(error.message).toBe("API key not found");
    expect(error.detail).toBe("The API key does not exist");
    expect(error.request_id).toBe("req_123");
    expect(error.name).toBe("FaimError");
  });

  it("should serialize to JSON safely", () => {
    const error = new FaimError(
      "TIMEOUT_ERROR",
      "Request timed out",
      "Inference exceeded 20s",
      "req_456",
    );

    const json = error.toJSON();
    expect(json.error_code).toBe("TIMEOUT_ERROR");
    expect(json.message).toBe("Request timed out");
    expect(json.detail).toBe("Inference exceeded 20s");
    expect(json.request_id).toBe("req_456");
  });
});

describe("Error classification functions", () => {
  it("isRetryable should detect retryable errors", () => {
    expect(isRetryable({ error_code: "TIMEOUT_ERROR", message: "Timeout" })).toBe(true);
    expect(isRetryable({ error_code: "OUT_OF_MEMORY", message: "OOM" })).toBe(true);
    expect(isRetryable({ error_code: "RESOURCE_EXHAUSTED", message: "Resources" })).toBe(true);
    expect(
      isRetryable({ error_code: "TRITON_CONNECTION_ERROR", message: "Connection failed" }),
    ).toBe(true);
    expect(isRetryable({ error_code: "BILLING_TRANSACTION_FAILED", message: "Billing" })).toBe(
      true,
    );
  });

  it("isRetryable should not mark permanent errors as retryable", () => {
    expect(isRetryable({ error_code: "INVALID_API_KEY", message: "Invalid key" })).toBe(false);
    expect(isRetryable({ error_code: "INVALID_PARAMETER", message: "Bad param" })).toBe(false);
    expect(isRetryable({ error_code: "INSUFFICIENT_FUNDS", message: "No funds" })).toBe(false);
  });

  it("isAuthError should detect auth errors", () => {
    expect(isAuthError({ error_code: "INVALID_API_KEY", message: "Invalid key" })).toBe(true);
    expect(isAuthError({ error_code: "AUTHENTICATION_REQUIRED", message: "Missing auth" })).toBe(
      true,
    );
    expect(isAuthError({ error_code: "AUTHENTICATION_FAILED", message: "Failed" })).toBe(true);
    expect(isAuthError({ error_code: "AUTHORIZATION_FAILED", message: "No permission" })).toBe(
      true,
    );
  });

  it("isValidationError should detect validation errors", () => {
    expect(isValidationError({ error_code: "INVALID_PARAMETER", message: "Bad param" })).toBe(
      true,
    );
    expect(isValidationError({ error_code: "MISSING_REQUIRED_FIELD", message: "Missing" })).toBe(
      true,
    );
    expect(isValidationError({ error_code: "INVALID_SHAPE", message: "Bad shape" })).toBe(true);
  });

  it("isTimeoutError should detect timeout errors", () => {
    expect(isTimeoutError({ error_code: "TIMEOUT_ERROR", message: "Timeout" })).toBe(true);
    expect(isTimeoutError({ error_code: "INVALID_API_KEY", message: "Bad key" })).toBe(false);
  });

  it("isBillingError should detect billing errors", () => {
    expect(isBillingError({ error_code: "INSUFFICIENT_FUNDS", message: "No funds" })).toBe(true);
    expect(
      isBillingError({ error_code: "BILLING_TRANSACTION_FAILED", message: "Failed" }),
    ).toBe(true);
  });

  it("isInferenceError should detect inference errors", () => {
    expect(isInferenceError({ error_code: "INFERENCE_ERROR", message: "Inference failed" })).toBe(
      true,
    );
    expect(isInferenceError({ error_code: "OUT_OF_MEMORY", message: "OOM" })).toBe(true);
    expect(isInferenceError({ error_code: "TIMEOUT_ERROR", message: "Timeout" })).toBe(true);
  });
});
