import { FaimClient, expandTo3D, squeeze, MAE, MSE } from "@faim-group/sdk-forecasting";

async function main() {
  const apiKey = process.env.FAIM_API_KEY;
  if (!apiKey) throw new Error("FAIM_API_KEY required");

  const client = new FaimClient(apiKey);

  // Create 1D input array (1 to 50)
  const timeSeries1D = Array.from({ length: 50 }, (_, i) => i + 1);
  console.log("Input 1D time series (1-50):", timeSeries1D);

  // Transform to 3D format required by API
  const x = expandTo3D(timeSeries1D);
  console.log("Expanded to 3D shape:", `[${x.length}, ${x[0]?.length}, ${x[0]?.[0]?.length}]`);

  // Define target for metrics calculation (next 3 values)
  const target: number[][][] = [[[51], [52], [53]]];
  console.log("Target for metrics:", JSON.stringify(target));

  console.log("\nTiRex - Point Forecast");
  const result = await client.forecastTiRex({
    x,
    horizon: 3,
    output_type: "point",
  });

  if (result.success) {
    console.log("✓ Success");

    const outputs = result.data.outputs as { point?: number[][][] };
    if (outputs.point) {
      const forecast = outputs.point;
      console.log("\nRaw forecast output (3D):");
      console.log(JSON.stringify(forecast, null, 2));

      // Squeeze the output to remove singleton dimensions
      const squeezedForecast = squeeze(forecast);
      console.log("\nSqueezed forecast:");
      console.log(JSON.stringify(squeezedForecast, null, 2));

      // Calculate metrics
      const mae = MAE(target, forecast);
      const mse = MSE(target, forecast);

      console.log("\nMetrics:");
      console.log(`  MAE: ${mae.toFixed(4)}`);
      console.log(`  MSE: ${mse.toFixed(4)}`);
    }
  } else {
    console.log(`✗ ${result.error.error_code}: ${result.error.message}`);
  }
}

main().catch(console.error);
