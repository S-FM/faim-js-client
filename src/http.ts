import type { APIError } from "./types";
import { FaimError } from "./errors";

interface FetchOptions {
  method: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export class FetchClient {
  constructor(
    private baseUrl: string,
    private apiKey: string,
  ) {}

  async request<T>(
    path: string,
    options: FetchOptions,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = options.timeout
      ? setTimeout(() => controller.abort(), options.timeout)
      : undefined;

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      };

      const body = options.body ? JSON.stringify(options.body) : undefined;

      const response = await fetch(url, {
        method: options.method,
        headers,
        body,
        signal: controller.signal,
      });

      const responseBody = await response.json();

      if (!response.ok) {
        const error = responseBody as APIError;
        throw new FaimError(error.error_code, error.message, error.detail, error.request_id);
      }

      return responseBody as T;
    } catch (error) {
      if (error instanceof FaimError) {
        throw error;
      }

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new FaimError(
          "TRITON_CONNECTION_ERROR",
          "Failed to connect to server",
          error.message,
        );
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new FaimError(
          "TIMEOUT_ERROR",
          "Request timeout exceeded",
          `Request did not complete within ${options.timeout}ms`,
        );
      }

      throw new FaimError(
        "INTERNAL_SERVER_ERROR",
        "Unexpected error occurred",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }

  async post<T>(path: string, body: unknown, timeout?: number): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body,
      timeout,
    });
  }

  async get<T>(path: string, timeout?: number): Promise<T> {
    return this.request<T>(path, {
      method: "GET",
      timeout,
    });
  }
}
