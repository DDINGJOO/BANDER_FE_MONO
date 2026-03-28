import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  requestPasswordReset,
  resendPasswordReset,
  verifyPasswordResetCode,
  PasswordResetVerifyResponse,
} from '../api/auth';
import { BrandMark } from '../components/shared/BrandMark';
import { ErrorIcon, SuccessIcon } from '../components/shared/Icons';
import { savePasswordResetDraft } from '../data/authSession';
import { formatCountdown, useVerificationFlow } from '../hooks/useVerificationFlow';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const {
    email,
    handleVerificationCodeChange,
    handleVerificationRequest,
    remainingSeconds,
    setEmail,
    toastMessage,
    verifiedResult,
    verificationCode,
    verificationRequested,
    verificationStatus,
  } = useVerificationFlow<PasswordResetVerifyResponse>({
    onVerified: (result) => {
      savePasswordResetDraft({
        email,
        passwordResetToken: result.passwordResetToken,
      });
    },
    requestVerification: requestPasswordReset,
    resendVerification: resendPasswordReset,
    verifyCode: verifyPasswordResetCode,
  });

  const canSubmit = verificationRequested && verificationStatus === 'verified';

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !verifiedResult) {
      return;
    }
    navigate('/forgot-password/reset');
  };

  return (
    <main className="forgot-page">
      <section className="forgot-shell" aria-labelledby="forgot-title">
        <div className="forgot-brand">
          <BrandMark />
        </div>

        <h1 className="forgot-headline" id="forgot-title">
          비밀번호 찾기
        </h1>

        <form className="forgot-card" onSubmit={handleSubmit}>
          {toastMessage ? (
            <div className="signup-toast" role="alert">
              <ErrorIcon />
              <span className="signup-toast__text">{toastMessage}</span>
            </div>
          ) : null}

          <div className="forgot-card__body">
            <div className="forgot-section">
              <label className="signup-label" htmlFor="forgotEmail">
                가입 이메일
              </label>

              <div className="signup-input">
                <input
                  autoComplete="email"
                  className="signup-input__control"
                  id="forgotEmail"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="가입하신 이메일을 입력해주세요."
                  type="email"
                  value={email}
                />
                <button className="signup-tag-button" onClick={handleVerificationRequest} type="button">
                  인증받기
                </button>
              </div>

              {verificationRequested ? (
                <>
                  <div
                    className={`signup-input ${
                      verificationStatus === 'verified' ? 'signup-input--verified' : ''
                    }`}
                  >
                    <input
                      className="signup-input__control"
                      id="forgotVerificationCode"
                      name="verificationCode"
                      onChange={(event) => handleVerificationCodeChange(event.target.value)}
                      placeholder="인증번호를 입력해주세요."
                      type="text"
                      value={verificationCode}
                    />
                    {verificationStatus === 'verified' ? (
                      <span className="signup-status signup-status--success">
                        <SuccessIcon />
                        <span className="signup-status__text signup-status__text--success">
                          인증완료
                        </span>
                      </span>
                    ) : verificationStatus === 'verifying' ? (
                      <span className="signup-status signup-status--pending">
                        <span className="signup-status__text signup-status__text--pending">
                          확인중...
                        </span>
                      </span>
                    ) : (
                      <span className="signup-timer">{formatCountdown(remainingSeconds)}</span>
                    )}
                  </div>

                  <p className="signup-help">
                    <span>5분 이내로 인증번호(6자리)를 입력해주세요.</span>
                    <span>인증번호가 전송되지 않은 경우 ‘다시받기’ 버튼을 눌러주세요.</span>
                  </p>
                </>
              ) : null}
            </div>
          </div>

          <button
            className={`signup-next-button ${canSubmit ? 'signup-next-button--active' : ''}`}
            disabled={!canSubmit}
            type="submit"
          >
            다음
          </button>
        </form>
      </section>
    </main>
  );
}
