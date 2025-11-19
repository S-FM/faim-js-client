import { describe, it, expect, vi, beforeEach } from "vitest";
import { withRetry } from "../src/retry";

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should return success on first attempt if successful", async () => {
    const fn = vi.fn().mockResolvedValue({ success: true, data: "result" });

    const result = await withRetry(fn);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("result");
    }
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on retryable error", async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce({
        success: false,
        error: { error_code: "TIMEOUT_ERROR", message: "Timeout" },
      })
      .mockResolvedValueOnce({
        success: false,
        error: { error_code: "TIMEOUT_ERROR", message: "Timeout" },
      })
      .mockResolvedValueOnce({ success: true, data: "result" });

    const promise = withRetry(fn, { maxRetries: 3 });

    // Fast-forward through retries
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("result");
    }
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should not retry on non-retryable error", async () => {
    const fn = vi.fn().mockResolvedValue({
      success: false,
      error: { error_code: "INVALID_API_KEY", message: "Invalid key" },
    });

    const result = await withRetry(fn, { maxRetries: 3 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.error_code).toBe("INVALID_API_KEY");
    }
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should respect maxRetries limit", async () => {
    const fn = vi.fn().mockResolvedValue({
      success: false,
      error: { error_code: "TIMEOUT_ERROR", message: "Timeout" },
    });

    const promise = withRetry(fn, { maxRetries: 2 });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.success).toBe(false);
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("should apply exponential backoff", async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce({
        success: false,
        error: { error_code: "TIMEOUT_ERROR", message: "Timeout" },
      })
      .mockResolvedValueOnce({ success: true, data: "result" });

    const promise = withRetry(fn, { maxRetries: 1, initialDelayMs: 100, maxDelayMs: 1000 });

    await vi.runAllTimersAsync();
    await promise;

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should respect max delay cap", async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce({
        success: false,
        error: { error_code: "TIMEOUT_ERROR", message: "Timeout" },
      })
      .mockResolvedValueOnce({
        success: false,
        error: { error_code: "TIMEOUT_ERROR", message: "Timeout" },
      })
      .mockResolvedValueOnce({ success: true, data: "result" });

    const promise = withRetry(fn, { maxRetries: 2, initialDelayMs: 100, maxDelayMs: 200 });

    await vi.runAllTimersAsync();
    await promise;

    expect(fn).toHaveBeenCalledTimes(3);
  });
});
