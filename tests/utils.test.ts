import { describe, it, expect } from "vitest";
import { getShape, expandTo3D, squeeze, MAE, MSE, validateInput3D } from "../src/utils";

describe("Array Utilities", () => {
  describe("getShape()", () => {
    it("should return shape of 1D array", () => {
      expect(getShape([1, 2, 3])).toEqual([3]);
    });

    it("should return shape of 2D array", () => {
      expect(getShape([[1, 2], [3, 4]])).toEqual([2, 2]);
    });

    it("should return shape of 3D array", () => {
      expect(getShape([[[1], [2]], [[3], [4]]])).toEqual([2, 2, 1]);
    });

    it("should return shape of 4D array", () => {
      expect(getShape([[[[1, 2]]], [[[3, 4]]]])).toEqual([2, 1, 1, 2]);
    });

    it("should return empty array for empty input", () => {
      expect(getShape([])).toEqual([]);
    });

    it("should return empty array for non-array input", () => {
      expect(getShape("not-an-array")).toEqual([]);
      expect(getShape(42)).toEqual([]);
      expect(getShape(null)).toEqual([]);
    });

    it("should handle irregular arrays", () => {
      // Returns shape of first path
      expect(getShape([[1, 2, 3], [4, 5]])).toEqual([2, 3]);
    });
  });

  describe("expandTo3D()", () => {
    describe("1D arrays", () => {
      it("should expand 1D to 3D with shape [1, n, 1]", () => {
        const result = expandTo3D([1, 2, 3]);
        expect(result).toEqual([[[1], [2], [3]]]);
        expect(getShape(result)).toEqual([1, 3, 1]);
      });

      it("should handle single element 1D array", () => {
        const result = expandTo3D([42]);
        expect(result).toEqual([[[42]]]);
      });

      it("should handle larger 1D array", () => {
        const result = expandTo3D([1, 2, 3, 4, 5]);
        expect(result).toEqual([[[1], [2], [3], [4], [5]]]);
        expect(getShape(result)).toEqual([1, 5, 1]);
      });
    });

    describe("2D arrays with multivariate=true", () => {
      it("should expand [n, f] to [[[f1, f2, ..., fn]], ...] with shape [1, n, f]", () => {
        const result = expandTo3D(
          [
            [1, 2],
            [3, 4],
          ],
          true
        );
        expect(result).toEqual([
          [
            [1, 2],
            [3, 4],
          ],
        ]);
        expect(getShape(result)).toEqual([1, 2, 2]);
      });

      it("should handle single feature multivariate", () => {
        const result = expandTo3D([[1], [2], [3]], true);
        expect(result).toEqual([[[1], [2], [3]]]);
        expect(getShape(result)).toEqual([1, 3, 1]);
      });

      it("should handle multiple features", () => {
        const result = expandTo3D(
          [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
          ],
          true
        );
        expect(getShape(result)).toEqual([1, 3, 3]);
      });
    });

    describe("2D arrays with multivariate=false (default)", () => {
      it("should treat first dimension as batch, second as sequence with 1 feature", () => {
        const result = expandTo3D(
          [
            [1, 2, 3],
            [4, 5, 6],
          ],
          false
        );
        expect(result).toEqual([
          [[1], [2], [3]],
          [[4], [5], [6]],
        ]);
        expect(getShape(result)).toEqual([2, 3, 1]);
      });

      it("should default to multivariate=false", () => {
        const result = expandTo3D([[1, 2], [3, 4]]);
        expect(result).toEqual([[[1], [2]], [[3], [4]]]);
        expect(getShape(result)).toEqual([2, 2, 1]);
      });
    });

    describe("3D arrays", () => {
      it("should pass through 3D arrays unchanged", () => {
        const input = [[[1, 2], [3, 4]]];
        const result = expandTo3D(input);
        expect(result).toEqual(input);
      });
    });

    it("should throw error for unsupported dimensions", () => {
      expect(() => expandTo3D(42 as any)).toThrow("Unsupported input dimensions");
    });
  });

  describe("squeeze()", () => {
    describe("1D arrays", () => {
      it("should pass through 1D array unchanged", () => {
        const input = [1, 2, 3];
        expect(squeeze(input)).toEqual(input);
      });
    });

    describe("2D arrays", () => {
      it("should squeeze [1, n] to [n]", () => {
        expect(squeeze([[1, 2, 3]])).toEqual([1, 2, 3]);
      });

      it("should squeeze [n, 1] to [n, 1] (inner dim not squeezed at 2D level)", () => {
        expect(squeeze([[1], [2], [3]])).toEqual([[1], [2], [3]]);
      });

      it("should pass through [n, m] where both > 1", () => {
        const input = [
          [1, 2],
          [3, 4],
        ];
        expect(squeeze(input)).toEqual(input);
      });
    });

    describe("3D arrays", () => {
      it("should squeeze [1, n, 1] to [n, 1] then [n] requires 4D input", () => {
        // [[[1], [2], [3]]] has shape [1, 3, 1]
        // Squeeze removes first singleton dim, leaving [[1], [2], [3]] with shape [3, 1]
        expect(squeeze([[[1], [2], [3]]])).toEqual([[1], [2], [3]]);
      });

      it("should squeeze [1, n, f] to [n, f]", () => {
        const input = [
          [
            [1, 2],
            [3, 4],
          ],
        ];
        expect(squeeze(input)).toEqual([
          [1, 2],
          [3, 4],
        ]);
      });

      it("should squeeze [b, 1, f] to [b, f]", () => {
        const input = [
          [[1, 2]],
          [[3, 4]],
        ];
        expect(squeeze(input)).toEqual([
          [1, 2],
          [3, 4],
        ]);
      });

      it("should pass through [b, n, f] where all > 1", () => {
        const input = [
          [
            [1, 2],
            [3, 4],
          ],
          [
            [5, 6],
            [7, 8],
          ],
        ];
        expect(squeeze(input)).toEqual(input);
      });
    });

    describe("4D arrays (quantiles output)", () => {
      it("should squeeze quantiles output [1, horizon, quantiles, 1]", () => {
        const input = [[[[1]], [[2]], [[3]]]];
        expect(squeeze(input)).toEqual([[1], [2], [3]]);
      });

      it("should squeeze [1, horizon, quantiles, f] to [horizon, quantiles, f]", () => {
        // Input shape [1, 2, 2, 2] -> squeeze first dim -> [2, 2, 2]
        const input = [[[[1, 2]], [[3, 4]]]];
        const expected = [
          [1, 2],
          [3, 4],
        ];
        expect(squeeze(input)).toEqual(expected);
      });

      it("should squeeze [batch, horizon, 1, features] to [batch, horizon, features]", () => {
        const input = [
          [[[1, 2]], [[3, 4]]],
          [[[5, 6]], [[7, 8]]],
        ];
        const expected = [
          [
            [1, 2],
            [3, 4],
          ],
          [
            [5, 6],
            [7, 8],
          ],
        ];
        expect(squeeze(input)).toEqual(expected);
      });

      it("should squeeze 4D arrays with inner singleton dims", () => {
        // [2, 1, 2, 2] -> squeeze removes dimension with size 1
        const input = [
          [
            [[1, 2], [3, 4]],
            [[5, 6], [7, 8]],
          ],
          [
            [[9, 10], [11, 12]],
            [[13, 14], [15, 16]],
          ],
        ];
        expect(squeeze(input)).toEqual(input);
      });
    });

    it("should handle empty arrays", () => {
      expect(squeeze([])).toEqual([]);
      expect(squeeze([[]])).toEqual([]);
    });
  });

  describe("Metrics - MAE", () => {
    it("should return 0 for identical arrays", () => {
      const arr = [[[1], [2], [3]]];
      expect(MAE(arr, arr)).toBe(0);
    });

    it("should calculate MAE correctly", () => {
      const yTrue = [[[1], [2], [3]]];
      const yPred = [[[1.5], [2.5], [3.5]]];
      expect(MAE(yTrue, yPred)).toBe(0.5);
    });

    it("should handle multiple batches", () => {
      const yTrue = [
        [[1], [2]],
        [[3], [4]],
      ];
      const yPred = [
        [[2], [2]],
        [[4], [4]],
      ];
      expect(MAE(yTrue, yPred)).toBe(0.5);
    });

    it("should handle multiple features", () => {
      const yTrue = [[[1, 2], [3, 4]]];
      const yPred = [[[2, 2], [4, 4]]];
      // Differences: |1-2|=1, |2-2|=0, |3-4|=1, |4-4|=0. MAE = (1+0+1+0)/4 = 0.5
      expect(MAE(yTrue, yPred)).toBe(0.5);
    });

    it("should handle large differences", () => {
      const yTrue = [[[0]]];
      const yPred = [[[10]]];
      expect(MAE(yTrue, yPred)).toBe(10);
    });

    it("should throw error for shape mismatch", () => {
      const arr1 = [[[1], [2]]];
      const arr2 = [[[1], [2], [3]]];
      expect(() => MAE(arr1, arr2)).toThrow(/Shape mismatch/);
    });

    it("should throw error for different batch sizes", () => {
      const arr1 = [[[1]]];
      const arr2 = [[[1]], [[2]]];
      expect(() => MAE(arr1, arr2)).toThrow(/Shape mismatch/);
    });
  });

  describe("Metrics - MSE", () => {
    it("should return 0 for identical arrays", () => {
      const arr = [[[1], [2], [3]]];
      expect(MSE(arr, arr)).toBe(0);
    });

    it("should calculate MSE correctly", () => {
      const yTrue = [[[1], [2]]];
      const yPred = [[[2], [4]]];
      // MSE = (1 + 4) / 2 = 2.5
      expect(MSE(yTrue, yPred)).toBe(2.5);
    });

    it("should square the errors", () => {
      const yTrue = [[[1], [1]]];
      const yPred = [[[2], [3]]];
      // MSE = (1 + 4) / 2 = 2.5
      expect(MSE(yTrue, yPred)).toBe(2.5);
    });

    it("should handle multiple batches", () => {
      const yTrue = [
        [[0], [0]],
        [[0], [0]],
      ];
      const yPred = [
        [[1], [1]],
        [[1], [1]],
      ];
      expect(MSE(yTrue, yPred)).toBe(1);
    });

    it("should handle multiple features", () => {
      const yTrue = [[[0, 0], [0, 0]]];
      const yPred = [[[2, 2], [2, 2]]];
      expect(MSE(yTrue, yPred)).toBe(4);
    });

    it("should throw error for shape mismatch", () => {
      const arr1 = [[[1], [2]]];
      const arr2 = [[[1], [2], [3]]];
      expect(() => MSE(arr1, arr2)).toThrow(/Shape mismatch/);
    });
  });
});

describe("Validation", () => {
  describe("validateInput3D()", () => {
    it("should accept valid 3D array", () => {
      expect(() => validateInput3D([[[1], [2], [3]]])).not.toThrow();
    });

    it("should accept multiple batches", () => {
      expect(() =>
        validateInput3D([
          [[1], [2]],
          [[3], [4]],
        ])
      ).not.toThrow();
    });

    it("should accept multiple features", () => {
      expect(() => validateInput3D([[[1, 2, 3], [4, 5, 6]]])).not.toThrow();
    });

    it("should reject non-array input", () => {
      expect(() => validateInput3D("not-an-array")).toThrow(/Input x must be a 3D array/);
    });

    it("should reject 1D array", () => {
      expect(() => validateInput3D([1, 2, 3])).toThrow(/Input x must be a 3D array/);
    });

    it("should reject 2D array", () => {
      expect(() => validateInput3D([[1, 2], [3, 4]])).toThrow(/Input x must be a 3D array/);
    });

    it("should reject empty batch", () => {
      expect(() => validateInput3D([])).toThrow(/Batch size cannot be empty/);
    });

    it("should reject empty sequence", () => {
      expect(() => validateInput3D([[]])).toThrow(/Sequence length cannot be empty/);
    });

    it("should include helpful transformation example in error", () => {
      expect(() => validateInput3D([[1, 2, 3]])).toThrow(
        /\[\[\[1\], \[2\], \[3\], \[4\], \[5\]\]\]/
      );
    });
  });
});