import { FetchClient } from "./http";
import { withRetry } from "./retry";
import type {
  Chronos2ForecastRequest,
  FaimClientConfig,
  ForecastResponse,
  Result,
  TiRexForecastRequest,
} from "./types";
import { FaimError } from "./errors";

const DEFAULT_BASE_URL = "https://api.faim.it.com";
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_MAX_RETRIES = 2;

function validateInput3D(x: unknown): void {
  if (!Array.isArray(x)) {
    throw new Error(
      "Input x must be a 3D array with shape (batch_size, context_length, num_features). " +
      "Expected array but got " + typeof x
    );
  }

  if (x.length === 0) {
    throw new Error(
      "Input x must be a 3D array with shape (batch_size, context_length, num_features). " +
      "Batch size cannot be empty."
    );
  }

  if (!Array.isArray(x[0])) {
    throw new Error(
      "Input x must be a 3D array with shape (batch_size, context_length, num_features). " +
      "Example: For a single time-series [1, 2, 3, 4, 5], transform to [[[1], [2], [3], [4], [5]]]"
    );
  }

  if (x[0].length === 0) {
    throw new Error(
      "Input x must be a 3D array with shape (batch_size, context_length, num_features). " +
      "Sequence length cannot be empty."
    );
  }

  if (!Array.isArray(x[0][0])) {
    throw new Error(
      "Input x must be a 3D array with shape (batch_size, context_length, num_features). " +
      "Example: For a single time-series [1, 2, 3, 4, 5], transform to [[[1], [2], [3], [4], [5]]]"
    );
  }
}

export class FaimClient {
  private httpClient: FetchClient;
  private timeout: number;
  private maxRetries: number;

  constructor(apiKey: string, config?: FaimClientConfig) {
    if (!apiKey) {
      throw new Error("API key is required");
    }

    const baseUrl = config?.baseUrl || DEFAULT_BASE_URL;
    this.httpClient = new FetchClient(baseUrl, apiKey);
    this.timeout = config?.timeout || DEFAULT_TIMEOUT;
    this.maxRetries = config?.maxRetries || DEFAULT_MAX_RETRIES;
  }

  async forecastChronos2(
    request: Chronos2ForecastRequest,
  ): Promise<Result<ForecastResponse>> {
    validateInput3D(request.x);

    return withRetry(
      async () => {
        try {
          const payload = {
            x: request.x,
            horizon: request.horizon,
            output_type: request.output_type,
            ...(request.quantiles && { quantiles: request.quantiles }),
          };

          const response = await this.httpClient.post<ForecastResponse>(
            "/v1/ts/forecast/chronos2/1",
            payload,
            this.timeout,
          );

          return { success: true, data: response };
        } catch (error) {
          if (error instanceof FaimError) {
            return { success: false, error };
          }
          throw error;
        }
      },
      { maxRetries: this.maxRetries },
    );
  }

  async forecastTiRex(request: TiRexForecastRequest): Promise<Result<ForecastResponse>> {
    validateInput3D(request.x);

    return withRetry(
      async () => {
        try {
          const payload = {
            x: request.x,
            horizon: request.horizon,
            output_type: request.output_type,
          };

          const response = await this.httpClient.post<ForecastResponse>(
            "/v1/ts/forecast/tirex/1",
            payload,
            this.timeout,
          );

          return { success: true, data: response };
        } catch (error) {
          if (error instanceof FaimError) {
            return { success: false, error };
          }
          throw error;
        }
      },
      { maxRetries: this.maxRetries },
    );
  }
}
