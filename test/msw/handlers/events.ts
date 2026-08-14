import { http, HttpResponse } from 'msw';
import { TEST_CONFIG } from '../../support/env';
import {
  eventFixture,
  eventListFixture,
  eventRedeliverFixture,
} from '../../support/fixtures/events';

const url = (path: string) => `${TEST_CONFIG.baseUrl}${path}`;

export const eventHandlers = [
  http.get(url('/events/:id'), ({ params }) =>
    HttpResponse.json(eventFixture({ id: params.id as string }))
  ),

  http.get(url('/events'), () => HttpResponse.json(eventListFixture())),

  http.post(url('/events/:id/redeliver'), ({ params }) =>
    HttpResponse.json(eventRedeliverFixture({ event_id: params.id as string }))
  ),
];