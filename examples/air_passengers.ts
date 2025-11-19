/**
 * Comprehensive Air Passengers Forecasting Example
 *
 * Demonstrates:
 * - Point forecasting with both Chronos2 and TiRex models
 * - Probabilistic forecasting with quantile outputs
 * - Confidence interval extraction and visualization
 * - MAE and MSE metric calculation
 * - ASCII chart visualization (requires asciichart to be installed)
 *
 * Data: Classic Air Passengers dataset (1949-1960, 144 monthly observations)
 * Test/Forecast: Last 12 months
 * Context: Last 2048 points before test set (non-overlapping)
 */

import { FaimClient, expandTo3D, squeeze, MAE, MSE } from "@faim-group/sdk-forecasting";

const CSV_URL =
  "https://raw.githubusercontent.com/AileenNielsen/TimeSeriesAnalysisWithPython/master/data/AirPassengers.csv";

const HORIZON = 12; // Forecast and test set: 12 months
const CONTEXT_SIZE = 2048; // Context: last 2048 points before test
const VISUALIZATION_POINTS = 36; // Show last 36 training points

// ========== HELPER FUNCTIONS ==========

/**
 * Downloads CSV from URL and parses it into a data structure.
 * Expects CSV format: Date,Value
 */
async function downloadAndParseCSV(
  url: string
): Promise<{ dates: string[]; values: number[] }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();
    const dates: string[] = [];
    const values: number[] = [];

    // Try parsing as standard CSV with newlines
    let lines = csvText.trim().split("\n");

    if (lines.length === 1) {
      // Handle malformed CSV: data concatenated without newlines
      const content = csvText.trim();

      // Remove header (Month,#Passengers or similar)
      const headerMatch = content.match(/^[^,]+,[^,]+/);
      const dataString = headerMatch ? content.slice(headerMatch[0].length) : content;

      // Parse date-value pairs
      // Dates are typically YYYY-MM format, values are numbers
      const pairRegex = /(\d{4}-\d{2}),(\d+)/g;
      let match;
      while ((match = pairRegex.exec(dataString)) !== null) {
        const date = match[1] ?? "";
        const valueStr = match[2] ?? "";
        if (!date || !valueStr) continue;
        dates.push(date);
        const value = parseFloat(valueStr);
        if (!isNaN(value)) {
          values.push(value);
        }
      }
    } else {
      // Standard CSV parsing with newlines
      const dataLines = lines.slice(1);
      for (const line of dataLines) {
        const parts = line.split(",");
        const date = parts[0] ?? "";
        const valueStr = parts[1] ?? "";
        if (!date || !valueStr) continue;
        const value = parseFloat(valueStr);

        if (!isNaN(value)) {
          dates.push(date.trim());
          values.push(value);
        }
      }
    }

    return { dates, values };
  } catch (error) {
    throw new Error(`Failed to download/parse CSV: ${error}`);
  }
}

/**
 * Extracts quantile values from quantile forecast output.
 * Assumes default quantiles structure from backend.
 */
function extractConfidenceIntervals(
  quantiles: number[][][][],
  horizonIndex: number = 0
): { median: number; lower: number; upper: number } {
  // Get first batch
  const batchQuantiles = quantiles[0];
  if (!batchQuantiles || !batchQuantiles[horizonIndex]) {
    throw new Error(
      `Invalid horizon index ${horizonIndex} for quantiles shape`
    );
  }

  const horizonQuantiles = batchQuantiles[horizonIndex];
  if (!horizonQuantiles || horizonQuantiles.length === 0) {
    throw new Error(`Invalid horizon quantiles at index ${horizonIndex}`);
  }

  // Assume quantiles are sorted: [0.1, 0.25, 0.5, 0.75, 0.9] or similar
  // Median (0.5) is typically at index 2 for default quantiles
  // Lower CI (0.1) at index 0, Upper CI (0.9) at index 4
  const medianIdx = Math.floor(horizonQuantiles.length / 2);
  const medianQuantile = horizonQuantiles[medianIdx];
  const lowerQuantile = horizonQuantiles[0];
  const upperQuantile = horizonQuantiles[horizonQuantiles.length - 1];

  if (!medianQuantile || !lowerQuantile || !upperQuantile) {
    throw new Error(`Invalid quantile values at horizon ${horizonIndex}`);
  }

  const median = medianQuantile[0] ?? 0; // feature index 0
  const lower = lowerQuantile[0] ?? 0; // lowest quantile
  const upper = upperQuantile[0] ?? 0; // highest quantile

  return { median, lower, upper };
}

/**
 * Formats and displays metrics in a table.
 */
function displayMetrics(metrics: Record<string, number>): void {
  console.log("=== METRICS ===");
  const maxKeyLength = Math.max(...Object.keys(metrics).map((k) => k.length));

  Object.entries(metrics).forEach(([key, value]) => {
    const paddedKey = key.padEnd(maxKeyLength);
    console.log(`${paddedKey}: ${value.toFixed(4)}`);
  });
}

async function main() {
  try {
    const apiKey = process.env.FAIM_API_KEY;
    if (!apiKey) throw new Error("FAIM_API_KEY environment variable required");

    const client = new FaimClient(apiKey);

    // Download and parse data
    console.log("📥 Downloading Air Passengers dataset...");
    const { dates, values } = await downloadAndParseCSV(CSV_URL);
    console.log(`✓ Loaded ${values.length} observations`);

    // Split data: context + test (non-overlapping)
    const testStart = values.length - HORIZON;
    const contextEnd = testStart; // Context ends where test begins
    const contextStart = Math.max(0, contextEnd - CONTEXT_SIZE);

    const contextData = values.slice(contextStart, contextEnd);
    const testData = values.slice(testStart);

    console.log(`\nData Split:`);
    console.log(`  Context window: ${contextData.length} points (last 2048 before test)`);
    console.log(`  Test set: ${testData.length} points (last 12)`);
    console.log(`  Total: ${values.length} observations`);

    // Expand context to 3D format
    const contextX = expandTo3D(contextData);
    const testTarget: number[][][] = [testData.map((v) => [v])];

    // Get visualization data (last 36 training points + test)
    const vizStart = Math.max(0, contextEnd - VISUALIZATION_POINTS);
    const vizData = values.slice(vizStart, contextEnd);

    console.log(
      `\n📊 Visualization: Last ${vizData.length} training points + ${HORIZON} forecast points\n`
    );

    // ========== POINT FORECASTS ==========
    console.log("🔮 === POINT FORECASTS ===");

    // Chronos2 Point Forecast
    console.log("\n⏳ Chronos2 (point forecast)...");
    const chronos2Result = await client.forecastChronos2({
      x: contextX,
      horizon: HORIZON,
      output_type: "point",
    });

    let chronos2Forecast: number[][][] = [[[0]]];
    let chronos2MAE = 0;
    let chronos2MSE = 0;

    if (chronos2Result.success) {
      const outputs = chronos2Result.data.outputs as { point?: number[][][] };
      if (outputs.point) {
        chronos2Forecast = outputs.point;
        chronos2MAE = MAE(testTarget, chronos2Forecast);
        chronos2MSE = MSE(testTarget, chronos2Forecast);
        console.log("✓ Chronos2 forecast complete");
      }
    } else {
      console.log(
        `✗ Chronos2 failed: ${chronos2Result.error.error_code}`
      );
    }

    // TiRex Point Forecast
    console.log("⏳ TiRex (point forecast)...");
    const tirexResult = await client.forecastTiRex({
      x: contextX,
      horizon: HORIZON,
      output_type: "point",
    });

    let tirexForecast: number[][][] = [[[0]]];
    let tirexMAE = 0;
    let tirexMSE = 0;

    if (tirexResult.success) {
      const outputs = tirexResult.data.outputs as { point?: number[][][] };
      if (outputs.point) {
        tirexForecast = outputs.point;
        tirexMAE = MAE(testTarget, tirexForecast);
        tirexMSE = MSE(testTarget, tirexForecast);
        console.log("✓ TiRex forecast complete");
      }
    } else {
      console.log(`✗ TiRex failed: ${tirexResult.error.error_code}`);
    }

    // ========== PROBABILISTIC FORECASTS ==========
    console.log("\n🎲 === PROBABILISTIC FORECASTS (QUANTILES) ===");

    // Chronos2 Quantiles
    console.log("\n⏳ Chronos2 (quantiles)...");
    const chronos2QuantResult = await client.forecastChronos2({
      x: contextX,
      horizon: HORIZON,
      output_type: "quantiles",
    });

    let chronos2Quantiles: number[][][][] = [[[[[0]]]]];
    let chronos2CI: { median: number[]; lower: number[]; upper: number[] } = {
      median: [],
      lower: [],
      upper: [],
    };

    if (chronos2QuantResult.success) {
      const outputs = chronos2QuantResult.data.outputs as {
        quantiles?: number[][][][];
      };
      if (outputs.quantiles) {
        chronos2Quantiles = outputs.quantiles;
        // Extract confidence intervals for each horizon step
        chronos2CI = {
          median: [],
          lower: [],
          upper: [],
        };
        for (let h = 0; h < HORIZON; h++) {
          const ci = extractConfidenceIntervals(chronos2Quantiles, h);
          chronos2CI.median.push(ci.median);
          chronos2CI.lower.push(ci.lower);
          chronos2CI.upper.push(ci.upper);
        }
        console.log("✓ Chronos2 quantiles complete");
      }
    } else {
      console.log(
        `✗ Chronos2 quantiles failed: ${chronos2QuantResult.error.error_code}`
      );
    }

    // TiRex Quantiles
    console.log("⏳ TiRex (quantiles)...");
    const tirexQuantResult = await client.forecastTiRex({
      x: contextX,
      horizon: HORIZON,
      output_type: "quantiles",
    });

    let tirexQuantiles: number[][][][] = [[[[[0]]]]];
    let tirexCI: { median: number[]; lower: number[]; upper: number[] } = {
      median: [],
      lower: [],
      upper: [],
    };

    if (tirexQuantResult.success) {
      const outputs = tirexQuantResult.data.outputs as {
        quantiles?: number[][][][];
      };
      if (outputs.quantiles) {
        tirexQuantiles = outputs.quantiles;
        // Extract confidence intervals
        tirexCI = {
          median: [],
          lower: [],
          upper: [],
        };
        for (let h = 0; h < HORIZON; h++) {
          const ci = extractConfidenceIntervals(tirexQuantiles, h);
          tirexCI.median.push(ci.median);
          tirexCI.lower.push(ci.lower);
          tirexCI.upper.push(ci.upper);
        }
        console.log("✓ TiRex quantiles complete");
      }
    } else {
      console.log(`✗ TiRex quantiles failed: ${tirexQuantResult.error.error_code}`);
    }

    // ========== FORECASTS AND CONFIDENCE INTERVALS ==========
    console.log("\n📊 === POINT FORECASTS & CONFIDENCE INTERVALS (90%) ===\n");

    // Extract forecasts as 1D arrays
    const chronos2ForecastFlat = squeeze(chronos2Forecast) as number[];
    const tirexForecastFlat = squeeze(tirexForecast) as number[];

    // Print table header
    console.log(
      "Month | Ground Truth | Chronos2 Forecast | Chronos2 Lower | Chronos2 Upper | TiRex Forecast | TiRex Lower | TiRex Upper"
    );
    console.log(
      "------|--------------|-------------------|----------------|----------------|----------------|-------------|------------"
    );

    // Print forecasts for each month
    for (let i = 0; i < HORIZON; i++) {
      const month = i + 1;
      const actual = testData[i] ?? 0;

      // Extract scalar values from nested arrays
      let c2Forecast = 0;
      let trForecast = 0;

      const c2Val = chronos2ForecastFlat[i];
      const trVal = tirexForecastFlat[i];

      // Handle both direct numbers and nested arrays
      c2Forecast = typeof c2Val === 'number' ? c2Val : (Array.isArray(c2Val) ? (c2Val[0] as number) ?? 0 : 0);
      trForecast = typeof trVal === 'number' ? trVal : (Array.isArray(trVal) ? (trVal[0] as number) ?? 0 : 0);

      const c2Lower = chronos2CI.lower[i] ?? 0;
      const c2Upper = chronos2CI.upper[i] ?? 0;
      const trLower = tirexCI.lower[i] ?? 0;
      const trUpper = tirexCI.upper[i] ?? 0;

      console.log(
        `  ${month.toString().padStart(2)} | ${actual.toFixed(1).padStart(12)} | ${c2Forecast.toFixed(1).padStart(17)} | ${c2Lower.toFixed(1).padStart(14)} | ${c2Upper.toFixed(1).padStart(14)} | ${trForecast.toFixed(1).padStart(14)} | ${trLower.toFixed(1).padStart(11)} | ${trUpper.toFixed(1).padStart(12)}`
      );
    }

    // ========== METRICS ==========
    console.log("\n📊 === METRICS (POINT FORECASTS) ===");

    displayMetrics({
      "Chronos2 MAE": chronos2MAE,
      "Chronos2 MSE": chronos2MSE,
      "TiRex MAE": tirexMAE,
      "TiRex MSE": tirexMSE,
    });

    console.log("\n✓ Analysis complete!");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();