import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import {
  formatPaymentAmountWon,
  getMyPaymentHistory,
  type PaymentHistoryEntry,
  type PaymentHistoryKind,
} from '../api/payments';
import { loadAuthSession } from '../data/authSession';
import '../styles/payment-info.css';

type PaymentFilter = 'all' | PaymentHistoryKind;

const FILTER_OPTIONS: readonly { id: PaymentFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'payment', label: '결제' },
  { id: 'refund', label: '취소' },
];

function filterEntries(
  entries: readonly PaymentHistoryEntry[],
  filter: PaymentFilter,
): PaymentHistoryEntry[] {
  if (filter === 'all') return [...entries];
  return entries.filter((e) => e.kind === filter);
}

function PaymentHistoryRow({ entry }: { entry: PaymentHistoryEntry }) {
  const tag =
    entry.kind === 'payment' ? (
      <p className="payment-info__tag payment-info__tag--payment">결제</p>
    ) : (
      <p className="payment-info__tag payment-info__tag--refund">취소</p>
    );

  const amountText =
    entry.kind === 'payment'
      ? `- ${formatPaymentAmountWon(entry.amountWon)}원`
      : `+ ${formatPaymentAmountWon(entry.amountWon)}원`;

  return (
    <article className="payment-info__row">
      <div className="payment-info__row-main">
        <div className="payment-info__row-head">
          {tag}
          <p className="payment-info__row-title">{entry.title}</p>
        </div>
        <p className="payment-info__row-date">{entry.dateLabel}</p>
      </div>
      <p className="payment-info__amount">{amountText}</p>
    </article>
  );
}

export function PaymentInfoPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const [filter, setFilter] = useState<PaymentFilter>('all');
  const [entries, setEntries] = useState<PaymentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
  );

  const visibleEntries = useMemo(
    () => filterEntries(entries, filter),
    [entries, filter],
  );

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setErrorMessage(null);

    getMyPaymentHistory({ page: 0, size: 100, signal: controller.signal })
      .then((res) => {
        setEntries(res.items ?? []);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setEntries([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '결제 내역을 불러오지 못했습니다.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const onHeaderSearchSubmit = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      navigate(`/search/map?q=${encodeURIComponent(q)}`);
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

  return (
    <main className="payment-info-page">
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

      <div className="payment-info-page__main">
        <div className="payment-info">
          <header className="payment-info__header">
            <button
              type="button"
              className="payment-info__back"
              onClick={() => navigate(-1)}
              aria-label="뒤로"
            >
              <span className="payment-info__back-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
            <h1 className="payment-info__title">결제 정보</h1>
          </header>

          <div
            className="payment-info__filters"
            role="tablist"
            aria-label="결제 내역 필터"
          >
            {FILTER_OPTIONS.map((opt) => {
              const active = filter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`payment-info__filter${active ? ' payment-info__filter--active' : ' payment-info__filter--inactive'}`}
                  onClick={() => setFilter(opt.id)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="payment-info__list">
            {loading ? (
              <p className="payment-info__empty">결제 내역을 불러오는 중입니다.</p>
            ) : errorMessage ? (
              <p className="payment-info__empty">{errorMessage}</p>
            ) : visibleEntries.length === 0 ? (
              <p className="payment-info__empty">결제 내역이 없습니다.</p>
            ) : (
              visibleEntries.map((entry) => (
                <PaymentHistoryRow entry={entry} key={entry.id} />
              ))
            )}
          </div>
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
