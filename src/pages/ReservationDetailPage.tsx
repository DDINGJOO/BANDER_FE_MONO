import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ReservationCancelModal } from '../components/reservations/ReservationCancelModal';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import {
  RESERVATION_DETAIL,
  RESERVATION_DETAIL_MAP_IMAGE,
  RESERVATION_REFUND_POLICY,
  parseReservationDetailVariant,
  reservationDetailChatHref,
  type ReservationDetailVariant,
} from '../data/reservationDetail';
import {
  RESERVATION_CANCEL_ALERT_DEFAULT,
  RESERVATION_CANCEL_LEAD_LINES,
  RESERVATION_CANCEL_NOTICE_DEFAULT,
} from '../data/reservationCancelModal';
import { getBookingDetail, cancelBooking, type BookingDetailResponse } from '../api/bookings';
import { isMockMode } from '../config/publicEnv';

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

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${weekday}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatPrice(price: number) {
  return `${price.toLocaleString()}원`;
}

function badgeForStatus(status: string) {
  if (status === 'PENDING') {
    return { className: 'res-detail__badge res-detail__badge--muted', text: '승인대기' };
  }
  if (status === 'CONFIRMED') {
    return { className: 'res-detail__badge res-detail__badge--blue', text: '예약확정' };
  }
  return { className: 'res-detail__badge res-detail__badge--blue', text: '이용완료' };
}

export function ReservationDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [detail, setDetail] = useState<BookingDetailResponse | null>(null);

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
    if (isMockMode()) {
      const variant: ReservationDetailVariant = parseReservationDetailVariant(
        searchParams.get('status'),
      );
      const mockDetail: BookingDetailResponse = {
        bookingId: '1',
        roomId: '1',
        roomName: RESERVATION_DETAIL.spaceTitle,
        studioName: '유스뮤직',
        status: variant === 'pending' ? 'PENDING' : variant === 'completed' ? 'COMPLETED' : 'CONFIRMED',
        startsAt: '2025-08-13T16:00:00',
        endsAt: '2025-08-13T17:00:00',
        totalPrice: 20000,
        paymentMethod: RESERVATION_DETAIL.payment.method,
        bookerName: RESERVATION_DETAIL.booker.name,
        bookerPhone: RESERVATION_DETAIL.booker.phone,
        bookerNote: null,
        cancelReason: null,
        createdAt: '2025-08-09T10:00:00',
      };
      setDetail(mockDetail);
      return;
    }

    if (!bookingId) return;
    getBookingDetail(bookingId)
      .then(setDetail)
      .catch(() => undefined);
  }, [bookingId, searchParams]);

  if (!detail) {
    return null;
  }

  const badge = badgeForStatus(detail.status);
  const isCompleted = detail.status === 'COMPLETED';

  const onCopyAddress = () => {
    void navigator.clipboard.writeText('서울시 마포구 독막로9길 31 지하 1층');
  };

  const startFormatted = formatDateTime(detail.startsAt);
  const endDate = new Date(detail.endsAt);
  const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
  const durationMs = endDate.getTime() - new Date(detail.startsAt).getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  const cta = isCompleted
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
          </div>

          <div className="res-detail__hero">
            <div className="res-detail__hero-main">
              <div className="res-detail__hero-text">
                <p className="res-detail__space-title">{detail.roomName}</p>
                <p className="res-detail__address-line">{detail.studioName}</p>
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
                <span className="res-detail__row-value">{startFormatted}</span>
              </div>
              <div className="res-detail__row">
                <span className="res-detail__row-label">예약 시간</span>
                <span className="res-detail__row-value">
                  {startFormatted} ~ {endTime} (총 {durationHours}시간)
                </span>
              </div>
              {detail.bookerNote ? (
                <div className="res-detail__row">
                  <span className="res-detail__row-label">추가 요청사항</span>
                  <span className="res-detail__row-value">{detail.bookerNote}</span>
                </div>
              ) : null}
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
              <p>서울시 마포구 독막로9길 31 지하 1층</p>
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
                    <span className="res-detail__row-value">{detail.bookingId}</span>
                  </div>
                  <div className="res-detail__row">
                    <span className="res-detail__row-label">이름</span>
                    <span className="res-detail__row-value">{detail.bookerName}</span>
                  </div>
                  <div className="res-detail__row">
                    <span className="res-detail__row-label">연락처</span>
                    <span className="res-detail__row-value">{detail.bookerPhone}</span>
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
                    <span className="res-detail__row-value">{formatPrice(detail.totalPrice)}</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="res-detail__pay-header">
                <h2>결제 금액</h2>
                <p className="res-detail__pay-total">{formatPrice(detail.totalPrice)}</p>
              </div>
              <div className="res-detail__subcard">
                <div className="res-detail__pay-split">
                  <div className="res-detail__pay-split-bottom">
                    <div className="res-detail__row">
                      <span className="res-detail__row-label">실 결제 금액</span>
                      <span className="res-detail__row-value">{formatPrice(detail.totalPrice)}</span>
                    </div>
                    {detail.paymentMethod ? (
                      <div className="res-detail__row">
                        <span className="res-detail__row-label">결제 수단</span>
                        <span className="res-detail__row-value">{detail.paymentMethod}</span>
                      </div>
                    ) : null}
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
                if (isCompleted) {
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
          if (bookingId) {
            cancelBooking(bookingId, { cancelReason: '고객 취소' })
              .then(() => navigate('/my-reservations'))
              .catch(() => undefined);
          }
          setCancelModalOpen(false);
        }}
        open={cancelModalOpen}
      />
    </main>
  );
}
