import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyCoupons } from '../api/coupons';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { isMockMode } from '../config/publicEnv';
import { loadAuthSession } from '../data/authSession';
import { MY_COUPONS, type CouponStatus, type MyCoupon } from '../data/myCoupons';
import type { CouponScopeType, OwnedCouponItemDto } from '../data/schemas/coupon';

const FILTER_OPTIONS: readonly { key: CouponStatus; label: string }[] = [
  { key: 'OWNED', label: '보유쿠폰' },
  { key: 'USED', label: '사용완료' },
  { key: 'EXPIRED', label: '기한만료' },
];

/** 카드 펼치기 가능 여부 — ROOM_LIST + 보유 상태에서만 활성. */
function canExpandCard(item: MyCoupon): boolean {
  return item.status === 'OWNED' && item.scopeType === 'ROOM_LIST' && item.scopeRooms.length > 0;
}

function CouponCard({ item }: { item: MyCoupon }) {
  const [expanded, setExpanded] = useState(false);
  const expandable = canExpandCard(item);
  const panelId = `coupon-card-scope-${item.id}`;

  const onToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <article className="coupon-card" data-status={item.status}>
      <div className="coupon-card__main">
        <div className="coupon-card__left">
          <p className="coupon-card__label">{item.label}</p>
          <div className="coupon-card__discount">
            <span className="coupon-card__discount-value">{item.discountValue}</span>
            <span className="coupon-card__discount-suffix">할인</span>
          </div>
          {item.capLine ? <p className="coupon-card__cap">{item.capLine}</p> : null}
        </div>
        <div className="coupon-card__right">
          {item.availableLine ? (
            expandable ? (
              <button
                aria-controls={panelId}
                aria-expanded={expanded}
                className="coupon-card__expand-button"
                onClick={onToggle}
                type="button"
              >
                <span className="coupon-card__line coupon-card__line--available">
                  {item.availableLine}
                </span>
                <span
                  aria-hidden
                  className={`coupon-card__expand-chevron${
                    expanded ? ' coupon-card__expand-chevron--open' : ''
                  }`}
                >
                  <ChevronIcon />
                </span>
              </button>
            ) : (
              <p className="coupon-card__line">{item.availableLine}</p>
            )
          ) : null}
          <p className="coupon-card__line">{item.conditionLine}</p>
          {item.capLineRight ? (
            <p className="coupon-card__line coupon-card__cap-right">{item.capLineRight}</p>
          ) : null}
          <p className="coupon-card__line">{item.expiryLine}</p>
        </div>
      </div>
      {expandable && expanded ? (
        <ul className="coupon-card__scope-list" id={panelId}>
          {item.scopeRooms.map((room, index) => (
            <li className="coupon-card__scope-item-wrapper" key={`${item.id}-${index}-${room.name}`}>
              {room.slug ? (
                <Link
                  className="coupon-card__scope-item"
                  to={`/spaces/${encodeURIComponent(room.slug)}`}
                >
                  {room.name}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="coupon-card__scope-item coupon-card__scope-item--disabled"
                  title="삭제된 공간"
                >
                  {room.name} (삭제된 공간)
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function formatExpiryLine(expiresAt?: string): string {
  if (!expiresAt) {
    return '기한 : 사용 가능 기간 내';
  }
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) {
    return '기한 : 사용 가능 기간 내';
  }
  return `기한 : ${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}까지`;
}

export function formatConditionLine(minPurchaseWon: number | null | undefined): string {
  const min = typeof minPurchaseWon === 'number' && minPurchaseWon > 0 ? minPurchaseWon : 0;
  return `조건 : ${min.toLocaleString('ko-KR')}원 이상 결제 시`;
}

export function formatCapLine(maxDiscountWon: number | null | undefined): string | undefined {
  if (typeof maxDiscountWon !== 'number' || maxDiscountWon <= 0) {
    return undefined;
  }
  return `최대 ${maxDiscountWon.toLocaleString('ko-KR')}원 할인`;
}

export function formatAvailableLine(
  scopeType: CouponScopeType,
  roomNames: string[],
): string {
  if (scopeType === 'ALL' || roomNames.length === 0) {
    return '모든 공간에서 사용 가능';
  }
  if (roomNames.length === 1) {
    return roomNames[0];
  }
  return `${roomNames[0]} 외 ${roomNames.length - 1}곳`;
}

function toCouponStatus(item: OwnedCouponItemDto): CouponStatus {
  if (!item.expiresAt) {
    return 'OWNED';
  }
  const date = new Date(item.expiresAt);
  return Number.isFinite(date.getTime()) && date.getTime() < Date.now() ? 'EXPIRED' : 'OWNED';
}

export function toMyCoupon(item: OwnedCouponItemDto): MyCoupon {
  const scopeType: CouponScopeType = item.scopeType ?? 'ALL';
  const roomNames =
    scopeType === 'ROOM_LIST' && Array.isArray(item.scopeRoomNames) ? item.scopeRoomNames : [];
  const roomSlugs = Array.isArray(item.scopeRoomSlugs) ? item.scopeRoomSlugs : null;
  // BE PR #460: scopeRoomNames 와 scopeRoomSlugs 는 같은 인덱스로 매칭 보장.
  // slug 가 null 이면 삭제된 공간 (비활성 표기).
  const scopeRooms = roomNames.map((name, i) => ({
    name,
    slug: roomSlugs?.[i] ?? null,
  }));
  return {
    id: item.id,
    status: toCouponStatus(item),
    label: item.title,
    discountValue: item.discountLabel,
    availableLine: formatAvailableLine(scopeType, roomNames),
    conditionLine: formatConditionLine(item.minPurchaseWon ?? null),
    capLineRight: formatCapLine(item.maxDiscountWon ?? null),
    expiryLine: formatExpiryLine(item.expiresAt),
    scopeType,
    scopeRooms,
  };
}

export function CouponsPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const useLocalCouponSeed = isMockMode() || process.env.NODE_ENV === 'test';
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

  const [code, setCode] = useState('');
  const [filter, setFilter] = useState<CouponStatus>('OWNED');
  const [coupons, setCoupons] = useState<MyCoupon[]>(useLocalCouponSeed ? MY_COUPONS : []);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (useLocalCouponSeed) {
      setCoupons(MY_COUPONS);
      return;
    }
    const controller = new AbortController();
    setLoadingCoupons(true);
    setCouponError(null);
    getMyCoupons({ signal: controller.signal })
      .then((response) => setCoupons(response.items.map(toMyCoupon)))
      .catch((error) => {
        if (!controller.signal.aborted) {
          setCouponError(error instanceof Error ? error.message : '쿠폰 목록을 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingCoupons(false);
        }
      });
    return () => controller.abort();
  }, [useLocalCouponSeed]);

  const items = useMemo(
    () => coupons.filter((c) => c.status === filter),
    [coupons, filter],
  );

  const registerDisabled = code.trim().length === 0;

  const onRegisterSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const trimmed = code.trim();
      if (!trimmed) return;
      // TODO: POST /api/v1/coupons/redeem 연동 시 서버 응답 메시지로 치환.
      setRegisterMessage(`쿠폰 등록 요청이 접수되었습니다. (코드: ${trimmed})`);
      setCode('');
    },
    [code],
  );

  return (
    <main className="coupons-page">
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

      <div className="coupons-page__main">
        <section className="coupons">
          <div className="coupons__head">
            <button
              aria-label="뒤로"
              className="coupons__back"
              onClick={() => navigate(-1)}
              type="button"
            >
              <span aria-hidden className="coupons__back-chevron">
                <ChevronIcon />
              </span>
            </button>
            <h1 className="coupons__title">쿠폰</h1>
          </div>

          <form className="coupon-register" onSubmit={onRegisterSubmit} noValidate>
            <h2 className="coupon-register__title">쿠폰등록</h2>
            <div className="coupon-register__row">
              <input
                aria-label="쿠폰 코드"
                className="coupon-register__input"
                onChange={(event) => {
                  setCode(event.target.value);
                  if (registerMessage) setRegisterMessage(null);
                }}
                placeholder="쿠폰 코드 번호를 입력해주세요."
                type="text"
                value={code}
              />
              <button
                className="coupon-register__button"
                disabled={registerDisabled}
                type="submit"
              >
                등록
              </button>
            </div>
            {registerMessage ? (
              <p className="coupon-register__message" role="status">
                {registerMessage}
              </p>
            ) : null}
          </form>

          <div className="coupons__divider" role="presentation" />

          {couponError ? (
            <p className="coupon-register__message" role="alert">
              {couponError}
            </p>
          ) : null}

          <div className="coupon-filters" role="tablist" aria-label="쿠폰 필터">
            {FILTER_OPTIONS.map((opt) => (
              <button
                aria-selected={filter === opt.key}
                className={`coupon-filters__chip${
                  filter === opt.key ? ' coupon-filters__chip--active' : ''
                }`}
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                role="tab"
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>

          {loadingCoupons ? (
            <p className="coupons__empty">쿠폰을 불러오는 중입니다.</p>
          ) : items.length === 0 ? (
            <p className="coupons__empty">쿠폰이 없습니다.</p>
          ) : (
            <ul className="coupons__list" role="tabpanel">
              {items.map((coupon) => (
                <li key={coupon.id}>
                  <CouponCard item={coupon} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <HomeFooter />
    </main>
  );
}
