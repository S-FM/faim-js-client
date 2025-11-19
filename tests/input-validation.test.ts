import { describe, it, expect } from "vitest";
import { FaimClient } from "../src/index";

describe("Input Validation - 3D Array Check", () => {
  const client = new FaimClient("test-key");

  describe("Chronos2 - forecastChronos2()", () => {
    it("should reject 1D array input", async () => {
      await expect(
        client.forecastChronos2({
          x: [1, 2, 3, 4, 5] as any,
          horizon: 10,
          output_type: "point",
        })
      ).rejects.toThrow(/Input x must be a 3D array/);
    });

    it("should reject 2D array input", async () => {
      await expect(
        client.forecastChronos2({
          x: [[1, 2, 3, 4, 5]],
          horizon: 10,
          output_type: "point",
        })
      ).rejects.toThrow(/Input x must be a 3D array/);
    });

    it("should reject non-array input", async () => {
      await expect(
        client.forecastChronos2({
          x: "not-an-array" as any,
          horizon: 10,
          output_type: "point",
        })
      ).rejects.toThrow(/Input x must be a 3D array/);
    });

    it("should reject empty batch array", async () => {
      await expect(
        client.forecastChronos2({
          x: [],
          horizon: 10,
          output_type: "point",
        })
      ).rejects.toThrow(/Batch size cannot be empty/);
    });

    it("should reject empty sequence", async () => {
      await expect(
        client.forecastChronos2({
          x: [[]],
          horizon: 10,
          output_type: "point",
        })
      ).rejects.toThrow(/Sequence length cannot be empty/);
    });

    it("should accept correct 3D array format", async () => {
      // This will throw on API call but validation should pass
      try {
        await client.forecastChronos2({
          x: [[[1], [2], [3], [4], [5]]],
          horizon: 10,
          output_type: "point",
        });
      } catch (e) {
        const msg = (e as Error).message;
        // Should not be a validation error
        expect(msg).not.toMatch(/Input x must be a 3D array/);
      }
    });

    it("should accept multiple batches (3D array)", async () => {
      try {
        await client.forecastChronos2({
          x: [
            [[1], [2], [3]],
            [[4], [5], [6]],
          ],
          horizon: 5,
          output_type: "point",
        });
      } catch (e) {
        const msg = (e as Error).message;
        expect(msg).not.toMatch(/Input x must be a 3D array/);
      }
    });

    it("should accept multiple features (3D array)", async () => {
      try {
        await client.forecastChronos2({
          x: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]]],
          horizon: 5,
          output_type: "point",
        });
      } catch (e) {
        const msg = (e as Error).message;
        expect(msg).not.toMatch(/Input x must be a 3D array/);
      }
    });
  });

  describe("TiRex - forecastTiRex()", () => {
    it("should reject 1D array input", async () => {
      await expect(
        client.forecastTiRex({
          x: [1, 2, 3, 4, 5] as any,
          horizon: 10,
          output_type: "point",
        })
      ).rejects.toThrow(/Input x must be a 3D array/);
    });

    it("should reject 2D array input", async () => {
      await expect(
        client.forecastTiRex({
          x: [[1, 2, 3, 4, 5]],
          horizon: 10,
          output_type: "point",
        })
      ).rejects.toThrow(/Input x must be a 3D array/);
    });

    it("should reject non-array input", async () => {
      await expect(
        client.forecastTiRex({
          x: { data: [1, 2, 3] } as any,
          horizon: 10,
          output_type: "point",
        })
      ).rejects.toThrow(/Input x must be a 3D array/);
    });

    it("should reject empty batch array", async () => {
      await expect(
        client.forecastTiRex({
          x: [],
          horizon: 10,
          output_type: "point",
        })
      ).rejects.toThrow(/Batch size cannot be empty/);
    });

    it("should accept correct 3D array format", async () => {
      try {
        await client.forecastTiRex({
          x: [[[1], [2], [3], [4], [5]]],
          horizon: 10,
          output_type: "point",
        });
      } catch (e) {
        const msg = (e as Error).message;
        expect(msg).not.toMatch(/Input x must be a 3D array/);
      }
    });
  });

  describe("Error Messages - Helpful Guidance", () => {
    it("should include transformation example in error message", async () => {
      await expect(
        client.forecastChronos2({
          x: [[1, 2, 3, 4, 5]],
          horizon: 10,
          output_type: "point",
        })
      ).rejects.toThrow(/\[\[\[1\], \[2\], \[3\], \[4\], \[5\]\]\]/);
    });

    it("should mention shape (batch_size, context_length, num_features)", async () => {
      await expect(
        client.forecastChronos2({
          x: "invalid" as any,
          horizon: 10,
          output_type: "point",
        })
      ).rejects.toThrow(/batch_size.*context_length.*num_features/);
    });
  });
});