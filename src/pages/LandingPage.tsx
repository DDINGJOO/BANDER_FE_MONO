import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrandMark } from '../components/shared/BrandMark';
import { HomeFooter } from '../components/home/HomeFooter';

type UserType = 'GENERAL' | 'OWNER';

type ConsentState = {
  service: boolean;
  privacy: boolean;
  marketing: boolean;
};

const INITIAL_CONSENT: ConsentState = {
  service: false,
  privacy: false,
  marketing: false,
};

const APP_PHONES_SRC = `${process.env.PUBLIC_URL ?? ''}/main/app-phones.png`;
const HERO_IMAGE_SRC = `${process.env.PUBLIC_URL ?? ''}/main/hero-image.png`;
const HOST_CTA_PICK = `${process.env.PUBLIC_URL ?? ''}/main/host-cta-pick.svg`;
const HOST_CTA_ARROW = `${process.env.PUBLIC_URL ?? ''}/main/host-cta-arrow.svg`;

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function isValidPhone(formatted: string): boolean {
  return /^010-\d{4}-\d{4}$/.test(formatted);
}

export function LandingPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [consent, setConsent] = useState<ConsentState>(INITIAL_CONSENT);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const allRequiredConsented = consent.service && consent.privacy;
  const allConsented = consent.service && consent.privacy && consent.marketing;

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      isValidPhone(phone) &&
      userType !== null &&
      allRequiredConsented
    );
  }, [name, phone, userType, allRequiredConsented]);

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(event.target.value));
  };

  const toggleAll = () => {
    const next = !allConsented;
    setConsent({ service: next, privacy: next, marketing: next });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!canSubmit) {
      if (name.trim().length < 2) {
        setError('이름을 2자 이상 입력해주세요.');
      } else if (!isValidPhone(phone)) {
        setError('전화번호 형식을 확인해주세요. (010-0000-0000)');
      } else if (!userType) {
        setError('회원 유형을 선택해주세요.');
      } else if (!allRequiredConsented) {
        setError('필수 약관에 동의해주세요.');
      }
      return;
    }

    const endpoint =
      process.env.REACT_APP_LANDING_PREREGISTER_URL ?? '/api/v1/landing/pre-register';

    setSubmitting(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          userType,
          consent,
          submittedAt: new Date().toISOString(),
        }),
        credentials: 'omit',
      });
      if (!response.ok) {
        throw new Error(`pre-register endpoint responded ${response.status}`);
      }
      setSubmitted(true);
    } catch {
      setError('사전신청 전송에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setUserType(null);
    setConsent(INITIAL_CONSENT);
    setSubmitted(false);
    setError(null);
  };

  return (
    <div className="landing" ref={rootRef}>
      <div className="landing__bg" aria-hidden="true">
        <span className="landing__bg-blob landing__bg-blob--1" />
        <span className="landing__bg-blob landing__bg-blob--2" />
        <span className="landing__bg-blob landing__bg-blob--3" />
      </div>

      <header className="landing__header">
        <BrandMark />
        <nav className="landing__nav" aria-label="섹션 바로가기">
          <a className="landing__nav-link" href="#features">서비스</a>
          <a className="landing__nav-link" href="#preview">앱 미리보기</a>
          <a className="landing__nav-link" href="#how">이용방법</a>
          <a className="landing__nav-link" href="#faq">FAQ</a>
          <a className="landing__nav-cta" href="#apply">사전신청</a>
        </nav>
      </header>

      <main>
        <section className="landing__hero" aria-labelledby="landing-hero-title">
          <div className="landing__hero-inner">
            <span className="landing__eyebrow" data-reveal>BANDER 사전신청</span>
            <h1 className="landing__hero-title" id="landing-hero-title" data-reveal>
              합주실 찾기,
              <br />
              이제 <span className="landing__hero-highlight">밴더</span>로.
            </h1>
            <p className="landing__hero-sub" data-reveal>
              근처 합주실·녹음실·공연장을 한곳에서 찾고,
              <br />
              실시간으로 예약하고, 밴드 동료까지 만나보세요.
            </p>
            <div className="landing__hero-actions" data-reveal>
              <a className="landing__btn landing__btn--primary landing__btn--shine" href="#apply">
                지금 사전신청
                <span className="landing__btn-arrow" aria-hidden="true">→</span>
              </a>
              <a className="landing__btn landing__btn--ghost" href="#preview">
                앱 미리보기
              </a>
            </div>
            <ul className="landing__hero-meta" data-reveal>
              <li>카카오 1초 로그인</li>
              <li>토스 결제</li>
              <li>실시간 슬롯 예약</li>
            </ul>
          </div>
          <div className="landing__hero-art" aria-hidden="true" data-reveal>
            <div className="landing__hero-orb" />
            <div className="landing__hero-orb-glow" />
            <div className="landing__hero-card landing__hero-card--1">
              <span className="landing__hero-card-tag">합주실</span>
              <p className="landing__hero-card-title">홍대 사운드파크</p>
              <p className="landing__hero-card-meta">시간당 22,000원</p>
            </div>
            <div className="landing__hero-card landing__hero-card--2">
              <span className="landing__hero-card-tag">실시간 예약</span>
              <p className="landing__hero-card-title">오늘 19:00 가능</p>
              <p className="landing__hero-card-meta">2시간 · 토스 결제</p>
            </div>
            <span className="landing__hero-note landing__hero-note--1" aria-hidden="true">♪</span>
            <span className="landing__hero-note landing__hero-note--2" aria-hidden="true">♫</span>
            <span className="landing__hero-note landing__hero-note--3" aria-hidden="true">♩</span>
          </div>
        </section>

        <section
          className="landing__features"
          id="features"
          aria-labelledby="landing-features-title"
        >
          <h2 className="landing__section-title" id="landing-features-title" data-reveal>
            누구를 위한 서비스인가요?
          </h2>
          <p className="landing__section-sub" data-reveal>
            연주자, 공간 관리자, 그리고 함께 음악할 동료까지.
            <br />
            밴더 한 곳에서 모두 만날 수 있어요.
          </p>
          <div className="landing__feature-grid">
            <article className="landing__feature-card" data-reveal>
              <span className="landing__feature-badge">일반 유저</span>
              <h3 className="landing__feature-title">합주실, 1분 안에 예약</h3>
              <p className="landing__feature-desc">
                지도와 필터로 근처 합주실을 비교하고, 원하는 시간 슬롯을 골라
                토스로 결제까지 한 번에 끝내세요.
              </p>
            </article>
            <article className="landing__feature-card landing__feature-card--accent" data-reveal>
              <span className="landing__feature-badge">공간 관리자</span>
              <h3 className="landing__feature-title">예약을 자동화하세요</h3>
              <p className="landing__feature-desc">
                슬롯과 요금제를 한 번 설정하면 24시간 자동 예약. 전화 응대
                부담 없이 예약·정산을 한 화면에서 관리해요.
              </p>
            </article>
            <article className="landing__feature-card" data-reveal>
              <span className="landing__feature-badge">커뮤니티</span>
              <h3 className="landing__feature-title">밴드 동료를 찾아요</h3>
              <p className="landing__feature-desc">
                포지션과 장르로 음악 동료를 만나고, 미니피드와 1:1 채팅으로
                합주 활동을 이어가세요.
              </p>
            </article>
          </div>
        </section>

        <section
          className="landing__preview"
          id="preview"
          aria-labelledby="landing-preview-title"
        >
          <div className="landing__preview-inner">
            <div className="landing__preview-copy">
              <span className="landing__eyebrow" data-reveal>App Preview</span>
              <h2 className="landing__section-title landing__section-title--left" id="landing-preview-title" data-reveal>
                실제 화면을
                <br />
                미리 보여드릴게요
              </h2>
              <p className="landing__preview-desc" data-reveal>
                지도에서 합주실을 찾고, 슬롯을 골라 결제하고, 합주 후 미니피드에
                기록까지. 모바일에 최적화된 화면으로 어디서든 빠르게.
              </p>
              <ul className="landing__preview-list" data-reveal>
                <li>
                  <span className="landing__preview-list-dot" aria-hidden="true" />
                  카카오맵으로 위치·거리 한눈에
                </li>
                <li>
                  <span className="landing__preview-list-dot" aria-hidden="true" />
                  실시간 슬롯 + 토스 결제
                </li>
                <li>
                  <span className="landing__preview-list-dot" aria-hidden="true" />
                  합주 활동 미니피드 기록
                </li>
              </ul>
            </div>
            <div className="landing__preview-stage" aria-hidden="true" data-reveal>
              <img
                alt=""
                className="landing__preview-image"
                loading="lazy"
                src={APP_PHONES_SRC}
              />
              <div className="landing__preview-chip landing__preview-chip--1">
                <span className="landing__preview-chip-tag">지도 검색</span>
                <p>합주실 24곳</p>
              </div>
              <div className="landing__preview-chip landing__preview-chip--2">
                <span className="landing__preview-chip-tag">예약 완료</span>
                <p>오늘 19:00–21:00</p>
              </div>
              <div className="landing__preview-chip landing__preview-chip--3">
                <span className="landing__preview-chip-tag">미니피드</span>
                <p>오늘 합주 후기 ♪</p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing__how" id="how" aria-labelledby="landing-how-title">
          <h2 className="landing__section-title" id="landing-how-title" data-reveal>
            이렇게 사용해요
          </h2>
          <p className="landing__section-sub" data-reveal>
            검색부터 후기까지, 4단계면 충분해요.
          </p>
          <ol className="landing__steps">
            <li className="landing__step" data-reveal>
              <span className="landing__step-num">1</span>
              <h3 className="landing__step-title">검색하기</h3>
              <p className="landing__step-desc">
                지역, 날짜, 인원으로 원하는 합주실을 찾아보세요.
              </p>
            </li>
            <li className="landing__step" data-reveal>
              <span className="landing__step-num">2</span>
              <h3 className="landing__step-title">비교하기</h3>
              <p className="landing__step-desc">
                가격·후기·장비를 한눈에 비교하고 마음에 드는 곳을 골라요.
              </p>
            </li>
            <li className="landing__step" data-reveal>
              <span className="landing__step-num">3</span>
              <h3 className="landing__step-title">예약·결제</h3>
              <p className="landing__step-desc">
                원하는 시간 슬롯을 선택하고 토스로 결제까지 한 번에.
              </p>
            </li>
            <li className="landing__step" data-reveal>
              <span className="landing__step-num">4</span>
              <h3 className="landing__step-title">기록하기</h3>
              <p className="landing__step-desc">
                합주 후 후기를 남기고 미니피드에 활동을 기록해요.
              </p>
            </li>
          </ol>
        </section>

        <section
          className="landing__owner"
          aria-labelledby="landing-owner-title"
          data-reveal
        >
          <div className="landing__owner-inner">
            <img
              alt=""
              aria-hidden="true"
              className="landing__owner-pick"
              loading="lazy"
              src={HOST_CTA_PICK}
            />
            <div className="landing__owner-copy">
              <span className="landing__eyebrow landing__eyebrow--dark">Pre-register</span>
              <h2 className="landing__section-title landing__section-title--light" id="landing-owner-title">
                오픈 소식,
                <br />
                가장 먼저 받아보세요
              </h2>
              <p className="landing__owner-desc">
                서비스 시작 소식을 받아보고 싶으신가요?
              </p>
              <a
                className="landing__btn landing__btn--yellow landing__btn--shine"
                href="#apply"
              >
                사전신청하러 가기
                <img alt="" aria-hidden="true" className="landing__owner-arrow" src={HOST_CTA_ARROW} />
              </a>
            </div>
          </div>
        </section>

        <section className="landing__apply" id="apply" aria-labelledby="landing-apply-title">
          <div className="landing__apply-card" data-reveal>
            <div className="landing__apply-intro">
              <span className="landing__eyebrow">사전신청</span>
              <h2 className="landing__section-title landing__section-title--left" id="landing-apply-title">
                먼저 만나보고 싶다면
              </h2>
              <p className="landing__apply-desc">
                정식 오픈 시 가장 먼저 알려드리고, 사전신청자 전용 혜택을 보내드릴게요.
              </p>
              <ul className="landing__apply-perks">
                <li>오픈 알림 SMS</li>
                <li>사전신청자 전용 쿠폰</li>
                <li>관리자 베타 우선 초대</li>
              </ul>
              <img
                alt=""
                aria-hidden="true"
                className="landing__apply-image"
                loading="lazy"
                src={HERO_IMAGE_SRC}
              />
            </div>

            {submitted ? (
              <div className="landing__apply-success" role="status" aria-live="polite">
                <div className="landing__apply-success-mark" aria-hidden="true">✓</div>
                <h3 className="landing__apply-success-title">사전신청이 완료되었어요</h3>
                <p className="landing__apply-success-desc">
                  입력해주신 번호로 오픈 소식을 가장 먼저 보내드릴게요.
                </p>
                <button className="landing__btn landing__btn--ghost" onClick={handleReset} type="button">
                  다른 정보로 다시 신청
                </button>
              </div>
            ) : (
              <form className="landing__form" noValidate onSubmit={handleSubmit}>
                <div className="landing__field">
                  <label className="landing__label" htmlFor="landing-name">
                    이름 <span className="landing__required">*</span>
                  </label>
                  <input
                    autoComplete="name"
                    className="landing__input"
                    id="landing-name"
                    maxLength={30}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="홍길동"
                    type="text"
                    value={name}
                  />
                </div>

                <div className="landing__field">
                  <label className="landing__label" htmlFor="landing-phone">
                    전화번호 <span className="landing__required">*</span>
                  </label>
                  <input
                    autoComplete="tel"
                    className="landing__input"
                    id="landing-phone"
                    inputMode="numeric"
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    type="tel"
                    value={phone}
                  />
                  <p className="landing__hint">오픈 알림과 사전신청 쿠폰 발송에 사용돼요.</p>
                </div>

                <div className="landing__field">
                  <span className="landing__label">
                    회원 유형 <span className="landing__required">*</span>
                  </span>
                  <div className="landing__usertype" role="radiogroup" aria-label="회원 유형">
                    <button
                      aria-checked={userType === 'GENERAL'}
                      className={`landing__usertype-card ${userType === 'GENERAL' ? 'is-selected' : ''}`}
                      onClick={() => setUserType('GENERAL')}
                      role="radio"
                      type="button"
                    >
                      <span className="landing__usertype-emoji" aria-hidden="true">🎸</span>
                      <span className="landing__usertype-name">일반 유저</span>
                      <span className="landing__usertype-desc">합주실을 찾고 예약해요</span>
                    </button>
                    <button
                      aria-checked={userType === 'OWNER'}
                      className={`landing__usertype-card ${userType === 'OWNER' ? 'is-selected' : ''}`}
                      onClick={() => setUserType('OWNER')}
                      role="radio"
                      type="button"
                    >
                      <span className="landing__usertype-emoji" aria-hidden="true">🏠</span>
                      <span className="landing__usertype-name">공간 관리자</span>
                      <span className="landing__usertype-desc">합주실·연습실을 운영해요</span>
                    </button>
                  </div>
                </div>

                <div className="landing__field">
                  <span className="landing__label">약관 동의</span>
                  <div className="landing__consent">
                    <label className="landing__consent-item landing__consent-item--all">
                      <input checked={allConsented} onChange={toggleAll} type="checkbox" />
                      <span>약관 전체 동의</span>
                    </label>
                    <label className="landing__consent-item">
                      <input
                        checked={consent.service}
                        onChange={(event) => setConsent((prev) => ({ ...prev, service: event.target.checked }))}
                        type="checkbox"
                      />
                      <span>
                        <span className="landing__consent-tag landing__consent-tag--required">필수</span>
                        서비스 이용약관 동의
                      </span>
                    </label>
                    <label className="landing__consent-item">
                      <input
                        checked={consent.privacy}
                        onChange={(event) => setConsent((prev) => ({ ...prev, privacy: event.target.checked }))}
                        type="checkbox"
                      />
                      <span>
                        <span className="landing__consent-tag landing__consent-tag--required">필수</span>
                        개인정보 수집·이용 동의
                      </span>
                    </label>
                    <label className="landing__consent-item">
                      <input
                        checked={consent.marketing}
                        onChange={(event) => setConsent((prev) => ({ ...prev, marketing: event.target.checked }))}
                        type="checkbox"
                      />
                      <span>
                        <span className="landing__consent-tag">선택</span>
                        마케팅 정보 수신 동의
                      </span>
                    </label>
                  </div>
                </div>

                {error ? (
                  <p className="landing__error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  className="landing__btn landing__btn--primary landing__btn--submit"
                  disabled={!canSubmit || submitting}
                  type="submit"
                >
                  {submitting ? '전송 중…' : '사전신청 완료'}
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="landing__faq" id="faq" aria-labelledby="landing-faq-title">
          <h2 className="landing__section-title" id="landing-faq-title" data-reveal>
            자주 묻는 질문
          </h2>
          <div className="landing__faq-list">
            <details className="landing__faq-item" data-reveal>
              <summary>밴더는 언제 정식 오픈되나요?</summary>
              <p>
                2026년 상반기 정식 오픈을 목표로 준비중이에요. 사전신청자에게
                오픈 소식을 가장 먼저 알려드릴게요.
              </p>
            </details>
            <details className="landing__faq-item" data-reveal>
              <summary>이용 요금은 어떻게 되나요?</summary>
              <p>
                밴더 가입과 검색·커뮤니티 이용은 무료입니다. 합주실 예약 결제
                시에만 해당 공간이 정해둔 정상 요금이 청구돼요.
              </p>
            </details>
            <details className="landing__faq-item" data-reveal>
              <summary>결제와 환불은 어떻게 되나요?</summary>
              <p>
                결제는 토스페이먼츠를 통해 카드·간편결제로 진행되며, 환불은
                각 공간의 환불 규정에 따라 자동 처리됩니다.
              </p>
            </details>
            <details className="landing__faq-item" data-reveal>
              <summary>공간 관리자로 등록하려면 어떻게 하나요?</summary>
              <p>
                사전신청 시 ‘공간 관리자’를 선택해 주세요. 정식 오픈 전 베타
                입점 절차를 순차적으로 안내드립니다.
              </p>
            </details>
            <details className="landing__faq-item" data-reveal>
              <summary>입력한 개인정보는 어떻게 사용되나요?</summary>
              <p>
                오픈 알림과 사전신청자 쿠폰 발송 목적으로만 사용되며, 정식
                오픈 후 6개월 내 안전하게 파기합니다.
              </p>
            </details>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
