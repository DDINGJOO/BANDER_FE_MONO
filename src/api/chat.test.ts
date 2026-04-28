import { getSyncHint, updateChatCursor } from './chat';

describe('chat api device sync contract', () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    window.localStorage.clear();
    document.cookie = 'bander_device_id=; Max-Age=0; Path=/';
    window.localStorage.setItem('bander_device_id', 'web-test-device');
  });

  afterAll(() => {
    (global as unknown as { fetch: typeof fetch }).fetch = originalFetch;
  });

  function jsonResponse(status: number, body: unknown): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as unknown as Response;
  }

  it('unwraps sync-hint envelope and sends the device header', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        data: {
          type: 'sync.hint',
          deviceId: 'web-test-device',
          rooms: [
            {
              chatRoomId: '100',
              lastSeenMessageId: '200',
              latestMessageIdServer: '300',
            },
          ],
        },
      }),
    );

    const result = await getSyncHint();

    expect(result).toEqual([
      {
        chatRoomId: '100',
        lastSeenMessageId: '200',
        latestMessageIdServer: '300',
      },
    ]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/chat/sync-hint');
    expect((init.headers as Headers).get('X-Device-Id')).toBe('web-test-device');
  });

  it('updates the per-device cursor without coercing snowflake ids to number', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        data: {
          chatRoomId: '100',
          deviceId: 'web-test-device',
          lastSeenMessageId: '307057320825716736',
        },
      }),
    );

    const result = await updateChatCursor('100', '307057320825716736');

    expect(result.lastSeenMessageId).toBe('307057320825716736');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/chat/rooms/100/cursor');
    expect(init.method).toBe('PUT');
    expect((init.headers as Headers).get('X-Device-Id')).toBe('web-test-device');
    expect(JSON.parse(init.body as string)).toEqual({
      lastSeenMessageId: '307057320825716736',
    });
  });
});
