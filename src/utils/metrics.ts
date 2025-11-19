/**
 * Calculates Mean Absolute Error between predicted and true values.
 *
 * MAE = mean(|y_true - y_pred|) across all dimensions
 *
 * Note: Expects y_true and y_pred to have equal shapes. An error is thrown if shapes differ.
 *
 * @param yTrue - Ground truth values (shape: batch × sequence × features)
 * @param yPred - Predicted values (shape: batch × sequence × features)
 * @returns Single scalar MAE value
 * @throws Error if arrays have different shapes
 *
 * @example
 * MAE([[[1], [2]]], [[[1.1], [2.1]]]) // ≈ 0.1
 */
export function MAE(yTrue: number[][][], yPred: number[][][]): number {
  // Validate shapes match
  const shapesMatch = isShapeEqual(yTrue, yPred);
  if (!shapesMatch) {
    throw new Error(
      `Shape mismatch: y_true and y_pred must have equal shapes. ` +
      `Got y_true shape ${JSON.stringify(getShape(yTrue))} and y_pred shape ${JSON.stringify(getShape(yPred))}`
    );
  }

  let sumAbsError = 0;
  let count = 0;

  flattenAndCompute(yTrue, yPred, (t, p) => {
    sumAbsError += Math.abs(t - p);
    count++;
  });

  return count > 0 ? sumAbsError / count : 0;
}

/**
 * Calculates Mean Squared Error between predicted and true values.
 *
 * MSE = mean((y_true - y_pred)^2) across all dimensions
 *
 * Note: Expects y_true and y_pred to have equal shapes. An error is thrown if shapes differ.
 *
 * @param yTrue - Ground truth values (shape: batch × sequence × features)
 * @param yPred - Predicted values (shape: batch × sequence × features)
 * @returns Single scalar MSE value
 * @throws Error if arrays have different shapes
 *
 * @example
 * MSE([[[1], [2]]], [[[1.1], [2.1]]]) // ≈ 0.01
 */
export function MSE(yTrue: number[][][], yPred: number[][][]): number {
  // Validate shapes match
  const shapesMatch = isShapeEqual(yTrue, yPred);
  if (!shapesMatch) {
    throw new Error(
      `Shape mismatch: y_true and y_pred must have equal shapes. ` +
      `Got y_true shape ${JSON.stringify(getShape(yTrue))} and y_pred shape ${JSON.stringify(getShape(yPred))}`
    );
  }

  let sumSquaredError = 0;
  let count = 0;

  flattenAndCompute(yTrue, yPred, (t, p) => {
    const error = t - p;
    sumSquaredError += error * error;
    count++;
  });

  return count > 0 ? sumSquaredError / count : 0;
}

/**
 * Internal helper: flattens nested arrays and applies a computation function to corresponding elements.
 */
function flattenAndCompute(
  a: any,
  b: any,
  fn: (aVal: number, bVal: number) => void
): void {
  if (typeof a === "number" && typeof b === "number") {
    fn(a, b);
  } else if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < a.length; i++) {
      flattenAndCompute(a[i], b[i], fn);
    }
  }
}

/**
 * Internal helper: returns the shape of an array.
 */
function getShape(array: any): number[] {
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
 * Internal helper: checks if two arrays have equal shapes.
 */
function isShapeEqual(a: any, b: any): boolean {
  const shapeA = getShape(a);
  const shapeB = getShape(b);

  if (shapeA.length !== shapeB.length) {
    return false;
  }

  return shapeA.every((dim, idx) => dim === shapeB[idx]);
}