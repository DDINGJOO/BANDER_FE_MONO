import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import { LEGAL_ARTICLES, POLICY_ARTICLES, type TermsTab } from '../data/termsContent';

export function TermsPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<TermsTab>('LEGAL');

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

  const articles = tab === 'LEGAL' ? LEGAL_ARTICLES : POLICY_ARTICLES;

  return (
    <main className="terms-page">
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

      <div className="terms-page__main">
        <section className="terms">
          <div className="terms__head">
            <button
              aria-label="뒤로"
              className="terms__back"
              onClick={() => navigate(-1)}
              type="button"
            >
              <span aria-hidden className="terms__back-chevron">
                <ChevronIcon />
              </span>
            </button>
            <h1 className="terms__title">이용약관</h1>
          </div>

          <div className="terms__tabs" role="tablist" aria-label="이용약관 탭">
            <button
              aria-selected={tab === 'LEGAL'}
              className={`terms__tab${tab === 'LEGAL' ? ' terms__tab--active' : ''}`}
              onClick={() => setTab('LEGAL')}
              role="tab"
              type="button"
            >
              법적고지
            </button>
            <button
              aria-selected={tab === 'POLICY'}
              className={`terms__tab${tab === 'POLICY' ? ' terms__tab--active' : ''}`}
              onClick={() => setTab('POLICY')}
              role="tab"
              type="button"
            >
              이용정책
            </button>
          </div>

          <div className="terms__articles" role="tabpanel">
            {articles.map((article) => (
              <article className="terms__article" key={article.id}>
                <h2 className="terms__article-heading">{article.heading}</h2>
                <p className="terms__article-body">{article.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <HomeFooter />
    </main>
  );
}
