import type { Result } from "./types";
import { isRetryable } from "./errors";

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 2000,
  maxDelayMs: 10000,
};

function calculateBackoff(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(2, attempt);
  return Math.min(delay, config.maxDelayMs);
}

export async function withRetry<T>(
  fn: () => Promise<Result<T>>,
  config: Partial<RetryConfig> = {},
): Promise<Result<T>> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    const result = await fn();

    if (result.success) {
      return result;
    }

    const shouldRetry = isRetryable(result.error) && attempt < finalConfig.maxRetries;

    if (!shouldRetry) {
      return result;
    }

    const delayMs = calculateBackoff(attempt, finalConfig);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // Should not reach here, but satisfy TypeScript
  return { success: false, error: { error_code: "INTERNAL_SERVER_ERROR", message: "Retry failed" } };
}
