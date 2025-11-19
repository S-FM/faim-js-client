import { FaimClient, expandTo3D, squeeze } from "@faim-group/sdk-forecasting";

async function main() {
  const apiKey = process.env.FAIM_API_KEY;
  if (!apiKey) throw new Error("FAIM_API_KEY required");

  const client = new FaimClient(apiKey);

  // Create 1D input array (1 to 50)
  const timeSeries1D = Array.from({ length: 50 }, (_, i) => i + 1);
  console.log("Input 1D time series (1-50):", timeSeries1D);

  // Transform to 3D format required by API
  const x = expandTo3D(timeSeries1D);
  console.log("Expanded to 3D shape:", `[${x.length}, ${x[0]?.length}, ${x[0]?.[0]?.length}]\n`);

  console.log("TiRex - Quantiles (default)");
  const result = await client.forecastTiRex({
    x,
    horizon: 3,
    output_type: "quantiles",
  });

  if (result.success) {
    console.log("✓ Success");

    const outputs = result.data.outputs as { quantiles?: number[][][][] };
    if (outputs.quantiles) {
      console.log("\nRaw quantiles output (4D):");
      console.log(JSON.stringify(outputs.quantiles, null, 2));

      // Squeeze the output to remove singleton dimensions
      const squeezedQuantiles = squeeze(outputs.quantiles);
      console.log("\nSqueezed quantiles:");
      console.log(JSON.stringify(squeezedQuantiles, null, 2));
    }
  } else {
    console.log(`✗ ${result.error.error_code}: ${result.error.message}`);
  }
}

main().catch(console.error);
