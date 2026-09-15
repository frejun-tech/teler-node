import { describe, it, expect } from 'vitest';
import { resolveIdempotencyKey } from '@/lib/idempotency';
import {
  BadParametersException,
  UnprocessableRequestException
} from '@/exceptions';

describe('resolveIdempotencyKey', () => {
  it('auto-generates a UUID when no key is provided', () => {
    const key = resolveIdempotencyKey();
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('auto-generates a UUID when key is explicitly undefined', () => {
    const key = resolveIdempotencyKey(undefined);
    expect(key).toBeTruthy();
  });

  it('returns the caller-supplied key unchanged when valid', () => {
    expect(resolveIdempotencyKey('my-custom-key')).toBe('my-custom-key');
  });

  it('throws BadParametersException when the key is an empty string', () => {
    expect(() => resolveIdempotencyKey('')).toThrow(BadParametersException);
    expect(() => resolveIdempotencyKey('')).toThrow(/must not be empty/);
  });

  it('throws UnprocessableRequestException when the key exceeds 255 characters', () => {
    const tooLong = 'a'.repeat(256);
    expect(() => resolveIdempotencyKey(tooLong)).toThrow(UnprocessableRequestException);
    expect(() => resolveIdempotencyKey(tooLong)).toThrow(/must not exceed 255 characters/);
  });

  it('accepts a key at exactly 255 characters (boundary)', () => {
    const exactly255 = 'a'.repeat(255);
    expect(resolveIdempotencyKey(exactly255)).toBe(exactly255);
  });
});