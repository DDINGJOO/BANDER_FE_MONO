import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ReservationCancelModal } from '../components/reservations/ReservationCancelModal';
import { ReviewViewModal } from '../components/reviews/ReviewViewModal';
import { REVIEW_VIEW_MODAL_DEFAULT } from '../data/reviewViewModal';
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
import { reservationsForTab, type MyReservation, type MyReservationTab } from '../data/myReservations';
import { getMyBookings, getRefundEstimate, type MyBookingItem } from '../api/bookings';
import { isMockMode } from '../config/publicEnv';

const TAB_LABELS: Record<MyReservationTab, string> = {
  upcoming: '이용전',
  past: '이용후',
  canceled: '취소',
};

const TAB_API_MAP: Record<MyReservationTab, string> = {
  upcoming: 'UPCOMING',
  past: 'PAST',
  canceled: 'CANCELED',
};

type BookingStatus = MyBookingItem['status'];

function statusPillLabel(status: BookingStatus) {
  if (status === 'CONFIRMED') return '예약확정';
  if (status === 'PENDING') return '예약대기';
  if (status === 'COMPLETED') return '이용완료';
  if (status === 'CANCELED_USER') return '예약취소';
  return '업체예약취소';
}

function statusPillClass(status: BookingStatus) {
  if (status === 'CONFIRMED') return 'my-res-card__pill--confirmed';
  if (status === 'CANCELED_USER' || status === 'CANCELED_VENDOR') {
    return 'my-res-card__pill--canceled';
  }
  return 'my-res-card__pill--muted';
}

function formatDateRange(date: string, startTime: string, endTime: string) {
  const parsed = new Date(date);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][parsed.getDay()];
  const dateStr = `${String(parsed.getFullYear()).slice(2)}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')} (${weekday})`;
  const start = startTime.slice(0, 5);
  const end = endTime.slice(0, 5);
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  const durationHours = durationMinutes / 60;
  return {
    dateTimeLine: `${dateStr} ${start} ~ ${end} `,
    durationLine: `총 ${durationHours}시간 이용`,
  };
}

function bookingAction(status: BookingStatus): 'cancel' | 'writeReview' | 'viewMyReview' | 'none' {
  if (status === 'CONFIRMED' || status === 'PENDING') return 'cancel';
  if (status === 'COMPLETED') return 'writeReview';
  return 'none';
}

function actionButtonLabel(action: 'cancel' | 'writeReview' | 'viewMyReview' | 'none') {
  if (action === 'cancel') return '예약취소';
  if (action === 'writeReview') return '리뷰쓰기';
  if (action === 'viewMyReview') return '내가 쓴 리뷰보기';
  return '';
}

type CardItem = {
  bookingId: string;
  status: BookingStatus;
  action: 'cancel' | 'writeReview' | 'viewMyReview' | 'none';
  thumbUrl: string;
  spaceTitle: string;
  vendorName: string;
  dateTimeLine: string;
  durationLine: string;
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
              <span className={`my-res-card__pill ${statusPillClass(item.status)}`}>
                {statusPillLabel(item.status)}
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
              ) : null}
              <div className="my-res-card__text">
                <p className="my-res-card__space-title">{item.spaceTitle}</p>
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
              <span className="my-res-card__detail-label">일자/시간</span>
              <span className="my-res-card__detail-value">{item.dateTimeLine}</span>
            </div>
            <div className="my-res-card__detail-row" key={`${item.bookingId}-d1`}>
              <span className="my-res-card__detail-label">예약시간</span>
              <span className="my-res-card__detail-value">{item.durationLine}</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

function toCardItem(booking: MyBookingItem): CardItem {
  const { dateTimeLine, durationLine } = formatDateRange(booking.date, booking.startTime, booking.endTime);
  return {
    bookingId: booking.bookingId,
    status: booking.status,
    action: bookingAction(booking.status),
    thumbUrl: '',
    spaceTitle: booking.studioName,
    vendorName: booking.studioName,
    dateTimeLine,
    durationLine,
    detailPath: `/reservation-detail?bookingId=${booking.bookingId}`,
  };
}

export function MyReservationsPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [tab, setTab] = useState<MyReservationTab>('upcoming');
  const [bookings, setBookings] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [reviewViewOpen, setReviewViewOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelToast, setCancelToast] = useState(false);
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
    if (isMockMode()) {
      const mockItems = reservationsForTab(tab).map((r: MyReservation, index: number): CardItem => ({
        bookingId: String(index),
        status: r.status === 'confirmed' ? 'CONFIRMED'
          : r.status === 'pending' ? 'PENDING'
          : r.status === 'completed' ? 'COMPLETED'
          : r.status === 'canceledUser' ? 'CANCELED_USER'
          : 'CANCELED_VENDOR',
        action: r.action === 'cancel' ? 'cancel'
          : r.action === 'writeReview' ? 'writeReview'
          : r.action === 'viewMyReview' ? 'viewMyReview'
          : 'none',
        thumbUrl: r.thumbUrl ?? '',
        spaceTitle: r.spaceTitle,
        vendorName: r.vendorName,
        dateTimeLine: r.dateTimeLine ?? '',
        durationLine: r.durationLine ?? '',
        detailPath: r.detailPath,
      }));
      setBookings(mockItems);
      return;
    }

    setLoading(true);
    getMyBookings({ tab: TAB_API_MAP[tab], size: 20 })
      .then((page) => {
        setBookings(page.items.map(toCardItem));
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
          {cancelToast ? (
            <p className="my-reservations__flash" role="status">
              취소 요청이 접수되었습니다. 실제 환불은 정책에 따라 처리됩니다.
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
            <p className="my-reservations__empty">예약 내역이 없습니다.</p>
          ) : (
            <div className="my-reservations__list">
              {bookings.map((item) => (
                <ReservationCard
                  key={item.bookingId}
                  item={item}
                  onAction={(row) => {
                    if (row.action === 'writeReview') {
                      navigate('/review/write');
                    }
                    if (row.action === 'viewMyReview') {
                      setReviewViewOpen(true);
                    }
                    if (row.action === 'cancel') {
                      setSelectedBookingId(row.bookingId);
                      if (!isMockMode()) {
                        getRefundEstimate(row.bookingId)
                          .then((est) => {
                            if (!est.cancellable) {
                              alert('취소 불가: 예약 시작 12시간 이내에는 취소할 수 없습니다.');
                              return;
                            }
                            setCancelNoticeRows(buildCancelNoticeRows(est));
                            setCancelLeadLines(buildCancelLeadLines(est));
                            setCancelModalOpen(true);
                          })
                          .catch(() => {
                            setCancelNoticeRows(RESERVATION_CANCEL_NOTICE_DEFAULT);
                            setCancelLeadLines(RESERVATION_CANCEL_LEAD_LINES);
                            setCancelModalOpen(true);
                          });
                      } else {
                        setCancelModalOpen(true);
                      }
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <HomeFooter />

      <ReviewViewModal
        content={REVIEW_VIEW_MODAL_DEFAULT}
        open={reviewViewOpen}
        onClose={() => setReviewViewOpen(false)}
      />

      <ReservationCancelModal
        alertText={RESERVATION_CANCEL_ALERT_DEFAULT}
        dividerAfterRowIndex={1}
        leadLines={cancelLeadLines}
        noticeRows={cancelNoticeRows}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedBookingId(null);
        }}
        onConfirm={() => {
          // 이전엔 cancel API 응답 전에 toast 를 띄워 실제 실패해도 "취소 성공" 으로 보였음.
          // 이제 API 성공 후에만 toast 띄움 + 실패 시 error alert.
          if (selectedBookingId != null) {
            const targetId = selectedBookingId;
            import('../api/bookings').then(({ cancelBooking }) => {
              cancelBooking(targetId, { cancelReason: '고객 취소' }).then(() => {
                setBookings((prev) => prev.filter((b) => b.bookingId !== targetId));
                setCancelToast(true);
                window.setTimeout(() => setCancelToast(false), 6000);
              }).catch((err) => {
                const message = err instanceof Error && err.message
                  ? err.message
                  : '예약 취소에 실패했습니다. 잠시 후 다시 시도해주세요.';
                window.alert(message);
              });
            });
          }
          setCancelModalOpen(false);
          setSelectedBookingId(null);
        }}
        open={cancelModalOpen}
      />
    </main>
  );
}
