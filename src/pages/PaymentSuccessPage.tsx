import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPayment, confirmSagaPayment, getSagaStatus } from '../api/bookings';
import { HomeHeader } from '../components/home/HomeHeader';
import { ErrorIcon, SuccessIcon } from '../components/shared/Icons';
import { loadAuthSession } from '../data/authSession';
import {
  isPaymentAlreadyConfirmed,
  normalizePaymentFailure,
  roomDetailPathFromPaymentContext,
  type PaymentFailureInfo,
} from '../utils/paymentFailure';
import '../styles/payment-result.css';

type ResultState = 'loading' | 'success' | 'error';

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resultState, setResultState] = useState<ResultState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const confirmKeyRef = useRef('');
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);
  const roomDetailPath = roomDetailPathFromPaymentContext(searchParams);

  const paymentKey = searchParams.get('paymentKey') ?? '';
  const orderId = searchParams.get('orderId') ?? '';
  const amount = searchParams.get('amount') ?? '';

  useEffect(() => {
    const confirmKey = `${paymentKey}:${orderId}:${amount}`;
    if (confirmKeyRef.current === confirmKey) {
      return;
    }
    confirmKeyRef.current = confirmKey;

    const showSuccess = () => {
      setResultState('success');
      sessionStorage.setItem('bander_last_payment_success_order_id', orderId);
      sessionStorage.removeItem('bander_pending_booking_id');
      sessionStorage.removeItem('bander_pending_saga_id');
    };
    const showError = (message: string) => {
      setErrorMessage(message);
      setResultState((current) => (current === 'success' ? current : 'error'));
    };
    const delay = (ms: number) => new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
    if (sessionStorage.getItem('bander_last_payment_success_order_id') === orderId) {
      showSuccess();
      return;
    }

    const bookingId = sessionStorage.getItem('bander_pending_booking_id');
    const sagaId = sessionStorage.getItem('bander_pending_saga_id');
    if ((!bookingId && !sagaId) || !paymentKey || !orderId || !amount) {
      window.setTimeout(() => showError('결제 정보가 올바르지 않습니다.'), 1000);
      return;
    }

    const waitForSagaCompletion = async (id: string): Promise<{ ok: true } | { ok: false; failure: PaymentFailureInfo }> => {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        await delay(attempt === 0 ? 500 : 1000);
        const status = await getSagaStatus(id);
        if (status.status === 'COMPLETED') {
          return { ok: true };
        }
        if (status.status === 'FAILED' || status.status === 'COMPENSATING') {
          return {
            ok: false,
            failure: normalizePaymentFailure({ code: status.errorCode ?? 'PROVIDER_ERROR' }, '예약 확정에 실패했습니다.'),
          };
        }
      }
      return {
        ok: false,
        failure: normalizePaymentFailure({ code: 'PAYMENT_TIMEOUT' }, '예약 확정이 지연되고 있습니다.'),
      };
    };

    const confirmOnce = async (): Promise<{ ok: true } | { ok: false; failure: PaymentFailureInfo }> => {
      try {
        if (sagaId) {
          await confirmSagaPayment(sagaId, { paymentKey, orderId, amount });
          return await waitForSagaCompletion(sagaId);
        }
        await confirmPayment(bookingId as string, { paymentKey, orderId, amount });
        return { ok: true };
      } catch (err) {
        const failure = normalizePaymentFailure(err, '결제 확인에 실패했습니다.');
        return isPaymentAlreadyConfirmed(failure)
          ? { ok: true }
          : { ok: false, failure };
      }
    };

    void (async () => {
      const first = await confirmOnce();
      await delay(1000);
      const second = await confirmOnce();

      if (first.ok || second.ok) {
        showSuccess();
        return;
      }

      showError(second.failure.message || first.failure.message);
    })();
  }, [paymentKey, orderId, amount]);

  return (
    <main className="payment-result">
      <HomeHeader authenticated={isAuthenticated} onGuestCta={() => navigate('/login')} variant="icon" />
      <section className="payment-result__shell">
        {resultState === 'loading' && (
          <>
            <span aria-hidden="true" className="payment-result__loading-dot" />
            <h2 className="payment-result__title">결제 확인 중</h2>
            <p className="payment-result__description">잠시만 기다려주세요.</p>
          </>
        )}

        {resultState === 'success' && (
          <>
            <span aria-hidden="true" className="payment-result__icon payment-result__icon--success">
              <SuccessIcon />
            </span>
            <h2 className="payment-result__title">예약이 완료되었어요</h2>
            <p className="payment-result__description">업체의 승인 후 공간 사용이 가능합니다.</p>
            <div className="payment-result__actions">
              <button
                className="payment-result__button payment-result__button--secondary"
                onClick={() => navigate('/')}
                type="button"
              >
                홈으로
              </button>
              <button
                className="payment-result__button payment-result__button--primary"
                onClick={() => navigate('/my-reservations')}
                type="button"
              >
                예약현황 보기
              </button>
            </div>
          </>
        )}

        {resultState === 'error' && (
          <>
            <span aria-hidden="true" className="payment-result__icon payment-result__icon--error">
              <ErrorIcon />
            </span>
            <h2 className="payment-result__title">결제 확인에 실패했어요</h2>
            <p className="payment-result__description">{errorMessage}</p>
            <div className="payment-result__actions">
              <button
                className="payment-result__button payment-result__button--secondary"
                onClick={() => navigate('/')}
                type="button"
              >
                홈으로
              </button>
              <button
                className="payment-result__button payment-result__button--primary"
                onClick={() => navigate(roomDetailPath)}
                type="button"
              >
                확인
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
