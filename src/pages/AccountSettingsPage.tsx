import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deactivateAccount, getMyAccount } from '../api/users';
import { sendPhoneCode, updatePhone, verifyPhoneCode } from '../api/phone';
import { getLinkedProviders, socialUnlink } from '../api/social';
import { getMarketingConsent, updateMarketingConsent } from '../api/marketing-consent';
import { startOAuth } from '../config/oauth';
import { ApiError } from '../api/client';
import { ChangePasswordModal } from '../components/account/ChangePasswordModal';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { ReactComponent as SnsAppleBadge } from '../assets/icons/mobile/mobile-sns-apple.svg';
import { ReactComponent as SnsGoogleBadge } from '../assets/icons/mobile/mobile-sns-google.svg';
import { ReactComponent as SnsKakaoBadge } from '../assets/icons/mobile/mobile-sns-kakao.svg';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { clearAuthSession, loadAuthSession } from '../data/authSession';
import {
  resolveAccountSettingsEmail,
  type AccountLinkProvider,
} from '../data/accountSettings';
import '../styles/account-settings.css';

function maskPhoneForDisplay(phoneNumber: string) {
  const digits = phoneNumber.replace(/[^0-9]/g, '');
  if (digits.length < 7) return '';
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

function LinkDoneCheck() {
  return (
    <svg
      aria-hidden
      className="account-settings__check-glyph"
      fill="none"
      height="14"
      viewBox="0 0 14 14"
      width="14"
    >
      <path
        d="M3 7.15L5.65 9.8L11 4.45"
        stroke="#6d7a87"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function KakaoGlyph() {
  return <SnsKakaoBadge aria-hidden className="account-settings__sns-svg" />;
}

function GoogleGlyph() {
  return <SnsGoogleBadge aria-hidden className="account-settings__sns-svg" />;
}

function AppleGlyph() {
  return <SnsAppleBadge aria-hidden className="account-settings__sns-svg" />;
}

export function AccountSettingsPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

  const [email, setEmail] = useState(() => resolveAccountSettingsEmail());
  const [marketingOptIn, setMarketingOptIn] = useState<boolean | null>(null);
  const [marketingError, setMarketingError] = useState<string | null>(null);
  const [marketingPending, setMarketingPending] = useState(false);
  const marketingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [linked, setLinked] = useState<Record<AccountLinkProvider, boolean>>({
    kakao: false,
    google: false,
    apple: false,
  });
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // Phone verification
  const [phone, setPhone] = useState('');
  const [phoneStep, setPhoneStep] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [phoneCode, setPhoneCode] = useState('');
  const [verifiedPhoneMasked, setVerifiedPhoneMasked] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
  );

  const onHeaderSearchSubmit = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      navigate(`/search?q=${encodeURIComponent(q)}`);
    },
    [navigate],
  );

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!headerSearchRef.current?.contains(event.target as Node)) {
        setHeaderSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMyAccount()
      .then((account) => {
        if (cancelled) return;
        setEmail(account.email);
        if (account.phoneVerified) {
          setVerifiedPhoneMasked(account.phoneMasked ?? '');
          setPhoneStep('verified');
        }
      })
      .catch(() => {
        // Account details are non-blocking for the settings shell.
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMarketingConsent()
      .then((view) => {
        if (cancelled) return;
        setMarketingOptIn(view.granted);
      })
      .catch(() => {
        if (cancelled) return;
        setMarketingError('마케팅 동의 상태를 불러오지 못했습니다.');
        setMarketingOptIn(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleMarketingToggle = () => {
    if (marketingOptIn === null || marketingPending) return;
    const prev = marketingOptIn;
    const next = !prev;
    setMarketingOptIn(next);
    if (marketingDebounceRef.current !== null) {
      clearTimeout(marketingDebounceRef.current);
    }
    marketingDebounceRef.current = setTimeout(async () => {
      setMarketingPending(true);
      try {
        const view = await updateMarketingConsent({ granted: next });
        setMarketingOptIn(view.granted);
        setMarketingError(null);
      } catch {
        setMarketingOptIn(prev);
        setMarketingError('변경 실패. 잠시 후 다시 시도해주세요.');
      } finally {
        setMarketingPending(false);
      }
    }, 300);
  };

  useEffect(() => {
    let cancelled = false;
    getLinkedProviders()
      .then((result) => {
        if (cancelled) return;
        const map: Record<AccountLinkProvider, boolean> = { kakao: false, google: false, apple: false };
        for (const p of result.providers) {
          const key = p.provider.toLowerCase() as AccountLinkProvider;
          if (key in map) map[key] = true;
        }
        setLinked(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const toggleLink = async (p: AccountLinkProvider) => {
    if (linked[p]) {
      const providerEnum = p.toUpperCase() as 'KAKAO' | 'GOOGLE' | 'APPLE';
      try {
        await socialUnlink(providerEnum);
        setLinked((prev) => ({ ...prev, [p]: false }));
      } catch {
        alert('계정 연동 해제에 실패했습니다.');
      }
    } else {
      const providerEnum = p.toUpperCase() as 'KAKAO' | 'GOOGLE' | 'APPLE';
      startOAuth(providerEnum, 'link');
    }
  };

  return (
    <main className="account-settings-page">
      <HomeHeader
        authenticated={isAuthenticated}
        filteredSuggestions={filteredSuggestions}
        onGuestCta={() => navigate('/login')}
        onSearchChange={(value) => {
          setHeaderSearchQuery(value);
          setHeaderSearchOpen(Boolean(value.trim()));
        }}
        onSearchClear={() => {
          setHeaderSearchQuery('');
          setHeaderSearchOpen(false);
        }}
        onSearchFocus={() =>
          setHeaderSearchOpen(Boolean(headerSearchQuery.trim()))
        }
        onSearchSubmit={onHeaderSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          onHeaderSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <div className="account-settings-page__main">
        <div className="account-settings">
          <header className="account-settings__header">
            <button
              type="button"
              className="account-settings__back"
              onClick={() => navigate(-1)}
              aria-label="뒤로"
            >
              <span className="account-settings__back-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
            <h1 className="account-settings__title">계정 설정</h1>
          </header>

          <div className="account-settings__stack">
            <section className="account-settings__section">
              <span className="account-settings__label" id="account-email-label">
                이메일
              </span>
              <div
                className="account-settings__readonly"
                aria-labelledby="account-email-label"
              >
                {email}
              </div>
            </section>

            <section className="account-settings__section">
              <span className="account-settings__label">비밀번호 변경</span>
              <button
                type="button"
                className="account-settings__password-btn"
                onClick={() => setChangePasswordOpen(true)}
              >
                비밀번호 변경
              </button>
            </section>

            <section className="account-settings__section">
              <span className="account-settings__label">휴대폰 번호</span>
              {phoneStep === 'verified' ? (
                <div className="account-settings__readonly">
                  휴대폰 인증 완료{verifiedPhoneMasked ? ` (${verifiedPhoneMasked})` : ''}
                </div>
              ) : (
                <>
                  <div className="account-settings__phone-row">
                    <input
                      className="account-settings__phone-input"
                      placeholder="01012345678"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/[^0-9]/g, ''));
                        if (phoneStep !== 'idle') {
                          setPhoneStep('idle');
                          setPhoneCode('');
                          setPhoneError('');
                        }
                      }}
                      maxLength={11}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                    />
                    <button
                      type="button"
                      className="account-settings__verify-btn"
                      disabled={phone.length < 10 || phoneSending}
                      onClick={async () => {
                        setPhoneSending(true);
                        setPhoneError('');
                        try {
                          await sendPhoneCode(phone);
                          setPhoneStep('sent');
                        } catch (err) {
                          setPhoneError(err instanceof ApiError ? err.message : '인증번호 전송에 실패했습니다.');
                        } finally {
                          setPhoneSending(false);
                        }
                      }}
                    >
                      {phoneSending ? '전송 중...' : phoneStep === 'sent' ? '재전송' : '인증받기'}
                    </button>
                  </div>
                  {phoneStep === 'sent' ? (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        className="account-settings__phone-code"
                        placeholder="인증번호 입력"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength={6}
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
                      />
                      <button
                        type="button"
                        className="account-settings__verify-btn"
                        disabled={phoneCode.length !== 6 || phoneVerifying}
                        onClick={async () => {
                          setPhoneVerifying(true);
                          setPhoneError('');
                          try {
                            const result = await verifyPhoneCode(phone, phoneCode);
                            if (result.verified) {
                              await updatePhone(phone, result.verificationToken);
                              setVerifiedPhoneMasked(maskPhoneForDisplay(phone));
                              setPhoneStep('verified');
                            } else {
                              setPhoneError('인증번호가 올바르지 않습니다.');
                            }
                          } catch (err) {
                            setPhoneError(err instanceof ApiError ? err.message : '인증에 실패했습니다.');
                          } finally {
                            setPhoneVerifying(false);
                          }
                        }}
                      >
                        {phoneVerifying ? '확인 중...' : '확인'}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
              {phoneError ? (
                <p style={{ marginTop: '8px', color: '#e74c3c', fontSize: '13px' }}>{phoneError}</p>
              ) : null}
            </section>

            <section className="account-settings__section">
              <span className="account-settings__label">선택 약관 동의</span>
              <div className="account-settings__marketing-row">
                <div className="account-settings__marketing-left">
                  <button
                    type="button"
                    className="account-settings__consent-toggle"
                    aria-pressed={marketingOptIn ?? false}
                    disabled={marketingOptIn === null || marketingPending}
                    onClick={handleMarketingToggle}
                    aria-label="마케팅 정보 수신 동의"
                  >
                    {marketingOptIn ? (
                      <svg
                        aria-hidden
                        fill="none"
                        height="10"
                        viewBox="0 0 12 10"
                        width="12"
                      >
                        <path
                          d="M1 5l3.5 3.5L11 1"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden
                        fill="none"
                        height="7"
                        viewBox="0 0 10 7"
                        width="10"
                      >
                        <path
                          d="M1 1h8M1 3.5h5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.2"
                        />
                      </svg>
                    )}
                  </button>
                  <div className="account-settings__consent-text">
                    <span className="account-settings__consent-optional">
                      (선택)
                    </span>
                    <span className="account-settings__consent-main">
                      마케팅 정보 수신동의
                    </span>
                  </div>
                </div>
                <a
                  className="account-settings__marketing-chevron"
                  href="/signup/terms"
                  aria-label="약관 자세히 보기"
                >
                  <ChevronIcon />
                </a>
              </div>
              {marketingError ? (
                <p style={{ marginTop: '6px', color: '#e74c3c', fontSize: '13px' }}>
                  {marketingError}
                </p>
              ) : null}
            </section>

            <section className="account-settings__section">
              <span className="account-settings__label">계정연동</span>
              <div className="account-settings__link-box">
                <div className="account-settings__link-row">
                  <div className="account-settings__link-left">
                    <span
                      className="account-settings__sns-icon account-settings__sns-icon--kakao"
                      aria-hidden
                    >
                      <KakaoGlyph />
                    </span>
                    <span className="account-settings__sns-name">카카오</span>
                  </div>
                  <div className="account-settings__link-status">
                    {linked.kakao ? (
                      <>
                        <LinkDoneCheck />
                        <span className="account-settings__link-done">
                          연동완료
                        </span>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="account-settings__link-action"
                        onClick={() => toggleLink('kakao')}
                      >
                        연동하기
                      </button>
                    )}
                  </div>
                </div>
                <div className="account-settings__link-row">
                  <div className="account-settings__link-left">
                    <span
                      className="account-settings__sns-icon account-settings__sns-icon--google"
                      aria-hidden
                    >
                      <GoogleGlyph />
                    </span>
                    <span className="account-settings__sns-name">구글</span>
                  </div>
                  {linked.google ? (
                    <div className="account-settings__link-status">
                      <LinkDoneCheck />
                      <span className="account-settings__link-done">
                        연동완료
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="account-settings__link-action"
                      onClick={() => toggleLink('google')}
                    >
                      연동하기
                    </button>
                  )}
                </div>
                <div className="account-settings__link-row">
                  <div className="account-settings__link-left">
                    <span
                      className="account-settings__sns-icon account-settings__sns-icon--apple"
                      aria-hidden
                    >
                      <AppleGlyph />
                    </span>
                    <span className="account-settings__sns-name">애플</span>
                  </div>
                  {linked.apple ? (
                    <div className="account-settings__link-status">
                      <LinkDoneCheck />
                      <span className="account-settings__link-done">
                        연동완료
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="account-settings__link-action"
                      onClick={() => toggleLink('apple')}
                    >
                      연동하기
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="account-settings__withdraw-wrap">
            <button
              type="button"
              className="account-settings__withdraw"
              onClick={async () => {
                if (!window.confirm('정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
                try {
                  await deactivateAccount();
                  clearAuthSession();
                  navigate('/');
                } catch {
                  alert('회원 탈퇴에 실패했습니다.');
                }
              }}
            >
              회원탈퇴
            </button>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      <HomeFooter />
    </main>
  );
}
