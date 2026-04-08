import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HomeHeader } from '../components/home/HomeHeader';
import { loadAuthSession } from '../data/authSession';

export function PaymentFailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);

  const errorCode = searchParams.get('code') ?? '';
  const errorMessage = searchParams.get('message') ?? '결제가 취소되었거나 실패했습니다.';

  return (
    <main className="space-reservation-page">
      <HomeHeader authenticated={isAuthenticated} onGuestCta={() => navigate('/login')} variant="icon" />
      <section className="space-reservation__shell" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: '#ef4444',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', color: '#fff', fontSize: 32
        }}>×</div>
        <h2>결제 실패</h2>
        <p style={{ color: '#888', marginTop: 8 }}>{errorMessage}</p>
        {errorCode && (
          <p style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>오류 코드: {errorCode}</p>
        )}
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
            다시 예약하기
          </button>
        </div>
      </section>
    </main>
  );
}
