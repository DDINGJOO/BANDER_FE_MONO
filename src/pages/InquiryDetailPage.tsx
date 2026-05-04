import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import { getInquiryDetail } from '../data/support';

export function InquiryDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

  const detail = params.id ? getInquiryDetail(params.id) : null;

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
    <main className="inquiry-detail-page">
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

      <div className="inquiry-detail-page__main">
        <section className="inquiry-detail">
          <button
            aria-label="뒤로"
            className="inquiry-detail__back"
            onClick={() => navigate(-1)}
            type="button"
          >
            <span aria-hidden className="inquiry-detail__back-chevron">
              <ChevronIcon />
            </span>
          </button>

          {!detail ? (
            <p className="inquiry-detail__missing">존재하지 않는 문의입니다.</p>
          ) : (
            <>
              <header className="inquiry-detail__header">
                <span className="inquiry-detail__category">{detail.category}</span>
                <h1 className="inquiry-detail__title">{detail.title}</h1>
                <span className="inquiry-detail__date">{detail.dateLabel}</span>
              </header>

              <div className="inquiry-detail__question">
                {detail.status === 'WAITING' ? (
                  <span className="inquiry-detail__status inquiry-detail__status--waiting">
                    답변대기
                  </span>
                ) : null}
                <p className="inquiry-detail__question-body">{detail.body}</p>
              </div>

              {detail.imageUrls && detail.imageUrls.length > 0 ? (
                <div className="inquiry-detail__images">
                  {detail.imageUrls.map((url, idx) => (
                    <img alt="" className="inquiry-detail__image" key={`${url}-${idx}`} src={url} />
                  ))}
                </div>
              ) : null}

              {detail.answer ? (
                <div className="inquiry-detail__answer">
                  <span className="inquiry-detail__status inquiry-detail__status--answered">
                    답변완료
                  </span>
                  <p className="inquiry-detail__answer-body">{detail.answer.body}</p>
                  <span className="inquiry-detail__answer-date">{detail.answer.dateLabel}</span>
                </div>
              ) : null}

              <div className="inquiry-detail__actions">
                <Link className="inquiry-detail__list-button" to="/support?tab=inquiry">
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
