import { FaimClient } from "../src/index";

async function main() {
  const apiKey = process.env.FAIM_API_KEY;
  if (!apiKey) throw new Error("FAIM_API_KEY required");

  const client = new FaimClient(apiKey);
  const x: number[][][] = [[[1], [2], [3], [4], [5]]];

  // FlowState - Point forecast
  console.log("\n=== FlowState (Point) ===");
  let result = await client.forecastFlowState({
    x,
    horizon: 10,
    output_type: "point",
  });
  console.log(result.success ? `✓ Success` : `✗ ${result.error.error_code}: ${result.error.message}`);

  // FlowState with scale_factor
  console.log("\n=== FlowState (with scale_factor) ===");
  result = await client.forecastFlowState({
    x,
    horizon: 5,
    output_type: "point",
    scale_factor: 0.5,
  });
  console.log(result.success ? `✓ Success` : `✗ ${result.error.error_code}: ${result.error.message}`);

  // Chronos2 - Point forecast
  console.log("\n=== Chronos2 (Point) ===");
  result = await client.forecastChronos2({
    x,
    horizon: 10,
    output_type: "point",
  });
  console.log(result.success ? `✓ Success` : `✗ ${result.error.error_code}: ${result.error.message}`);

  // Chronos2 - Quantiles with custom values
  console.log("\n=== Chronos2 (Custom quantiles) ===");
  result = await client.forecastChronos2({
    x,
    horizon: 10,
    output_type: "quantiles",
    quantiles: [0.1, 0.5, 0.9],
  });
  console.log(result.success ? `✓ Success` : `✗ ${result.error.error_code}: ${result.error.message}`);

  // TiRex - Point forecast
  console.log("\n=== TiRex (Point) ===");
  result = await client.forecastTiRex({
    x,
    horizon: 10,
    output_type: "point",
  });
  console.log(result.success ? `✓ Success` : `✗ ${result.error.error_code}: ${result.error.message}`);

  // TiRex - Quantiles
  console.log("\n=== TiRex (Quantiles) ===");
  result = await client.forecastTiRex({
    x,
    horizon: 10,
    output_type: "quantiles",
  });
  console.log(result.success ? `✓ Success` : `✗ ${result.error.error_code}: ${result.error.message}`);
}

main().catch(console.error);
