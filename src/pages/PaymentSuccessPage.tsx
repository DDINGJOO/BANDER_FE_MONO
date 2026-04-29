import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPayment } from '../api/bookings';
import { HomeHeader } from '../components/home/HomeHeader';
import { ErrorIcon, SuccessIcon } from '../components/shared/Icons';
import { loadAuthSession } from '../data/authSession';
import { normalizePaymentFailure, roomDetailPathFromPaymentContext } from '../utils/paymentFailure';
import '../styles/payment-result.css';

type ResultState = 'loading' | 'success' | 'error';

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resultState, setResultState] = useState<ResultState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);
  const roomDetailPath = roomDetailPathFromPaymentContext(searchParams);

  const paymentKey = searchParams.get('paymentKey') ?? '';
  const orderId = searchParams.get('orderId') ?? '';
  const amount = searchParams.get('amount') ?? '';

  useEffect(() => {
    const bookingId = sessionStorage.getItem('bander_pending_booking_id');
    if (!bookingId || !paymentKey || !orderId || !amount) {
      setResultState('error');
      setErrorMessage('결제 정보가 올바르지 않습니다.');
      return;
    }

    confirmPayment(bookingId, { paymentKey, orderId, amount })
      .then(() => {
        setResultState('success');
        sessionStorage.removeItem('bander_pending_booking_id');
      })
      .catch((err) => {
        setResultState('error');
        setErrorMessage(normalizePaymentFailure(err, '결제 확인에 실패했습니다.').message);
      });
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
