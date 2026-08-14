import { describe, it, expect } from 'vitest';
import { Client } from '@/client';
import { BadParametersException } from '@/exceptions';

describe('Client (unit)', () => {
  it('initializes successfully with a valid API key', () => {
    const client = new Client('valid_key_123');
    expect(client).toBeDefined();
    expect(client.secrets).toBeDefined();
    expect(client.virtualNumbers).toBeDefined();
    expect(client.sip).toBeDefined();
    expect(client.events).toBeDefined();
    expect(client.recordings).toBeDefined();
    expect(client.voice).toBeDefined();
  });

  it('throws BadParametersException when initialized without an API key', () => {
    expect(() => new Client('')).toThrow(BadParametersException);
    expect(() => new Client('')).toThrow(
      'Missing Teler API Key. Please provide one when initializing the client.'
    );
  });

  it('accepts optional client options such as logLevel', () => {
    const client = new Client('valid_key_123', { logLevel: 'debug' });
    expect(client).toBeDefined();
  });
});
