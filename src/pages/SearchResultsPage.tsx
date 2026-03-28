import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HomeSpaceExplorer } from '../components/home/HomeSpaceExplorer';
import { ChevronIcon } from '../components/shared/Icons';
import { loadAuthSession } from '../data/authSession';

const HEADER_KEYWORD_SUGGESTIONS = [
  '합주실 스토어',
  '합주실',
  '합주공간',
  '합주스튜디오',
  '합정 뮤직 업라운드',
  '합정 뮤직스퀘어',
  '합정 굿마인드',
];

const SEARCH_VENDOR_RESULTS = [
  { name: '유스뮤직', spaces: '15개의 공간', tone: 'linear-gradient(135deg, #7f1315, #e26447)' },
  { name: '방구석 뮤지션의 합주실', spaces: '15개의 공간', tone: 'linear-gradient(135deg, #6b4d24, #c5a071)' },
  { name: '챗츠뮤직', spaces: '15개의 공간', tone: 'linear-gradient(135deg, #bcbcbc, #ececec)' },
];

const SEARCH_COMMUNITY_RESULTS = [
  {
    category: '정보공유',
    excerpt:
      '20평 규모 복층형 사운드랩 한층 형태 공간이지만, 다른 공간과 공간은 완전히 분리되어있고, 야간 할인 카드로 있어서 시간대 별로 저렴하게 가능해요!',
    likes: 4,
    thumbnail: 'linear-gradient(135deg, #80aab4, #d4861f)',
    title: '서울 지역 연습실습실 가격 비교 정리했습니다 🎵',
  },
  {
    category: '공간리뷰',
    excerpt:
      '인테리어도 만족스러웠고 음향 구성도 잘 되어 있었습니다. 직접 보고 느낀 상세한 관리가 잘 되어 있어서 장비 컨디션도 좋게 느꼈어요.',
    likes: 5,
    thumbnail: 'linear-gradient(135deg, #1b2f5d, #07131f)',
    title: '홍대 합주실 예약 후기 - 가성비 괜찮은 편입니다',
  },
  {
    category: '공간문의',
    excerpt:
      '최근 공간 기본 사양 표기에 관심이 생겨서 이것저것 알아보고 있습니다. 특히 공조와 음향 관련해 모델명까지 다 나온 곳들도 종종 있더라고요.',
    likes: 2,
    title: '공간 임대/프린트 출력 있으면 본 계신가요?',
  },
];

type SearchTab = 'community' | 'space' | 'vendor';

const SEARCH_SORT_OPTIONS: Record<SearchTab, string[]> = {
  community: ['최신순', '인기순', '정확도순', '댓글 많은 순', '좋아요 많은 순'],
  space: ['가까운순', '정확도순', '예약 많은 순', '가격 높은 순', '가격 낮은 순'],
  vendor: ['가까운순', '정확도순', '예약 많은 순', '가격 높은 순', '가격 낮은 순'],
};

const SEARCH_SORT_DEFAULT: Record<SearchTab, string> = {
  community: '최신순',
  space: '가까운순',
  vendor: '가까운순',
};

export function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthenticated = Boolean(loadAuthSession());
  const query = searchParams.get('q')?.trim() || '합주';
  const [activeTab, setActiveTab] = useState<SearchTab>('space');
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState(query);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState(SEARCH_SORT_DEFAULT.space);
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHeaderSearchQuery(query);
  }, [query]);

  useEffect(() => {
    setSortBy(SEARCH_SORT_DEFAULT[activeTab]);
    setSortOpen(false);
  }, [activeTab]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!headerSearchRef.current?.contains(target)) {
        setHeaderSearchOpen(false);
      }

      if (!sortRef.current?.contains(target)) {
        setSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  const filteredSuggestions = HEADER_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase())
  );

  const handleSearchSubmit = (value: string) => {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return;
    }

    navigate(`/search?q=${encodeURIComponent(normalizedValue)}`);
  };

  const resultCountLabel =
    activeTab === 'space' ? '4개의 공간' : activeTab === 'vendor' ? '3개의 업체' : '3개의 게시글';

  return (
    <main className="search-results-page">
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
        onSearchSubmit={handleSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          handleSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <section className="search-results__inner">
        <h1 className="search-results__title">‘{query}’ 검색 결과</h1>

        <div className="search-results__tabs">
          <button
            className={`search-results__tab ${activeTab === 'space' ? 'search-results__tab--active' : ''}`}
            onClick={() => setActiveTab('space')}
            type="button"
          >
            공간
          </button>
          <button
            className={`search-results__tab ${activeTab === 'vendor' ? 'search-results__tab--active' : ''}`}
            onClick={() => setActiveTab('vendor')}
            type="button"
          >
            업체
          </button>
          <button
            className={`search-results__tab ${activeTab === 'community' ? 'search-results__tab--active' : ''}`}
            onClick={() => setActiveTab('community')}
            type="button"
          >
            커뮤니티
          </button>
        </div>

        <div className="search-results__summary" ref={sortRef}>
          <p className="search-results__count">{resultCountLabel}</p>
          <div className="search-results__sort-wrap">
            <button
              className="search-results__sort"
              onClick={() => setSortOpen((current) => !current)}
              type="button"
            >
              <span>{sortBy}</span>
              <ChevronIcon />
            </button>

            {sortOpen ? (
              <div className="search-results__sort-menu">
                {SEARCH_SORT_OPTIONS[activeTab].map((option) => (
                  <button
                    className={`search-results__sort-option ${sortBy === option ? 'search-results__sort-option--active' : ''}`}
                    key={option}
                    onClick={() => {
                      setSortBy(option);
                      setSortOpen(false);
                    }}
                    type="button"
                  >
                    <span>{option}</span>
                    {sortBy === option ? <span className="search-results__sort-check">✓</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {activeTab === 'space' ? (
          <HomeSpaceExplorer resultLimit={4} variant="section" />
        ) : null}

        {activeTab === 'vendor' ? (
          <div className="search-results__vendor-grid">
            {SEARCH_VENDOR_RESULTS.map((vendor) => (
              <article className="search-results__vendor-card" key={vendor.name}>
                <div className="search-results__vendor-avatar" style={{ background: vendor.tone }} />
                <div className="search-results__vendor-body">
                  <h2 className="search-results__vendor-name">{vendor.name}</h2>
                  <p className="search-results__vendor-meta">{vendor.spaces}</p>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {activeTab === 'community' ? (
          <div className="search-results__community-list">
            {SEARCH_COMMUNITY_RESULTS.map((item) => (
              <article className="search-results__community-card" key={item.title}>
                <div className="search-results__community-copy">
                  <span className="search-results__community-category">{item.category}</span>
                  <h2 className="search-results__community-title">{item.title}</h2>
                  <p className="search-results__community-excerpt">{item.excerpt}</p>
                  <div className="search-results__community-meta">
                    <span>neowmeow</span>
                    <span>방금</span>
                    <span>♥ {item.likes}</span>
                    <span>• 2</span>
                  </div>
                </div>
                {item.thumbnail ? (
                  <div className="search-results__community-thumb" style={{ background: item.thumbnail }} />
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <HomeFooter />
    </main>
  );
}
