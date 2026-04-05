import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { socialLogin, socialLink } from '../api/social';
import { parseOAuthState } from '../config/oauth';
import { saveAuthSession } from '../data/authSession';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      setError('인증 정보가 올바르지 않습니다.');
      return;
    }

    const parsed = parseOAuthState(state);
    if (!parsed) {
      setError('인증 상태가 유효하지 않습니다. 다시 시도해주세요.');
      return;
    }

    if (parsed.purpose === 'login') {
      socialLogin(parsed.provider, code, state)
        .then((result) => {
          saveAuthSession({
            expiresAt: result.expiresAt,
            gatewayContextToken: result.gatewayContextToken,
            userId: result.userId,
          });
          navigate('/', { replace: true });
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : '소셜 로그인에 실패했습니다.');
        });
    } else {
      socialLink(parsed.provider, code, state)
        .then(() => {
          navigate('/account/settings', { replace: true });
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : '계정 연동에 실패했습니다.');
        });
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: '#e74c3c', fontSize: '16px' }}>{error}</p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          style={{ padding: '8px 24px', borderRadius: '8px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
        >
          로그인으로 돌아가기
        </button>
      </main>
    );
  }

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: '#888', fontSize: '16px' }}>인증 처리 중...</p>
    </main>
  );
}
