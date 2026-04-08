import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPayment } from '../api/bookings';
import { HomeHeader } from '../components/home/HomeHeader';
import { loadAuthSession } from '../data/authSession';

type ResultState = 'loading' | 'success' | 'error';

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resultState, setResultState] = useState<ResultState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);

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
        setErrorMessage(err?.message ?? '결제 확인에 실패했습니다.');
      });
  }, [paymentKey, orderId, amount]);

  return (
    <main className="space-reservation-page">
      <HomeHeader authenticated={isAuthenticated} onGuestCta={() => navigate('/login')} variant="icon" />
      <section className="space-reservation__shell" style={{ padding: '40px 20px', textAlign: 'center' }}>
        {resultState === 'loading' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2>결제 확인 중...</h2>
            <p style={{ color: '#888', marginTop: 8 }}>잠시만 기다려주세요.</p>
          </>
        )}

        {resultState === 'success' && (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#22c55e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: '#fff', fontSize: 32
            }}>✓</div>
            <h2>예약 완료!</h2>
            <p style={{ color: '#888', marginTop: 8 }}>업체의 승인 후 공간 사용 가능합니다.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 24px', borderRadius: 8, border: '1px solid #ddd',
                  background: '#fff', cursor: 'pointer'
                }}
                type="button"
              >
                홈으로
              </button>
              <button
                onClick={() => navigate('/my-reservations')}
                style={{
                  padding: '12px 24px', borderRadius: 8, border: 'none',
                  background: '#7c3aed', color: '#fff', cursor: 'pointer'
                }}
                type="button"
              >
                예약현황 이동
              </button>
            </div>
          </>
        )}

        {resultState === 'error' && (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', color: '#fff', fontSize: 32
            }}>×</div>
            <h2>결제 확인 실패</h2>
            <p style={{ color: '#888', marginTop: 8 }}>{errorMessage}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 24px', borderRadius: 8, border: '1px solid #ddd',
                  background: '#fff', cursor: 'pointer'
                }}
                type="button"
              >
                홈으로
              </button>
              <button
                onClick={() => navigate(-1)}
                style={{
                  padding: '12px 24px', borderRadius: 8, border: 'none',
                  background: '#7c3aed', color: '#fff', cursor: 'pointer'
                }}
                type="button"
              >
                다시 시도
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
