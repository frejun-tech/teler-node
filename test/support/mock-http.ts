import { vi } from 'vitest';
import type { HttpResourceManager } from '@/resources/http';

export function createMockHttp() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
}

export type MockHttp = ReturnType<typeof createMockHttp>;

export function asHttp(mock: MockHttp): HttpResourceManager {
  return mock as unknown as HttpResourceManager;
}