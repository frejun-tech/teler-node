import { Client } from '@/index';
import { TEST_CONFIG } from './env';
import type { ClientOptions } from '@/client';

export function createTestClient(options?: ClientOptions) {
  return new Client(TEST_CONFIG.apiKey, options);
}