import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';
import '../support/logger';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());