import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HomeHeader } from '../components/home/HomeHeader';
import { ErrorIcon } from '../components/shared/Icons';
import { loadAuthSession } from '../data/authSession';
import { paymentFailureFromSearchParams, roomDetailPathFromPaymentContext } from '../utils/paymentFailure';
import '../styles/payment-result.css';

export function PaymentFailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);

  const failure = paymentFailureFromSearchParams(searchParams);
  const roomDetailPath = roomDetailPathFromPaymentContext(searchParams);

  return (
    <main className="payment-result">
      <HomeHeader authenticated={isAuthenticated} onGuestCta={() => navigate('/login')} variant="icon" />
      <section className="payment-result__shell">
        <span aria-hidden="true" className="payment-result__icon payment-result__icon--error">
          <ErrorIcon />
        </span>
        <h2 className="payment-result__title">결제 실패</h2>
        <p className="payment-result__description">{failure.message}</p>
        {failure.code ? (
          <p className="payment-result__error-code">오류 코드: {failure.code}</p>
        ) : null}
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
      </section>
    </main>
  );
}
