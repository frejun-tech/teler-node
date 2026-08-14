import { http, HttpResponse } from 'msw';
import { TEST_CONFIG } from '../../support/env';
import { virtualNumberFixture, virtualNumberListFixture } from '../../support/fixtures/vns';

const url = (path: string) => `${TEST_CONFIG.baseUrl}${path}`;

export const virtualNumberHandlers = [
  http.get(url('/virtual-numbers'), () =>
    HttpResponse.json(virtualNumberListFixture())
  ),

  http.patch(url('/virtual-numbers/:id'), async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Partial<ReturnType<typeof virtualNumberFixture>>;
    return HttpResponse.json(
      virtualNumberFixture({ id: params.id as string, ...body })
    );
  }),

  http.post(url('/virtual-numbers/assign'), () =>
    HttpResponse.json({ success: true, message: 'Virtual numbers assigned successfully.' })
  ),

  http.post(url('/virtual-numbers/unassign'), () =>
    HttpResponse.json({ success: true, message: 'Virtual numbers unassigned successfully.' })
  ),
];
