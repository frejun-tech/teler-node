import { http, HttpResponse } from 'msw';
import { TEST_CONFIG } from '../../support/env';
import {
  voiceAppFixture,
  voiceAppListFixture,
  callResponseFixture,
  voiceCallFixture,
  voiceCallListFixture,
  voiceCallLegListFixture,
  mutationResponseFixture,
  transferResponseFixture,
} from '../../support/fixtures/voice';
import { virtualNumberListFixture } from '../../support/fixtures/vns';

const url = (path: string) => `${TEST_CONFIG.baseUrl}${path}`;

export const voiceHandlers = [
  // Voice Apps
  http.post(url('/voice/apps'), async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    return HttpResponse.json(
      voiceAppFixture({ name: body.name || 'Customer Support App' }),
      { status: 201 }
    );
  }),

  http.get(url('/voice/apps'), () => HttpResponse.json(voiceAppListFixture())),

  http.get(url('/voice/apps/:id/virtual-numbers'), () =>
    HttpResponse.json(virtualNumberListFixture())
  ),

  http.get(url('/voice/apps/:id'), ({ params }) =>
    HttpResponse.json(voiceAppFixture({ id: params.id as string }))
  ),

  http.patch(url('/voice/apps/:id'), async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Partial<
      ReturnType<typeof voiceAppFixture>
    >;
    return HttpResponse.json(
      voiceAppFixture({ id: params.id as string, ...body })
    );
  }),

  http.delete(url('/voice/apps/:id'), () =>
    HttpResponse.json({
      success: true,
      message: 'Voice app deleted successfully.',
    })
  ),

  // Voice Calls
  http.post(url('/voice/calls/initiate'), () =>
    HttpResponse.json(callResponseFixture(), { status: 202 })
  ),

  http.get(url('/voice/calls'), () => HttpResponse.json(voiceCallListFixture())),

  http.get(url('/voice/calls/:id/legs'), () =>
    HttpResponse.json(voiceCallLegListFixture())
  ),

  http.get(url('/voice/calls/:id'), ({ params }) =>
    HttpResponse.json(voiceCallFixture({ id: params.id as string }))
  ),

  // Call Controls
  http.post(url('/voice/calls/:id/hangup'), () =>
    HttpResponse.json(mutationResponseFixture(), { status: 202 })
  ),

  http.post(url('/voice/calls/:id/mute'), () =>
    HttpResponse.json(mutationResponseFixture(), { status: 202 })
  ),

  http.post(url('/voice/calls/:id/dtmf'), () =>
    HttpResponse.json(mutationResponseFixture(), { status: 202 })
  ),

  http.post(url('/voice/calls/:id/play'), () =>
    HttpResponse.json(mutationResponseFixture(), { status: 202 })
  ),

  // Voice Operations
  http.post(url('/voice/calls/:id/transfer'), () =>
    HttpResponse.json(transferResponseFixture(), { status: 202 })
  ),
];
