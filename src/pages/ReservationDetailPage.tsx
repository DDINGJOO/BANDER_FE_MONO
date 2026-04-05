import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ReservationCancelModal } from '../components/reservations/ReservationCancelModal';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import {
  parseReservationDetailVariant,
  reservationDetailChatHref,
  RESERVATION_DETAIL,
  RESERVATION_DETAIL_MAP_IMAGE,
  RESERVATION_REFUND_POLICY,
  type ReservationDetailVariant,
} from '../data/reservationDetail';
import {
  RESERVATION_CANCEL_ALERT_DEFAULT,
  RESERVATION_CANCEL_LEAD_LINES,
  RESERVATION_CANCEL_NOTICE_DEFAULT,
} from '../data/reservationCancelModal';

function ChatGlyph20() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20" width="20" height="20">
      <path
        d="M5.2 6.1C5.2 5.45 5.73 4.92 6.38 4.92H13.62C14.27 4.92 14.8 5.45 14.8 6.1V11.05C14.8 11.7 14.27 12.23 13.62 12.23H11.45L8.9 14.05V12.23H6.38C5.73 12.23 5.2 11.7 5.2 11.05V6.1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
      <path
        d="M8.05 8.55H11.95"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function CopyGlyph18() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 18 18" width="18" height="18">
      <rect
        height="9"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.2"
        width="9"
        x="6.75"
        y="6.75"
      />
      <path
        d="M5.25 11.25H4.5C3.67 11.25 3 10.58 3 9.75V4.5C3 3.67 3.67 3 4.5 3H9.75C10.58 3 11.25 3.67 11.25 4.5V5.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function badgeForVariant(v: ReservationDetailVariant) {
  if (v === 'pending') {
    return { className: 'res-detail__badge res-detail__badge--muted', text: '승인대기' };
  }
  if (v === 'confirmed') {
    return { className: 'res-detail__badge res-detail__badge--blue', text: '예약확정' };
  }
  return { className: 'res-detail__badge res-detail__badge--blue', text: '이용완료' };
}

export function ReservationDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const variant = parseReservationDetailVariant(searchParams.get('status'));
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const d = RESERVATION_DETAIL;
  const badge = badgeForVariant(variant);

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

  const onCopyAddress = () => {
    void navigator.clipboard.writeText(d.address);
  };

  const cta =
    variant === 'completed'
      ? { className: 'res-detail__cta res-detail__cta--yellow', label: '리뷰쓰기' }
      : { className: 'res-detail__cta res-detail__cta--muted', label: '예약취소' };

  return (
    <main className="res-detail-page">
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

      <div className="res-detail-page__main">
        <div className="res-detail">
          <div className="res-detail__title-row">
            <button
              type="button"
              className="res-detail__back"
              onClick={() => navigate(-1)}
              aria-label="뒤로"
            >
              <span className="res-detail__back-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
            <h1 className="res-detail__title">예약상세</h1>
            <span className={badge.className}>{badge.text}</span>
            {variant === 'confirmed' ? (
              <p className="res-detail__headline">{d.confirmedHeadline}</p>
            ) : null}
          </div>

          <div className="res-detail__hero">
            <div className="res-detail__hero-main">
              <img
                alt=""
                className="res-detail__thumb"
                src={d.thumbUrl}
                loading="lazy"
              />
              <div className="res-detail__hero-text">
                <p className="res-detail__space-title">{d.spaceTitle}</p>
                <p className="res-detail__address-line">{d.address}</p>
              </div>
            </div>
            <button
              type="button"
              className="res-detail__chat"
              onClick={() => {
                const dest = reservationDetailChatHref();
                if (!isAuthenticated) {
                  navigate(`/login?returnTo=${encodeURIComponent(dest)}`);
                  return;
                }
                navigate(dest);
              }}
            >
              <span className="res-detail__chat-icon" aria-hidden>
                <ChatGlyph20 />
              </span>
              채팅하기
            </button>
          </div>

          <div className="res-detail__card">
            <div className="res-detail__rows">
              <div className="res-detail__row">
                <span className="res-detail__row-label">일자/시간</span>
                <span className="res-detail__row-value">
                  {d.schedule.dateShort}
                </span>
              </div>
              <div className="res-detail__row">
                <span className="res-detail__row-label">예약 시간</span>
                <span className="res-detail__row-value">{d.schedule.range}</span>
              </div>
              <div className="res-detail__row">
                <span className="res-detail__row-label">예약 인원</span>
                <span className="res-detail__row-value">
                  {d.schedule.peopleLine}
                </span>
              </div>
              <div className="res-detail__row">
                <span className="res-detail__row-label">상품 옵션</span>
                <span className="res-detail__row-value">
                  {d.schedule.options}
                </span>
              </div>
            </div>
          </div>

          <section>
            <h2 className="res-detail__section-title">위치 정보</h2>
            <div className="res-detail__map-wrap">
              <div className="res-detail__map">
                <img alt="" src={RESERVATION_DETAIL_MAP_IMAGE} loading="lazy" />
              </div>
            </div>
            <div className="res-detail__address-copy">
              <p>{d.address}</p>
              <button
                type="button"
                className="res-detail__copy-btn"
                aria-label="주소 복사"
                onClick={onCopyAddress}
              >
                <CopyGlyph18 />
              </button>
            </div>
          </section>

          <hr className="res-detail__divider" />

          <div className="res-detail__stack">
            <section>
              <h2 className="res-detail__section-title">예약자 정보</h2>
              <div className="res-detail__subcard">
                <div className="res-detail__rows">
                  <div className="res-detail__row">
                    <span className="res-detail__row-label">예약번호</span>
                    <span className="res-detail__row-value">
                      {d.booker.reservationNo}
                    </span>
                  </div>
                  <div className="res-detail__row">
                    <span className="res-detail__row-label">이름</span>
                    <span className="res-detail__row-value">{d.booker.name}</span>
                  </div>
                  <div className="res-detail__row">
                    <span className="res-detail__row-label">연락처</span>
                    <span className="res-detail__row-value">{d.booker.phone}</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="res-detail__section-title">결제 정보</h2>
              <div className="res-detail__subcard">
                <div className="res-detail__rows">
                  <div className="res-detail__row">
                    <span className="res-detail__row-label">가격</span>
                    <span className="res-detail__row-value">{d.priceLine}</span>
                  </div>
                  <div className="res-detail__row">
                    <span className="res-detail__row-label">사용 쿠폰</span>
                    <span className="res-detail__row-value">
                      {d.payment.couponLine}
                    </span>
                  </div>
                  <div className="res-detail__row">
                    <span className="res-detail__row-label">사용 포인트</span>
                    <span className="res-detail__row-value">
                      {d.payment.pointLine}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="res-detail__pay-header">
                <h2>결제 금액</h2>
                <p className="res-detail__pay-total">{d.priceLine}</p>
              </div>
              <div className="res-detail__subcard">
                <div className="res-detail__pay-split">
                  <div className="res-detail__pay-split-top">
                    <div className="res-detail__row">
                      <span className="res-detail__row-label">공간 금액</span>
                      <span className="res-detail__row-value">
                        {d.payment.space}
                      </span>
                    </div>
                    <div className="res-detail__row">
                      <span className="res-detail__row-label">옵션 금액</span>
                      <span className="res-detail__row-value">
                        {d.payment.option}
                      </span>
                    </div>
                    <div className="res-detail__row">
                      <span className="res-detail__row-label">포인트</span>
                      <span className="res-detail__row-value">
                        {d.payment.pointLine}
                      </span>
                    </div>
                    <div className="res-detail__row">
                      <span className="res-detail__row-label">쿠폰</span>
                      <span className="res-detail__row-value">
                        {d.payment.couponLine}
                      </span>
                    </div>
                  </div>
                  <div className="res-detail__pay-split-bottom">
                    <div className="res-detail__row">
                      <span className="res-detail__row-label">실 결제 금액</span>
                      <span className="res-detail__row-value">
                        {d.payment.paid}
                      </span>
                    </div>
                    <div className="res-detail__row">
                      <span className="res-detail__row-label">결제 수단</span>
                      <span className="res-detail__row-value">
                        {d.payment.method}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="res-detail__cta-wrap">
            <button
              type="button"
              className={cta.className}
              onClick={() => {
                if (variant === 'completed') {
                  navigate('/review/write');
                  return;
                }
                setCancelModalOpen(true);
              }}
            >
              {cta.label}
            </button>
          </div>

          <footer className="res-detail__refund">
            <p className="res-detail__refund-title">
              <span className="res-detail__refund-dot" aria-hidden />
              환불규정 안내
            </p>
            <ul className="res-detail__refund-list">
              <li className="res-detail__refund-item res-detail__refund-item--lead">
                <span className="res-detail__refund-bar" aria-hidden />
                <span>{RESERVATION_REFUND_POLICY.lead}</span>
              </li>
              {RESERVATION_REFUND_POLICY.rules.map((rule) => (
                <li
                  key={rule}
                  className="res-detail__refund-item res-detail__refund-item--rule"
                >
                  <span className="res-detail__refund-bar" aria-hidden />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </footer>
        </div>
      </div>

      <HomeFooter />

      <ReservationCancelModal
        alertText={RESERVATION_CANCEL_ALERT_DEFAULT}
        dividerAfterRowIndex={1}
        leadLines={RESERVATION_CANCEL_LEAD_LINES}
        noticeRows={RESERVATION_CANCEL_NOTICE_DEFAULT}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => {
          setCancelModalOpen(false);
          navigate('/my-reservations');
        }}
        open={cancelModalOpen}
      />
    </main>
  );
}
