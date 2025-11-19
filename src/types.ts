export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_MODEL_INPUT"
  | "INVALID_PARAMETER"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_SHAPE"
  | "INVALID_DTYPE"
  | "INVALID_VALUE_RANGE"
  | "AUTHENTICATION_REQUIRED"
  | "AUTHENTICATION_FAILED"
  | "INVALID_API_KEY"
  | "AUTHORIZATION_FAILED"
  | "MODEL_NOT_FOUND"
  | "PRICING_NOT_FOUND"
  | "RESOURCE_NOT_FOUND"
  | "INSUFFICIENT_FUNDS"
  | "INFERENCE_ERROR"
  | "MODEL_INITIALIZATION_ERROR"
  | "TIMEOUT_ERROR"
  | "OUT_OF_MEMORY"
  | "RESOURCE_EXHAUSTED"
  | "INTERNAL_SERVER_ERROR"
  | "TRITON_CONNECTION_ERROR"
  | "DATABASE_ERROR"
  | "CONFIGURATION_ERROR"
  | "BILLING_TRANSACTION_FAILED"
  | "REQUEST_TOO_LARGE"
  | "RATE_LIMIT_EXCEEDED";

export interface APIError {
  error_code: ErrorCode;
  message: string;
  detail?: string;
  request_id?: string;
}

export type OutputType = "point" | "quantiles" | "samples";

export interface ForecastMetadata {
  model_name: string;
  model_version: string;
  token_count: number;
}

export interface ForecastResponsePoint {
  outputs: {
    point: number[][][]; // 3D: (batch, horizon, features)
  };
  metadata: ForecastMetadata;
}

export interface ForecastResponseQuantiles {
  outputs: {
    quantiles: number[][][][]; // 4D: (batch, horizon, num_quantiles, features)
  };
  metadata: ForecastMetadata;
}

export type ForecastResponse = ForecastResponsePoint | ForecastResponseQuantiles;

export type Result<T> = { success: true; data: T } | { success: false; error: APIError };

export interface BaseForecastRequest {
  x: number[][][]; // 3D: (batch, sequence, features)
  horizon: number;
  output_type: OutputType;
}

export interface Chronos2ForecastRequest extends BaseForecastRequest {
  quantiles?: number[];
}

export interface TiRexForecastRequest extends BaseForecastRequest {
  // No model-specific parameters
}

export interface FaimClientConfig {
  timeout?: number; // milliseconds (default: 30000)
  maxRetries?: number; // default: 3
  baseUrl?: string; // default: https://api.faim.it.com
}
