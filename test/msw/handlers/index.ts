import { eventHandlers } from './events';
import { secretHandlers } from './secrets';
import { virtualNumberHandlers } from './vns';
import { sipHandlers } from './sip';
import { voiceHandlers } from './voice';
import { recordingHandlers } from './recordings';

export const handlers = [
  ...voiceHandlers,
  ...sipHandlers,
  ...virtualNumberHandlers,
  ...eventHandlers,
  ...secretHandlers,
  ...recordingHandlers,
];