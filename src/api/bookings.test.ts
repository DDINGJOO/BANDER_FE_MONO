import { ApiError } from './client';
import {
  applyReservationCoupon,
  cancelReservationCheckout,
  createBooking,
  startReservationCheckout,
} from './bookings';

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

  it('starts reservation checkout through the public reservation gateway path', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        data: {
          reservationId: 'checkout-1',
          sagaId: 'saga-1',
          businessDeadlineAt: '2026-05-15T10:30:00+09:00',
        },
      }),
    );

    const result = await startReservationCheckout({
      roomId: '101',
      startsAt: '2026-05-15T10:00:00+09:00',
      endsAt: '2026-05-15T11:00:00+09:00',
      basePriceWon: 10000,
    });

    expect(result.reservationId).toBe('checkout-1');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/reservations/start'),
      expect.objectContaining({
        body: expect.stringContaining('"basePriceWon":10000'),
        method: 'POST',
      }),
    );
  });

  it('applies reservation coupon with an idempotency key', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        data: {
          checkoutId: 'checkout-1',
          sagaId: 'saga-1',
          userId: '1',
          state: 'COUPON_APPLYING',
          revision: 3,
          roomId: '101',
          startsAt: '2026-05-15T10:00:00+09:00',
          endsAt: '2026-05-15T11:00:00+09:00',
        },
      }),
    );

    await applyReservationCoupon('checkout-1', { couponOwnedId: '9007199254740993', expectedRevision: 2 }, 'idem-coupon');

    const [, init] = fetchMock.mock.calls[0];
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/reservations/checkout-1/coupon');
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit).body).toBe(JSON.stringify({ couponOwnedId: '9007199254740993', expectedRevision: 2 }));
    expect(new Headers((init as RequestInit).headers).get('Idempotency-Key')).toBe('idem-coupon');
  });

  it('cancels reservation checkout with expected revision and idempotency key', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        success: true,
        data: {
          checkoutId: 'checkout-1',
          sagaId: 'saga-1',
          userId: '1',
          state: 'CANCELLING',
          revision: 4,
          roomId: '101',
          startsAt: '2026-05-15T10:00:00+09:00',
          endsAt: '2026-05-15T11:00:00+09:00',
        },
      }),
    );

    await cancelReservationCheckout('checkout-1', 3, 'idem-cancel');

    const [, init] = fetchMock.mock.calls[0];
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/reservations/checkout-1?expectedRevision=3');
    expect((init as RequestInit).method).toBe('DELETE');
    expect(new Headers((init as RequestInit).headers).get('Idempotency-Key')).toBe('idem-cancel');
  });
});
