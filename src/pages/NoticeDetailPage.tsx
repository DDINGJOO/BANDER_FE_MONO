import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import { getNoticeDetail, type NoticeBlock, type NoticeDetail } from '../data/notices';

function DetailBadges({ detail }: { detail: NoticeDetail }) {
  if (detail.tab === 'NOTICE') {
    return (
      <div className="notice-detail__badges">
        <span className="notices-badge notices-badge--notice">{detail.category ?? '공지'}</span>
      </div>
    );
  }

  if (detail.status === '종료') {
    return (
      <div className="notice-detail__badges">
        <span className="notices-badge notices-badge--ended">종료</span>
      </div>
    );
  }

  return (
    <div className="notice-detail__badges">
      <span className="notices-badge notices-badge--ongoing">진행중</span>
      {detail.dDayLabel ? (
        <span className="notices-badge notices-badge--dday">{detail.dDayLabel}</span>
      ) : null}
    </div>
  );
}

function DetailBlock({ block }: { block: NoticeBlock }) {
  if (block.kind === 'paragraph') {
    return <p className="notice-detail__paragraph">{block.text}</p>;
  }
  if (block.kind === 'heading') {
    return <h3 className="notice-detail__heading">{block.text}</h3>;
  }
  if (block.kind === 'bullet') {
    return (
      <ul className="notice-detail__bullets">
        {block.items.map((item, idx) => (
          <li className="notice-detail__bullet" key={idx}>
            {item}
          </li>
        ))}
      </ul>
    );
  }
  // winners
  return (
    <section className="notice-detail__winners">
      <h3 className="notice-detail__winners-title">{block.title}</h3>
      {block.message ? (
        <p className="notice-detail__winners-message">{block.message}</p>
      ) : null}
      <ul className="notice-detail__winners-list">
        {block.rows.map((row, idx) => (
          <li className="notice-detail__winners-row" key={idx}>
            <span className="notice-detail__winners-rank">{row.rank}</span>
            <span className="notice-detail__winners-email">{row.masked}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NoticeDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ slug: string }>();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

  const detail = params.slug ? getNoticeDetail(params.slug) : null;

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

  const listHref = detail?.tab === 'EVENT' ? '/notices?tab=event' : '/notices';

  return (
    <main className="notice-detail-page">
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

      <div className="notice-detail-page__main">
        <section className="notice-detail">
          <button
            aria-label="뒤로"
            className="notice-detail__back"
            onClick={() => navigate(-1)}
            type="button"
          >
            <span aria-hidden className="notice-detail__back-chevron">
              <ChevronIcon />
            </span>
          </button>

          {!detail ? (
            <p className="notice-detail__missing">존재하지 않는 게시물입니다.</p>
          ) : (
            <>
              <header className="notice-detail__header">
                <DetailBadges detail={detail} />
                <h1 className="notice-detail__title">{detail.title}</h1>
                <p className="notice-detail__date">{detail.dateLabel}</p>
              </header>

              {detail.thumbnailUrl ? (
                <img
                  alt=""
                  className="notice-detail__thumb"
                  loading="lazy"
                  src={detail.thumbnailUrl}
                />
              ) : null}

              <div className="notice-detail__body">
                {detail.blocks.map((block, idx) => (
                  <DetailBlock block={block} key={idx} />
                ))}
              </div>

              <nav aria-label="다른 글" className="notice-detail__nav">
                {detail.prev ? (
                  <Link className="notice-detail__nav-row" to={`/notices/${detail.prev.slug}`}>
                    <span className="notice-detail__nav-label">이전으로</span>
                    <span className="notice-detail__nav-meta">
                      <span className="notice-detail__nav-title">{detail.prev.title}</span>
                      <span className="notice-detail__nav-date">{detail.prev.dateLabel}</span>
                    </span>
                  </Link>
                ) : null}
                {detail.next ? (
                  <Link className="notice-detail__nav-row" to={`/notices/${detail.next.slug}`}>
                    <span className="notice-detail__nav-label">다음으로</span>
                    <span className="notice-detail__nav-meta">
                      <span className="notice-detail__nav-title">{detail.next.title}</span>
                      <span className="notice-detail__nav-date">{detail.next.dateLabel}</span>
                    </span>
                  </Link>
                ) : null}
              </nav>

              <div className="notice-detail__actions">
                <Link className="notice-detail__list-button" to={listHref}>
                  목록으로
                </Link>
              </div>
            </>
          )}
        </section>
      </div>

      <HomeFooter />
    </main>
  );
}
