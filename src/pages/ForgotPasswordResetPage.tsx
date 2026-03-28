import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completePasswordReset } from '../api/auth';
import { BrandMark } from '../components/shared/BrandMark';
import { SuccessIcon } from '../components/shared/Icons';
import { clearPasswordResetDraft, loadPasswordResetDraft } from '../data/authSession';

export function ForgotPasswordResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordIsValid =
    password.length >= 8 && password.length <= 20 && /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === passwordConfirm;
  const canSubmit = passwordIsValid && passwordsMatch && !isSubmitting;

  useEffect(() => {
    const draft = loadPasswordResetDraft();
    if (!draft?.passwordResetToken) {
      navigate('/forgot-password', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    const draft = loadPasswordResetDraft();
    if (!draft?.passwordResetToken) {
      navigate('/forgot-password', { replace: true });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await completePasswordReset(draft.passwordResetToken, password, passwordConfirm);
      clearPasswordResetDraft();
      setIsCompleted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '비밀번호 재설정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="forgot-page">
      <section className="forgot-shell" aria-labelledby="forgot-reset-title">
        <div className="forgot-brand">
          <BrandMark />
        </div>

        <h1 className="forgot-headline" id="forgot-reset-title">
          비밀번호 찾기
        </h1>

        <form className="forgot-card" onSubmit={handleSubmit}>
          {errorMessage ? (
            <div className="signup-toast" role="alert">
              <span className="signup-toast__text">{errorMessage}</span>
            </div>
          ) : null}
          <div className="forgot-card__body">
            <div className="forgot-section">
              <label className="signup-label" htmlFor="forgotPassword">
                새 비밀번호
              </label>

              <div className="signup-input">
                <input
                  autoComplete="new-password"
                  className="signup-input__control"
                  id="forgotPassword"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="새 비밀번호는 4~16자 이내로 입력해주세요."
                  type="password"
                  value={password}
                />
              </div>

              <div className="signup-input">
                <input
                  autoComplete="new-password"
                  className="signup-input__control"
                  id="forgotPasswordConfirm"
                  name="passwordConfirm"
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="새 비밀번호를 재입력해주세요."
                  type="password"
                  value={passwordConfirm}
                />
              </div>
            </div>
          </div>

          <button
            className={`signup-next-button ${canSubmit ? 'signup-next-button--active' : ''}`}
            disabled={!canSubmit}
            type="submit"
          >
            비밀번호 설정하고 로그인하러 가기!
          </button>

          {isCompleted ? (
            <div className="forgot-complete">
              <div className="forgot-complete__backdrop" />
              <div className="forgot-complete__dialog" role="dialog" aria-modal="true">
                <div className="forgot-complete__icon">
                  <SuccessIcon />
                </div>
                <div className="forgot-complete__copy">
                  <p className="forgot-complete__title">비밀번호 설정 완료!</p>
                  <p className="forgot-complete__description">비밀번호가 설정되었습니다.</p>
                  <p className="forgot-complete__description">지금 바로 로그인 해보세요.</p>
                </div>
                <button className="forgot-complete__button" onClick={() => navigate('/login')} type="button">
                  로그인 하러 가기
                </button>
              </div>
            </div>
          ) : null}
        </form>
      </section>
    </main>
  );
}
