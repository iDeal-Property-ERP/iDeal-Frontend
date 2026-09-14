import { describe, expect, it } from 'vitest';
import { websocketUrl } from './useChatRealtime';

describe(websocketUrl, () => {
  it('uses the configured ASGI endpoint', () => {
    expect(
      websocketUrl(
        { protocol: 'http:', host: '127.0.0.1:3000' },
        'ws://127.0.0.1:8010/ws/v1/chat/',
      ),
    ).toBe('ws://127.0.0.1:8010/ws/v1/chat/');
  });

  it('preserves the same-origin HTTP host and port without an override', () => {
    expect(websocketUrl({ protocol: 'http:', host: '127.0.0.1:3000' }, '')).toBe(
      'ws://127.0.0.1:3000/ws/v1/chat/',
    );
  });

  it('uses secure WebSockets on HTTPS without an override', () => {
    expect(websocketUrl({ protocol: 'https:', host: 'app.example.com' }, '')).toBe(
      'wss://app.example.com/ws/v1/chat/',
    );
  });
});
