import {
  FaimClient,
  isAuthError,
  isValidationError,
  isTimeoutError,
  isInferenceError,
  FaimError,
} from "../src/index";

async function main() {
  const apiKey = process.env.FAIM_API_KEY;
  if (!apiKey) {
    throw new Error("FAIM_API_KEY environment variable is required");
  }

  const client = new FaimClient(apiKey, {
    timeout: 30000,
    maxRetries: 3,
  });

  const x: number[][][] = [[[1], [2], [3], [4], [5]]];

  console.log("Example 1: Handling authentication error");
  const invalidClient = new FaimClient("sk-invalid-key");
  const authResult = await invalidClient.forecastFlowState({
    x,
    horizon: 10,
    output_type: "point",
  });

  if (!authResult.success && isAuthError(authResult.error)) {
    console.log(`✓ Caught auth error: ${authResult.error.message}`);
  }

  console.log("\nExample 2: Handling validation error");
  const validationResult = await client.forecastFlowState({
    x,
    horizon: -1, // Invalid: must be > 0
    output_type: "point",
  });

  if (!validationResult.success && isValidationError(validationResult.error)) {
    console.log(`✓ Caught validation error: ${validationResult.error.message}`);
  }

  console.log("\nExample 3: Handling with timeout");
  const timeoutClient = new FaimClient(apiKey, {
    timeout: 100, // Very short timeout for demo
  });

  const timeoutResult = await timeoutClient.forecastFlowState({
    x,
    horizon: 10,
    output_type: "point",
  });

  if (!timeoutResult.success && isTimeoutError(timeoutResult.error)) {
    console.log(`✓ Caught timeout error: ${timeoutResult.error.message}`);
  }

  console.log("\nExample 4: Successful forecast with result unwrapping");
  const successResult = await client.forecastFlowState({
    x,
    horizon: 5,
    output_type: "point",
  });

  if (successResult.success) {
    const { data } = successResult;
    console.log(`✓ Success! Got ${data.metadata.token_count} tokens`);
  } else {
    console.error(`✗ Failed: ${successResult.error.error_code}`);
  }
}

main().catch(console.error);
