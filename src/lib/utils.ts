/**
 * Field names whose value is an arbitrary user- or server-defined key/value bag
 * (e.g. SIP header names, webhook payload data) that must bypass case-conversion.
 * Both toSnakeCase and toCamelCase check this list to avoid mangling keys in these fields.
 */
const OPAQUE_FIELDS = new Set(["properties", "customHeaders", "payload"]);

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
 * Skips transformation for opaque fields (OPAQUE_FIELDS) whose values are arbitrary key/value bags.
 * @param obj - The object to convert.
 * @param parentKey - Internal tracking for opaque-field bypass.
 * @returns The converted object with snake_case keys.
 */
export function toSnakeCase<T>(obj: unknown, parentKey?: string): T {
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
    return obj.map((item) => toSnakeCase(item, parentKey)) as unknown as T;
  }

  const result = Object.create(null) as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const snakeKey = camelToSnake(key);
    if (OPAQUE_FIELDS.has(key) || OPAQUE_FIELDS.has(parentKey ?? "")) {
      result[snakeKey] = value;
    } else {
      result[snakeKey] = toSnakeCase(value, key);
    }
  }

  return result as T;
}

/**
 * Recursively converts object keys from snake_case to camelCase.
 * Handles nested objects and arrays while preserving primitive types, Date, Buffer, etc.
 * Skips transformation for opaque fields (OPAQUE_FIELDS) whose values are arbitrary key/value bags.
 * @param obj - The object to convert.
 * @param parentKey - Internal tracking for opaque-field bypass (in camelCase).
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

  const result = Object.create(null) as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = snakeToCamel(key);
    if (OPAQUE_FIELDS.has(camelKey) || OPAQUE_FIELDS.has(parentKey ?? "")) {
      result[camelKey] = value;
    } else {
      result[camelKey] = toCamelCase(value, camelKey);
    }
  }

  return result as T;
}
