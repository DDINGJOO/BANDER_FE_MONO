import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HomeSpaceCard } from '../components/home/HomeSpaceCard';
import { ChevronIcon, StarIcon } from '../components/shared/Icons';
import { loadAuthSession } from '../data/authSession';
import { HOME_SPACE_CARDS } from '../data/home';
import {
  ROOM_DETAIL_DATA,
  ROOM_DETAIL_INFO_ROWS,
  ROOM_DETAIL_RECOMMENDATIONS,
} from '../data/spaceDetail';

const HEADER_KEYWORD_SUGGESTIONS = [
  '합주실 스토어',
  '합주실',
  '합주공간',
  '합주스튜디오',
  '합정 뮤직 업라운드',
  '합정 뮤직스퀘어',
  '합정 굿마인드',
];

type DetailCalendarDay = {
  day: number;
  highlight?: 'disabled' | 'today';
  muted?: boolean;
};

const DETAIL_CALENDAR_DAYS: DetailCalendarDay[] = [
  { day: 1, muted: true },
  { day: 2, muted: true },
  { day: 3, muted: true },
  { day: 4, muted: true },
  { day: 5, muted: true },
  { day: 6, muted: true },
  { day: 7, muted: true },
  { day: 8, muted: true },
  { day: 9, muted: true },
  { day: 10, muted: true },
  { day: 11, muted: true },
  { day: 12, muted: true },
  { day: 13, highlight: 'today' },
  { day: 14 },
  { day: 15, highlight: 'disabled' },
  { day: 16 },
  { day: 17 },
  { day: 18 },
  { day: 19 },
  { day: 20 },
  { day: 21 },
  { day: 22 },
  { day: 23 },
  { day: 24 },
  { day: 25 },
  { day: 26 },
  { day: 27 },
  { day: 28 },
  { day: 29 },
  { day: 30 },
  { day: 31 },
];

export function SpaceDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);
  const [phoneVerified, setPhoneVerified] = useState(authSession?.phoneVerified === true);
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedBookingDay, setSelectedBookingDay] = useState<number | null>(null);
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

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

  const filteredSuggestions = HEADER_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase())
  );

  const spaceCard = useMemo(
    () => HOME_SPACE_CARDS.find((item) => item.detailPath === `/spaces/${slug}`) ?? HOME_SPACE_CARDS[1],
    [slug]
  );

  const detail = {
    ...ROOM_DETAIL_DATA,
    category: spaceCard.subtitle,
    location: spaceCard.location,
    priceLabel: `${spaceCard.price}~`,
    studioName: spaceCard.studio,
    title: spaceCard.title,
  };

  const handleSearchSubmit = (value: string) => {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return;
    }

    navigate(`/search?q=${encodeURIComponent(normalizedValue)}`);
  };

  const selectedBookingDateLabel = selectedBookingDay
    ? `${new Date(2025, 7, selectedBookingDay).getFullYear()}년 8월 ${selectedBookingDay}일 (${['일', '월', '화', '수', '목', '금', '토'][new Date(2025, 7, selectedBookingDay).getDay()]})`
    : '날짜를 선택해주세요';

  return (
    <main className="space-detail-page">
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

      <section className="space-detail__inner">
        <div className="space-detail__top">
          <div className="space-detail__gallery">
            <div className="space-detail__hero-image-wrap">
              <img
                alt={detail.title}
                className="space-detail__hero-image"
                src={detail.gallery[selectedImageIndex]}
              />
            </div>
            <div className="space-detail__thumb-grid">
              {detail.gallery.slice(1).map((image, index) => (
                <button
                  className={`space-detail__thumb ${selectedImageIndex === index + 1 ? 'space-detail__thumb--active' : ''}`}
                  key={image}
                  onClick={() => setSelectedImageIndex(index + 1)}
                  type="button"
                >
                  <img alt="" className="space-detail__thumb-image" src={image} />
                </button>
              ))}
            </div>
          </div>

          <aside className="space-detail__booking-card">
            <div className="space-detail__test-toggle">
              <span>테스트 보기</span>
              <button
                className="space-detail__test-toggle-button"
                onClick={() => setPhoneVerified((current) => !current)}
                type="button"
              >
                {phoneVerified ? '본인인증 완료' : '본인인증 미완료'}
              </button>
            </div>
            {phoneVerified ? (
              <>
                <div className="space-detail__booking-header">
                  <h2>날짜 선택</h2>
                  <p className={selectedBookingDay ? 'space-detail__booking-date-value' : ''}>
                    {selectedBookingDateLabel}
                  </p>
                </div>
                <div className="space-detail__calendar-month">
                  <button type="button">‹</button>
                  <span>2025년 8월</span>
                  <button type="button">›</button>
                </div>
                <div className="space-detail__calendar-weekdays">
                  {['일', '월', '화', '수', '목', '금', '토'].map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>
                <div className="space-detail__calendar-grid">
                  {DETAIL_CALENDAR_DAYS.map((item) => (
                    <button
                      className={`space-detail__calendar-day ${item.muted ? 'space-detail__calendar-day--muted' : ''} ${selectedBookingDay === item.day ? 'space-detail__calendar-day--selected' : ''}`}
                      disabled={item.highlight === 'disabled' || item.muted}
                      key={item.day}
                      onClick={() => setSelectedBookingDay(item.day)}
                      type="button"
                    >
                      <span>{item.day}</span>
                      {item.highlight === 'today' ? <em>오늘</em> : null}
                      {item.highlight === 'disabled' ? <em className="space-detail__calendar-day-note">예약불가</em> : null}
                    </button>
                  ))}
                </div>
                <button
                  className="space-detail__calendar-submit"
                  disabled={!selectedBookingDay}
                  onClick={() =>
                    selectedBookingDay &&
                    navigate(
                      `/spaces/${slug}/reserve?date=2025-08-${String(selectedBookingDay).padStart(2, '0')}`
                    )
                  }
                  type="button"
                >
                  선택완료
                </button>
              </>
            ) : (
              <div className="space-detail__verify-card">
                <div className="space-detail__verify-date">08.13 (수)</div>
                <div className="space-detail__verify-divider" />
                <p className="space-detail__verify-copy">
                  예약을 하려면 최초 1회
                  <br />
                  휴대폰 본인인증이 필요해요.
                </p>
                <button
                  className="space-detail__verify-button"
                  onClick={() => navigate(isAuthenticated ? '/login' : '/login')}
                  type="button"
                >
                  <span className="space-detail__verify-badge">20초</span>
                  <span>본인인증 하기</span>
                </button>
              </div>
            )}
          </aside>
        </div>

        <div className="space-detail__content">
          <div className="space-detail__main">
            <div className="space-detail__summary">
              <div className="space-detail__eyebrow">
                <span>{detail.category}</span>
                <span className="space-detail__dot" />
                <span>{detail.studioName}</span>
              </div>
              <h1 className="space-detail__title">{detail.title}</h1>
              <p className="space-detail__location">{detail.location} · {detail.address}</p>
              <div className="space-detail__rating-row">
                <div className="space-detail__stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <StarIcon key={index} />
                  ))}
                  <span>{detail.rating}({detail.reviewCount})</span>
                </div>
                <button className="space-detail__scrap" type="button">
                  저장
                </button>
              </div>
              <div className="space-detail__price-row">
                <div className="space-detail__price">
                  <strong>{detail.priceLabel}</strong>
                  <span>/60분</span>
                </div>
                <div className="space-detail__tags">
                  {detail.summaryTags.map((tag) => (
                    <span className="space-detail__tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <section className="space-detail__section">
              <div className="space-detail__section-title-wrap">
                <h2>기본 정보</h2>
              </div>
              <div className="space-detail__info-card">
                <div className="space-detail__info-list">
                  {ROOM_DETAIL_INFO_ROWS.map((row) => (
                    <div className="space-detail__info-row" key={row.label}>
                      <span className="space-detail__info-label">{row.label}</span>
                      <span className="space-detail__info-value">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-detail__map">
                  <div className="space-detail__map-pin" />
                </div>
              </div>
            </section>

            <section className="space-detail__section">
              <h2>업체 정보</h2>
              <div className="space-detail__vendor-card">
                <div className="space-detail__vendor-main">
                  <div className="space-detail__vendor-avatar" />
                  <div>
                    <p className="space-detail__vendor-name">{detail.vendor.name}</p>
                    <p className="space-detail__vendor-meta">{detail.vendor.spaces}</p>
                  </div>
                </div>
                <button className="space-detail__vendor-link" type="button">
                  상세보기
                  <ChevronIcon />
                </button>
                <button className="space-detail__chat-button" type="button">
                  채팅하기
                </button>
              </div>
            </section>

            <nav className="space-detail__section-nav" aria-label="상세 섹션">
              <button className="space-detail__section-tab space-detail__section-tab--active" type="button">
                기본 정보
              </button>
              <button className="space-detail__section-tab" type="button">
                상세 설명
              </button>
              <button className="space-detail__section-tab" type="button">
                후기 32
              </button>
            </nav>

            <section className="space-detail__section">
              <h2>상세 정보</h2>
              <p className="space-detail__description">{detail.description}</p>
              <div className="space-detail__policy-list">
                {detail.policies.map((policy) => (
                  <article className="space-detail__policy-card" key={policy.title}>
                    <h3>{policy.title}</h3>
                    <p>{policy.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-detail__section">
              <div className="space-detail__section-title-wrap">
                <h2>후기 {detail.reviewSummary.length}</h2>
                <button className="space-detail__more-link" type="button">
                  전체보기
                </button>
              </div>
              <div className="space-detail__review-list">
                {detail.reviewSummary.map((review) => (
                  <article className="space-detail__review-card" key={`${review.author}-${review.date}`}>
                    <div className="space-detail__review-head">
                      <div className="space-detail__review-avatar" />
                      <div>
                        <p className="space-detail__review-author">{review.author}</p>
                        <p className="space-detail__review-date">{review.date} · 전체 별점</p>
                      </div>
                    </div>
                    <div className="space-detail__review-stars">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <StarIcon key={index} />
                      ))}
                      <span>{review.rating}</span>
                    </div>
                    <p className="space-detail__review-text">{review.text}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

        </div>

        <section className="space-detail__section space-detail__section--recommend">
          <div className="space-detail__section-title-wrap">
            <h2>유사하다면 다른 방</h2>
          </div>
          <div className="space-detail__recommend-grid">
            {ROOM_DETAIL_RECOMMENDATIONS.map((space) => (
              <HomeSpaceCard key={space.title} {...space} />
            ))}
          </div>
        </section>
      </section>

      <HomeFooter />
    </main>
  );
}
