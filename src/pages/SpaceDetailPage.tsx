import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createVendorChatRoom } from '../api/chat';
import { getAvailableCoupons } from '../api/coupons';
import { fetchVendorDetail } from '../api/spaces';
import { getMyAccount } from '../api/users';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { useGuestGate } from '../components/home/GuestGateProvider';
import { KakaoMapView } from '../components/map/KakaoMapView';
import { BookmarkIcon, ChevronIcon, HeaderChatIcon, StarIcon } from '../components/shared/Icons';
import { loadAuthSession, saveAuthSession } from '../data/authSession';
import { HomeSpaceCard } from '../components/home/HomeSpaceCard';
import { ROOM_DETAIL_RECOMMENDATIONS } from '../data/spaceDetail';
import { SpaceSummaryFeatureIcon } from '../components/space/SpaceSummaryFeatureIcon';
import { BanderUsagePolicyModal } from '../components/space/BanderUsagePolicyModal';
import { CouponDownloadModal } from '../components/space/CouponDownloadModal';
import { useCouponDownloads } from '../hooks/useCouponDownloads';
import { useSpaceDetail } from '../hooks/useSpaceDetail';
import { buildChatHref } from '../lib/chatRoutes';
import { isMockMode } from '../config/publicEnv';
import type { CouponAvailableItemDto } from '../data/schemas/coupon';

type DetailCalendarDay = {
  day: number;
  highlight?: 'disabled' | 'today';
  muted?: boolean;
};

type SpaceDetailSubTab = 'basic' | 'detail' | 'reviews';

/** `.space-detail__section-nav--sticky` top(79px) + 탭바(패딩·본문·보더) — 제목이 스티키 바로 아래 보이도록 */
const SPACE_DETAIL_SECTION_SCROLL_TOP_OFFSET_PX = 130;

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

function DetailPolicyBlock({ body, title, imageUrl }: { body: string; title: string; imageUrl?: string | null }) {
  const lines = body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  return (
    <div className="space-detail__detail-policy-block">
      <div className="space-detail__detail-policy-head">
        <span aria-hidden="true" className="space-detail__detail-policy-sq" />
        <h3>{title}</h3>
      </div>
      {imageUrl ? (
        <img
          alt={title}
          className="space-detail__detail-policy-image"
          src={imageUrl}
        />
      ) : null}
      {lines.map((line) => (
        <div className="space-detail__detail-policy-row" key={line}>
          <span aria-hidden="true" className="space-detail__detail-policy-bar" />
          <p>{line}</p>
        </div>
      ))}
    </div>
  );
}

export function SpaceDetailPage() {
  const navigate = useNavigate();
  const { openGuestGate } = useGuestGate();
  const { slug: slugParam } = useParams();
  const { detail, slug, vendorSlug, loading, error } = useSpaceDetail(slugParam);
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);
  const [phoneVerified, setPhoneVerified] = useState(authSession?.phoneVerified === true);
  const [verifiedPhoneMasked, setVerifiedPhoneMasked] = useState('');
  const [phoneStatusLoading, setPhoneStatusLoading] = useState(false);
  const [phoneStatusError, setPhoneStatusError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedBookingDay, setSelectedBookingDay] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<SpaceDetailSubTab>('basic');
  const [vendorOperatingOpen, setVendorOperatingOpen] = useState(false);
  const [summaryOperatingOpen, setSummaryOperatingOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<CouponAvailableItemDto[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [banderPolicyOpen, setBanderPolicyOpen] = useState(false);
  const { downloadCoupon, downloadedCouponIds, downloadError } = useCouponDownloads();
  const galleryRef = useRef<HTMLElement | null>(null);
  const basicSectionRef = useRef<HTMLElement | null>(null);
  const detailSectionRef = useRef<HTMLElement | null>(null);
  const reviewsSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isAuthenticated || isMockMode()) {
      setPhoneVerified(false);
      setVerifiedPhoneMasked('');
      setPhoneStatusLoading(false);
      setPhoneStatusError(null);
      return;
    }

    let cancelled = false;
    setPhoneStatusLoading(true);
    setPhoneStatusError(null);

    getMyAccount()
      .then((account) => {
        if (cancelled) return;
        setPhoneVerified(account.phoneVerified);
        setVerifiedPhoneMasked(account.phoneMasked ?? '');

        const latestSession = loadAuthSession();
        if (latestSession) {
          saveAuthSession({
            ...latestSession,
            phoneVerified: account.phoneVerified,
          });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setPhoneStatusError('휴대폰 인증 상태를 불러오지 못했습니다.');
        setPhoneVerified(false);
        setVerifiedPhoneMasked('');
      })
      .finally(() => {
        if (!cancelled) {
          setPhoneStatusLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authSession?.userId]);

  useEffect(() => {
    if (!slug || isMockMode()) {
      return;
    }
    const controller = new AbortController();
    setCouponLoading(true);
    setCouponError(null);
    getAvailableCoupons(slug, { signal: controller.signal })
      .then((response) => setAvailableCoupons(response.coupons))
      .catch((error) => {
        if (!controller.signal.aborted) {
          setCouponError(error instanceof Error ? error.message : '쿠폰을 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCouponLoading(false);
        }
      });
    return () => controller.abort();
  }, [slug]);

  const handleDownloadCoupon = async (couponId: string) => {
    if (!isAuthenticated) {
      openGuestGate(`/spaces/${slug}`);
      return;
    }
    try {
      await downloadCoupon(couponId);
      setCouponError(null);
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : '쿠폰 다운로드에 실패했습니다.');
    }
  };

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToSubSection = (tab: SpaceDetailSubTab) => {
    const refMap: Record<SpaceDetailSubTab, React.RefObject<HTMLElement | null>> = {
      basic: basicSectionRef,
      detail: detailSectionRef,
      reviews: reviewsSectionRef,
    };
    const el = refMap[tab].current;
    setActiveSubTab(tab);
    if (!el) {
      return;
    }
    const top = el.getBoundingClientRect().top + window.scrollY - SPACE_DETAIL_SECTION_SCROLL_TOP_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  const selectedBookingDateLabel = selectedBookingDay
    ? `${new Date(2025, 7, selectedBookingDay).getFullYear()}년 8월 ${selectedBookingDay}일 (${['일', '월', '화', '수', '목', '금', '토'][new Date(2025, 7, selectedBookingDay).getDay()]})`
    : '날짜를 선택해주세요';

  if (loading) {
    return (
      <main className="space-detail-page">
        <HomeHeader authenticated={isAuthenticated} onGuestCta={() => navigate('/login')} variant="icon" />
        <section className="space-detail__inner">
          <p style={{ textAlign: 'center', padding: '4rem 0', color: '#888' }}>로딩 중...</p>
        </section>
        <HomeFooter />
      </main>
    );
  }

  if (error || !detail) {
    return (
      <main className="space-detail-page">
        <HomeHeader authenticated={isAuthenticated} onGuestCta={() => navigate('/login')} variant="icon" />
        <section className="space-detail__inner">
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ fontSize: '1.1rem', color: '#333', marginBottom: '1rem' }}>공간 정보를 불러올 수 없습니다.</p>
            <button onClick={() => navigate(-1)} style={{ minHeight: '44px', padding: '0.5rem 1.5rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }} type="button">뒤로 가기</button>
          </div>
        </section>
        <HomeFooter />
      </main>
    );
  }

  return (
    <main className="space-detail-page">
      <HomeHeader authenticated={isAuthenticated} onGuestCta={() => navigate('/login')} variant="icon" />

      <section className="space-detail__inner">
        <div className="space-detail__layout">
          <div className="space-detail__body-col">
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
                    className={`space-detail__thumb space-detail__thumb--corner-${index} ${selectedImageIndex === index + 1 ? 'space-detail__thumb--active' : ''}`}
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

                  {/* Figma 6071:33714 — 거리 · 전체 주소 한 줄 */}
                  <p className="space-detail__location-figma">
                    <span>{detail.stationDistance}</span>
                    <span className="space-detail__dot space-detail__dot--figma-loc" aria-hidden="true" />
                    <span>{detail.address}</span>
                  </p>

                  {/* Figma 6071:32899 + 6071:32908 — 별점(좌) · 시작가(우) */}
                  <div className="space-detail__meta-rating-price">
                    <div className="space-detail__stars space-detail__stars--figma-summary">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <StarIcon key={index} />
                      ))}
                      <span>
                        {detail.rating}({detail.reviewCount})
                      </span>
                    </div>
                    <div className="space-detail__summary-price-teaser">
                      <span className="space-detail__summary-price-strong">{detail.priceLabel}</span>
                      <span className="space-detail__summary-price-suffix">{detail.priceTeaserSuffix}</span>
                    </div>
                  </div>

                  {/* Figma 6071:32916 — 해시태그 (시설 아이콘 칩과 별도) */}
                  <ul className="space-detail__summary-hash-tags" aria-label="공간 태그">
                    {detail.summaryHashTags.map((tag) => (
                      <li className="space-detail__summary-hash-tag" key={tag}>
                        {tag}
                      </li>
                    ))}
                  </ul>

                  <hr className="space-detail__rule" />

                  {/* Figma 6071:32854 / Frame 6071:32924 — 요금 2줄 + 운영시간(요일 펼침) */}
                  <div
                    className="space-detail__pricing-spec space-detail__pricing-spec--figma-summary"
                    aria-label="요금 및 운영"
                  >
                    {detail.pricingLines.map((line) => (
                      <div className="space-detail__pricing-spec-row" key={`${line.label}-${line.value}`}>
                        <span className="space-detail__pricing-spec-label">{line.label}</span>
                        <span className="space-detail__pricing-spec-value">{line.value}</span>
                      </div>
                    ))}
                    <div className="space-detail__pricing-spec-row">
                      <span className="space-detail__pricing-spec-label" id="space-detail-hours-label">
                        운영시간
                      </span>
                      <button
                        aria-expanded={summaryOperatingOpen}
                        aria-labelledby="space-detail-hours-label"
                        className={`space-detail__pricing-spec-value space-detail__pricing-spec-value--with-icon space-detail__operating-toggle ${summaryOperatingOpen ? 'space-detail__operating-toggle--open' : ''}`}
                        onClick={() => setSummaryOperatingOpen((open) => !open)}
                        type="button"
                      >
                        <span className="space-detail__operating-toggle-text">{detail.operatingSummary}</span>
                        <span aria-hidden="true" className="space-detail__operating-toggle-chevron">
                          <ChevronIcon />
                        </span>
                      </button>
                    </div>
                    <div className="space-detail__pricing-spec-row">
                      <span className="space-detail__pricing-spec-label" id="space-detail-bander-policy-label">
                        이용정책
                      </span>
                      <button
                        aria-labelledby="space-detail-bander-policy-label"
                        className="space-detail__pricing-spec-value space-detail__bander-policy-btn"
                        onClick={() => setBanderPolicyOpen(true)}
                        type="button"
                      >
                        <span>이용정책 확인</span>
                        <span aria-hidden="true" className="space-detail__bander-policy-btn-chevron">
                          <ChevronIcon />
                        </span>
                      </button>
                    </div>
                  </div>
                  {summaryOperatingOpen ? (
                    <ul aria-label="요일별 운영시간" className="space-detail__operating-week">
                      {detail.operatingWeek.map((row) => (
                        <li
                          className={`space-detail__operating-week-row ${row.isToday ? 'space-detail__operating-week-row--today' : ''}`}
                          key={row.weekday}
                        >
                          <span className="space-detail__operating-week-day">
                            {row.weekday}
                            {row.isToday ? <em className="space-detail__operating-week-today">오늘</em> : null}
                          </span>
                          <span className="space-detail__operating-week-hours">{row.hours}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {/* 요약 영역 쿠폰 — 예약 페이지와 동일 적용 가능 쿠폰 모달 */}
                  <button
                    className="space-detail__coupon-strip"
                    onClick={() => setCouponModalOpen(true)}
                    type="button"
                  >
                    <span className="space-detail__coupon-strip-label">{detail.couponStripLabel}</span>
                    <span aria-hidden="true" className="space-detail__coupon-strip-chevron">
                      <ChevronIcon />
                    </span>
                  </button>

                  <hr className="space-detail__rule" />

                  <div className="space-detail__description-block">
                    <p
                      className={`space-detail__description space-detail__description--lead ${descriptionExpanded ? '' : 'space-detail__description--lead-clamped'}`}
                    >
                      {detail.description}
                    </p>
                    <button
                      aria-expanded={descriptionExpanded}
                      className="space-detail__description-more"
                      onClick={() => setDescriptionExpanded((open) => !open)}
                      type="button"
                    >
                      {descriptionExpanded ? '접기' : '더보기'}
                    </button>
                  </div>

                  {detail.trustBanner ? <p className="space-detail__trust-banner">{detail.trustBanner}</p> : null}
                </div>

                <nav className="space-detail__section-nav space-detail__section-nav--sticky" aria-label="상세 섹션">
                  <button
                    className={`space-detail__section-tab ${activeSubTab === 'basic' ? 'space-detail__section-tab--active' : ''}`}
                    onClick={() => scrollToSubSection('basic')}
                    type="button"
                  >
                    기본 정보
                  </button>
                  <button
                    className={`space-detail__section-tab ${activeSubTab === 'detail' ? 'space-detail__section-tab--active' : ''}`}
                    onClick={() => scrollToSubSection('detail')}
                    type="button"
                  >
                    상세정보
                  </button>
                  <button
                    className={`space-detail__section-tab ${activeSubTab === 'reviews' ? 'space-detail__section-tab--active' : ''}`}
                    onClick={() => scrollToSubSection('reviews')}
                    type="button"
                  >
                    후기 {detail.reviewCount}
                  </button>
                </nav>

                <section
                  className="space-detail__section space-detail__section--scroll-target"
                  id="space-detail-basic"
                  ref={basicSectionRef}
                >
                  <div className="space-detail__section-title-wrap">
                    <h2>기본 정보</h2>
                  </div>
                  <div className="space-detail__info-card">
                    <div className="space-detail__info-list">
                      {detail.address ? (
                        <div className="space-detail__info-row" key="address">
                          <span className="space-detail__info-label">주소</span>
                          <span className="space-detail__info-value space-detail__info-value--multiline">
                            {detail.address}
                          </span>
                        </div>
                      ) : null}
                      {detail.operatingSummary ? (
                        <div className="space-detail__info-row" key="hours">
                          <span className="space-detail__info-label">영업시간</span>
                          <span className="space-detail__info-value">{detail.operatingSummary}</span>
                        </div>
                      ) : null}
                      {detail.pricingLines.map((line) => (
                        <div className="space-detail__info-row" key={`pricing-${line.label}`}>
                          <span className="space-detail__info-label">{line.label}</span>
                          <span className="space-detail__info-value">{line.value}</span>
                        </div>
                      ))}
                    </div>
                    <KakaoMapView
                      center={detail.mapLocation}
                      className="space-detail__map space-detail__map--live"
                      level={4}
                      markers={[{ ...detail.mapLocation, title: detail.title }]}
                      title={`${detail.title} 위치 지도`}
                    />
                  </div>
                  <ul className="space-detail__facility-chips" aria-label="편의 시설">
                    {detail.facilityChips.map((item) => (
                      <li
                        aria-label={`${item.label} 지원`}
                        className="space-detail__facility-chip"
                        key={item.key ? `${item.key}-${item.label}` : item.label}
                      >
                        <span className="space-detail__facility-chip-icon">
                          {item.key ? (
                            <SpaceSummaryFeatureIcon featureKey={item.key} />
                          ) : (
                            <span aria-hidden="true" className="space-detail__detail-benefit-icon-ph" />
                          )}
                        </span>
                        <span className="space-detail__facility-chip-label">{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-detail__section">
                  <h2>업체 정보</h2>
                  <div className="space-detail__vendor-card">
                    <div className="space-detail__vendor-top">
                      {vendorSlug ? (
                        <Link className="space-detail__vendor-main space-detail__vendor-main--link" to={`/vendors/${vendorSlug}`}>
                          <div className="space-detail__vendor-avatar" />
                          <div>
                            <p className="space-detail__vendor-name">{detail.vendor.name}</p>
                            <p className="space-detail__vendor-meta">{detail.vendor.spaces}</p>
                          </div>
                        </Link>
                      ) : (
                        <div className="space-detail__vendor-main">
                          <div className="space-detail__vendor-avatar" />
                          <div>
                            <p className="space-detail__vendor-name">{detail.vendor.name}</p>
                            <p className="space-detail__vendor-meta">{detail.vendor.spaces}</p>
                          </div>
                        </div>
                      )}
                      <button
                        aria-expanded={vendorOperatingOpen}
                        className={`space-detail__vendor-hours ${vendorOperatingOpen ? 'space-detail__vendor-hours--open' : ''}`}
                        onClick={() => setVendorOperatingOpen((open) => !open)}
                        type="button"
                      >
                        <span>{detail.operatingSummary}</span>
                        <span className="space-detail__vendor-hours-icon" aria-hidden="true">
                          <ChevronIcon />
                        </span>
                      </button>
                    </div>
                    {vendorOperatingOpen ? (
                      <ul aria-label="요일별 운영시간" className="space-detail__operating-week space-detail__operating-week--in-card">
                        {detail.operatingWeek.map((row) => (
                          <li
                            className={`space-detail__operating-week-row ${row.isToday ? 'space-detail__operating-week-row--today' : ''}`}
                            key={`vendor-${row.weekday}`}
                          >
                            <span className="space-detail__operating-week-day">
                              {row.weekday}
                              {row.isToday ? <em className="space-detail__operating-week-today">오늘</em> : null}
                            </span>
                            <span className="space-detail__operating-week-hours">{row.hours}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <button
                      className="space-detail__chat-button"
                      type="button"
                      onClick={async () => {
                        if (!isAuthenticated) {
                          const dest = buildChatHref({
                            space: slug || undefined,
                            vendor: vendorSlug ?? undefined,
                          });
                          openGuestGate(dest);
                          return;
                        }
                        if (!vendorSlug) {
                          console.error('[SpaceDetailPage] missing vendorSlug');
                          window.alert('업체 정보를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
                          return;
                        }
                        try {
                          const vendorDto = await fetchVendorDetail(vendorSlug);
                          if (!vendorDto.ownerUserId) {
                            console.error('[SpaceDetailPage] missing ownerUserId, dto=', vendorDto);
                            window.alert('업체 사장 정보를 가져오지 못했습니다.');
                            return;
                          }
                          if (!vendorDto.vendorId) {
                            console.error('[SpaceDetailPage] missing vendorId, dto=', vendorDto);
                            window.alert('업체 ID 를 가져오지 못했습니다.');
                            return;
                          }
                          const room = await createVendorChatRoom({
                            targetUserId: vendorDto.ownerUserId,
                            vendorId: vendorDto.vendorId,
                            vendorSlug,
                          });
                          navigate(`/chat?t=${room.chatRoomId}`);
                        } catch (err) {
                          console.error('[SpaceDetailPage] createVendorChatRoom failed', err);
                          const msg = err instanceof Error ? err.message : '알 수 없는 오류';
                          window.alert(`채팅방 생성에 실패했습니다: ${msg}`);
                        }
                      }}
                    >
                      <HeaderChatIcon />
                      채팅하기
                    </button>
                  </div>
                </section>

                <section
                  className="space-detail__section space-detail__section--scroll-target space-detail__section--figma-detail"
                  id="space-detail-detail"
                  ref={detailSectionRef}
                >
                  <h2>상세정보</h2>
                  {detail.notices.length > 0 ? (
                    <div className="space-detail__notice-list space-detail__notice-list--under-detail-title">
                      {detail.notices.map((notice) => (
                        <DetailPolicyBlock body={notice.body} imageUrl={notice.imageUrl} key={notice.title} title={notice.title} />
                      ))}
                    </div>
                  ) : null}
                  {/* detailBenefits는 facilityChips에 통합됨 */}
                  <div className="space-detail__detail-policy-stack">
                    {detail.policies.map((policy) => (
                      <DetailPolicyBlock body={policy.body} imageUrl={policy.imageUrl} key={policy.title} title={policy.title} />
                    ))}
                  </div>
                </section>

                <section
                  className="space-detail__section space-detail__section--scroll-target"
                  id="space-detail-reviews"
                  ref={reviewsSectionRef}
                >
                  <div className="space-detail__section-title-wrap">
                    <h2>후기 {detail.reviewCount}</h2>
                    <button className="space-detail__more-link" type="button">
                      전체보기
                    </button>
                  </div>
                  <div className="space-detail__review-list">
                    {detail.reviewSummary.map((review, index) => (
                      <article className="space-detail__review-card" key={`review-${index}`}>
                        <div className="space-detail__review-meta-row">
                          <span className="space-detail__review-avatar-sm" aria-hidden="true" />
                          <p className="space-detail__review-meta-line">
                            <span className="space-detail__review-meta-author">{review.author}</span>
                            <span className="space-detail__review-meta-dot" aria-hidden="true" />
                            <span className="space-detail__review-meta-date">{review.date}</span>
                            <span className="space-detail__review-meta-dot" aria-hidden="true" />
                            <span>전체 별점</span>
                          </p>
                        </div>
                        <p className="space-detail__review-text space-detail__review-text--figma">{review.text}</p>
                        <div className="space-detail__review-stars space-detail__review-stars--figma">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <StarIcon key={index} />
                          ))}
                          <span>{review.rating}</span>
                        </div>
                        {review.photoCount ? (
                          <div className="space-detail__review-photos" aria-hidden="true">
                            {Array.from({ length: review.photoCount }).map((_, index) => (
                              <div className="space-detail__review-photo-ph" key={`${review.author}-ph-${index}`} />
                            ))}
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div className="space-detail__booking-host">
          <aside className="space-detail__booking-card">
            {phoneStatusLoading ? (
              <div className="space-detail__verify-card">
                <div className="space-detail__verify-date">인증 상태 확인</div>
                <div className="space-detail__verify-divider" />
                <p className="space-detail__verify-copy">
                  휴대폰 본인인증 상태를
                  <br />
                  확인하고 있어요.
                </p>
              </div>
            ) : phoneVerified ? (
              <>
                <div className="space-detail__booking-pricing-bar">
                  <span className="space-detail__booking-pricing-label">본인인증</span>
                  <span className="space-detail__booking-pricing-value">
                    {verifiedPhoneMasked ? `완료 (${verifiedPhoneMasked})` : '완료'}
                  </span>
                </div>
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
                      `/spaces/${slug}/reserve?date=2025-08-${String(selectedBookingDay).padStart(2, '0')}${detail && 'roomId' in detail && detail.roomId ? `&roomId=${detail.roomId}` : ''}`
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
                {phoneStatusError ? (
                  <p className="space-detail__verify-copy">
                    {phoneStatusError}
                  </p>
                ) : null}
                <button
                  className="space-detail__verify-button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      openGuestGate(`/spaces/${slug}`);
                      return;
                    }

                    navigate('/account/settings#phone-verification');
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

      <CouponDownloadModal
        coupons={isMockMode() ? undefined : availableCoupons}
        downloadedCouponIds={downloadedCouponIds}
        errorMessage={couponError ?? downloadError}
        loading={couponLoading}
        onClose={() => setCouponModalOpen(false)}
        onDownloadCoupon={handleDownloadCoupon}
        open={couponModalOpen}
      />

      <BanderUsagePolicyModal onClose={() => setBanderPolicyOpen(false)} open={banderPolicyOpen} />

      <HomeFooter />
    </main>
  );
}
