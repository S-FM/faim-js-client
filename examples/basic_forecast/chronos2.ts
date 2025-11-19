import { FaimClient } from "../../src/index";

async function main() {
  const apiKey = process.env.FAIM_API_KEY;
  if (!apiKey) throw new Error("FAIM_API_KEY required");

  const client = new FaimClient(apiKey);
  const x: number[][][] = [[[1], [2], [3], [4], [5], [6], [7], [8], [9], [10]]];

  console.log("Chronos2 - Point Forecast");
  const result = await client.forecastChronos2({
    x,
    horizon: 3,
    output_type: "point",
  });
  if (result.success) {
    console.log("✓ Success");
    console.log("Forecasted time series:");
    console.log(JSON.stringify(result.data.outputs.point, null, 2));
  } else {
    console.log(`✗ ${result.error.error_code}: ${result.error.message}`);
  }
}

main().catch(console.error);
