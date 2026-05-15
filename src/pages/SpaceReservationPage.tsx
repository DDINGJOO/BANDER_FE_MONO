import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { HomeHeader } from '../components/home/HomeHeader';
import { useGuestGate } from '../components/home/GuestGateProvider';
import { CouponDownloadModal } from '../components/space/CouponDownloadModal';
import { ChevronIcon } from '../components/shared/Icons';
import { loadAuthSession } from '../data/authSession';
import { COUPON_ITEMS } from '../data/couponDownloadModal';
import type { CouponAvailableItemDto } from '../data/schemas/coupon';
import { HOME_SPACE_CARDS } from '../data/home';
import { useCouponDownloads } from '../hooks/useCouponDownloads';
import { useSpaceDetail } from '../hooks/useSpaceDetail';
import { getAvailableCoupons } from '../api/coupons';
import {
  applyReservationCoupon,
  cancelReservationCheckout,
  getSpaceAvailability,
  getReservationCheckout,
  type SpaceAvailabilitySlot,
  type ReservationAnswerRequest,
  type ReservationCheckoutSession,
  startReservationCheckout,
  startReservationPayment,
  startReservationPrePaymentCheck,
} from '../api/bookings';
import { fetchVendorDetail, type SpaceReservationFieldDto } from '../api/spaces';
import { isMockMode, getTossPaymentsClientKey } from '../config/publicEnv';
import { requestTossPayment } from '../utils/tossPayments';
import { DEFAULT_PAYMENT_FAILURE, normalizePaymentFailure, type PaymentFailureInfo } from '../utils/paymentFailure';
import { formatReservationUnitNote, getReservationSlotMinutes } from '../utils/reservationSlotUnit';
import tossPaymentsLogo from '../assets/brand/toss-payments-logo.png';

/** Figma 6225:45288 — 시간 선택 카드 캘린더 아이콘 */
function ReservationCalendarIcon() {
  return (
    <svg aria-hidden="true" className="space-reservation__calendar-icon" fill="none" viewBox="0 0 16 16" width="20" height="20">
      <path d="M2.5 6.5h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
      <rect height="11.5" rx="2" stroke="currentColor" strokeWidth="1.2" width="11.5" x="2.25" y="2.75" />
      <path d="M5 1.5v2M11 1.5v2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
    </svg>
  );
}

const RESERVATION_OPTION_ITEMS = [
  {
    description: '전기기타/통기타 연주를 위한 앰프 및 연결 장비 포함',
    image: 'https://www.figma.com/api/mcp/asset/2152f27f-4cd4-4695-a95b-6076e68a52b6',
    key: 'guitar',
    name: 'Guitar 추가',
    price: 5000,
    short: 'G',
  },
  {
    description: '디지털 피아노 또는 업라이트 피아노 제공',
    image: 'https://www.figma.com/api/mcp/asset/301cf9d3-9402-406f-ade5-b92614d097e2',
    key: 'piano',
    name: 'Piano 추가',
    price: 5000,
    short: 'P',
  },
  {
    description: '기본 드럼 세트 및 스틱 제공',
    image: 'https://www.figma.com/api/mcp/asset/be44b331-d4e4-415d-9db3-9612b555e594',
    key: 'drum',
    name: 'Drum 추가',
    price: 5000,
    short: 'D',
  },
  {
    description: '인원은 최대 4명까지 추가 가능',
    image: '',
    key: 'people',
    name: '인원 추가',
    price: 5000,
    short: '인',
  },
] as const;

type PaymentResultState = 'failed' | 'success' | null;
type AvailabilityStatus = 'idle' | 'loading' | 'loaded' | 'failed';

type ReservationTimelineSlot = {
  available: boolean;
  endLabel: string;
  endMinutes: number;
  label: string;
  price: number;
  startMinutes: number;
};

type ReservationTimelineColumn = {
  hour: number;
  minuteLabels: string[];
  slots: ReservationTimelineSlot[];
};

function buildPaymentRedirectUrl(path: '/payment/success' | '/payment/fail', params: {
  date: string;
  roomId: string | null;
  slug?: string;
}) {
  const url = new URL(path, window.location.origin);
  if (params.slug) {
    url.searchParams.set('roomSlug', params.slug);
  }
  if (params.roomId) {
    url.searchParams.set('roomId', params.roomId);
  }
  url.searchParams.set('date', params.date);
  return url.toString();
}

const CHECKOUT_POLL_INTERVAL_MS = 800;
const CHECKOUT_PREPARE_MAX_ATTEMPTS = 90;

const CHECKOUT_FAILURE_STATES = new Set([
  'BOOKING_MODIFY_FAILED',
  'COUPON_FAILED',
  'PRE_PAYMENT_CHECK_FAILED',
  'PAYMENT_FAILED',
  'CANCELLING',
  'EXPIRED',
]);

function checkoutStepKey(checkoutId: string, step: string) {
  return `web:${checkoutId}:${step}`;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function checkoutFailure(session: ReservationCheckoutSession, fallback = '예약 처리에 실패했습니다.') {
  return paymentFlowError(
    session.state,
    session.paymentFailureReason ||
      session.prePaymentFailureReason ||
      session.bookingFailureReason ||
      session.couponFailureReason ||
      fallback,
  );
}

function paymentFlowError(code: string, message: string) {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toLocalDateParam(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function parseLocalDateParam(dateParam: string | null) {
  if (!dateParam) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }

  return parsed;
}

function normalizeReservationDateParam(dateParam: string | null) {
  const today = startOfLocalDay();
  const parsed = parseLocalDateParam(dateParam);

  if (!parsed || parsed < today) {
    return toLocalDateParam(today);
  }

  return toLocalDateParam(parsed);
}

function reservationFieldInputMode(inputType: string | null | undefined) {
  const normalized = (inputType ?? '').toUpperCase();
  if (normalized === 'SELECT') return 'select';
  if (normalized === 'FILE') return 'file';
  return 'text';
}

function formatReservationDate(dateParam: string | null) {
  const parsed = parseLocalDateParam(dateParam) ?? startOfLocalDay();

  const weekday = ['일', '월', '화', '수', '목', '금', '토'][parsed.getDay()];
  return `${String(parsed.getFullYear()).slice(2)}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')} (${weekday})`;
}

function addDaysToLocalDateParam(dateParam: string, days: number) {
  const date = parseLocalDateParam(dateParam) ?? startOfLocalDay();
  date.setDate(date.getDate() + days);
  return toLocalDateParam(date);
}

function slotLabelToIso(date: string, label: string): string {
  const minutes = parseTimeLabelMinutes(label);
  if (minutes == null) {
    return `${date}T${label}:00+09:00`;
  }

  const dayOffset = Math.floor(minutes / (24 * 60));
  const normalizedMinutes = minutes % (24 * 60);
  const normalizedLabel = formatTimeLabel(normalizedMinutes);
  const normalizedDate = dayOffset > 0 ? addDaysToLocalDateParam(date, dayOffset) : date;
  return `${normalizedDate}T${normalizedLabel}:00+09:00`;
}

function isReservationSlotInPast(date: string, label: string, nowMs = Date.now()) {
  const slotStart = new Date(slotLabelToIso(date, label)).getTime();
  return Number.isFinite(slotStart) && slotStart <= nowMs;
}

function normalizeApiTimeLabel(value: string) {
  return value.slice(0, 5);
}

function parseTimeLabelMinutes(label: string | null | undefined) {
  const match = /^(\d{1,2}):(\d{2})$/.exec((label ?? '').trim());
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute < 0 || minute >= 60) {
    return null;
  }
  if (hour === 24 && minute === 0) {
    return 24 * 60;
  }
  if (hour < 0 || hour >= 24) {
    return null;
  }

  return hour * 60 + minute;
}

function formatTimeLabel(totalMinutes: number) {
  const minutesInDay = 24 * 60;
  if (totalMinutes === minutesInDay) {
    return '24:00';
  }

  const normalized = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getApiSlotRange(slot: SpaceAvailabilitySlot) {
  const startLabel = normalizeApiTimeLabel(slot.startTime);
  const endLabel = normalizeApiTimeLabel(slot.endTime);
  const startMinutes = parseTimeLabelMinutes(startLabel);
  let endMinutes = parseTimeLabelMinutes(endLabel);

  if (startMinutes == null || endMinutes == null) {
    return null;
  }
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return {
    endLabel: formatTimeLabel(endMinutes),
    endMinutes,
    startLabel,
    startMinutes,
  };
}

function inferAvailabilitySlotMinutes(slots: SpaceAvailabilitySlot[]) {
  for (const slot of slots) {
    const range = getApiSlotRange(slot);
    if (range && range.endMinutes > range.startMinutes) {
      return range.endMinutes - range.startMinutes;
    }
  }

  return null;
}

function parseWonLabel(label: string | null | undefined) {
  const digits = (label ?? '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

function parseCouponLabelAmount(label: string, subtotalWon: number) {
  const normalized = label.replace(/,/g, '').trim();
  const numeric = Number(normalized.replace(/[^\d.]/g, ''));

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  if (normalized.includes('%')) {
    return Math.floor(subtotalWon * numeric / 100);
  }

  return Math.floor(numeric);
}

function calculateCouponDiscount(coupon: CouponAvailableItemDto | null, subtotalWon: number) {
  if (!coupon || subtotalWon <= 0) {
    return 0;
  }

  if (coupon.minPurchaseWon != null && subtotalWon < coupon.minPurchaseWon) {
    return 0;
  }

  let discountWon = 0;
  if (coupon.discountType === 'FIXED' && typeof coupon.discountValue === 'number') {
    discountWon = coupon.discountValue;
  } else if (coupon.discountType === 'PERCENT' && typeof coupon.discountValue === 'number') {
    discountWon = Math.floor(subtotalWon * coupon.discountValue / 100);
    if (coupon.maxDiscountWon != null) {
      discountWon = Math.min(discountWon, coupon.maxDiscountWon);
    }
  } else {
    discountWon = parseCouponLabelAmount(coupon.discountLabel, subtotalWon);
  }

  return Math.max(0, Math.min(subtotalWon, discountWon));
}

export function SpaceReservationPage() {
  const navigate = useNavigate();
  const { openGuestGate } = useGuestGate();
  const { slug } = useParams();
  const { detail, vendorSlug } = useSpaceDetail(slug);
  const [searchParams] = useSearchParams();
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());
  const [isSelectingTime, setIsSelectingTime] = useState(false);
  const [timeSelectionStart, setTimeSelectionStart] = useState<number | null>(null);
  const [agreements, setAgreements] = useState({
    all: false,
    collection: false,
    paymentAgency: false,
    thirdParty: false,
  });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<CouponAvailableItemDto[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const { downloadCoupon, downloadedCouponIds, downloadError, ownedCoupons, refreshOwnedCoupons } = useCouponDownloads();
  const [paymentResult, setPaymentResult] = useState<PaymentResultState>(null);
  const [paymentFailure, setPaymentFailure] = useState<PaymentFailureInfo>(DEFAULT_PAYMENT_FAILURE);
  const [checkoutPending, setCheckoutPending] = useState(false);
  // success 가 한번 set 되면 failed 로 덮어쓰기 거부. 토스 SDK 의 redirect-induced
  // reject 와 saga COMPLETED 가 동시에 도착할 때 발생하던 "실패→성공" 깜빡임 차단.
  // null 로의 전환 (모달 닫기) 은 허용. SDK 진짜 오류는 success 가 아직 set 되지
  // 않은 상태이므로 정상적으로 'failed' 표시됨 → saga timeout 까지 대기하는 일도 없음.
  const setPaymentResultSafe = useCallback((next: PaymentResultState) => {
    setPaymentResult((prev) => (prev === 'success' && next === 'failed' ? prev : next));
  }, []);
  const showPaymentFailure = useCallback((error: unknown, fallback?: string) => {
    setPaymentFailure(normalizePaymentFailure(error, fallback));
    setPaymentResultSafe('failed');
  }, [setPaymentResultSafe]);
  // 성공 우선 렌더링: 결제 SDK reject 직후 saga/redirect 성공이 늦게 들어올 수 있다.
  // 실패는 잠깐 보류하고, 성공은 즉시 표시해서 실패→성공 깜빡임을 막는다.
  const [paymentResultDisplayed, setPaymentResultDisplayed] = useState<PaymentResultState>(null);
  useEffect(() => {
    if (paymentResult === null) {
      setPaymentResultDisplayed(null);
      return;
    }
    if (paymentResult === 'success') {
      setPaymentResultDisplayed('success');
      return;
    }
    const timer = window.setTimeout(() => {
      setPaymentResultDisplayed('failed');
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [paymentResult]);
  const [canScrollTimelineNext, setCanScrollTimelineNext] = useState(true);
  const [canScrollTimelinePrev, setCanScrollTimelinePrev] = useState(false);
  const [selectedOptionCounts, setSelectedOptionCounts] = useState<Record<string, number>>({
    drum: 0,
    guitar: 0,
    people: 0,
    piano: 0,
  });
  const [availabilitySlots, setAvailabilitySlots] = useState<SpaceAvailabilitySlot[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('idle');
  const [reservationBookerName, setReservationBookerName] = useState('');
  const [reservationBookerPhone, setReservationBookerPhone] = useState('');
  const [reservationNote, setReservationNote] = useState('');
  const [reservationAnswers, setReservationAnswers] = useState<Record<string, string>>({});
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollDragStateRef = useRef({ active: false, scrollLeft: 0, startX: 0 });

  const dateParam = normalizeReservationDateParam(searchParams.get('date'));
  const roomIdParam = searchParams.get('roomId');
  const detailRoomId =
    detail && 'id' in detail && typeof detail.id === 'string' ? detail.id : null;
  const roomId = roomIdParam ?? detailRoomId;
  const detailReservationUnit = detail as {
    basePrice?: number | null;
    priceLabel?: string | null;
    priceSuffix?: string | null;
    priceUnit?: string | null;
  } | null;
  const roomDetailPath = slug ? `/spaces/${slug}` : '/';
  const reservationFields = useMemo(() => {
    const rawFields = ((detail as { reservationFields?: SpaceReservationFieldDto[] } | null)?.reservationFields ?? []);
    return rawFields
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [detail]);

  useEffect(() => {
    setReservationAnswers((current) => {
      const next: Record<string, string> = {};
      reservationFields.forEach((field, index) => {
        const key = field.fieldId || `field-${index}`;
        next[key] = current[key] ?? '';
      });
      return next;
    });
  }, [reservationFields]);

  const updateTimelineNavState = () => {
    if (!timelineScrollRef.current) {
      return;
    }

    const { clientWidth, scrollLeft, scrollWidth } = timelineScrollRef.current;
    setCanScrollTimelinePrev(scrollLeft > 0);
    setCanScrollTimelineNext(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!timelineScrollRef.current || !scrollDragStateRef.current.active) {
        return;
      }

      const deltaX = event.clientX - scrollDragStateRef.current.startX;
      timelineScrollRef.current.scrollLeft = scrollDragStateRef.current.scrollLeft - deltaX;
    };

    const handleMouseUp = () => {
      scrollDragStateRef.current.active = false;
      setIsSelectingTime(false);
      setTimeSelectionStart(null);
      updateTimelineNavState();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    updateTimelineNavState();

    const handleResize = () => updateTimelineNavState();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 30_000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (isMockMode()) {
      setAvailabilityStatus('loaded');
      setAvailabilitySlots([]);
      return;
    }
    if (!roomId) {
      setAvailabilityStatus('idle');
      setAvailabilitySlots([]);
      return;
    }
    let cancelled = false;
    setAvailabilityStatus('loading');
    getSpaceAvailability(roomId, dateParam)
      .then((res) => {
        if (!cancelled) {
          setAvailabilitySlots(res.slots);
          setAvailabilityStatus('loaded');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailabilitySlots([]);
          setAvailabilityStatus('failed');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, dateParam]);

  useEffect(() => {
    if (isMockMode() || !slug) return;
    const controller = new AbortController();
    setCouponLoading(true);
    setCouponError(null);
    // vendorSlug 가 있으면 owner user id 를 함께 fetch — BE 의 Coupon.issuerId 매칭용.
    // 실패 시 PLATFORM 쿠폰만 노출 (다른 점주 쿠폰 회귀 차단).
    const vendorIdPromise = vendorSlug
      ? fetchVendorDetail(vendorSlug)
          .then((dto) => dto.ownerUserId ?? null)
          .catch(() => null)
      : Promise.resolve<string | null>(null);

    vendorIdPromise
      .then((vendorId) => getAvailableCoupons(slug, vendorId, { signal: controller.signal }))
      .then((res) => setAvailableCoupons(res.coupons))
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
  }, [slug, vendorSlug]);

  const inferredAvailabilitySlotMinutes = useMemo(
    () => inferAvailabilitySlotMinutes(availabilitySlots),
    [availabilitySlots]
  );
  const slotUnitMinutes = inferredAvailabilitySlotMinutes
    ?? getReservationSlotMinutes(detailReservationUnit?.priceUnit, detailReservationUnit?.priceSuffix);
  const reservationUnitNote = formatReservationUnitNote(slotUnitMinutes);
  const apiSlotByStart = useMemo(() => {
    const map = new Map<string, { endLabel: string; endMinutes: number; slot: SpaceAvailabilitySlot; startMinutes: number }>();
    availabilitySlots.forEach((slot) => {
      const range = getApiSlotRange(slot);
      if (range) {
        map.set(range.startLabel, {
          endLabel: range.endLabel,
          endMinutes: range.endMinutes,
          slot,
          startMinutes: range.startMinutes,
        });
      }
    });
    return map;
  }, [availabilitySlots]);
  const fallbackSlotPrice = detailReservationUnit?.basePrice
    ?? parseWonLabel(detailReservationUnit?.priceLabel)
    ?? (slotUnitMinutes >= 60 ? 10000 : 5000);
  const timeColumns = useMemo<ReservationTimelineColumn[]>(() => {
    const hasAuthoritativeAvailability = !isMockMode() && Boolean(roomId) && availabilityStatus === 'loaded';
    const canUseFallbackAvailability = isMockMode() || !roomId;
    const minutesPerSlot = Math.max(1, Math.min(60, slotUnitMinutes));
    const labelsPerHour = Array.from(
      { length: Math.ceil(60 / minutesPerSlot) },
      (_, index) => index * minutesPerSlot
    ).filter((minute) => minute < 60);

    return Array.from({ length: 24 }, (_, hour) => {
      const slots = labelsPerHour.map((minute): ReservationTimelineSlot => {
        const startMinutes = hour * 60 + minute;
        const label = formatTimeLabel(startMinutes);
        const apiSlotInfo = apiSlotByStart.get(label);
        const endMinutes = apiSlotInfo?.endMinutes ?? startMinutes + minutesPerSlot;
        const past = isReservationSlotInPast(dateParam, label, currentTimeMs);
        const fallbackAvailable = !(hour < 6 || hour === 17 || label === '18:30');
        const available = !past && (
          hasAuthoritativeAvailability
            ? Boolean(apiSlotInfo?.slot.bookable)
            : canUseFallbackAvailability && fallbackAvailable
        );

        return {
          available,
          endLabel: apiSlotInfo?.endLabel ?? formatTimeLabel(endMinutes),
          endMinutes,
          label,
          price: apiSlotInfo?.slot.priceWon ?? fallbackSlotPrice,
          startMinutes,
        };
      });

      return {
        hour,
        minuteLabels: labelsPerHour.map((minute) => String(minute).padStart(2, '0')),
        slots,
      };
    });
  }, [
    apiSlotByStart,
    availabilityStatus,
    currentTimeMs,
    dateParam,
    fallbackSlotPrice,
    roomId,
    slotUnitMinutes,
  ]);

  const linearSlots = useMemo(() => timeColumns.flatMap((column) => column.slots), [timeColumns]);
  const linearSlotIndexByLabel = useMemo(
    () => new Map(linearSlots.map((slot, index) => [slot.label, index])),
    [linearSlots]
  );

  useEffect(() => {
    setSelectedTimes((current) =>
      current.filter((label) => linearSlots.some((slot) => slot.label === label && slot.available))
    );
  }, [linearSlots]);

  const spaceCard = useMemo(
    () => HOME_SPACE_CARDS.find((item) => item.detailPath === `/spaces/${slug}`) ?? HOME_SPACE_CARDS[1],
    [slug]
  );
  const reservationSummary = useMemo(() => {
    const mock = isMockMode();
    return {
      address: detail?.address || detail?.location || (mock ? '서울시 마포구 독막로9길 31 지하 1층' : '주소 확인 중'),
      image: detail?.gallery?.[0] ?? spaceCard.image,
      title: detail?.title ?? (mock ? spaceCard.title : '공간 정보를 불러오는 중'),
    };
  }, [detail, spaceCard]);

  const reservationDateLabel = formatReservationDate(dateParam);
  const selectedSlotDetails = linearSlots
    .filter((slot) => selectedTimes.includes(slot.label))
    .sort((a, b) => a.startMinutes - b.startMinutes);
  const basePrice = selectedSlotDetails.reduce((sum, slot) => sum + slot.price, 0) || fallbackSlotPrice;
  const optionTotal = RESERVATION_OPTION_ITEMS.reduce(
    (sum, item) => sum + item.price * (selectedOptionCounts[item.key] ?? 0),
    0
  );
  const subtotalPrice = basePrice + optionTotal;
  const mockSelectedCoupon = isMockMode()
    ? COUPON_ITEMS.find((coupon) => coupon.id === selectedCouponId)
    : undefined;
  const selectedCoupon: CouponAvailableItemDto | null = availableCoupons.find((coupon) => coupon.id === selectedCouponId)
    ?? (mockSelectedCoupon
      ? {
          id: mockSelectedCoupon.id,
          title: mockSelectedCoupon.subtitle,
          discountLabel: mockSelectedCoupon.valueMain,
          claimed: false,
        }
      : null);
  const couponDiscount = calculateCouponDiscount(selectedCoupon, subtotalPrice);
  const totalPrice = Math.max(0, subtotalPrice - couponDiscount);
  const couponMinPurchaseWarning = selectedCoupon?.minPurchaseWon != null && subtotalPrice < selectedCoupon.minPurchaseWon
    ? `최소 주문 금액 ${selectedCoupon.minPurchaseWon.toLocaleString()}원 이상부터 사용할 수 있어요.`
    : null;
  const couponDiscountLabel = selectedCoupon
    ? couponDiscount > 0
      ? `- ${couponDiscount.toLocaleString()}원`
      : '- 0원'
    : '- 0원';
  const selectedTimeRange = (() => {
    if (selectedSlotDetails.length === 0) {
      return '-';
    }

    const first = selectedSlotDetails[0];
    const last = selectedSlotDetails[selectedSlotDetails.length - 1];
    const totalMinutes = last.endMinutes - first.startMinutes;
    const totalHours = totalMinutes / 60;

    return `${first.label} ~ ${last.endLabel} (총 ${totalHours}시간)`;
  })();
  const selectedOptionSummary = RESERVATION_OPTION_ITEMS.filter(
    (item) => selectedOptionCounts[item.key] > 0
  )
    .map((item) => `${item.name} X ${selectedOptionCounts[item.key]}`)
    .join(', ');
  const hasSelectedOptions = RESERVATION_OPTION_ITEMS.some(
    (item) => (selectedOptionCounts[item.key] ?? 0) > 0
  );
  const requiredAgreementsChecked =
    agreements.collection && agreements.thirdParty && agreements.paymentAgency;
  const requiredReservationFieldsFilled = reservationFields.every((field, index) => {
    if (!field.required) {
      return true;
    }
    const key = field.fieldId || `field-${index}`;
    return Boolean(reservationAnswers[key]?.trim());
  });
  const canSubmitPayment =
    requiredAgreementsChecked &&
    requiredReservationFieldsFilled &&
    selectedTimes.length > 0 &&
    (isMockMode() || Boolean(roomId)) &&
    !checkoutPending;
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const couponCount = isMockMode() ? COUPON_ITEMS.length : availableCoupons.length;

  const setAllAgreements = (checked: boolean) => {
    setAgreements({
      all: checked,
      collection: checked,
      paymentAgency: checked,
      thirdParty: checked,
    });
  };

  const toggleAgreement = (key: 'collection' | 'paymentAgency' | 'thirdParty') => {
    setAgreements((current) => {
      const next = {
        ...current,
        [key]: !current[key],
      };

      return {
        ...next,
        all: next.collection && next.thirdParty && next.paymentAgency,
      };
    });
  };

  const updateReservationAnswer = (fieldKey: string, value: string) => {
    setReservationAnswers((current) => ({
      ...current,
      [fieldKey]: value,
    }));
  };

  const buildReservationAnswerPayload = (): ReservationAnswerRequest[] => {
    const fixedAnswers: ReservationAnswerRequest[] = [
      {
        fieldId: '0',
        sortOrder: 0,
        title: '예약자 이름',
        value: reservationBookerName.trim(),
      },
      {
        fieldId: '0',
        sortOrder: 1,
        title: '연락처',
        value: reservationBookerPhone.trim(),
      },
      {
        fieldId: '0',
        sortOrder: 2,
        title: '추가 요청사항',
        value: reservationNote.trim(),
      },
    ].filter((answer) => answer.value);

    const customAnswers = reservationFields.map((field, index) => {
      const key = field.fieldId || `field-${index}`;
      return {
        fieldId: field.fieldId,
        sortOrder: (field.sortOrder ?? index) + 10,
        title: field.title,
        value: reservationAnswers[key]?.trim() ?? '',
      };
    });
    return [...fixedAnswers, ...customAnswers];
  };

  const buildContinuousSelection = (startIndex: number, endIndex: number) => {
    const step = startIndex <= endIndex ? 1 : -1;
    const nextSelected: string[] = [];

    for (let index = startIndex; step > 0 ? index <= endIndex : index >= endIndex; index += step) {
      const slot = linearSlots[index];

      if (!slot?.available) {
        break;
      }

      nextSelected.push(slot.label);
    }

    return nextSelected;
  };

  const handleSlotMouseDown = (slotIndex: number) => {
    const slot = linearSlots[slotIndex];
    if (!slot?.available) {
      return;
    }

    setIsSelectingTime(true);
    setTimeSelectionStart(slotIndex);
    setSelectedTimes([slot.label]);
  };

  const handleSlotMouseEnter = (slotIndex: number) => {
    if (!isSelectingTime || timeSelectionStart === null) {
      return;
    }

    setSelectedTimes(buildContinuousSelection(timeSelectionStart, slotIndex));
  };

  const handleTimelineScrollMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !timelineScrollRef.current) {
      return;
    }

    const target = event.target as HTMLElement;
    const canScroll =
      target.closest('.space-reservation__timeline-hour') ||
      target.closest('.space-reservation__timeline-end');

    if (!canScroll) {
      return;
    }

    scrollDragStateRef.current = {
      active: true,
      scrollLeft: timelineScrollRef.current.scrollLeft,
      startX: event.clientX,
    };
    event.preventDefault();
  };

  const scrollTimelineBy = (direction: 'next' | 'prev') => {
    if (!timelineScrollRef.current) {
      return;
    }

    timelineScrollRef.current.scrollBy({
      behavior: 'smooth',
      left: direction === 'next' ? 320 : -320,
    });

    window.setTimeout(() => {
      updateTimelineNavState();
    }, 220);
  };

  const buildReservationItemPayload = () =>
    RESERVATION_OPTION_ITEMS
      .map((item) => ({
        itemId: item.key,
        quantity: selectedOptionCounts[item.key] ?? 0,
      }))
      .filter((item) => item.quantity > 0);

  const numericOwnedCouponId = (ownedCouponId?: string | null) => {
    const value = Number(ownedCouponId);
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  };

  const resolveSelectedCouponOwnedId = async () => {
    if (!selectedCouponId) {
      return null;
    }
    const ownedFromState = numericOwnedCouponId(
      ownedCoupons.find((coupon) => coupon.couponId === selectedCouponId)?.id
    );
    if (ownedFromState) {
      return ownedFromState;
    }
    const claimedId = numericOwnedCouponId(await downloadCoupon(selectedCouponId));
    if (claimedId) {
      return claimedId;
    }
    const refreshed = await refreshOwnedCoupons();
    return numericOwnedCouponId(refreshed.find((coupon) => coupon.couponId === selectedCouponId)?.id);
  };

  const waitForCheckoutSession = async (
    checkoutId: string,
    isReady: (session: ReservationCheckoutSession) => boolean,
    timeoutMessage: string,
    maxAttempts = CHECKOUT_PREPARE_MAX_ATTEMPTS,
  ) => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const session = await getReservationCheckout(checkoutId);
      if (CHECKOUT_FAILURE_STATES.has(session.state)) {
        throw checkoutFailure(session);
      }
      if (isReady(session)) {
        return session;
      }
      await delay(CHECKOUT_POLL_INTERVAL_MS);
    }
    throw paymentFlowError('PAYMENT_TIMEOUT', timeoutMessage);
  };

  const handlePaymentSubmit = async () => {
    if (!canSubmitPayment || selectedSlotDetails.length === 0) return;

    if (isMockMode()) {
      setPaymentResult('success');
      return;
    }

    if (selectedSlotDetails.some((slot) => isReservationSlotInPast(dateParam, slot.label))) {
      setSelectedTimes((current) => current.filter((label) => !isReservationSlotInPast(dateParam, label)));
      return;
    }
    if (couponMinPurchaseWarning) {
      showPaymentFailure({ code: 'COUPON_MIN_PURCHASE', message: couponMinPurchaseWarning });
      return;
    }
    if (totalPrice <= 0) {
      showPaymentFailure({
        code: 'BELOW_MINIMUM_AMOUNT',
        message: '0원 결제는 아직 지원하지 않습니다. 쿠폰을 변경한 뒤 다시 시도해주세요.',
      });
      return;
    }

    const firstSlot = selectedSlotDetails[0];
    const lastSlot = selectedSlotDetails[selectedSlotDetails.length - 1];
    const startsAt = slotLabelToIso(dateParam, firstSlot.label);
    const endsAt = slotLabelToIso(dateParam, lastSlot.endLabel);
    let checkoutId: string | null = null;
    let latestSession: ReservationCheckoutSession | null = null;

    setCheckoutPending(true);
    try {
      const started = await startReservationCheckout({
        roomId: roomId ?? '',
        startsAt,
        endsAt,
        items: buildReservationItemPayload(),
        basePriceWon: subtotalPrice,
        reservationAnswers: buildReservationAnswerPayload(),
      });
      checkoutId = started.reservationId;
      sessionStorage.setItem('bander_pending_checkout_id', checkoutId);
      sessionStorage.removeItem('bander_pending_booking_id');
      sessionStorage.removeItem('bander_pending_saga_id');
      sessionStorage.setItem('bander_pending_room_slug', slug ?? '');
      sessionStorage.setItem('bander_pending_room_id', roomId ?? '');

      latestSession = await waitForCheckoutSession(
        checkoutId,
        (session) => session.state !== 'STARTING' && Boolean(session.bookingReservationId),
        '예약 시간이 확정되지 않았습니다. 잠시 후 다시 시도해주세요.',
      );

      if (selectedCouponId) {
        const couponOwnedId = await resolveSelectedCouponOwnedId();
        if (!couponOwnedId) {
          throw paymentFlowError('COUPON_REQUIRED', '선택한 쿠폰을 확인하지 못했습니다. 쿠폰을 다시 선택해주세요.');
        }
        latestSession = await applyReservationCoupon(
          checkoutId,
          { couponOwnedId, expectedRevision: latestSession.revision },
          checkoutStepKey(checkoutId, 'coupon-apply'),
        );
        latestSession = await waitForCheckoutSession(
          checkoutId,
          (session) => session.couponOwnedId === couponOwnedId && session.couponState === 'HELD',
          '쿠폰 적용이 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
        );
      }

      latestSession = await startReservationPrePaymentCheck(
        checkoutId,
        { expectedRevision: latestSession.revision },
        checkoutStepKey(checkoutId, 'pre-payment-check'),
      );
      latestSession = await waitForCheckoutSession(
        checkoutId,
        (session) => session.state === 'PRE_PAYMENT_READY',
        '결제 전 예약 검증이 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
      );

      latestSession = await startReservationPayment(
        checkoutId,
        { expectedRevision: latestSession.revision },
        checkoutStepKey(checkoutId, 'booking-create'),
      );
      latestSession = await waitForCheckoutSession(
        checkoutId,
        (session) => ['BOOKING_READY', 'PAYMENT_CREATING', 'PAYMENT_READY'].includes(session.state),
        '예약 생성이 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
      );

      if (latestSession.state === 'BOOKING_READY') {
        latestSession = await startReservationPayment(
          checkoutId,
          { expectedRevision: latestSession.revision },
          checkoutStepKey(checkoutId, 'payment-create'),
        );
      }
      latestSession = await waitForCheckoutSession(
        checkoutId,
        (session) => session.state === 'PAYMENT_READY' && Boolean(session.paymentOrderId) && Boolean(session.paymentAmountWon),
        '결제 준비가 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
      );

      const clientKey = getTossPaymentsClientKey();
      if (!clientKey || !latestSession.paymentOrderId || !latestSession.paymentAmountWon) {
        throw paymentFlowError('PAYMENT_CONFIG_MISSING', '결제 설정이 아직 준비되지 않았습니다. 관리자에게 문의해주세요.');
      }

      sessionStorage.setItem('bander_pending_checkout_revision', String(latestSession.revision));
      await requestTossPayment({
        clientKey,
        orderId: latestSession.paymentOrderId,
        orderName: reservationSummary.title + ' 예약',
        amount: latestSession.paymentAmountWon,
        successUrl: buildPaymentRedirectUrl('/payment/success', { date: dateParam, roomId, slug }),
        failUrl: buildPaymentRedirectUrl('/payment/fail', { date: dateParam, roomId, slug }),
      });
    } catch (error) {
      if (checkoutId && latestSession) {
        void cancelReservationCheckout(
          checkoutId,
          latestSession.revision,
          checkoutStepKey(checkoutId, 'client-abort'),
        ).catch(() => undefined);
      }
      showPaymentFailure(error, '예약을 생성하지 못했습니다. 입력한 예약 정보를 다시 확인해주세요.');
    } finally {
      setCheckoutPending(false);
    }
  };

  const handleDownloadCoupon = async (couponId: string) => {
    if (!isAuthenticated) {
      openGuestGate(`/spaces/${slug}/reserve?date=${dateParam}${roomId ? `&roomId=${roomId}` : ''}`);
      return;
    }
    try {
      await downloadCoupon(couponId);
      setSelectedCouponId(couponId);
      setCouponError(null);
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : '쿠폰 다운로드에 실패했습니다.');
    }
  };

  return (
    <main className="space-reservation-page">
      <HomeHeader authenticated={isAuthenticated} onGuestCta={() => navigate('/login')} variant="icon" />

      <section className="space-reservation__shell">
        <div className="space-reservation__header">
          <button className="space-reservation__back" onClick={() => navigate(-1)} type="button" aria-label="뒤로">
            <span className="space-reservation__back-icon">
              <ChevronIcon />
            </span>
          </button>
          <h1>예약하기</h1>
        </div>

        <div className="space-reservation__summary-card">
          <div className="space-reservation__summary-top">
            <img alt="" className="space-reservation__summary-thumb" src={reservationSummary.image} />
            <div>
              <p className="space-reservation__summary-title">{reservationSummary.title}</p>
              <p className="space-reservation__summary-address">{reservationSummary.address}</p>
            </div>
          </div>
          <div className="space-reservation__summary-grid">
            <div className="space-reservation__summary-grid-col">
              <div>
                <span>예약 날짜</span>
                <strong>{reservationDateLabel}</strong>
              </div>
              <div>
                <span>예약 시간</span>
                <strong>{selectedTimeRange}</strong>
              </div>
            </div>
            <div className="space-reservation__summary-grid-col">
              <div>
                <span>상품 옵션</span>
                <strong>{selectedOptionSummary || '-'}</strong>
              </div>
              <div>
                <span>가격</span>
                <strong>{totalPrice.toLocaleString()}원</strong>
              </div>
            </div>
          </div>
        </div>

        <section className="space-reservation__section space-reservation__section--time">
          <div className="space-reservation__time-section-head">
            <div className="space-reservation__time-section-head-main">
              <ReservationCalendarIcon />
              <h2 className="space-reservation__time-section-title">시간 선택</h2>
            </div>
            <button className="space-reservation__time-section-range" type="button">
              {selectedTimeRange}
            </button>
          </div>
          <p className="space-reservation__timeline-lead">{reservationUnitNote}</p>
          <div className="space-reservation__timeline">
            <button
              aria-label="이전 시간대로 이동"
              className="space-reservation__timeline-nav space-reservation__timeline-nav--prev"
              disabled={!canScrollTimelinePrev}
              onClick={() => scrollTimelineBy('prev')}
              type="button"
            >
              <span className="space-reservation__timeline-nav-icon space-reservation__timeline-nav-icon--prev">
                <ChevronIcon />
              </span>
            </button>
            <div
              className="space-reservation__timeline-scroll"
              onMouseDown={handleTimelineScrollMouseDown}
              onScroll={updateTimelineNavState}
              ref={timelineScrollRef}
            >
              {timeColumns.map((column) => (
                <div className="space-reservation__timeline-column" key={column.hour}>
                  <div className="space-reservation__timeline-hour">
                    {String(column.hour).padStart(2, '0')}:00
                  </div>
                  <div
                    className="space-reservation__timeline-slots"
                    style={{ gridTemplateColumns: `repeat(${column.slots.length}, minmax(0, 1fr))` }}
                  >
                    {column.slots.map((slot, slotIndex) => {
                      const selected = selectedTimes.includes(slot.label);
                      const slotLinearIndex = linearSlotIndexByLabel.get(slot.label) ?? slotIndex;

                      return (
                        <button
                          className={`space-reservation__timeline-slot ${selected ? 'space-reservation__timeline-slot--selected' : ''} ${!slot.available ? 'space-reservation__timeline-slot--disabled' : ''}`}
                          disabled={!slot.available}
                          key={slot.label}
                          onMouseDown={() => handleSlotMouseDown(slotLinearIndex)}
                          onMouseEnter={() => handleSlotMouseEnter(slotLinearIndex)}
                          type="button"
                        >
                          <small>{slot.price.toLocaleString()}</small>
                        </button>
                      );
                    })}
                  </div>
                  <div
                    className="space-reservation__timeline-minutes"
                    style={{ gridTemplateColumns: `repeat(${column.minuteLabels.length}, minmax(0, 1fr))` }}
                  >
                    {column.minuteLabels.map((minuteLabel) => (
                      <span key={`${column.hour}-${minuteLabel}`}>{minuteLabel}</span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="space-reservation__timeline-end">24:00</div>
            </div>
            <button
              aria-label="다음 시간대로 이동"
              className="space-reservation__timeline-nav space-reservation__timeline-nav--next"
              disabled={!canScrollTimelineNext}
              onClick={() => scrollTimelineBy('next')}
              type="button"
            >
              <span className="space-reservation__timeline-nav-icon space-reservation__timeline-nav-icon--next">
                <ChevronIcon />
              </span>
            </button>
          </div>
          <div className="space-reservation__legend">
            <span className="space-reservation__legend-item">
              <span className="space-reservation__legend-swatch space-reservation__legend-swatch--available" />
              예약 가능
            </span>
            <span className="space-reservation__legend-item">
              <span className="space-reservation__legend-swatch space-reservation__legend-swatch--blocked" />
              예약 불가
            </span>
            <span className="space-reservation__legend-item">
              <span className="space-reservation__legend-swatch space-reservation__legend-swatch--selected" />
              선택
            </span>
          </div>
        </section>

        <section className="space-reservation__section">
          <h2>예약자 정보</h2>
          <div className="space-reservation__field-list">
            <div className="space-reservation__field space-reservation__field--select">
              <span>상품 옵션 선택</span>
              <button className="space-reservation__select" onClick={() => setOptionsOpen(true)} type="button">
                <span>{selectedOptionSummary || '상품 옵션을 선택해주세요'}</span>
                <ChevronIcon />
              </button>
            </div>
            <label className="space-reservation__field">
              <span>예약자 이름</span>
              <input
                placeholder="이름을 입력해주세요"
                type="text"
                value={reservationBookerName}
                onChange={(event) => setReservationBookerName(event.target.value)}
              />
            </label>
            <label className="space-reservation__field">
              <span>연락처</span>
              <input
                placeholder="010-0000-0000"
                type="text"
                value={reservationBookerPhone}
                onChange={(event) => setReservationBookerPhone(event.target.value)}
              />
            </label>
            {reservationFields.map((field, index) => {
              const key = field.fieldId || `field-${index}`;
              const inputMode = reservationFieldInputMode(field.inputType);
              return (
                <label className="space-reservation__field" key={key}>
                  <span>
                    {field.title}
                    {field.required && <em className="space-reservation__required-mark">필수</em>}
                  </span>
                  {inputMode === 'file' ? (
                    <input
                      type="file"
                      onChange={(event) => updateReservationAnswer(key, event.target.files?.[0]?.name ?? '')}
                    />
                  ) : inputMode === 'select' ? (
                    <select
                      value={reservationAnswers[key] ?? ''}
                      onChange={(event) => updateReservationAnswer(key, event.target.value)}
                    >
                      <option value="">{field.title} 선택</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      placeholder={`${field.title}을(를) 입력해주세요`}
                      type="text"
                      value={reservationAnswers[key] ?? ''}
                      onChange={(event) => updateReservationAnswer(key, event.target.value)}
                    />
                  )}
                  {field.inputFrequency && (
                    <small className="space-reservation__field-help">{field.inputFrequency}</small>
                  )}
                </label>
              );
            })}
            <label className="space-reservation__field">
              <span>추가 요청사항</span>
              <textarea
                placeholder="요청사항이 있다면 입력해주세요"
                value={reservationNote}
                onChange={(event) => setReservationNote(event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="space-reservation__section">
          <h2>할인</h2>
          <div className="space-reservation__discount-list">
            <button className="space-reservation__discount-input" onClick={() => setCouponModalOpen(true)} type="button">
              <span>쿠폰</span>
              <span className="space-reservation__discount-input-value">
                {selectedCoupon ? `${selectedCoupon.title} 적용` : `적용 가능 ${couponCount}장`}
              </span>
              <ChevronIcon />
            </button>
            <div className="space-reservation__discount-input">
              <span>포인트</span>
              <div className="space-reservation__point-wrap">
                <span>0P</span>
                <button type="button">전액사용</button>
              </div>
            </div>
            <p className="space-reservation__point-note">보유 포인트 : 500P</p>
          </div>
        </section>

        <section className="space-reservation__section">
          <h2>결제수단</h2>
          <p className="space-reservation__payment-only-note">토스페이먼츠로 결제합니다.</p>
          <div className="space-reservation__payment-methods space-reservation__payment-methods--single" role="group" aria-label="결제수단">
            <div className="space-reservation__payment-method space-reservation__payment-method--only">
              <img alt="토스페이먼츠" className="space-reservation__payment-method-image" src={tossPaymentsLogo} />
            </div>
          </div>
        </section>

        <section className="space-reservation__section">
          <h2>결제정보</h2>
          <div className="space-reservation__payment-summary">
            <div className="space-reservation__payment-summary-rows">
              <div>
                <span>공간 금액</span>
                <strong>{basePrice.toLocaleString()}원</strong>
              </div>
              <div>
                <span>옵션 금액</span>
                <strong>{optionTotal.toLocaleString()}원</strong>
              </div>
              <div>
                <span>포인트</span>
                <strong>- 0원</strong>
              </div>
              <div>
                <span>쿠폰</span>
                <div className="space-reservation__payment-amount-stack">
                  <strong>{couponDiscountLabel}</strong>
                  {couponMinPurchaseWarning ? (
                    <em className="space-reservation__payment-warning">{couponMinPurchaseWarning}</em>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="space-reservation__payment-total">
              <span>총 결제 금액</span>
              <strong className="space-reservation__payment-total-price">{totalPrice.toLocaleString()}원</strong>
            </div>
          </div>
          <button
            className="space-reservation__payment-agreement-all"
            onClick={() => setAllAgreements(!agreements.all)}
            type="button"
          >
            <span
              className={`space-reservation__payment-agreement-all-check ${agreements.all ? 'space-reservation__payment-agreement-all-check--active' : ''}`}
            >
              ✓
            </span>
            <span>약관 전체 동의</span>
            <span className="space-reservation__payment-agreement-all-chevron" aria-hidden="true">
              <ChevronIcon />
            </span>
          </button>
        </section>
      </section>

      <div className="space-reservation__bottom-bar">
        <div className="space-reservation__bottom-main">
          <button className="space-reservation__bottom-summary" type="button">
            <span className="space-reservation__bottom-summary-title">결제정보</span>
            <span className="space-reservation__bottom-summary-right">
              <strong>{totalPrice.toLocaleString()}원</strong>
              <span className="space-reservation__bottom-summary-arrow">
                <ChevronIcon />
              </span>
            </span>
          </button>
          <button
            className="space-reservation__submit"
            disabled={!canSubmitPayment}
            onClick={() => { void handlePaymentSubmit(); }}
            type="button"
          >
            총 {totalPrice.toLocaleString()}원 결제하기
          </button>
        </div>

        <div className="space-reservation__bottom-agreements">
          <button
            className="space-reservation__agreement space-reservation__agreement--all"
            onClick={() => setAllAgreements(!agreements.all)}
            type="button"
          >
            <span className={`space-reservation__agreement-check ${agreements.all ? 'space-reservation__agreement-check--active' : ''}`}>✓</span>
            <span>전체동의</span>
          </button>
          <button
            className="space-reservation__agreement"
            onClick={() => toggleAgreement('collection')}
            type="button"
          >
            <span className={`space-reservation__agreement-check ${agreements.collection ? 'space-reservation__agreement-check--active' : ''}`}>✓</span>
            <span className="space-reservation__agreement-required">(필수)</span>
            <span>개인정보 수집 이용 동의</span>
            <span className="space-reservation__agreement-arrow"><ChevronIcon /></span>
          </button>
          <button
            className="space-reservation__agreement"
            onClick={() => toggleAgreement('thirdParty')}
            type="button"
          >
            <span className={`space-reservation__agreement-check ${agreements.thirdParty ? 'space-reservation__agreement-check--active' : ''}`}>✓</span>
            <span className="space-reservation__agreement-required">(필수)</span>
            <span>개인정보 제3자 정보 제공 동의</span>
            <span className="space-reservation__agreement-arrow"><ChevronIcon /></span>
          </button>
          <button
            className="space-reservation__agreement"
            onClick={() => toggleAgreement('paymentAgency')}
            type="button"
          >
            <span className={`space-reservation__agreement-check ${agreements.paymentAgency ? 'space-reservation__agreement-check--active' : ''}`}>✓</span>
            <span className="space-reservation__agreement-required">(필수)</span>
            <span>결제대행 서비스 이용약관 동의</span>
            <span className="space-reservation__agreement-arrow"><ChevronIcon /></span>
          </button>
        </div>
      </div>

      {optionsOpen && modalRoot
        ? createPortal(
            <div className="space-reservation__modal">
              <div className="space-reservation__modal-backdrop" onClick={() => setOptionsOpen(false)} />
              <div className="space-reservation__modal-dialog">
                <div className="space-reservation__modal-header">
                  <h2>상품 옵션 선택</h2>
                  <button onClick={() => setOptionsOpen(false)} type="button">
                    ×
                  </button>
                </div>
                <div className="space-reservation__option-list">
                  {RESERVATION_OPTION_ITEMS.map((item) => (
                    <div className="space-reservation__option-item" key={item.key}>
                      <div className="space-reservation__option-main">
                        <div className="space-reservation__option-icon">
                          {item.image ? (
                            <img alt="" className="space-reservation__option-icon-image" src={item.image} />
                          ) : (
                            <span>{item.short}</span>
                          )}
                        </div>
                        <div>
                          <p className="space-reservation__option-name">{item.name}</p>
                          <p className="space-reservation__option-desc">{item.description}</p>
                        </div>
                      </div>
                      <div className="space-reservation__option-side">
                        <div className="space-reservation__option-stepper">
                          <button
                            onClick={() =>
                              setSelectedOptionCounts((current) => ({
                                ...current,
                                [item.key]: Math.max((current[item.key] ?? 0) - 1, 0),
                              }))
                            }
                            type="button"
                          >
                            −
                          </button>
                          <span>{selectedOptionCounts[item.key] ?? 0}</span>
                          <button
                            onClick={() =>
                              setSelectedOptionCounts((current) => ({
                                ...current,
                                [item.key]: (current[item.key] ?? 0) + 1,
                              }))
                            }
                            type="button"
                          >
                            +
                          </button>
                        </div>
                        <strong>{item.price.toLocaleString()}원</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="space-reservation__modal-submit"
                  disabled={!hasSelectedOptions}
                  onClick={() => setOptionsOpen(false)}
                  type="button"
                >
                  선택 완료
                </button>
              </div>
            </div>,
            modalRoot
          )
        : null}

      <CouponDownloadModal
        coupons={isMockMode() ? undefined : availableCoupons}
        downloadedCouponIds={downloadedCouponIds}
        errorMessage={couponError ?? downloadError}
        loading={couponLoading}
        onClose={() => setCouponModalOpen(false)}
        onDownloadCoupon={handleDownloadCoupon}
        onSelectCoupon={(couponId) => {
          setSelectedCouponId(couponId);
          setCouponModalOpen(false);
        }}
        open={couponModalOpen}
        selectable
        selectedCouponId={selectedCouponId}
        title={`적용 가능 쿠폰 ${couponCount}`}
      />

      {checkoutPending && modalRoot
        ? createPortal(
            <div className="space-reservation__modal" role="dialog" aria-live="polite">
              <div className="space-reservation__modal-backdrop" />
              <div className="space-reservation__result-dialog">
                <h2>결제 준비 중...</h2>
                <p className="space-reservation__result-desc">
                  잠시만 기다려주세요. 예약을 처리하고 있습니다.
                </p>
              </div>
            </div>,
            modalRoot,
          )
        : null}

      {/* 결과 모달 mount 조건:
          1. checkoutPending=true 인 동안 차단 (checkout 진행 중 결과 모달 X)
          2. paymentResultDisplayed 사용. paymentResult 의 2.5s failure debounce 값.
             failed 가 먼저, success 가 늦게 도착해도 최종값만 mount 되어
             깜빡임 흡수. */}
      {paymentResultDisplayed && !checkoutPending && modalRoot
        ? createPortal(
            <div className="space-reservation__modal">
              <div className="space-reservation__modal-backdrop" onClick={() => setPaymentResult(null)} />
              <div className="space-reservation__result-dialog">
                <button className="space-reservation__result-close" onClick={() => setPaymentResult(null)} type="button">
                  ×
                </button>
                <div
                  className={`space-reservation__result-icon ${paymentResultDisplayed === 'success' ? 'space-reservation__result-icon--success' : 'space-reservation__result-icon--failed'}`}
                >
                  {paymentResultDisplayed === 'success' ? '✓' : '×'}
                </div>
                <h2>{paymentResultDisplayed === 'success' ? '예약 완료!' : '결제 실패'}</h2>
                <p className="space-reservation__result-desc">
                  {paymentResultDisplayed === 'success'
                    ? '업체의 승인 후 공간 사용 가능합니다.'
                    : paymentFailure.message}
                </p>
                {paymentResultDisplayed === 'failed' && paymentFailure.code ? (
                  <p className="space-reservation__result-error-code">오류 코드: {paymentFailure.code}</p>
                ) : null}
                <div className="space-reservation__result-summary">
                  <img alt="" src={reservationSummary.image} />
                  <div>
                    <p>{reservationSummary.title}</p>
                    <span>{reservationSummary.address}</span>
                  </div>
                </div>
                <div className="space-reservation__result-info">
                  <div><span>예약 날짜</span><strong>{reservationDateLabel}</strong></div>
                  <div><span>예약 시간</span><strong>{selectedTimeRange}</strong></div>
                  <div><span>상품 옵션</span><strong>{selectedOptionSummary || '-'}</strong></div>
                  <div><span>가격</span><strong>{totalPrice.toLocaleString()}원</strong></div>
                </div>
                <div className="space-reservation__result-actions">
                  <button onClick={() => navigate('/')} type="button">홈으로</button>
                  <button
                    className="space-reservation__result-primary"
                    onClick={() => navigate(paymentResultDisplayed === 'success' ? '/my-reservations' : roomDetailPath)}
                    type="button"
                  >
                    {paymentResultDisplayed === 'success' ? '예약현황 이동' : '확인'}
                  </button>
                </div>
              </div>
            </div>,
            modalRoot
          )
        : null}
    </main>
  );
}
