import { ApiError } from './client';
import { createBooking } from './bookings';

describe('createBooking discriminated union', () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
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

  it('returns kind=legacy when backend responds 200 with bookingId', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        data: {
          bookingId: 'b-1',
          status: 'PENDING_PAYMENT',
          expiresAt: null,
          totalPrice: 10000,
          cancelledAt: null,
          orderId: 'ord-1',
          paymentId: null,
          paidAmount: 10000,
          discountWon: 0,
        },
      }),
    );

    const result = await createBooking({ roomId: 'r-1', startsAt: 's', endsAt: 'e' });

    expect(result.kind).toBe('legacy');
    expect((result as Extract<typeof result, { kind: 'legacy' }>).booking.bookingId).toBe('b-1');
  });

  it('returns kind=saga when backend responds 202 with sagaId', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(202, {
        success: true,
        data: { sagaId: 'sg-42', expiresAt: '2026-04-27T15:00:00+09:00' },
      }),
    );

    const result = await createBooking({ roomId: 'r-1', startsAt: 's', endsAt: 'e' });

    expect(result.kind).toBe('saga');
    const sagaResult = result as Extract<typeof result, { kind: 'saga' }>;
    expect(sagaResult.saga.sagaId).toBe('sg-42');
    expect(sagaResult.saga.expiresAt).toBe('2026-04-27T15:00:00+09:00');
  });

  it('still detects saga shape even when status is 200 (canary edge case)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        data: { sagaId: 'sg-7', expiresAt: '2026-04-27T15:00:00+09:00' },
      }),
    );

    const result = await createBooking({ roomId: 'r-1', startsAt: 's', endsAt: 'e' });

    expect(result.kind).toBe('saga');
  });

  it('throws ApiError on non-success envelope', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        success: false,
        error: { code: 'INVALID', message: '잘못된 요청' },
      }),
    );

    await expect(
      createBooking({ roomId: 'r-1', startsAt: 's', endsAt: 'e' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('throws ApiError on network failure', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network'));

    await expect(
      createBooking({ roomId: 'r-1', startsAt: 's', endsAt: 'e' }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
