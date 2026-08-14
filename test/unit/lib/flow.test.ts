import { describe, it, expect } from 'vitest';
import { CallFlow } from '@/lib/flows';

describe('CallFlow', () => {
  describe('stream', () => {
    it('builds with defaults', () => {
      const result = CallFlow.stream('wss://example.com/audio');
      expect(result).toEqual({
        action: 'stream',
        ws_url: 'wss://example.com/audio',
        sample_rate: '8k',
        chunk_size: 400,
        record: true,
      });
    });

    it('builds with all options overridden', () => {
      const result = CallFlow.stream('wss://example.com/audio', {
        flowUrl: 'https://example.com/next',
        sampleRate: '16k',
        chunkSize: 800,
        record: false,
      });
      expect(result).toEqual({
        action: 'stream',
        ws_url: 'wss://example.com/audio',
        flow_url: 'https://example.com/next',
        sample_rate: '16k',
        chunk_size: 800,
        record: false,
      });
    });

    it('omits flow_url when not provided', () => {
      const result = CallFlow.stream('wss://example.com/audio');
      expect(result).not.toHaveProperty('flow_url');
    });
  });

  describe('play', () => {
    it('builds with just a media url', () => {
      expect(CallFlow.play('https://example.com/audio.mp3')).toEqual({
        action: 'play',
        media_url: 'https://example.com/audio.mp3',
      });
    });

    it('includes flow_url when provided', () => {
      expect(CallFlow.play('https://example.com/audio.mp3', 'https://example.com/next')).toEqual({
        action: 'play',
        media_url: 'https://example.com/audio.mp3',
        flow_url: 'https://example.com/next',
      });
    });
  });

  describe('hangup', () => {
    it('builds with only action', () => {
      expect(CallFlow.hangup()).toEqual({ action: 'hangup' });
    });
  });

  describe('dial', () => {
    it('builds with defaults', () => {
      const result = CallFlow.dial('+15551234567');
      expect(result).toEqual({
        action: 'dial',
        to: '+15551234567',
        timeout: 30,
        record: false,
        ringback: 'passthrough',
      });
    });

    it('builds with all options overridden', () => {
      const result = CallFlow.dial('+15551234567', {
        flowUrl: 'https://example.com/next',
        timeout: 60,
        record: 'mono',
        customHeaders: { 'X-Trace-Id': 'abc123' },
        statusCallbackUrl: 'https://example.com/status',
        ringback: 'suppress',
        dialMusic: { action: 'play', media_url: 'https://example.com/hold.mp3' },
        confirmSound: { action: 'hangup' },
        onNoAnswer: { action: 'hangup' },
        onBusy: { action: 'hangup' },
        onFailure: { action: 'hangup' },
      });

      expect(result).toEqual({
        action: 'dial',
        to: '+15551234567',
        flow_url: 'https://example.com/next',
        timeout: 60,
        record: 'mono',
        custom_headers: { 'X-Trace-Id': 'abc123' },
        status_callback_url: 'https://example.com/status',
        ringback: 'suppress',
        dial_music: { action: 'play', media_url: 'https://example.com/hold.mp3' },
        confirm_sound: { action: 'hangup' },
        on_no_answer: { action: 'hangup' },
        on_busy: { action: 'hangup' },
        on_failure: { action: 'hangup' },
      });
    });

    it('omits optional fields when not provided', () => {
      const result = CallFlow.dial('+15551234567');
      expect(result).not.toHaveProperty('flow_url');
      expect(result).not.toHaveProperty('custom_headers');
      expect(result).not.toHaveProperty('status_callback_url');
      expect(result).not.toHaveProperty('dial_music');
      expect(result).not.toHaveProperty('confirm_sound');
      expect(result).not.toHaveProperty('on_no_answer');
      expect(result).not.toHaveProperty('on_busy');
      expect(result).not.toHaveProperty('on_failure');
    });
  });
});