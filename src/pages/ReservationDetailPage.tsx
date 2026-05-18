import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { KakaoAddressMapView } from '../components/map/KakaoAddressMapView';
import { useGuestGate } from '../components/home/GuestGateProvider';
import { ReservationCancelModal } from '../components/reservations/ReservationCancelModal';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import {
  RESERVATION_REFUND_POLICY,
  reservationDetailChatHref,
} from '../data/reservationDetail';
import {
  RESERVATION_CANCEL_ALERT_DEFAULT,
  RESERVATION_CANCEL_LEAD_LINES,
  RESERVATION_CANCEL_NOTICE_DEFAULT,
  buildCancelLeadLines,
  buildCancelNoticeRows,
} from '../data/reservationCancelModal';
import {
  getBookingDetail,
  cancelBooking,
  getMyReviews,
  getRefundEstimate,
  type BookingDetailResponse,
  type ReservationAnswerRequest,
} from '../api/bookings';
import { fetchStudioSpaceDetail } from '../api/spaces';
import type { ReservationCancelNoticeRow } from '../components/reservations/ReservationCancelModal';

type MapCoordinate = {
  lat: number;
  lng: number;
};

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

function formatPhone(phone: string | null | undefined) {
  const raw = phone?.trim();
  if (!raw) return '(연락처 미등록)';

  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

function isBookerNameAnswer(answer: ReservationAnswerRequest) {
  const normalized = answer.title
    .toLowerCase()
    .replace(/[\s:/._-]/g, '');
  return [
    '예약자이름',
    '예약자명',
    '예약자성함',
    '신청자이름',
    '신청자명',
    '성함',
    '이름',
    'name',
    'bookername',
  ].includes(normalized);
}

function isBookerPhoneAnswer(answer: ReservationAnswerRequest) {
  const normalized = answer.title
    .toLowerCase()
    .replace(/[\s:/._-]/g, '');
  return [
    '연락처',
    '전화번호',
    '휴대폰',
    '휴대폰번호',
    '예약자연락처',
    '신청자연락처',
    'phone',
    'bookerphone',
  ].includes(normalized);
}

function joinStudioAddress(roadAddress?: string | null, detailAddress?: string | null) {
  return [roadAddress?.trim(), detailAddress?.trim()].filter(Boolean).join(' ');
}

/**
 * BookingDetail.status 는 booking-service 의 raw DB status (BookingStatus enum 10종) 일 수도,
 * read-service 의 view-status (PENDING/CONFIRMED/COMPLETED/CANCELED_USER/CANCELED_VENDOR 등) 일
 * 수도 있다. ADR-002 (2026-05-12) 자동 환불 정책 정합성 확인:
 *   - REFUND_REQUESTED / CANCEL_REQUESTED → 환불 처리 중
 *   - CANCELLED / REFUNDED → 사용자 취소 계열
 *   - REJECTED → 점주(또는 시스템 자동) 취소 계열
 */
function badgeForStatus(status: string) {
  if (status === 'PENDING' || status === 'PENDING_PAYMENT' || status === 'PENDING_APPROVAL') {
    return { className: 'res-detail__badge res-detail__badge--muted', text: '예약대기' };
  }
  if (status === 'PAYMENT_CONFIRMING') {
    return { className: 'res-detail__badge res-detail__badge--muted', text: '결제 확인 중' };
  }
  if (status === 'CONFIRMED' || status === 'PAID') {
    return { className: 'res-detail__badge res-detail__badge--blue', text: '예약확정' };
  }
  if (status === 'COMPLETED') {
    return { className: 'res-detail__badge res-detail__badge--blue', text: '이용완료' };
  }
  if (status === 'CANCEL_REQUESTED' || status === 'REFUND_REQUESTED') {
    return { className: 'res-detail__badge res-detail__badge--muted', text: '환불 처리 중' };
  }
  if (status === 'CANCELED_USER' || status === 'CANCELLED' || status === 'REFUNDED') {
    return { className: 'res-detail__badge res-detail__badge--muted', text: '예약취소' };
  }
  if (status === 'CANCELED_VENDOR' || status === 'REJECTED') {
    return { className: 'res-detail__badge res-detail__badge--muted', text: '업체예약취소' };
  }
  return { className: 'res-detail__badge res-detail__badge--muted', text: status };
}

/**
 * ADR-002: 환불 정책 자동화 — 사용자 측 cancel = 즉시 정책 기반 자동 환불.
 *   - PENDING / CONFIRMED / PAID : 사용자 취소(환불) 가능
 *   - COMPLETED (예약 시작 시간 도래) : 환불 불가, 리뷰 작성 가능
 *   - 그 외 (취소/거절/환불 진행 중) : 액션 없음
 */
function reservationAction(status: string): 'cancel' | 'review' | 'none' {
  if (
    status === 'PENDING' ||
    status === 'PENDING_PAYMENT' ||
    status === 'PENDING_APPROVAL' ||
    status === 'CONFIRMED' ||
    status === 'PAID'
  ) {
    return 'cancel';
  }
  if (status === 'COMPLETED') {
    return 'review';
  }
  return 'none';
}

export function ReservationDetailPage() {
  const navigate = useNavigate();
  const { openGuestGate } = useGuestGate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelNoticeRows, setCancelNoticeRows] = useState<ReservationCancelNoticeRow[]>(RESERVATION_CANCEL_NOTICE_DEFAULT);
  const [cancelLeadLines, setCancelLeadLines] = useState<[string, string]>(RESERVATION_CANCEL_LEAD_LINES);
  const [cancelQuoteId, setCancelQuoteId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [detail, setDetail] = useState<BookingDetailResponse | null>(null);
  const [hasReview, setHasReview] = useState(false);
  const [studioMapCenter, setStudioMapCenter] = useState<MapCoordinate | null>(null);
  const [studioMapAddress, setStudioMapAddress] = useState<string | null>(null);

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
    if (!bookingId) return;
    setHasReview(false);
    setStudioMapCenter(null);
    setStudioMapAddress(null);
    getBookingDetail(bookingId)
      .then(setDetail)
      .catch(() => undefined);
    getMyReviews({ size: 100 })
      .then((page) => {
        setHasReview(page.items.some((review) => review.bookingId === bookingId));
      })
      .catch(() => undefined);
  }, [bookingId]);

  useEffect(() => {
    const studioId = detail?.studioId?.trim();
    if (!studioId) {
      setStudioMapCenter(null);
      setStudioMapAddress(null);
      return;
    }

    let mounted = true;
    fetchStudioSpaceDetail(studioId)
      .then((studio) => {
        if (!mounted) return;
        const address = studio.address;
        const lat = address?.latitude;
        const lng = address?.longitude;
        setStudioMapAddress(joinStudioAddress(address?.roadAddress, address?.detailAddress) || null);
        setStudioMapCenter(
          typeof lat === 'number' && Number.isFinite(lat)
            && typeof lng === 'number' && Number.isFinite(lng)
            ? { lat, lng }
            : null
        );
      })
      .catch(() => {
        if (!mounted) return;
        setStudioMapCenter(null);
        setStudioMapAddress(null);
      });

    return () => {
      mounted = false;
    };
  }, [detail?.studioId]);

  if (!detail) {
    return null;
  }

  const badge = badgeForStatus(detail.status);
  const action = reservationAction(detail.status);
  const studioAddress = studioMapAddress || detail.studioAddress?.trim() || '주소 정보 없음';
  const mapAddress = studioMapAddress || detail.studioAddress?.trim() || '';
  const hasStudioAddress = studioAddress !== '주소 정보 없음';
  const reservationAnswers = (detail.reservationAnswers ?? [])
    .filter((answer) => answer.value?.trim())
    .filter((answer) => !isBookerNameAnswer(answer))
    .filter((answer) => !isBookerPhoneAnswer(answer))
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const onCopyAddress = () => {
    if (hasStudioAddress) {
      void navigator.clipboard.writeText(studioAddress);
    }
  };

  const startFormatted = formatDateTime(detail.startsAt);
  const endDate = new Date(detail.endsAt);
  const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
  const durationMs = endDate.getTime() - new Date(detail.startsAt).getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  const paidAmount = detail.paidAmount ?? detail.totalPrice;
  const couponDiscountAmount = detail.couponDiscountAmount ?? 0;
  const refundAmount = detail.refundAmount ?? 0;
  const selectedOptions = (detail.selectedOptions ?? [])
    .filter((option) => option.quantity != null && option.quantity > 0)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const cta = action === 'review'
    ? {
        className: 'res-detail__cta res-detail__cta--yellow',
        label: hasReview ? '내가 쓴 리뷰보기' : '리뷰쓰기',
      }
    : action === 'cancel'
      ? { className: 'res-detail__cta res-detail__cta--muted', label: '예약취소' }
      : null;

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
                <p className="res-detail__address-line">{studioAddress}</p>
              </div>
            </div>
            <button
              type="button"
              className="res-detail__chat"
              onClick={() => {
                const dest = reservationDetailChatHref();
                if (!isAuthenticated) {
                  openGuestGate(dest);
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
              <div className="res-detail__row">
                <span className="res-detail__row-label">예약번호</span>
                <span className="res-detail__row-value">{detail.bookingId}</span>
              </div>
              <div className="res-detail__row">
                <span className="res-detail__row-label">이름</span>
                <span className="res-detail__row-value">{detail.bookerName || '—'}</span>
              </div>
              <div className="res-detail__row">
                <span className="res-detail__row-label">연락처</span>
                <span className="res-detail__row-value">{formatPhone(detail.bookerPhone)}</span>
              </div>
              {detail.bookerNote ? (
                <div className="res-detail__row">
                  <span className="res-detail__row-label">추가 요청사항</span>
                  <span className="res-detail__row-value">{detail.bookerNote}</span>
                </div>
              ) : null}
              {reservationAnswers.map((answer) => (
                <div className="res-detail__row" key={`${answer.fieldId}-${answer.sortOrder}`}>
                  <span className="res-detail__row-label">{answer.title}</span>
                  <span className="res-detail__row-value">{answer.value}</span>
                </div>
              ))}
            </div>
          </div>

          <section>
            <h2 className="res-detail__section-title">위치 정보</h2>
            <div className="res-detail__map-wrap">
              <KakaoAddressMapView
                address={mapAddress}
                center={studioMapCenter}
                className="res-detail__map"
                level={3}
                markerTitle={detail.studioName || detail.roomName}
                title={`${detail.studioName || detail.roomName} 위치 지도`}
              />
            </div>
            <div className="res-detail__address-copy">
              <p>{studioAddress}</p>
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
              <h2 className="res-detail__section-title">결제 정보</h2>
              <div className="res-detail__subcard">
                <div className="res-detail__rows">
                  <div className="res-detail__row">
                    <span className="res-detail__row-label">가격</span>
                    <span className="res-detail__row-value">{formatPrice(detail.totalPrice)}</span>
                  </div>
                  {selectedOptions.map((option) => (
                    <div className="res-detail__row" key={option.optionId}>
                      <span className="res-detail__row-label">{option.name}</span>
                      <span className="res-detail__row-value">
                        {option.quantity}개 · {formatPrice(option.lineTotal ?? ((option.unitPrice ?? 0) * (option.quantity ?? 0)))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <div className="res-detail__pay-header">
                <h2>결제 금액</h2>
                <p className="res-detail__pay-total">{formatPrice(paidAmount)}</p>
              </div>
              <div className="res-detail__subcard">
                <div className="res-detail__pay-split">
                  <div className="res-detail__pay-split-bottom">
                    <div className="res-detail__row">
                      <span className="res-detail__row-label">예약 금액</span>
                      <span className="res-detail__row-value">{formatPrice(detail.totalPrice)}</span>
                    </div>
                    {couponDiscountAmount > 0 ? (
                      <div className="res-detail__row">
                        <span className="res-detail__row-label">쿠폰 할인</span>
                        <span className="res-detail__row-value">-{formatPrice(couponDiscountAmount)}</span>
                      </div>
                    ) : null}
                    <div className="res-detail__row">
                      <span className="res-detail__row-label">실 결제 금액</span>
                      <span className="res-detail__row-value">{formatPrice(paidAmount)}</span>
                    </div>
                    {detail.paymentMethod ? (
                      <div className="res-detail__row">
                        <span className="res-detail__row-label">결제 수단</span>
                        <span className="res-detail__row-value">{detail.paymentMethod}</span>
                      </div>
                    ) : null}
                    {refundAmount > 0 ? (
                      <div className="res-detail__row">
                        <span className="res-detail__row-label">환불 금액</span>
                        <span className="res-detail__row-value">{formatPrice(refundAmount)}</span>
                      </div>
                    ) : null}
                    {detail.refundedAt ? (
                      <div className="res-detail__row">
                        <span className="res-detail__row-label">환불 일시</span>
                        <span className="res-detail__row-value">{formatDateTime(detail.refundedAt)}</span>
                      </div>
                    ) : detail.cancelledAt ? (
                      <div className="res-detail__row">
                        <span className="res-detail__row-label">취소 일시</span>
                        <span className="res-detail__row-value">{formatDateTime(detail.cancelledAt)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {cta ? (
            <div className="res-detail__cta-wrap">
              <button
                type="button"
                className={cta.className}
                onClick={() => {
                  if (action === 'review') {
                    if (hasReview) {
                      navigate('/my-reviews');
                      return;
                    }
                    if (!detail.studioId) {
                      window.alert('리뷰 작성에 필요한 예약 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
                      return;
                    }
                    navigate(`/review/write?bookingId=${encodeURIComponent(detail.bookingId)}&studioId=${encodeURIComponent(detail.studioId)}`);
                    return;
                  }
                  if (!bookingId) {
                    return;
                  }
                  getRefundEstimate(bookingId)
                    .then((estimate) => {
                      if (!estimate.cancellable) {
                        window.alert('취소 불가: 예약 시작 12시간 이내에는 취소할 수 없습니다.');
                        return;
                      }
                      setCancelQuoteId(estimate.quoteId ?? null);
                      setCancelNoticeRows(buildCancelNoticeRows(estimate));
                      setCancelLeadLines(buildCancelLeadLines(estimate));
                      setCancelModalOpen(true);
                    })
                    .catch(() => {
                      window.alert('취소/환불 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
                      setCancelQuoteId(null);
                    });
                }}
              >
                {cta.label}
              </button>
            </div>
          ) : null}

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
        leadLines={cancelLeadLines}
        noticeRows={cancelNoticeRows}
        onClose={() => {
          if (isCancelling) {
            return;
          }
          setCancelQuoteId(null);
          setCancelModalOpen(false);
        }}
        onConfirm={() => {
          if (!bookingId || isCancelling) {
            return;
          }
          setIsCancelling(true);
          cancelBooking(bookingId, {
            cancelReason: '고객 취소',
            quoteId: cancelQuoteId ?? undefined,
          })
            .then(() => {
              // ADR-002: 사용자 환불 자동화 — 점주 승인 단계 없이 즉시 환불 완료.
              window.alert('예약 취소가 완료되었습니다. 환불 대상 결제는 영업일 기준 3-5일 내 결제 수단으로 입금됩니다.');
              navigate('/my-reservations');
            })
            .catch((err) => {
              const message = err instanceof Error && err.message
                ? err.message
                : '예약 취소에 실패했습니다. 잠시 후 다시 시도해주세요.';
              window.alert(message);
            })
            .finally(() => {
              setIsCancelling(false);
              setCancelQuoteId(null);
              setCancelModalOpen(false);
            });
        }}
        open={cancelModalOpen}
      />
    </main>
  );
}
