import {
  type EventResponse,
  type EventRedeliverResponse,
  type EventFilters,
  DeliveryStatus,
} from '@/types/events';
import type { CursorResponse } from '@/types/common';

export const eventFixture = (overrides: Partial<EventResponse> = {}): EventResponse => ({
  id: 'evt_123',
  account_id: 'acc_123',
  call_id: 'call_123',
  sip_trunk_id: 'trunk_123',
  leg_id: 'leg_123',
  type: 'call.completed',
  api_version: '2026-01-01',
  occurred_at: '2026-08-14T00:00:00.000Z',
  payload: {},
  delivery_status: 'delivered',
  attempt_count: 1,
  last_attempt_at: '2026-08-14T00:00:00.000Z',
  last_status_code: 200,
  last_error: '',
  delivered_at: '2026-08-14T00:00:01.000Z',
  created_at: '2026-08-14T00:00:00.000Z',
  ...overrides,
});

export const eventListFixture = (
  overrides: Partial<CursorResponse<EventResponse>> = {}
): CursorResponse<EventResponse> => ({
  data: [eventFixture({ id: 'evt_1' }), eventFixture({ id: 'evt_2', call_id: 'call_2' })],
  next_cursor: 'cur_next',
  previous_cursor: null,
  has_more: true,
  ...overrides,
});

export const eventRedeliverFixture = (
  overrides: Partial<EventRedeliverResponse> = {}
): EventRedeliverResponse => ({
  event_id: 'evt_123',
  redelivered_at: '2026-08-14T00:00:02.000Z',
  ...overrides,
});

export const eventFiltersFixture = (
  overrides: Partial<EventFilters> = {}
): EventFilters => ({
  call_id: 'call_123',
  type: 'call.completed',
  occurred_after: '2026-08-01T00:00:00.000Z',
  delivery_status: DeliveryStatus.DELIVERED,
  limit: 20,
  cursor_after:
    'eyJ0IjoiMjAyNi0wNy0wOFQwOTozMzoyMS43MjAwMDArMDA6MDAiLCJpIjoiY3NfNlo1TTBNSlRDUEJGSFY4Vlk0UFNHUzAzWDUifQ',
  cursor_before:
    'eyJ0IjoiMjAyNi0wNy0wOFQwOTozMDo1OC4wODAwMDArMDA6MDAiLCJpIjoiY3NfNlpFUEY2NU1NWkE1RFJTSFBGRVJHQjZFS1QifQ',
  ...overrides,
});