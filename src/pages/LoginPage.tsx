import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { BrandMark } from '../components/shared/BrandMark';
import { AppleIcon, CheckIcon, GoogleIcon, KakaoIcon } from '../components/shared/Icons';
import { saveAuthSession } from '../data/authSession';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await login(email, password);
      saveAuthSession({
        expiresAt: result.expiresAt,
        gatewayContextToken: result.gatewayContextToken,
        userId: result.userId,
      });
      navigate('/');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-shell" aria-labelledby="login-title">
        <div className="login-panel">
          <div className="login-panel__header">
            <BrandMark />
            <h1 className="sr-only" id="login-title">
              밴더 로그인
            </h1>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {errorMessage ? (
              <div className="signup-toast" role="alert">
                <span className="signup-toast__text">{errorMessage}</span>
              </div>
            ) : null}
            <div className="login-form__fields">
              <label className="sr-only" htmlFor="loginEmail">
                이메일
              </label>
              <div className="login-input">
                <input
                  autoComplete="email"
                  className="login-input__control"
                  id="loginEmail"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="이메일을 입력해주세요."
                  type="email"
                  value={email}
                />
              </div>

              <label className="sr-only" htmlFor="loginPassword">
                비밀번호
              </label>
              <div className="login-input">
                <input
                  autoComplete="current-password"
                  className="login-input__control"
                  id="loginPassword"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호를 입력해주세요."
                  type="password"
                  value={password}
                />
              </div>
            </div>

            <div className="login-form__actions">
              <button className="login-button" disabled={isSubmitting} type="submit">
                로그인
              </button>

              <div className="login-meta">
                <label className="login-keep">
                  <input className="login-keep__native" defaultChecked type="checkbox" />
                  <span aria-hidden="true" className="login-keep__box">
                    <CheckIcon />
                  </span>
                  <span className="login-keep__label">로그인 유지</span>
                </label>

                <Link className="login-text-link" to="/forgot-password">
                  비밀번호 찾기
                </Link>
              </div>
            </div>
          </form>

          <div className="login-social" aria-label="SNS로 시작하기">
            <div className="login-social__divider">
              <span className="login-social__line" />
              <span className="login-social__label">SNS로 시작하기</span>
              <span className="login-social__line" />
            </div>

            <div className="login-social__buttons">
              <a aria-label="카카오로 로그인" className="login-social__button" href="#kakao-login">
                <KakaoIcon />
              </a>
              <a aria-label="구글로 로그인" className="login-social__button" href="#google-login">
                <GoogleIcon />
              </a>
              <a aria-label="애플로 로그인" className="login-social__button" href="#apple-login">
                <AppleIcon />
              </a>
            </div>
          </div>
        </div>

        <p className="login-footer">
          <span>아직 밴더 회원이 아니신가요?</span>
          <Link className="login-footer__link" to="/signup">
            회원가입
          </Link>
        </p>
      </section>
    </main>
  );
}
