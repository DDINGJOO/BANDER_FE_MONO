import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuestGateModal } from '../components/home/GuestGateModal';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HomePostCard } from '../components/home/HomePostCard';
import { HomeSpaceExplorer } from '../components/home/HomeSpaceExplorer';
import { loadAuthSession } from '../data/authSession';
import {
  HOME_CATEGORY_BUBBLES,
  HOME_HOT_POSTS,
  HOME_REVIEW_CARDS,
} from '../data/home';

export function MainPage({ previewAuthenticated = false }: { previewAuthenticated?: boolean }) {
  const navigate = useNavigate();
  const isAuthenticated = previewAuthenticated || Boolean(loadAuthSession());
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

  const keywordSuggestions = [
    '합주실 스토어',
    '합주실',
    '합주공간',
    '합주스튜디오',
    '합정 뮤직 업라운드',
    '합정 뮤직스퀘어',
    '합정 굿마인드',
  ];

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

  const filteredSuggestions = keywordSuggestions.filter((item) =>
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
        <HomeSpaceExplorer variant="hero" />
      </section>

      <section className="home-section" id="hot-posts">
        <div className="home-section__heading">
          <h2>이달의 HOT 게시글</h2>
          <span>♥</span>
        </div>
        <div className="home-post-grid">
          {HOME_HOT_POSTS.map((post) => (
            <HomePostCard key={post.title} {...post} />
          ))}
        </div>
      </section>

      <section className="home-section" id="spaces">
        <div className="home-section__heading home-section__heading--stack">
          <h2>이런 공간은 어떠신가요?</h2>
        </div>
        <HomeSpaceExplorer />
      </section>

      <section className="home-bubbles">
        <div className="home-bubbles__inner">
          <h2>밴더 인기 장르별</h2>
          <div className="home-bubbles__list">
            {HOME_CATEGORY_BUBBLES.map((item) => (
              <div className="home-bubble" key={item.label}>
                <div
                  className="home-bubble__circle"
                  style={{ background: `radial-gradient(circle at 30% 30%, #ffffff, ${item.accent})` }}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section" id="reviews">
        <div className="home-section__heading home-section__heading--stack">
          <h2>밴더 리얼 후기를 확인하세요.</h2>
          <p>게스트도 후기와 정보를 충분히 보고 공간을 비교할 수 있습니다.</p>
        </div>
        <div className="home-review-grid">
          {HOME_REVIEW_CARDS.map((review) => (
            <article className="home-review-card" key={review.author}>
              <div className="home-review-card__stars">★ ★ ★ ★ ☆</div>
              <p className="home-review-card__score">{review.rating}</p>
              <p className="home-review-card__text">{review.text}</p>
              <p className="home-review-card__author">@{review.author}</p>
            </article>
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
