import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createVendorChatRoom } from '../api/chat';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { useGuestGate } from '../components/home/GuestGateProvider';
import { KakaoMapView } from '../components/map/KakaoMapView';
import { BanderUsagePolicyModal } from '../components/space/BanderUsagePolicyModal';
import { ChevronIcon, HeaderChatIcon, StarEmptyIcon, StarIcon } from '../components/shared/Icons';
import { VendorBasicInfoSection } from '../components/vendor/VendorBasicInfoSection';
import { loadAuthSession } from '../data/authSession';
import { useVendorDetail } from '../hooks/useVendorDetail';
import { buildChatHref } from '../lib/chatRoutes';

function VendorStarRow({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 2) / 2;
  const numFull = Math.min(5, Math.floor(rounded));
  const hasHalf = rounded % 1 !== 0 && numFull < 5;
  const numEmpty = 5 - numFull - (hasHalf ? 1 : 0);

  return (
    <div className="vendor-detail__star-row">
      {Array.from({ length: numFull }, (_, i) => (
        <StarIcon key={`f-${i}`} />
      ))}
      {hasHalf ? (
        <span className="vendor-detail__star-half" aria-hidden="true">
          <StarIcon />
        </span>
      ) : null}
      {Array.from({ length: numEmpty }, (_, i) => (
        <span className="vendor-detail__star-empty" key={`e-${i}`} aria-hidden="true">
          <StarEmptyIcon />
        </span>
      ))}
      <span className="vendor-detail__star-score">{rating.toFixed(1)}</span>
    </div>
  );
}

export function VendorDetailPage() {
  const navigate = useNavigate();
  const { openGuestGate } = useGuestGate();
  const { slug } = useParams();
  const { vendor } = useVendorDetail(slug);
  const isAuthenticated = Boolean(loadAuthSession());
  const [descExpanded, setDescExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [banderPolicyOpen, setBanderPolicyOpen] = useState(false);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!vendor) {
    return (
      <main className="vendor-detail-page vendor-detail-page--empty">
        <HomeHeader authenticated={isAuthenticated} onGuestCta={() => navigate('/login')} variant="icon" />
        <div className="vendor-detail__shell vendor-detail__shell--empty">
          <p className="vendor-detail__empty-title">업체를 찾을 수 없습니다.</p>
          <Link className="vendor-detail__empty-link" to="/search/map">
            검색으로 돌아가기
          </Link>
        </div>
        <HomeFooter />
      </main>
    );
  }

  const descParagraphs = vendor.description.split('\n').filter(Boolean);
  const showDescToggle = descParagraphs.length > 2;

  return (
    <main className="vendor-detail-page">
      <HomeHeader authenticated={isAuthenticated} onGuestCta={() => navigate('/login')} variant="icon" />

      <div className="vendor-detail__shell">
        <div className="vendor-detail__hero">
          <img alt="" className="vendor-detail__hero-image" src={vendor.heroImage} />
        </div>

        <header className="vendor-detail__head">
          <h1 className="vendor-detail__title">{vendor.name}</h1>
          <p className="vendor-detail__distance-line">
            <span>{vendor.distanceLabel}</span>
            <span className="vendor-detail__dot" aria-hidden="true" />
            <span>{vendor.fullAddress}</span>
          </p>
          <p className="vendor-detail__review-count">{vendor.reviewCountLabel}</p>
          <ul className="vendor-detail__tags" aria-label="업체 태그">
            {vendor.hashTags.map((tag) => (
              <li className="vendor-detail__tag" key={tag}>
                {tag}
              </li>
            ))}
          </ul>
          <button
            className="vendor-detail__chat-button"
            type="button"
            onClick={async () => {
              if (!isAuthenticated) {
                const dest = buildChatHref({ vendor: slug });
                openGuestGate(dest);
                return;
              }
              if (!vendor.ownerUserId) {
                console.error('[VendorDetailPage] missing ownerUserId, vendor=', vendor);
                window.alert('업체 정보가 아직 로딩 중입니다. 잠시 후 다시 시도해주세요.');
                return;
              }
              if (!vendor.vendorId) {
                console.error('[VendorDetailPage] missing vendorId, vendor=', vendor);
                window.alert('업체 ID 를 가져오지 못했습니다. 페이지를 새로고침해주세요.');
                return;
              }
              try {
                const room = await createVendorChatRoom({
                  targetUserId: vendor.ownerUserId,
                  vendorId: vendor.vendorId,
                  vendorSlug: vendor.slug ?? undefined,
                });
                navigate(`/chat?t=${room.chatRoomId}`);
              } catch (err) {
                console.error('[VendorDetailPage] createVendorChatRoom failed', err);
                const msg = err instanceof Error ? err.message : '알 수 없는 오류';
                window.alert(`채팅방 생성에 실패했습니다: ${msg}`);
              }
            }}
          >
            <HeaderChatIcon />
            채팅하기
          </button>
        </header>

        <hr className="vendor-detail__rule" />

        <div className="vendor-detail__policy-block">
          <div className="vendor-detail__policy-row">
            <span className="vendor-detail__policy-label">이용시간</span>
            <span className="vendor-detail__policy-value">{vendor.timeNote}</span>
          </div>
          <div className="vendor-detail__policy-row">
            <span className="vendor-detail__policy-label">이용정책</span>
            <button className="vendor-detail__policy-link" onClick={() => setBanderPolicyOpen(true)} type="button">
              <span>{vendor.policyLinkLabel}</span>
              <span className="vendor-detail__chevron" aria-hidden="true">
                <ChevronIcon />
              </span>
            </button>
          </div>
        </div>

        <hr className="vendor-detail__rule" />

        <div className="vendor-detail__description-block">
          <div
            className={`vendor-detail__description ${descExpanded || !showDescToggle ? '' : 'vendor-detail__description--clamped'}`}
          >
            {descParagraphs.map((line, i) => (
              <p key={`${i}-${line.slice(0, 40)}`}>{line}</p>
            ))}
          </div>
          {showDescToggle ? (
            <button
              className="vendor-detail__more-btn"
              onClick={() => setDescExpanded((v) => !v)}
              type="button"
            >
              {descExpanded ? '접기' : '더보기'}
            </button>
          ) : null}
        </div>

        <hr className="vendor-detail__rule" />

        <section className="vendor-detail__section" aria-labelledby="vendor-rooms-heading">
          <h2 className="vendor-detail__section-title" id="vendor-rooms-heading">
            룸 정보 {vendor.rooms.length}
          </h2>
          {vendor.rooms.length === 0 ? (
            <p className="vendor-detail__rooms-empty">등록된 공간이 아직 없습니다.</p>
          ) : (
            <div className="vendor-detail__room-list">
              {vendor.rooms.map((room) => (
                <Link className="vendor-detail__room-card" key={room.detailPath} to={room.detailPath}>
                  <div className="vendor-detail__room-thumb">
                    <img alt="" src={room.image} />
                  </div>
                  <div className="vendor-detail__room-body">
                    <div className="vendor-detail__room-top">
                      <div>
                        <p className="vendor-detail__room-category">{room.categoryLabel}</p>
                        <p className="vendor-detail__room-name">{room.title}</p>
                      </div>
                      <span className="vendor-detail__room-detail-link">
                        상세정보
                        <span className="vendor-detail__chevron vendor-detail__chevron--right" aria-hidden="true">
                          <ChevronIcon />
                        </span>
                      </span>
                    </div>
                    <div className="vendor-detail__room-meta">
                      <span className="vendor-detail__room-rating">
                        <StarIcon />
                        <strong>{room.rating}</strong>
                      </span>
                      <span className="vendor-detail__dot" aria-hidden="true" />
                      <span className="vendor-detail__room-location">{room.location}</span>
                    </div>
                    <div className="vendor-detail__room-bottom">
                      <div className="vendor-detail__room-price">
                        <strong>{room.priceLabel}</strong>
                        <span>{room.priceSuffix}</span>
                      </div>
                      <div className="vendor-detail__room-tags">
                        {room.tags.map((t, i) => (
                          <React.Fragment key={t}>
                            {i > 0 ? <span className="vendor-detail__dot" aria-hidden="true" /> : null}
                            <span>{t}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="vendor-detail__section vendor-detail__section--spaced" aria-labelledby="vendor-info-heading">
          <h2 className="vendor-detail__section-title" id="vendor-info-heading">
            기본 정보
          </h2>
          <div className="vendor-detail__info-stack">
            <VendorBasicInfoSection onCopy={copyText} rows={vendor.basicInfoRows} />
            <div className="vendor-detail__map">
              <KakaoMapView
                center={vendor.mapLocation}
                className="vendor-detail__map-image"
                level={4}
                markers={[{ ...vendor.mapLocation, title: vendor.name }]}
                title={`${vendor.name} 위치 지도`}
              />
            </div>
          </div>
        </section>

        <section className="vendor-detail__section" aria-labelledby="vendor-reviews-heading">
          <h2 className="vendor-detail__section-title" id="vendor-reviews-heading">
            리뷰 {vendor.reviewSectionCount}
          </h2>
          <div className="vendor-detail__review-list">
            {vendor.reviews.map((review, index) => (
              <article className="vendor-detail__review-card" key={`${review.author}-${review.date}-${index}`}>
                <div className="vendor-detail__review-head">
                  <div className="vendor-detail__review-author">
                    {review.authorAvatar ? (
                      <img alt="" className="vendor-detail__review-avatar" height="16" src={review.authorAvatar} width="16" />
                    ) : (
                      <span className="vendor-detail__review-avatar-ph" aria-hidden="true" />
                    )}
                    <span>{review.author}</span>
                    <span className="vendor-detail__dot" aria-hidden="true" />
                    <span>{review.date}</span>
                    <span className="vendor-detail__dot" aria-hidden="true" />
                    <span>{review.visitLabel}</span>
                  </div>
                  <p className="vendor-detail__review-text">{review.text}</p>
                  <VendorStarRow rating={review.rating} />
                </div>
                {review.photos && review.photos.length > 0 ? (
                  <div className="vendor-detail__review-photos">
                    {review.photos.map((src) => (
                      <div className="vendor-detail__review-photo" key={src}>
                        <img alt="" src={src} />
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="vendor-detail__review-room">
                  <div className="vendor-detail__review-room-thumb">
                    <img alt="" src={review.roomThumb} />
                  </div>
                  <span className="vendor-detail__review-room-name">{review.roomName}</span>
                </div>
              </article>
            ))}
          </div>
          <button className="vendor-detail__reviews-more" type="button">
            리뷰 더보기
          </button>
        </section>
      </div>

      {copied ? <div className="vendor-detail__toast" role="status">복사했습니다</div> : null}

      <BanderUsagePolicyModal onClose={() => setBanderPolicyOpen(false)} open={banderPolicyOpen} />

      <HomeFooter />
    </main>
  );
}
