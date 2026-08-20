import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestClient } from '@test/support/client';
import { server } from '@test/msw/server';
import { TEST_CONFIG } from '@test/support/env';
import { eventListFixture } from '@test/support/fixtures/events';

describe('Events API (integration)', () => {
  it('retrieves an event through the real http stack', async () => {
    const client = createTestClient();
    const event = await client.events.retrieve('evt_42');
    expect(event.id).toBe('evt_42');
  });

  it('lists events', async () => {
    const client = createTestClient();
    const result = await client.events.list();
    expect(result.data).toBeInstanceOf(Array);
    expect(result).toHaveProperty('has_more');
    expect(result).toHaveProperty('next_cursor');
    expect(result).toHaveProperty('previous_cursor');
  });

  it('sends query params correctly on list', async () => {
    const captured: {url: URL | null} = {url: null};
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/events`, ({ request }) => {
        captured.url = new URL(request.url);
        return HttpResponse.json(eventListFixture());
      })
    );
    const client = createTestClient();
    await client.events.list({ call_id: 'call_1' });
    expect(captured.url?.searchParams.get('call_id')).toBe('call_1');
  });

  it('propagates 404 errors from the backend', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/events/:id`, () =>
        HttpResponse.json({ error: 'not found' }, { status: 404 })
      )
    );
    const client = createTestClient();
    await expect(client.events.retrieve('evt_missing')).rejects.toMatchObject({
      name: 'NotFoundException',
      code: 404,
    });
  });

  it('propagates 500 errors from the backend', async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/events/:id`, () =>
        HttpResponse.json({ error: 'internal error' }, { status: 500 })
      )
    );
    const client = createTestClient();
    await expect(client.events.retrieve('evt_broken')).rejects.toMatchObject({
      name: 'InternalServerErrorException',
    });
  });

  it('redelivers an event through the real http stack', async () => {
    const client = createTestClient();
    const result = await client.events.redeliver('evt_123');
    expect(result.event_id).toBe('evt_123');
  });
});