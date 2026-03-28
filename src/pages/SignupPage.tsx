import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerSignup, verifySignupCode, requestSignupVerification, resendSignupVerification, SignupVerificationVerifyResponse } from '../api/auth';
import { BrandMark } from '../components/shared/BrandMark';
import { ErrorIcon, SuccessIcon } from '../components/shared/Icons';
import { saveSignupDraft } from '../data/authSession';
import { formatCountdown, useVerificationFlow } from '../hooks/useVerificationFlow';

export function SignupPage() {
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
  } = useVerificationFlow<SignupVerificationVerifyResponse>({
    onVerified: (result) => {
      saveSignupDraft({
        email,
        verifiedEmailToken: result.verifiedEmailToken,
      });
    },
    requestVerification: requestSignupVerification,
    resendVerification: resendSignupVerification,
    verifyCode: verifySignupCode,
  });
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordHasSpecialCharacter = /[^A-Za-z0-9]/.test(password);
  const passwordIsValid =
    password.length >= 8 && password.length <= 20 && passwordHasSpecialCharacter;
  const passwordsMatch = password.length > 0 && password === passwordConfirm;
  const verificationComplete = verificationStatus === 'verified';
  const canSubmit =
    verificationRequested &&
    verificationComplete &&
    passwordIsValid &&
    passwordsMatch &&
    !isSubmitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !verifiedResult) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const result = await registerSignup(
        verifiedResult.verifiedEmailToken,
        password,
        passwordConfirm
      );

      saveSignupDraft({
        email,
        signupCompletionToken: result.signupCompletionToken,
        verifiedEmailToken: verifiedResult.verifiedEmailToken,
      });
      navigate('/signup/profile');
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : '회원가입 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleMessage = submitMessage || toastMessage;

  return (
    <main className="signup-page">
      <section className="signup-shell" aria-labelledby="signup-title">
        <div className="signup-brand">
          <BrandMark />
        </div>

        <h1 className="signup-headline" id="signup-title">
          당신의 음악을, 당신의 공간에
        </h1>

        <ol aria-label="회원가입 단계" className="signup-progress">
          <li className="signup-progress__item signup-progress__item--active">
            <span className="signup-progress__badge signup-progress__badge--active">1</span>
            <span className="signup-progress__label">기본정보</span>
          </li>
          <li className="signup-progress__item">
            <span className="signup-progress__badge">2</span>
            <span className="signup-progress__label">부가정보</span>
          </li>
          <li className="signup-progress__item">
            <span className="signup-progress__badge">3</span>
            <span className="signup-progress__label">약관동의</span>
          </li>
        </ol>

        <form className="signup-card" onSubmit={handleSubmit}>
          {visibleMessage ? (
            <div className="signup-toast" role="alert">
              <ErrorIcon />
              <span className="signup-toast__text">{visibleMessage}</span>
            </div>
          ) : null}

          <div className="signup-card__body">
            <div className="signup-section">
              <label className="signup-label" htmlFor="signupEmail">
                이메일
              </label>

              <div className="signup-input">
                <input
                  autoComplete="email"
                  className="signup-input__control"
                  id="signupEmail"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="이메일을 입력해주세요."
                  type="email"
                  value={email}
                />
                <button className="signup-tag-button" onClick={handleVerificationRequest} type="button">
                  {verificationRequested ? '다시받기' : '인증받기'}
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
                      id="verificationCode"
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

            <div className="signup-section">
              <label className="signup-label" htmlFor="signupPassword">
                비밀번호
              </label>

              <div className="signup-input">
                <input
                  autoComplete="new-password"
                  className="signup-input__control"
                  id="signupPassword"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호를 입력해주세요."
                  type="password"
                  value={password}
                />
              </div>

              <div className="signup-input">
                <input
                  autoComplete="new-password"
                  className="signup-input__control"
                  id="passwordConfirm"
                  name="passwordConfirm"
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="비밀번호를 재입력해주세요."
                  type="password"
                  value={passwordConfirm}
                />
              </div>

              <p className="signup-help signup-help--password">
                <span>8자 이상 20자 이하로 입력해주세요.</span>
                <span>특수문자를 1개 이상 포함해주세요.</span>
              </p>
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

        <p className="signup-footer">
          <span>이미 계정이 있으신가요?</span>
          <Link className="signup-footer__link" to="/login">
            로그인
          </Link>
        </p>
      </section>
    </main>
  );
}
