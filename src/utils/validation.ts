/**
 * Validates that input is a 3D array with required structure.
 *
 * Expected shape: (batch_size, context_length, num_features)
 *
 * @param x - The input to validate
 * @throws Error if input is not a valid 3D array
 */
export function validateInput3D(x: unknown): void {
  if (!Array.isArray(x)) {
    throw new Error(
      "Input x must be a 3D array with shape (batch_size, context_length, num_features). " +
      "Expected array but got " + typeof x
    );
  }

  if (x.length === 0) {
    throw new Error(
      "Input x must be a 3D array with shape (batch_size, context_length, num_features). " +
      "Batch size cannot be empty."
    );
  }

  if (!Array.isArray(x[0])) {
    throw new Error(
      "Input x must be a 3D array with shape (batch_size, context_length, num_features). " +
      "Example: For a single time-series [1, 2, 3, 4, 5], transform to [[[1], [2], [3], [4], [5]]]"
    );
  }

  if (x[0].length === 0) {
    throw new Error(
      "Input x must be a 3D array with shape (batch_size, context_length, num_features). " +
      "Sequence length cannot be empty."
    );
  }

  if (!Array.isArray(x[0][0])) {
    throw new Error(
      "Input x must be a 3D array with shape (batch_size, context_length, num_features). " +
      "Example: For a single time-series [1, 2, 3, 4, 5], transform to [[[1], [2], [3], [4], [5]]]"
    );
  }
}