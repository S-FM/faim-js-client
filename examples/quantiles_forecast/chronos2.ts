import { FaimClient } from "../../src/index";

async function main() {
  const apiKey = process.env.FAIM_API_KEY;
  if (!apiKey) throw new Error("FAIM_API_KEY required");

  const client = new FaimClient(apiKey);
  const x: number[][][] = [[[1], [2], [3], [4], [5]]];

  console.log("Chronos2 - Quantiles (default)");
  let result = await client.forecastChronos2({
    x,
    horizon: 10,
    output_type: "quantiles",
  });
  console.log(result.success ? "✓ Success" : `✗ ${result.error.error_code}: ${result.error.message}`);

  console.log("\nChronos2 - Quantiles (custom: 0.1, 0.5, 0.9)");
  result = await client.forecastChronos2({
    x,
    horizon: 10,
    output_type: "quantiles",
    quantiles: [0.1, 0.5, 0.9],
  });
  console.log(result.success ? "✓ Success" : `✗ ${result.error.error_code}: ${result.error.message}`);
}

main().catch(console.error);
