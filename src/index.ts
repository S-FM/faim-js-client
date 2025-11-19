export { FaimClient } from "./client";

export type {
  FaimClientConfig,
  APIError,
  ErrorCode,
  OutputType,
  ForecastResponse,
  ForecastResponsePoint,
  ForecastResponseQuantiles,
  ForecastMetadata,
  Result,
  BaseForecastRequest,
  Chronos2ForecastRequest,
  TiRexForecastRequest,
} from "./types";

export { FaimError, isRetryable, isAuthError, isValidationError, isTimeoutError, isBillingError, isInferenceError } from "./errors";

// Utility functions
export { getShape, expandTo3D, squeeze, MAE, MSE, validateInput3D } from "./utils";
