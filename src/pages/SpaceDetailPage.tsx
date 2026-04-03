import React, { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HomeSpaceCard } from '../components/home/HomeSpaceCard';
import { BookmarkIcon, ChevronIcon, StarIcon } from '../components/shared/Icons';
import { loadAuthSession } from '../data/authSession';
import { ROOM_DETAIL_INFO_ROWS, ROOM_DETAIL_RECOMMENDATIONS } from '../data/spaceDetail';
import { useSpaceDetail } from '../hooks/useSpaceDetail';

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
  const { slug: slugParam } = useParams();
  const { detail, slug } = useSpaceDetail(slugParam);
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);
  const [phoneVerified, setPhoneVerified] = useState(authSession?.phoneVerified === true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedBookingDay, setSelectedBookingDay] = useState<number | null>(null);
  const galleryRef = useRef<HTMLElement | null>(null);

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const selectedBookingDateLabel = selectedBookingDay
    ? `${new Date(2025, 7, selectedBookingDay).getFullYear()}년 8월 ${selectedBookingDay}일 (${['일', '월', '화', '수', '목', '금', '토'][new Date(2025, 7, selectedBookingDay).getDay()]})`
    : '날짜를 선택해주세요';

  return (
    <main className="space-detail-page">
      <HomeHeader authenticated={isAuthenticated} onGuestCta={() => navigate('/login')} variant="icon" />

      <section className="space-detail__inner">
        <div className="space-detail__top">
          <section ref={galleryRef} aria-label="공간 사진" className="space-detail__gallery">
            <div className="space-detail__hero-image-wrap">
              <img
                alt={detail.title}
                className="space-detail__hero-image"
                src={detail.gallery[selectedImageIndex]}
              />
            </div>
            <div className="space-detail__thumb-stack">
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
              <button className="space-detail__gallery-viewall" onClick={scrollToGallery} type="button">
                사진 전체 보기
              </button>
            </div>
          </section>

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
                <div className="space-detail__booking-pricing-bar">
                  <span className="space-detail__booking-pricing-label">이용금액</span>
                  <span className="space-detail__booking-pricing-value">
                    <span aria-hidden="true" className="space-detail__booking-cal" />
                    {detail.pricingLines[0]?.value ?? '10분 1,000원'}
                  </span>
                </div>
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
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate(`/login?returnTo=${encodeURIComponent(`/spaces/${slug}`)}`);
                      return;
                    }

                    setPhoneVerified(true);
                  }}
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
              <div className="space-detail__summary-title-row">
                <div className="space-detail__summary-title-main">
                  <div className="space-detail__eyebrow">
                    <span>{detail.category}</span>
                    <span className="space-detail__dot" />
                    <span>{detail.studioName}</span>
                  </div>
                  <h1 className="space-detail__title">{detail.title}</h1>
                </div>
                <button aria-label="스크랩" className="space-detail__scrap space-detail__scrap--icon" type="button">
                  <BookmarkIcon />
                </button>
              </div>

              <p className="space-detail__location space-detail__location--split">
                <span>{detail.location}</span>
                <span className="space-detail__dot" aria-hidden="true" />
                <span>{detail.address}</span>
              </p>

              <div className="space-detail__rating-row space-detail__rating-row--detail">
                <div className="space-detail__stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <StarIcon key={index} />
                  ))}
                  <span>
                    {detail.rating}({detail.reviewCount})
                  </span>
                </div>
              </div>

              <div className="space-detail__tags-distance-row">
                <div className="space-detail__tags space-detail__tags--block">
                  {detail.summaryTags.map((tag) => (
                    <span className="space-detail__tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="space-detail__distance-block">
                  <strong className="space-detail__distance-strong">{detail.stationDistance}</strong>
                  <span className="space-detail__distance-sub">도보</span>
                </div>
              </div>

              <hr className="space-detail__rule" />

              <div className="space-detail__pricing-spec" aria-label="요금 및 운영">
                {detail.pricingLines.map((line) => (
                  <div className="space-detail__pricing-spec-row" key={`${line.label}-${line.value}`}>
                    <span className="space-detail__pricing-spec-label">{line.label}</span>
                    <span className="space-detail__pricing-spec-value">{line.value}</span>
                  </div>
                ))}
                <div className="space-detail__pricing-spec-row">
                  <span className="space-detail__pricing-spec-label">운영시간</span>
                  <span className="space-detail__pricing-spec-value space-detail__pricing-spec-value--with-icon">
                    {detail.operatingSummary}
                    <ChevronIcon />
                  </span>
                </div>
              </div>

              <a
                className="space-detail__map-search"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail.address)}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="space-detail__map-search-placeholder">{detail.mapSearchPlaceholder}</span>
                <span className="space-detail__map-search-icon" aria-hidden="true">
                  <ChevronIcon />
                </span>
              </a>

              <hr className="space-detail__rule" />

              <div className="space-detail__description-block">
                <p className="space-detail__description space-detail__description--lead">{detail.description}</p>
                <span className="space-detail__description-pill">{detail.descriptionCategoryLabel}</span>
              </div>

              <p className="space-detail__trust-banner">{detail.trustBanner}</p>
            </div>

            <section className="space-detail__section">
              <div className="space-detail__section-title-wrap">
                <h2>공지사항</h2>
              </div>
              <div className="space-detail__notice-list">
                {detail.notices.map((notice) => (
                  <article className="space-detail__notice-card" key={notice.title}>
                    <h3>{notice.title}</h3>
                    <p>{notice.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-detail__section">
              <div className="space-detail__section-title-wrap">
                <h2>기본 정보</h2>
              </div>
              <div className="space-detail__info-card">
                <div className="space-detail__info-list">
                  {ROOM_DETAIL_INFO_ROWS.map((row) => (
                    <div className="space-detail__info-row" key={row.label}>
                      <span className="space-detail__info-label">{row.label}</span>
                      <span
                        className={`space-detail__info-value ${row.label === '주소' ? 'space-detail__info-value--multiline' : ''}`}
                      >
                        {row.value}
                      </span>
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
