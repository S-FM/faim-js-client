import { FaimClient, isBillingError, isRetryable } from "../src/index";

async function main() {
  const apiKey = process.env.FAIM_API_KEY;
  if (!apiKey) {
    throw new Error("FAIM_API_KEY environment variable is required");
  }

  const client = new FaimClient(apiKey);

  const x: number[][][] = [[[1.0, 2.0], [2.0, 3.0], [3.0, 4.0], [4.0, 5.0], [5.0, 6.0]]];

  console.log("Forecasting with Chronos2 model - quantiles output...");
  const result = await client.forecastChronos2({
    x,
    horizon: 12,
    output_type: "quantiles",
    quantiles: [0.1, 0.5, 0.9],
  });

  if (result.success) {
    console.log("Forecast successful!");
    const outputs = result.data.outputs.quantiles;
    console.log(`Quantile forecast shape: ${outputs.length}x${outputs[0]?.length}x${outputs[0]?.[0]?.length}x${outputs[0]?.[0]?.[0]?.length}`);
    console.log("Token count:", result.data.metadata.token_count);
  } else {
    if (isBillingError(result.error)) {
      console.error("Billing error:", result.error.message);
      if (result.error.error_code === "INSUFFICIENT_FUNDS") {
        console.error("Please add credit to your account");
      }
    } else if (isRetryable(result.error)) {
      console.error("Retryable error occurred:", result.error.error_code);
    } else {
      console.error(`Error [${result.error.error_code}]:`, result.error.message);
    }
  }
}

main().catch(console.error);
