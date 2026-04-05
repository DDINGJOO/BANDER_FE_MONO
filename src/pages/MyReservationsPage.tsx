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
} from '../data/reservationCancelModal';
import {
  reservationsForTab,
  type MyReservation,
  type MyReservationTab,
} from '../data/myReservations';

const TAB_LABELS: Record<MyReservationTab, string> = {
  upcoming: '이용전',
  past: '이용후',
  canceled: '취소',
};

function statusPillLabel(status: MyReservation['status']) {
  if (status === 'confirmed') return '예약확정';
  if (status === 'pending') return '예약대기';
  if (status === 'completed') return '이용완료';
  if (status === 'canceledUser') return '예약취소';
  return '업체예약취소';
}

function actionButtonLabel(action: MyReservation['action']) {
  if (action === 'cancel') return '예약취소';
  if (action === 'writeReview') return '리뷰쓰기';
  if (action === 'viewMyReview') return '내가 쓴 리뷰보기';
  return '';
}

function statusPillClass(status: MyReservation['status']) {
  if (status === 'confirmed') return 'my-res-card__pill--confirmed';
  if (status === 'canceledUser' || status === 'canceledVendor') {
    return 'my-res-card__pill--canceled';
  }
  return 'my-res-card__pill--muted';
}

function ReservationCard({
  item,
  onAction,
}: {
  item: MyReservation;
  onAction?: (item: MyReservation) => void;
}) {
  const headline =
    item.headlineRight != null && item.headlineRight !== ''
      ? item.headlineRight
      : null;
  const headlineMuted = item.headlineAccent === 'muted';
  const showAction = item.action !== 'none';
  const detailRows =
    item.detailRows && item.detailRows.length > 0
      ? item.detailRows
      : [
          {
            label: '일자/시간',
            value: item.dateTimeLine ?? '',
          },
          { label: '예약시간', value: item.durationLine ?? '' },
        ];

  return (
    <article className="my-res-card">
      <div className="my-res-card__top">
        <Link className="my-res-card__block-link" to={item.detailPath}>
          <div className="my-res-card__meta-row">
            <div className="my-res-card__meta-left">
              <span className={`my-res-card__pill ${statusPillClass(item.status)}`}>
                {statusPillLabel(item.status)}
              </span>
              <span className="my-res-card__no">{item.reservationNo}</span>
            </div>
            <div className="my-res-card__meta-right">
              {headline ? (
                <p
                  className={`my-res-card__headline${headlineMuted ? ' my-res-card__headline--muted' : ' my-res-card__headline--primary'}`}
                >
                  {headline}
                </p>
              ) : null}
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
              <img
                alt=""
                className="my-res-card__thumb"
                src={item.thumbUrl}
                loading="lazy"
              />
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
            {detailRows.map((row, idx) => (
              <div
                className="my-res-card__detail-row"
                key={`${item.id}-d${idx}`}
              >
                <span className="my-res-card__detail-label">{row.label}</span>
                <span className="my-res-card__detail-value">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function MyReservationsPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [tab, setTab] = useState<MyReservationTab>('upcoming');
  const [reviewViewOpen, setReviewViewOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelToast, setCancelToast] = useState(false);
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

  const list = reservationsForTab(tab);

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

          {list.length === 0 ? (
            <p className="my-reservations__empty">예약 내역이 없습니다.</p>
          ) : (
            <div className="my-reservations__list">
              {list.map((item) => (
                <ReservationCard
                  key={item.id}
                  item={item}
                  onAction={(row) => {
                    if (row.action === 'writeReview') {
                      navigate('/review/write');
                    }
                    if (row.action === 'viewMyReview') {
                      setReviewViewOpen(true);
                    }
                    if (row.action === 'cancel') {
                      setCancelModalOpen(true);
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
        leadLines={RESERVATION_CANCEL_LEAD_LINES}
        noticeRows={RESERVATION_CANCEL_NOTICE_DEFAULT}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => {
          setCancelModalOpen(false);
          setCancelToast(true);
          window.setTimeout(() => setCancelToast(false), 6000);
        }}
        open={cancelModalOpen}
      />
    </main>
  );
}
