# @faim-group/sdk-forecasting

Modern zero-shot time-series forecasting with advanced neural networks. Get accurate predictions without historical tuning or complex setup.

## Features

- **Zero-Shot Forecasting** - Works out-of-the-box without model training
- **Advanced Models** - Chronos2 and TiRex for different scenarios
- **Point & Quantile Forecasts** - Get predictions and uncertainty estimates
- **Type-Safe** - Full TypeScript support with strict type checking
- **Production-Ready** - Zero external dependencies, optimized for performance
- **Automatic Retries** - Built-in exponential backoff for reliability

## Installation

Install the package using your preferred package manager:

```bash
# npm
npm install @faim-group/sdk-forecasting

# pnpm
pnpm add @faim-group/sdk-forecasting

# yarn
yarn add @faim-group/sdk-forecasting
```

### Version

Latest version: **0.1.0**

```bash
# Install specific version
npm install @faim-group/sdk-forecasting@0.1.0
```

## Quick Start

### 1. Get an API Key

Visit [faim.it.com](https://faim.it.com) to sign up and get your API key.

### 2. Set Environment Variable

```bash
export FAIM_API_KEY="your_api_key_here"
```

### 3. Basic Usage

```typescript
import { FaimClient } from "@faim-group/sdk-forecasting";

const client = new FaimClient(process.env.FAIM_API_KEY!);

const result = await client.forecastChronos2({
  x: [[[1], [2], [3], [4], [5]]],
  horizon: 10,
  output_type: "point",
});

if (result.success) {
  console.log("Forecasts:", result.data.outputs.point);
} else {
  console.error("Error:", result.error.message);
}
```

## Models

### Chronos2
State-of-the-art for diverse time series. Supports custom quantiles.

```typescript
await client.forecastChronos2({
  x: data,
  horizon: 10,
  output_type: "quantiles",
  quantiles: [0.1, 0.5, 0.9], // Optional (default: [0.1, 0.2, ..., 0.9])
});
```

### TiRex
Specialized for irregular or sparse time series.

```typescript
await client.forecastTiRex({
  x: data,
  horizon: 10,
  output_type: "point",
});
```

## Input/Output Shapes

### Input Format: 3D Array

All models expect: `x: number[][][]` with shape `[batch_size, sequence_length, num_features]`

```typescript
// Example: 1 sequence, 5 timesteps, 1 feature
const x = [[[1], [2], [3], [4], [5]]];

// Example: 2 sequences, 3 timesteps, 2 features
const x = [
  [[1, 2], [3, 4], [5, 6]],
  [[7, 8], [9, 10], [11, 12]]
];
```

### Output Format

**Point Forecasts** (`output_type: "point"`):
```typescript
outputs.point: number[][][] // [batch_size, horizon, num_features]
```

**Quantile Forecasts** (`output_type: "quantiles"`):
```typescript
outputs.quantiles: number[][][][] // [batch_size, horizon, num_quantiles, num_features]
```

## Error Handling

```typescript
const result = await client.forecastChronos2({ x, horizon: 10, output_type: "point" });

if (result.success) {
  console.log(result.data.outputs);
} else {
  console.error(result.error.error_code, result.error.message);
}
```

### Error Type Checking

```typescript
import { isAuthError, isValidationError, isTimeoutError } from "@faim-group/sdk-forecasting";

if (!result.success) {
  if (isAuthError(result.error)) {
    console.error("Invalid API key");
  } else if (isValidationError(result.error)) {
    console.error("Invalid input");
  } else if (isTimeoutError(result.error)) {
    console.error("Request timed out - reduce batch size");
  }
}
```

## Configuration

```typescript
const client = new FaimClient(apiKey, {
  baseUrl: "https://api.faim.it.com", // Default
  timeout: 30000, // 30 seconds
  maxRetries: 2, // Automatic exponential backoff
});
```

## Examples

### Using Examples from npm Package

The best way to learn how to use the SDK is by looking at the examples. You can either:

**Option 1: Install the npm package and run examples locally**

```bash
# Install the package
npm install @faim-group/sdk-forecasting

# Clone the repository to access examples
git clone https://github.com/S-FM/faim-js-client
cd faim-js-client

# Set your API key
export FAIM_API_KEY="your_api_key_here"

# Run an example
pnpm install
pnpm tsx examples/basic_forecast/chronos2.ts
```

**Option 2: View examples in the repository**

Visit the [GitHub repository](https://github.com/S-FM/faim-js-client) to browse the examples without cloning.

### Running Example Scripts Locally

To run example scripts from this repository, use the `pnpm tsx` command:

```bash
pnpm tsx examples/<filename>.ts
```

Make sure you have `FAIM_API_KEY` set as an environment variable:

```bash
export FAIM_API_KEY="your_api_key_here"
```

### Available Examples

**Basic Point Forecasts:**
```bash
pnpm tsx examples/basic_forecast/chronos2.ts
pnpm tsx examples/basic_forecast/tirex.ts
```

**Quantile Forecasts:**
```bash
pnpm tsx examples/quantiles_forecast/chronos2.ts
pnpm tsx examples/quantiles_forecast/tirex.ts
```

**Comprehensive Example (Air Passengers Dataset):**
```bash
pnpm tsx examples/air_passengers.ts
```

The Air Passengers example demonstrates:
- Real-world dataset download from GitHub
- Point forecasting with both Chronos2 and TiRex models
- Probabilistic forecasting with confidence intervals (90% bounds)
- Metric calculation (MAE, MSE)
- Formatted table output with predictions and confidence intervals

## License

MIT

## Support

For detailed API reference, see `CLIENT_API_GUIDE.md`.
