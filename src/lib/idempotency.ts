import { randomUUID } from "crypto";
import { BadParametersException } from "../exceptions";
import { config } from "../config";

/**
 * Resolves the idempotency key: uses the caller-supplied value if provided,
 * otherwise auto-generates a UUID v4. User-supplied keys are validated
 * (non-empty, ≤ 255 characters).
 */
export function resolveIdempotencyKey(key?: string): string {
  if (key === undefined || key === null) {
    return randomUUID();
  }
  if (key.length === 0) {
    throw new BadParametersException({
      message: "Idempotency-Key must not be empty. A UUID is recommended.",
      param: "Idempotency-Key"
    });
  }
  if (key.length > config.IDEMPOTENCY_KEY_MAX_LEN) {
    throw new BadParametersException({
      message: `Idempotency-Key must not exceed ${config.IDEMPOTENCY_KEY_MAX_LEN} characters (got ${key.length}).`,
      param: "Idempotency-Key"
    });
  }
  return key;
}
