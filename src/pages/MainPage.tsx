import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { GuestGateModal } from '../components/home/GuestGateModal';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HomePostCard } from '../components/home/HomePostCard';
import { HomeReviewCard } from '../components/home/HomeReviewCard';
import { HomeSpaceCard } from '../components/home/HomeSpaceCard';
import { HomeSpaceExplorer } from '../components/home/HomeSpaceExplorer';
import { loadAuthSession } from '../data/authSession';
import { useHomeFeed } from '../hooks/useHomeFeed';

export function MainPage({ previewAuthenticated = false }: { previewAuthenticated?: boolean }) {
  const navigate = useNavigate();
  const { hotPosts, recommendedSpaces, reviewCards, categoryBubbles, vendorCards, loading } = useHomeFeed();
  const isAuthenticated = previewAuthenticated || Boolean(loadAuthSession());
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const hotPostsScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!headerSearchRef.current?.contains(target)) {
        setHeaderSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  // HOT 게시물 자동 슬라이드
  useEffect(() => {
    const track = hotPostsScrollRef.current;
    if (!track || hotPosts.length === 0) return;
    const interval = setInterval(() => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft >= maxScroll - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [hotPosts]);

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase())
  );

  return (
    <main className="home-page">
      <HomeHeader
        authenticated={isAuthenticated}
        filteredSuggestions={filteredSuggestions}
        onGuestCta={() => setGuestModalOpen(true)}
        onSearchChange={(value) => {
          setHeaderSearchQuery(value);
          setHeaderSearchOpen(Boolean(value.trim()));
        }}
        onSearchClear={() => {
          setHeaderSearchQuery('');
          setHeaderSearchOpen(false);
        }}
        onSearchFocus={() => setHeaderSearchOpen(Boolean(headerSearchQuery.trim()))}
        onSearchSubmit={(value) => {
          const normalizedValue = value.trim();
          if (!normalizedValue) {
            return;
          }
          navigate(`/search?q=${encodeURIComponent(normalizedValue)}`);
        }}
        onSuggestionSelect={(value) => navigate(`/search?q=${encodeURIComponent(value)}`)}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <section className="home-hero">
        <div className="home-hero__inner">
          <div className="home-hero__copy">
            <p className="home-hero__headline">당신의 음악, 당신의 공간</p>
            <p className="home-hero__headline">언제 어디서나 한 번에!</p>
          </div>
          <div className="home-hero__visual">
            <div className="home-hero__vinyl" />
            <div className="home-hero__badge home-hero__badge--music">Music</div>
            <div className="home-hero__badge home-hero__badge--space">Space</div>
          </div>
        </div>
      </section>

      <section className="home-search">
        <HomeSpaceExplorer spaces={recommendedSpaces} variant="hero" />
      </section>

      <section className="home-section" id="hot-posts">
        <div className="home-section__heading">
          <h2>
            이달의 HOT 게시물 <span aria-hidden="true">❤️</span>
          </h2>
        </div>
        <div className="home-post-carousel">
          <div className="home-post-carousel__track" ref={hotPostsScrollRef}>
            {hotPosts.slice(0, 5).map((post) => (
              <HomePostCard key={post.title} {...post} />
            ))}
          </div>
        </div>
      </section>

      <section className="home-section" id="spaces">
        <div className="home-section__heading home-section__heading--stack">
          <h2>이런 공간은 어떠신가요?</h2>
        </div>
        <HomeSpaceExplorer spaces={recommendedSpaces} />
      </section>

      <section className="home-bubbles">
        <div className="home-bubbles__inner">
          <h2>밴더 인기 합주실</h2>
          <div className="home-bubbles__list">
            {categoryBubbles.map((item) => (
              <div className="home-bubble" key={item.label} style={{ borderColor: item.accent }}>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {vendorCards.length > 0 && (
        <section className="home-section home-section--vendors" id="vendors">
          <div className="home-section__heading home-section__heading--stack">
            <h2>인기 업체</h2>
            <p>검증된 음악 공간 업체를 만나보세요.</p>
          </div>
          <div className="home-space-grid">
            {vendorCards.slice(0, 8).map((vendor) => (
              <HomeSpaceCard
                key={vendor.slug}
                detailPath={vendor.detailPath}
                image={vendor.imageUrl}
                location={vendor.location}
                price={vendor.roomCount}
                rating={vendor.rating}
                studio=""
                subtitle={vendor.description}
                title={vendor.name}
              />
            ))}
          </div>
        </section>
      )}

      <section className="home-section home-section--popular-spaces" id="popular-spaces">
        <div className="home-space-grid">
          {recommendedSpaces.slice(0, 8).map((space) => (
            <HomeSpaceCard key={space.title} {...space} />
          ))}
        </div>
      </section>

      <section aria-label="공간 호스트 모집" className="home-host-cta">
        <div className="home-host-cta__inner">
          <span aria-hidden="true" className="home-host-cta__pick" />
          <p className="home-host-cta__copy">당신의 공간, 밴더와 함께하고 수익 창출을 누려보세요.</p>
          <a className="home-host-cta__link" href="#spaces">
            신청하러 가기 &gt;
          </a>
        </div>
      </section>

      <section className="home-section" id="reviews">
        <div className="home-section__heading home-section__heading--stack">
          <h2>밴더 리얼 후기를 확인하세요.</h2>
          <p>게스트도 후기와 정보를 충분히 보고 공간을 비교할 수 있습니다.</p>
        </div>
        <div className="home-review-grid">
          {reviewCards.map((review) => (
            <HomeReviewCard key={`${review.author}-${review.date}`} {...review} />
          ))}
        </div>
      </section>

      <section className="home-app-banner">
        <div className="home-app-banner__copy">
          <p className="home-app-banner__eyebrow">bander app</p>
          <h2>당신의 음악을, 당신의 공간에</h2>
          <p>음악인들이 함께하는 음악 생활 커뮤니티</p>
          <div className="home-app-banner__buttons">
            <button type="button">App Store</button>
            <button type="button">Google Play</button>
          </div>
        </div>
        <div className="home-app-banner__phones">
          <div className="home-phone home-phone--left" />
          <div className="home-phone home-phone--right" />
        </div>
      </section>

      <HomeFooter />

      <GuestGateModal
        onClose={() => setGuestModalOpen(false)}
        onProceed={() => navigate('/login')}
        open={guestModalOpen}
      />
    </main>
  );
}
