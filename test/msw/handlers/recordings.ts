import { http, HttpResponse } from 'msw';
import { TEST_CONFIG } from '../../support/env';

const url = (path: string) => `${TEST_CONFIG.baseUrl}${path}`;

export const recordingHandlers = [
  http.get(url('/recordings'), () =>
    new HttpResponse('audio-stream-binary', {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    })
  ),
];
