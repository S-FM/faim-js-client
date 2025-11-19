import { describe, it, expect, beforeAll } from "vitest";
import { FaimClient, isAuthError, isValidationError } from "../src/index";

const API_KEY = process.env.FAIM_API_KEY;
const BASE_URL = process.env.FAIM_BASE_URL || "https://api.faim.it.com";

const shouldRun = !!API_KEY;

if (!shouldRun) {
  console.warn(
    "\n⚠️  FAIM_API_KEY not set. Integration tests will be skipped.\n" +
      "To run integration tests:\n" +
      "  1. Copy .env.example to .env.local\n" +
      "  2. Add your API key: FAIM_API_KEY=sk-...\n" +
      "  3. Run: pnpm test:integration\n",
  );
}

describe.skipIf(!shouldRun)("Integration Tests - Real API Calls", () => {
  let client: FaimClient;

  beforeAll(() => {
    client = new FaimClient(API_KEY!, {
      baseUrl: BASE_URL,
      timeout: 30000,
      maxRetries: 1,
    });
  });

  describe("Chronos2 Model", () => {
    it("should forecast with point output", async () => {
      const x = [[[1], [2], [3], [4], [5]]];

      const result = await client.forecastChronos2({
        x,
        horizon: 10,
        output_type: "point",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.outputs).toHaveProperty("point");
        expect(result.data.metadata.model_name).toBe("chronos2");
      }
    });

    it("should forecast with custom quantiles", async () => {
      const x = [[[1], [2], [3], [4], [5]]];

      const result = await client.forecastChronos2({
        x,
        horizon: 10,
        output_type: "quantiles",
        quantiles: [0.1, 0.5, 0.9],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.outputs).toHaveProperty("quantiles");
        expect(Array.isArray(result.data.outputs.quantiles)).toBe(true);
        // Custom quantiles: [0.1, 0.5, 0.9]
        expect(result.data.outputs.quantiles[0][0]).toHaveLength(3);
      }
    });

    it("should forecast without custom quantiles (uses default)", async () => {
      const x = [[[1], [2], [3], [4], [5]]];

      const result = await client.forecastChronos2({
        x,
        horizon: 5,
        output_type: "quantiles",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.outputs).toHaveProperty("quantiles");
        // Default: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
        expect(result.data.outputs.quantiles[0][0]).toHaveLength(9);
      }
    });

    it("should handle different sequence lengths", async () => {
      const x = [[[1], [2], [3], [4], [5], [6], [7], [8], [9], [10]]];

      const result = await client.forecastChronos2({
        x,
        horizon: 12,
        output_type: "point",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.outputs.point).toBeDefined();
      }
    });
  });

  describe("TiRex Model", () => {
    it("should forecast with point output", async () => {
      const x = [[[1], [2], [3], [4], [5]]];

      const result = await client.forecastTiRex({
        x,
        horizon: 10,
        output_type: "point",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.outputs).toHaveProperty("point");
        expect(result.data.metadata.model_name).toBe("tirex");
      }
    });

    it("should forecast with quantiles output", async () => {
      const x = [[[1], [2], [3], [4], [5]]];

      const result = await client.forecastTiRex({
        x,
        horizon: 10,
        output_type: "quantiles",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.outputs).toHaveProperty("quantiles");
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid API key", async () => {
      const invalidClient = new FaimClient("sk-invalid-key-12345", { baseUrl: BASE_URL });
      const x = [[[1], [2], [3], [4], [5]]];

      const result = await invalidClient.forecastChronos2({
        x,
        horizon: 5,
        output_type: "point",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(isAuthError(result.error)).toBe(true);
        expect(result.error.error_code).toBe("INVALID_API_KEY");
      }
    });

    it("should handle invalid horizon (validation error)", async () => {
      const x = [[[1], [2], [3]]];

      const result = await client.forecastChronos2({
        x,
        horizon: 0, // Invalid: must be > 0
        output_type: "point",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(isValidationError(result.error)).toBe(true);
      }
    });

    it("should handle invalid output_type", async () => {
      const x = [[[1], [2], [3], [4], [5]]];

      const result = await client.forecastChronos2({
        x,
        horizon: 5,
        output_type: "invalid" as any, // Type checker would catch this
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(isValidationError(result.error)).toBe(true);
      }
    });
  });

  describe("Metadata Validation", () => {
    it("should return correct metadata structure", async () => {
      const x = [[[1], [2], [3], [4], [5]]];

      const result = await client.forecastChronos2({
        x,
        horizon: 10,
        output_type: "point",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const metadata = result.data.metadata;
        expect(metadata).toHaveProperty("model_name");
        expect(metadata).toHaveProperty("model_version");
        expect(metadata).toHaveProperty("token_count");
        expect(typeof metadata.model_name).toBe("string");
        expect(typeof metadata.model_version).toBe("string");
        expect(typeof metadata.token_count).toBe("number");
        expect(metadata.token_count).toBeGreaterThan(0);
      }
    });
  });
});
