import {
  type EventResponse,
  type EventRedeliverResponse,
  type EventFilters,
  DeliveryStatus,
} from '@/types/events';
import type { CursorResponse } from '@/types/common';

export const eventFixture = (overrides: Partial<EventResponse> = {}): EventResponse => ({
  id: 'evt_123',
  accountId: 'acc_123',
  callId: 'call_123',
  sipTrunkId: 'trunk_123',
  legId: 'leg_123',
  type: 'call.completed',
  apiVersion: '2026-01-01',
  occurredAt: '2026-08-14T00:00:00.000Z',
  payload: {},
  deliveryStatus: 'delivered',
  attemptCount: 1,
  lastAttemptAt: '2026-08-14T00:00:00.000Z',
  lastStatusCode: 200,
  lastError: '',
  deliveredAt: '2026-08-14T00:00:01.000Z',
  createdAt: '2026-08-14T00:00:00.000Z',
  ...overrides,
});

export const eventListFixture = (
  overrides: Partial<CursorResponse<EventResponse>> = {}
): CursorResponse<EventResponse> => ({
  data: [eventFixture({ id: 'evt_1' }), eventFixture({ id: 'evt_2', callId: 'call_2' })],
  nextCursor: 'cur_next',
  previousCursor: null,
  hasMore: true,
  ...overrides,
});

export const eventRedeliverFixture = (
  overrides: Partial<EventRedeliverResponse> = {}
): EventRedeliverResponse => ({
  eventId: 'evt_123',
  redeliveredAt: '2026-08-14T00:00:02.000Z',
  ...overrides,
});

export const eventFiltersFixture = (
  overrides: Partial<EventFilters> = {}
): EventFilters => ({
  callId: 'call_123',
  type: 'call.completed',
  occurredAfter: '2026-08-01T00:00:00.000Z',
  deliveryStatus: DeliveryStatus.DELIVERED,
  limit: 20,
  cursorAfter:
    'eyJ0IjoiMjAyNi0wNy0wOFQwOTozMzoyMS43MjAwMDArMDA6MDAiLCJpIjoiY3NfNlo1TTBNSlRDUEJGSFY4Vlk0UFNHUzAzWDUifQ',
  cursorBefore:
    'eyJ0IjoiMjAyNi0wNy0wOFQwOTozMDo1OC4wODAwMDArMDA6MDAiLCJpIjoiY3NfNlpFUEY2NU1NWkE1RFJTSFBGRVJHQjZFS1QifQ',
  ...overrides,
});