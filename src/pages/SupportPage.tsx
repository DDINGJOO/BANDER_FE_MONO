import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import {
  FAQ_ITEMS,
  INQUIRY_LIST,
  type FaqFilter,
  type FaqItem,
  type InquiryListItem,
} from '../data/support';

type SupportTab = 'FAQ' | 'INQUIRY';
type InquiryFilter = 'ALL' | 'WAITING' | 'ANSWERED';

const FAQ_FILTERS: readonly { key: FaqFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: '예약 관련', label: '예약 관련' },
  { key: '이용/입실', label: '이용/입실' },
  { key: '요금/결제', label: '요금/결제' },
  { key: '리뷰/신고', label: '리뷰/신고' },
  { key: '기타', label: '기타' },
];

const INQUIRY_FILTERS: readonly { key: InquiryFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'WAITING', label: '답변대기' },
  { key: 'ANSWERED', label: '답변완료' },
];

function FaqRow({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: (id: string) => void }) {
  return (
    <li className={`support-faq__item${open ? ' support-faq__item--open' : ''}`}>
      <button
        aria-expanded={open}
        className="support-faq__summary"
        onClick={() => onToggle(item.id)}
        type="button"
      >
        <span className="support-faq__meta">
          <span className="support-faq__category">{item.category}</span>
          <span className="support-faq__question">{item.question}</span>
        </span>
        <span aria-hidden className={`support-faq__chevron${open ? ' support-faq__chevron--open' : ''}`}>
          <ChevronIcon />
        </span>
      </button>
      {open ? (
        <div className="support-faq__answer">
          {item.answerParagraphs.map((p, i) => (
            <p className="support-faq__answer-head" key={`p-${i}`}>
              {p}
            </p>
          ))}
          {item.answerBullets ? (
            <ul className="support-faq__answer-bullets">
              {item.answerBullets.map((b, i) => (
                <li className="support-faq__answer-bullet" key={`b-${i}`}>
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function InquiryRow({ item }: { item: InquiryListItem }) {
  return (
    <li className="support-inquiry__row">
      <Link className="support-inquiry__row-link" to={`/support/inquiry/${item.id}`}>
        <div className="support-inquiry__meta">
          <span className="support-inquiry__category">{item.category}</span>
          <span className="support-inquiry__title">{item.title}</span>
          <span className="support-inquiry__date">{item.dateLabel}</span>
        </div>
        <span
          className={`support-inquiry__status support-inquiry__status--${
            item.status === 'ANSWERED' ? 'answered' : 'waiting'
          }`}
        >
          {item.status === 'ANSWERED' ? '답변완료' : '답변대기'}
        </span>
      </Link>
    </li>
  );
}

export function SupportPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

  const tab: SupportTab = search.get('tab') === 'inquiry' ? 'INQUIRY' : 'FAQ';
  const [faqFilter, setFaqFilter] = useState<FaqFilter>('ALL');
  const [inquiryFilter, setInquiryFilter] = useState<InquiryFilter>('ALL');
  const [openFaqIds, setOpenFaqIds] = useState<Set<string>>(() => new Set(['faq-3']));

  const filteredSuggestions = useMemo(
    () =>
      HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
        item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
      ),
    [headerSearchQuery],
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

  const filteredFaqItems = useMemo<FaqItem[]>(() => {
    if (faqFilter === 'ALL') return FAQ_ITEMS;
    return FAQ_ITEMS.filter((f) => f.category === faqFilter);
  }, [faqFilter]);

  const filteredInquiries = useMemo<InquiryListItem[]>(() => {
    if (inquiryFilter === 'ALL') return INQUIRY_LIST;
    return INQUIRY_LIST.filter((i) => i.status === inquiryFilter);
  }, [inquiryFilter]);

  const onTabChange = (next: SupportTab) => {
    const nextSearch = new URLSearchParams(search);
    if (next === 'INQUIRY') {
      nextSearch.set('tab', 'inquiry');
    } else {
      nextSearch.delete('tab');
    }
    setSearch(nextSearch);
  };

  const toggleFaq = useCallback((id: string) => {
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <main className="support-page">
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
        onSearchFocus={() => setHeaderSearchOpen(Boolean(headerSearchQuery.trim()))}
        onSearchSubmit={onHeaderSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          onHeaderSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <div className="support-page__main">
        <section className="support">
          <div className="support__head">
            <button
              aria-label="뒤로"
              className="support__back"
              onClick={() => navigate(-1)}
              type="button"
            >
              <span aria-hidden className="support__back-chevron">
                <ChevronIcon />
              </span>
            </button>
            <h1 className="support__title">고객센터</h1>
            {tab === 'INQUIRY' ? (
              <Link className="support__new-inquiry" to="/support/inquiry/new">
                1:1 문의하기
              </Link>
            ) : null}
          </div>

          <div className="support__tabs" role="tablist" aria-label="고객센터 탭">
            <button
              aria-selected={tab === 'FAQ'}
              className={`support__tab${tab === 'FAQ' ? ' support__tab--active' : ''}`}
              onClick={() => onTabChange('FAQ')}
              role="tab"
              type="button"
            >
              FAQ
            </button>
            <button
              aria-selected={tab === 'INQUIRY'}
              className={`support__tab${tab === 'INQUIRY' ? ' support__tab--active' : ''}`}
              onClick={() => onTabChange('INQUIRY')}
              role="tab"
              type="button"
            >
              1:1 문의
            </button>
          </div>

          {tab === 'FAQ' ? (
            <>
              <div className="support__filters" role="tablist" aria-label="FAQ 필터">
                {FAQ_FILTERS.map((opt) => (
                  <button
                    aria-selected={faqFilter === opt.key}
                    className={`support__filter${faqFilter === opt.key ? ' support__filter--active' : ''}`}
                    key={opt.key}
                    onClick={() => setFaqFilter(opt.key)}
                    role="tab"
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {filteredFaqItems.length === 0 ? (
                <p className="support__empty">등록된 FAQ가 없습니다.</p>
              ) : (
                <ul className="support-faq" role="tabpanel">
                  {filteredFaqItems.map((item) => (
                    <FaqRow item={item} key={item.id} onToggle={toggleFaq} open={openFaqIds.has(item.id)} />
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <div className="support__filters" role="tablist" aria-label="문의 필터">
                {INQUIRY_FILTERS.map((opt) => (
                  <button
                    aria-selected={inquiryFilter === opt.key}
                    className={`support__filter${
                      inquiryFilter === opt.key ? ' support__filter--active' : ''
                    }`}
                    key={opt.key}
                    onClick={() => setInquiryFilter(opt.key)}
                    role="tab"
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {filteredInquiries.length === 0 ? (
                <p className="support__empty">해당 상태의 문의가 없습니다.</p>
              ) : (
                <ul className="support-inquiry" role="tabpanel">
                  {filteredInquiries.map((row) => (
                    <InquiryRow item={row} key={row.id} />
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>

      <HomeFooter />
    </main>
  );
}
