/**
 * Converts a string from camelCase to snake_case.
 */
function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, (match, p1, offset) =>
    offset > 0 ? `_${match.toLowerCase()}` : match.toLowerCase()
  );
}

/**
 * Converts a string from snake_case to camelCase.
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Recursively converts object keys from camelCase to snake_case.
 * Handles nested objects and arrays while preserving primitive types, Date, Buffer, etc.
 * @param obj - The object to convert.
 * @returns The converted object with snake_case keys.
 */
export function toSnakeCase<T>(obj: unknown): T {
  if (obj === null || typeof obj !== "object") {
    return obj as T;
  }

  if (
    obj instanceof Date ||
    obj instanceof RegExp ||
    (typeof Buffer !== "undefined" && Buffer.isBuffer(obj))
  ) {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => toSnakeCase(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const snakeKey = camelToSnake(key);
    result[snakeKey] = toSnakeCase(value);
  }

  return result as T;
}

/**
 * Recursively converts object keys from snake_case to camelCase.
 * Handles nested objects and arrays while preserving primitive types, Date, Buffer, etc.
 * Skips transformation for user-defined custom properties fields.
 * @param obj - The object to convert.
 * @param parentKey - Internal tracking for nested properties bypass.
 * @returns The converted object with camelCase keys.
 */
export function toCamelCase<T>(obj: unknown, parentKey?: string): T {
  if (obj === null || typeof obj !== "object") {
    return obj as T;
  }

  if (
    obj instanceof Date ||
    obj instanceof RegExp ||
    (typeof Buffer !== "undefined" && Buffer.isBuffer(obj))
  ) {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item, parentKey)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = snakeToCamel(key);
    if (key === "properties" || parentKey === "properties") {
      result[camelKey] = value;
    } else {
      result[camelKey] = toCamelCase(value, key);
    }
  }

  return result as T;
}
