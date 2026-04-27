import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { completeSignup, getSignupTerms, SignupTermResponse } from '../api/auth';
import { BrandMark } from '../components/shared/BrandMark';
import { CheckIcon, ChevronIcon } from '../components/shared/Icons';
import { clearSignupDraft, loadSignupDraft } from '../data/authSession';

export function SignupTermsPage() {
  const navigate = useNavigate();
  const [terms, setTerms] = useState<SignupTermResponse[]>([]);
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const draft = loadSignupDraft();
    if (!draft?.signupCompletionToken) {
      navigate('/signup', { replace: true });
      return;
    }

    let active = true;

    void getSignupTerms()
      .then((result) => {
        if (!active) {
          return;
        }
        setTerms(result);
        setAgreements(
          result.reduce<Record<string, boolean>>((current, item) => {
            current[termKey(item)] = true;
            return current;
          }, {})
        );
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : '약관 정보를 불러오지 못했습니다.');
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  const allChecked = terms.length > 0 && terms.every((item) => agreements[termKey(item)]);
  const requiredChecked = terms
    .filter((item) => item.required)
    .every((item) => agreements[termKey(item)]);

  const toggleAgreement = (key: string) => {
    setAgreements((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const toggleAll = () => {
    setAgreements(
      terms.reduce<Record<string, boolean>>((current, item) => {
        current[termKey(item)] = !allChecked;
        return current;
      }, {})
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft = loadSignupDraft();
    if (!requiredChecked || !draft?.signupCompletionToken || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const shouldStaySignedIn = draft.signupSource === 'SOCIAL';
      await completeSignup(
        draft.signupCompletionToken,
        draft.nickname ?? '활기찬다람쥐',
        draft.gender ?? 'PREFER_NOT_TO_SAY',
        draft.regionCode ?? '서울특별시',
        draft.profileImageRef ?? 'profile/default-v1',
        terms.map((item) => ({
          agreed: Boolean(agreements[termKey(item)]),
          termCode: item.termCode,
          version: item.version,
        })),
        draft.profileImageOwnershipTicket,
      );
      clearSignupDraft();
      navigate(shouldStaySignedIn ? '/' : '/login', { replace: shouldStaySignedIn });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '회원가입 완료에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedTerms = useMemo(() => terms, [terms]);

  return (
    <main className="signup-page">
      <section className="signup-shell" aria-labelledby="signup-terms-title">
        <div className="signup-brand">
          <BrandMark />
        </div>

        <h1 className="signup-headline" id="signup-terms-title">
          당신의 음악을, 당신의 공간에
        </h1>

        <ol aria-label="회원가입 단계" className="signup-progress">
          <li className="signup-progress__item">
            <span className="signup-progress__badge">1</span>
            <span className="signup-progress__label">기본정보</span>
          </li>
          <li className="signup-progress__item">
            <span className="signup-progress__badge">2</span>
            <span className="signup-progress__label">부가정보</span>
          </li>
          <li className="signup-progress__item signup-progress__item--active">
            <span className="signup-progress__badge signup-progress__badge--active">3</span>
            <span className="signup-progress__label">약관동의</span>
          </li>
        </ol>

        <form className="signup-card signup-card--terms" onSubmit={handleSubmit}>
          {errorMessage ? (
            <div className="signup-toast" role="alert">
              <span className="signup-toast__text">{errorMessage}</span>
            </div>
          ) : null}
          <div className="terms-list">
            <button className="terms-list__all" onClick={toggleAll} type="button">
              <span className={`terms-check ${allChecked ? 'terms-check--active' : ''}`}>
                <CheckIcon />
              </span>
              <span className="terms-list__all-label">전체 약관 동의</span>
            </button>

            <div className="terms-list__divider" />

            {sortedTerms.map((item) => (
              <div className="terms-item" key={termKey(item)}>
                <button className="terms-item__toggle" onClick={() => toggleAgreement(termKey(item))} type="button">
                  <span className={`terms-check ${agreements[termKey(item)] ? 'terms-check--active' : ''}`}>
                    <CheckIcon />
                  </span>
                </button>
                <a className="terms-item__detail" href={item.contentUrl} rel="noreferrer" target="_blank">
                  <span className="terms-item__label-wrap">
                    <span
                      className={`terms-item__kind ${
                        item.required ? 'terms-item__kind--required' : ''
                      }`}
                    >
                      {item.required ? '(필수)' : '(선택)'}
                    </span>
                    <span className="terms-item__label">{item.title}</span>
                  </span>
                  <span className="terms-item__arrow">
                    <ChevronIcon />
                  </span>
                </a>
              </div>
            ))}
          </div>

          <button
            className={`signup-next-button ${requiredChecked ? 'signup-next-button--active' : ''}`}
            disabled={!requiredChecked || isSubmitting || terms.length === 0}
            type="submit"
          >
            가입완료
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

function termKey(term: Pick<SignupTermResponse, 'termCode' | 'version'>) {
  return `${term.termCode}:${term.version}`;
}
