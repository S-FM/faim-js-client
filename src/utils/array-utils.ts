/**
 * Returns the shape of an array as a tuple of dimensions.
 *
 * @param array - The input array (1D, 2D, 3D, or 4D)
 * @returns Array of dimensions, e.g., [batch, sequence, features] for 3D array
 *
 * @example
 * getShape([[[1, 2], [3, 4]]]) // [1, 2, 2]
 * getShape([[1, 2], [3, 4]]) // [2, 2]
 * getShape([1, 2, 3]) // [3]
 */
export function getShape(array: unknown): number[] {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }

  const shape: number[] = [array.length];
  let current = array[0];

  while (Array.isArray(current) && current.length > 0) {
    shape.push(current.length);
    current = current[0];
  }

  return shape;
}

/**
 * Expands 1D or 2D arrays to 3D format required by the API.
 *
 * Transformation rules:
 * - 1D [n] → 3D [[[1], [2], ..., [n]]] (shape: 1×n×1)
 * - 2D [n, f] with multivariate=true → 3D [[[v1, ..., vf], ..., [v1, ..., vf]]] (shape: 1×n×f)
 * - 2D [b, n] with multivariate=false → 3D [[[1], [2], ..., [n]]] (shape: b×n×1, first dim is batch)
 * - 3D arrays are passed through unchanged
 *
 * @param input - 1D, 2D, or 3D array
 * @param multivariate - For 2D input: if true, treats second dim as features; if false, treats first dim as batch
 * @returns 3D array with shape (batch, sequence, features)
 *
 * @example
 * expandTo3D([1, 2, 3]) // [[[1], [2], [3]]]
 * expandTo3D([[1, 2], [3, 4]], true) // [[[1, 2], [3, 4]]]
 * expandTo3D([[1, 2], [3, 4]], false) // [[[1]], [[2]], [[3]], [[4]]]
 */
export function expandTo3D(
  input: number[] | number[][] | number[][][],
  multivariate: boolean = false
): number[][][] {
  const shape = getShape(input);

  // Already 3D, return as-is
  if (shape.length === 3) {
    return input as number[][][];
  }

  // 1D: [n] → [[[1], [2], ..., [n]]]
  if (shape.length === 1) {
    return [(input as number[]).map((val) => [val])];
  }

  // 2D: [rows, cols]
  if (shape.length === 2) {
    const arr2d = input as number[][];
    if (multivariate) {
      // [n, f] → [[[f1, f2, ...], ..., [f1, f2, ...]]] (shape: 1×n×f)
      return [arr2d];
    } else {
      // [b, n] → each row becomes a sequence with 1 feature (shape: b×n×1)
      return arr2d.map((row) => row.map((val) => [val]));
    }
  }

  throw new Error(`Unsupported input dimensions: ${shape.length}D. Expected 1D, 2D, or 3D array.`);
}

/**
 * Removes all dimensions with size 1 from an array (similar to PyTorch squeeze).
 *
 * Useful for converting model outputs back to user-friendly shapes.
 *
 * @param array - Input array of any dimension (1D to 4D)
 * @returns Array with singleton dimensions removed
 *
 * @example
 * squeeze([[[1], [2], [3]]]) // [1, 2, 3]
 * squeeze([[[[1, 2]], [[3, 4]]]]) // [[1, 2], [3, 4]]
 * squeeze([1, 2, 3]) // [1, 2, 3] (no singleton dims)
 * squeeze([[1], [2], [3]]) // [1, 2, 3]
 */
export function squeeze(
  array: number[] | number[][] | number[][][] | number[][][][]
): any {
  if (!Array.isArray(array)) {
    return array;
  }

  // Base case: if it's not an array of arrays, return as-is (1D array)
  if (array.length === 0 || !Array.isArray(array[0])) {
    return array;
  }

  // If this dimension has size 1, squeeze it out and recurse
  if (array.length === 1) {
    return squeeze(array[0] as any);
  }

  // This dimension is not singleton
  // Check if all inner arrays have singleton dimensions that need squeezing
  const firstInner = array[0];
  if (
    Array.isArray(firstInner) &&
    firstInner.length === 1 &&
    Array.isArray(firstInner[0])
  ) {
    // All inner arrays have size 1 in their first dimension, squeeze them
    return (array as any[]).map((elem) => squeeze(elem));
  }

  // Check if all inner arrays are scalar numbers (no more squeezing possible)
  if (!Array.isArray(firstInner)) {
    return array;
  }

  // Recursively squeeze inner dimensions
  return (array as any[]).map((elem) => squeeze(elem));
}