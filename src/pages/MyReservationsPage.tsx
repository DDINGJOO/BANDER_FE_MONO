import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ReservationCancelModal } from '../components/reservations/ReservationCancelModal';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import {
  RESERVATION_CANCEL_ALERT_DEFAULT,
  RESERVATION_CANCEL_LEAD_LINES,
  RESERVATION_CANCEL_NOTICE_DEFAULT,
  buildCancelNoticeRows,
  buildCancelLeadLines,
} from '../data/reservationCancelModal';
import type { ReservationCancelNoticeRow } from '../components/reservations/ReservationCancelModal';
import { type MyReservationTab } from '../data/myReservations';
import { cancelBooking, getMyBookings, getMyReviews, getRefundEstimate, type MyBookingItem } from '../api/bookings';

const TAB_LABELS: Record<MyReservationTab, string> = {
  all: '전체',
  upcoming: '이용전',
  past: '이용후',
  canceled: '취소',
};

const TAB_API_MAP: Record<MyReservationTab, string> = {
  all: 'ALL',
  upcoming: 'UPCOMING',
  past: 'PAST',
  canceled: 'CANCELED',
};

type BookingStatus = MyBookingItem['status'];
type ReservationAction = 'cancel' | 'writeReview' | 'viewMyReview' | 'none';

function isCanceledStatus(status: BookingStatus) {
  return (
    status === 'CANCEL_REQUESTED' ||
    status === 'REFUND_REQUESTED' ||
    status === 'CANCELED_USER' ||
    status === 'CANCELED_VENDOR' ||
    status === 'CANCELLED' ||
    status === 'REFUNDED' ||
    status === 'REJECTED'
  );
}

function isCanceledTabPending(status: BookingStatus, tab: MyReservationTab) {
  return tab === 'canceled' && status === 'PENDING';
}

function statusPillLabel(status: BookingStatus, tab: MyReservationTab) {
  if (isCanceledTabPending(status, tab)) return '환불 처리 중';
  if (status === 'CONFIRMED' || status === 'PAID') return '예약확정';
  if (status === 'PENDING_PAYMENT') return '결제대기';
  if (status === 'PAYMENT_CONFIRMING') return '결제 확인 중';
  if (status === 'PENDING' || status === 'PENDING_APPROVAL') return '예약대기';
  if (status === 'COMPLETED') return '이용완료';
  if (status === 'CANCEL_REQUESTED' || status === 'REFUND_REQUESTED') return '환불 처리 중';
  if (status === 'CANCELED_USER' || status === 'CANCELLED' || status === 'REFUNDED') return '예약취소';
  if (status === 'CANCELED_VENDOR' || status === 'REJECTED') return '업체예약취소';
  return status || '예약상태 확인 중';
}

function statusPillClass(status: BookingStatus, tab: MyReservationTab) {
  if (status === 'CONFIRMED' || status === 'PAID') return 'my-res-card__pill--confirmed';
  if (
    status === 'CANCELED_USER' ||
    status === 'CANCELED_VENDOR' ||
    status === 'CANCELLED' ||
    status === 'REFUNDED' ||
    status === 'REJECTED'
  ) {
    return 'my-res-card__pill--canceled';
  }
  if (isCanceledTabPending(status, tab)) return 'my-res-card__pill--muted';
  return 'my-res-card__pill--muted';
}

function formatWon(value: number) {
  return `${value.toLocaleString()}원`;
}

function formatDateRange(date: string, startTime: string, endTime: string) {
  const parsed = new Date(date);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][parsed.getDay()];
  const dateStr = `${String(parsed.getFullYear()).slice(2)}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')} (${weekday})`;
  const start = startTime.slice(0, 5);
  const end = endTime.slice(0, 5);
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }
  const durationHours = durationMinutes / 60;
  return {
    dateLine: dateStr,
    timeLine: `${start} ~ ${end}`,
    durationLine: `총 ${durationHours}시간 이용`,
  };
}

function bookingAction(status: BookingStatus, tab: MyReservationTab, reviewed: boolean): ReservationAction {
  if (isCanceledTabPending(status, tab)) return 'none';
  if (
    status === 'CONFIRMED' ||
    status === 'PAID' ||
    status === 'PENDING' ||
    status === 'PENDING_PAYMENT' ||
    status === 'PENDING_APPROVAL'
  ) {
    return 'cancel';
  }
  if (status === 'COMPLETED') return reviewed ? 'viewMyReview' : 'writeReview';
  return 'none';
}

function actionButtonLabel(action: ReservationAction) {
  if (action === 'cancel') return '예약취소';
  if (action === 'writeReview') return '리뷰쓰기';
  if (action === 'viewMyReview') return '내가 쓴 리뷰보기';
  return '';
}

function parseTabParam(value: string | null): MyReservationTab {
  return value === 'all' || value === 'past' || value === 'canceled' ? value : 'upcoming';
}

type CardItem = {
  bookingId: string;
  studioId: string;
  status: BookingStatus;
  tab: MyReservationTab;
  action: ReservationAction;
  thumbUrl: string;
  spaceTitle: string;
  vendorName: string;
  dateLine: string;
  timeLine: string;
  durationLine: string;
  paidAmount: number;
  refundAmount: number | null;
  detailPath: string;
};

function ReservationCard({
  item,
  onAction,
}: {
  item: CardItem;
  onAction?: (item: CardItem) => void;
}) {
  const showAction = item.action !== 'none';

  return (
    <article className="my-res-card">
      <div className="my-res-card__top">
        <Link className="my-res-card__block-link" to={item.detailPath}>
          <div className="my-res-card__meta-row">
            <div className="my-res-card__meta-left">
              <span className={`my-res-card__pill ${statusPillClass(item.status, item.tab)}`}>
                {statusPillLabel(item.status, item.tab)}
              </span>
            </div>
            <div className="my-res-card__meta-right">
              <span className="my-res-card__chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </div>
          </div>
        </Link>
        <div
          className={`my-res-card__body-row${showAction ? '' : ' my-res-card__body-row--solo'}`}
        >
          <Link className="my-res-card__info-link" to={item.detailPath}>
            <div className="my-res-card__info">
              {item.thumbUrl ? (
                <img
                  alt=""
                  className="my-res-card__thumb"
                  src={item.thumbUrl}
                  loading="lazy"
                />
              ) : (
                <span className="my-res-card__thumb my-res-card__thumb--placeholder" aria-hidden>
                  {(item.spaceTitle || item.vendorName || 'B').trim().charAt(0)}
                </span>
              )}
              <div className="my-res-card__text">
                {item.spaceTitle ? (
                  <p className="my-res-card__space-title">{item.spaceTitle}</p>
                ) : null}
                <p className="my-res-card__vendor">{item.vendorName}</p>
              </div>
            </div>
          </Link>
          {showAction ? (
            <button
              className={`my-res-card__action${item.action === 'writeReview' ? ' my-res-card__action--yellow' : ' my-res-card__action--gray'}`}
              type="button"
              onClick={() => onAction?.(item)}
            >
              {actionButtonLabel(item.action)}
            </button>
          ) : null}
        </div>
      </div>
      <Link className="my-res-card__bottom-link" to={item.detailPath}>
        <div className="my-res-card__bottom">
          <div className="my-res-card__details">
            <div className="my-res-card__detail-row" key={`${item.bookingId}-d0`}>
              <span className="my-res-card__detail-label">일자</span>
              <span className="my-res-card__detail-value">{item.dateLine}</span>
            </div>
            <div className="my-res-card__detail-row" key={`${item.bookingId}-d1`}>
              <span className="my-res-card__detail-label">예약시간</span>
              <span className="my-res-card__detail-value">
                {item.timeLine} ({item.durationLine})
              </span>
            </div>
            <div className="my-res-card__detail-row" key={`${item.bookingId}-d2`}>
              <span className="my-res-card__detail-label">결제금액</span>
              {isCanceledStatus(item.status) || item.tab === 'canceled' ? (
                <span className="my-res-card__detail-value my-res-card__price my-res-card__price--canceled">
                  -{formatWon(item.paidAmount)}
                </span>
              ) : (
                <span className="my-res-card__detail-value my-res-card__price">
                  {formatWon(item.paidAmount)}
                </span>
              )}
            </div>
            {isCanceledStatus(item.status) || item.tab === 'canceled' ? (
              <div className="my-res-card__detail-row" key={`${item.bookingId}-d3`}>
                <span className="my-res-card__detail-label">환불금액</span>
                <span className="my-res-card__detail-value my-res-card__refund">
                  {item.refundAmount == null ? '환불 처리 중' : formatWon(item.refundAmount)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

function toCardItem(booking: MyBookingItem, tab: MyReservationTab, reviewedBookingIds: Set<string>): CardItem {
  const { dateLine, timeLine, durationLine } = formatDateRange(booking.date, booking.startTime, booking.endTime);
  return {
    bookingId: booking.bookingId,
    studioId: booking.studioId,
    status: booking.status,
    tab,
    action: bookingAction(booking.status, tab, reviewedBookingIds.has(booking.bookingId)),
    thumbUrl: booking.studioThumbnailUrl?.trim() ?? '',
    spaceTitle: booking.roomName?.trim() || '예약한 합주실',
    vendorName: booking.studioName?.trim() || '업체 정보',
    dateLine,
    timeLine,
    durationLine,
    paidAmount: booking.paidAmount ?? booking.totalPriceWon,
    refundAmount: booking.refundAmount ?? null,
    detailPath: `/reservation-detail?bookingId=${booking.bookingId}`,
  };
}

export function MyReservationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthenticated = Boolean(loadAuthSession());
  const [tab, setTab] = useState<MyReservationTab>(() => parseTabParam(searchParams.get('tab')));
  const [bookings, setBookings] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedCancelQuoteId, setSelectedCancelQuoteId] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelToastMessage, setCancelToastMessage] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelNoticeRows, setCancelNoticeRows] = useState<ReservationCancelNoticeRow[]>(RESERVATION_CANCEL_NOTICE_DEFAULT);
  const [cancelLeadLines, setCancelLeadLines] = useState<[string, string]>(RESERVATION_CANCEL_LEAD_LINES);
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

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
    setLoading(true);
    Promise.all([
      getMyBookings({ tab: TAB_API_MAP[tab], size: 20 }),
      getMyReviews({ size: 100 }).catch(() => ({ items: [] })),
    ])
      .then(([page, reviewsPage]) => {
        const reviewedBookingIds = new Set(
          reviewsPage.items
            .map((review) => review.bookingId)
            .filter((bookingId): bookingId is string => Boolean(bookingId)),
        );
        setBookings(page.items.map((booking) => toCardItem(booking, tab, reviewedBookingIds)));
      })
      .catch(() => {
        setBookings([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tab]);

  return (
    <main className="my-reservations-page">
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

      <div className="my-reservations-page__main">
        <div className="my-reservations">
          {cancelToastMessage ? (
            <p className="my-reservations__flash" role="status">
              {cancelToastMessage}
            </p>
          ) : null}
          <header className="my-reservations__header">
            <button
              type="button"
              className="my-reservations__back"
              onClick={() => navigate(-1)}
              aria-label="뒤로"
            >
              <span className="my-reservations__back-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
            <h1 className="my-reservations__title">내 예약</h1>
          </header>

          <div
            className="my-reservations__tabs"
            role="tablist"
            aria-label="예약 구분"
          >
            {(Object.keys(TAB_LABELS) as MyReservationTab[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={`my-reservations__tab${tab === key ? ' my-reservations__tab--active' : ''}`}
                onClick={() => setTab(key)}
              >
                <span>{TAB_LABELS[key]}</span>
                <span className="my-reservations__tab-line" aria-hidden />
              </button>
            ))}
          </div>

          {loading ? null : bookings.length === 0 ? (
            <div className="my-reservations__empty">
              <p>예약 내역이 없습니다.</p>
              <p className="my-reservations__empty-hint">이전 예약 내역은 고객센터로 문의해주세요.</p>
            </div>
          ) : (
            <div className="my-reservations__list">
              {bookings.map((item) => (
                <ReservationCard
                  key={item.bookingId}
                  item={item}
                  onAction={(row) => {
                    if (row.action === 'writeReview') {
                      navigate(`/review/write?bookingId=${encodeURIComponent(row.bookingId)}&studioId=${encodeURIComponent(row.studioId)}`);
                    }
                    if (row.action === 'viewMyReview') {
                      navigate('/my-reviews');
                    }
                    if (row.action === 'cancel') {
                      setSelectedBookingId(row.bookingId);
                      getRefundEstimate(row.bookingId)
                        .then((est) => {
                          if (!est.cancellable) {
                            alert('취소 불가: 예약 시작 12시간 이내에는 취소할 수 없습니다.');
                            return;
                          }
                          setSelectedCancelQuoteId(est.quoteId ?? null);
                          setCancelNoticeRows(buildCancelNoticeRows(est));
                          setCancelLeadLines(buildCancelLeadLines(est));
                          setCancelModalOpen(true);
                        })
                        .catch(() => {
                          window.alert('취소/환불 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
                          setSelectedBookingId(null);
                          setSelectedCancelQuoteId(null);
                        });
                    }
                  }}
                />
              ))}
            </div>
          )}
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
          setCancelModalOpen(false);
          setSelectedBookingId(null);
          setSelectedCancelQuoteId(null);
        }}
        onConfirm={() => {
          if (selectedBookingId == null || isCancelling) {
            return;
          }
          const targetId = selectedBookingId;
          const quoteId = selectedCancelQuoteId;
          setIsCancelling(true);
          cancelBooking(targetId, {
            cancelReason: '고객 취소',
            quoteId: quoteId ?? undefined,
          })
            .then(() => {
              setBookings((prev) => prev.filter((b) => b.bookingId !== targetId));
              setCancelToastMessage('예약 취소가 완료되었습니다. 환불 대상 결제는 영업일 기준 3-5일 내 결제 수단으로 입금됩니다.');
              window.setTimeout(() => setCancelToastMessage(null), 6000);
            })
            .catch((err) => {
              const message = err instanceof Error && err.message
                ? err.message
                : '예약 취소에 실패했습니다. 잠시 후 다시 시도해주세요.';
              window.alert(message);
            })
            .finally(() => {
              setIsCancelling(false);
              setCancelModalOpen(false);
              setSelectedBookingId(null);
              setSelectedCancelQuoteId(null);
            });
        }}
        open={cancelModalOpen}
      />
    </main>
  );
}
