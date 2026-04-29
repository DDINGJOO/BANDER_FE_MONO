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
  getSpaceAvailability,
  createBooking,
  type BookingCommandResponse,
  type SpaceAvailabilitySlot,
} from '../api/bookings';
import { useSagaPolling } from '../hooks/useSagaPolling';
import { isMockMode, getTossPaymentsClientKey } from '../config/publicEnv';
import { requestTossPayment } from '../utils/tossPayments';

const TOSS_PAY_IMAGE =
  'https://www.figma.com/api/mcp/asset/2eae63a4-d92c-4d34-9e5c-985a8b6f3ade';

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

function formatReservationDate(dateParam: string | null) {
  const parsed = parseLocalDateParam(dateParam) ?? startOfLocalDay();

  const weekday = ['일', '월', '화', '수', '목', '금', '토'][parsed.getDay()];
  return `${String(parsed.getFullYear()).slice(2)}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')} (${weekday})`;
}

function slotLabelToIso(date: string, label: string): string {
  return `${date}T${label}:00`;
}

function isReservationSlotInPast(date: string, label: string, nowMs = Date.now()) {
  const slotStart = new Date(slotLabelToIso(date, label)).getTime();
  return Number.isFinite(slotStart) && slotStart <= nowMs;
}

export function SpaceReservationPage() {
  const navigate = useNavigate();
  const { openGuestGate } = useGuestGate();
  const { slug } = useParams();
  const { detail } = useSpaceDetail(slug);
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
  const { downloadCoupon, downloadedCouponIds, downloadError } = useCouponDownloads();
  const [paymentResult, setPaymentResult] = useState<PaymentResultState>(null);
  const [sagaId, setSagaId] = useState<string | null>(null);
  const [sagaPending, setSagaPending] = useState(false);
  // success 가 한번 set 되면 failed 로 덮어쓰기 거부 — 토스 SDK 의 redirect-induced
  // reject 와 saga COMPLETED 가 동시에 도착할 때 발생하던 "실패→성공" 깜빡임 차단.
  // null 로의 전환 (모달 닫기) 은 허용. SDK 진짜 오류는 success 가 아직 set 되지
  // 않은 상태이므로 정상적으로 'failed' 표시됨 → saga timeout 까지 대기하는 일도 없음.
  const setPaymentResultSafe = useCallback((next: PaymentResultState) => {
    setPaymentResult((prev) => (prev === 'success' && next === 'failed' ? prev : next));
  }, []);
  // Guard: once the saga polling response surfaces orderId/amount/customerKey,
  // we open the Toss SDK exactly once. Polling continues until COMPLETED.
  const tossLaunchedRef = useRef(false);
  const [canScrollTimelineNext, setCanScrollTimelineNext] = useState(true);
  const [canScrollTimelinePrev, setCanScrollTimelinePrev] = useState(false);
  const [selectedOptionCounts, setSelectedOptionCounts] = useState<Record<string, number>>({
    drum: 0,
    guitar: 0,
    people: 0,
    piano: 0,
  });
  const [availabilitySlots, setAvailabilitySlots] = useState<SpaceAvailabilitySlot[]>([]);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollDragStateRef = useRef({ active: false, scrollLeft: 0, startX: 0 });

  const dateParam = normalizeReservationDateParam(searchParams.get('date'));
  const roomIdParam = searchParams.get('roomId');
  const detailRoomId =
    detail && 'id' in detail && typeof detail.id === 'string' ? detail.id : null;
  const roomId = roomIdParam ?? detailRoomId;

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
    if (isMockMode()) return;
    if (!roomId) return;
    getSpaceAvailability(roomId, dateParam)
      .then((res) => setAvailabilitySlots(res.slots))
      .catch(() => setAvailabilitySlots([]));
  }, [roomId, dateParam]);

  useEffect(() => {
    if (isMockMode() || !slug) return;
    const controller = new AbortController();
    setCouponLoading(true);
    setCouponError(null);
    getAvailableCoupons(slug, { signal: controller.signal })
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
  }, [slug]);

  const timeColumns = useMemo(() => {
    return Array.from({ length: 24 }, (_, hour) => {
      const firstLabel = `${String(hour).padStart(2, '0')}:00`;
      const secondLabel = `${String(hour).padStart(2, '0')}:30`;

      const findSlot = (label: string) =>
        availabilitySlots.find((s) => s.startTime.slice(0, 5) === label);

      const buildSlot = (label: string, apiSlot: SpaceAvailabilitySlot | undefined, fallbackAvailable: boolean) => {
        const past = isReservationSlotInPast(dateParam, label, currentTimeMs);
        return {
          available: !past && (apiSlot ? apiSlot.bookable : fallbackAvailable),
          label,
          price: apiSlot ? apiSlot.priceWon : (hour >= 18 ? 8000 : 5000),
        };
      };

      return {
        hour,
        slots: [
          buildSlot(firstLabel, findSlot(firstLabel), !(hour < 6 || hour === 17)),
          buildSlot(secondLabel, findSlot(secondLabel), !(hour < 6 || (hour === 18 && secondLabel === '18:30'))),
        ],
      };
    });
  }, [availabilitySlots, currentTimeMs, dateParam]);

  const linearSlots = useMemo(() => timeColumns.flatMap((column) => column.slots), [timeColumns]);

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
  const selectedSlotDetails = linearSlots.filter((slot) => selectedTimes.includes(slot.label));
  const basePrice = selectedSlotDetails.reduce((sum, slot) => sum + slot.price, 0) || 10000;
  const optionTotal = RESERVATION_OPTION_ITEMS.reduce(
    (sum, item) => sum + item.price * (selectedOptionCounts[item.key] ?? 0),
    0
  );
  const totalPrice = basePrice + optionTotal;
  const selectedTimeRange = (() => {
    if (selectedTimes.length === 0) {
      return '-';
    }

    const sorted = [...selectedTimes].sort();
    const start = sorted[0];
    const last = sorted[sorted.length - 1];
    const [hour, minute] = last.split(':').map(Number);
    const nextMinute = minute + 30;
    const endHour = nextMinute >= 60 ? hour + 1 : hour;
    const endMinute = nextMinute >= 60 ? 0 : nextMinute;
    const totalMinutes = selectedTimes.length * 30;
    const totalHours = totalMinutes / 60;

    return `${start} ~ ${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')} (총 ${totalHours}시간)`;
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
  const canSubmitPayment = requiredAgreementsChecked && selectedTimes.length > 0 && (isMockMode() || Boolean(roomId));
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const selectedCoupon = availableCoupons.find((coupon) => coupon.id === selectedCouponId) ?? null;
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

  const handlePaymentSubmit = async () => {
    if (!canSubmitPayment || selectedTimes.length === 0) return;

    if (isMockMode()) {
      setPaymentResult('success');
      return;
    }

    const sorted = [...selectedTimes].sort();
    if (sorted.some((label) => isReservationSlotInPast(dateParam, label))) {
      setSelectedTimes((current) => current.filter((label) => !isReservationSlotInPast(dateParam, label)));
      return;
    }
    const startsAt = slotLabelToIso(dateParam, sorted[0]);
    const last = sorted[sorted.length - 1];
    const [hour, minute] = last.split(':').map(Number);
    const nextMinute = minute + 30;
    const endHour = nextMinute >= 60 ? hour + 1 : hour;
    const endMinute = nextMinute >= 60 ? 0 : nextMinute;
    const endsAt = slotLabelToIso(dateParam, `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`);

    try {
      const result = await createBooking({
        roomId: roomId ?? '',
        startsAt,
        endsAt,
        couponId: selectedCouponId ?? undefined,
      });

      if (result.kind === 'saga') {
        // canary path: orchestrator returned 202 + sagaId. Polling handles the rest.
        tossLaunchedRef.current = false;
        setSagaId(result.saga.sagaId);
        setSagaPending(true);
        return;
      }

      await proceedWithLegacyBooking(result.booking);
    } catch {
      setPaymentResult('failed');
    }
  };

  const proceedWithLegacyBooking = async (booking: BookingCommandResponse) => {
    const paidAmount = Number(booking.paidAmount ?? booking.totalPrice);

    if (paidAmount <= 0) {
      setPaymentResult('success');
      return;
    }

    const clientKey = getTossPaymentsClientKey();
    if (!clientKey || !booking.orderId) {
      setPaymentResult('failed');
      return;
    }

    sessionStorage.setItem('bander_pending_booking_id', booking.bookingId);

    await requestTossPayment({
      clientKey,
      orderId: booking.orderId,
      orderName: reservationSummary.title + ' 예약',
      amount: paidAmount,
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`,
    });
  };

  const sagaState = useSagaPolling(sagaPending ? sagaId : null);

  useEffect(() => {
    if (!sagaPending) return;

    // PR-2.8a: when the saga polling response first exposes orderId + amount,
    // launch the Toss SDK once. Polling continues until COMPLETED.
    const data = sagaState.data;
    if (
      !tossLaunchedRef.current &&
      data?.orderId &&
      typeof data.amount === 'number' &&
      data.amount > 0
    ) {
      tossLaunchedRef.current = true;
      const clientKey = getTossPaymentsClientKey();
      if (!clientKey) {
        setSagaPending(false);
        setPaymentResult('failed');
        return;
      }
      if (data.bookingId) {
        sessionStorage.setItem('bander_pending_booking_id', data.bookingId);
      }
      void requestTossPayment({
        clientKey,
        orderId: data.orderId,
        orderName: reservationSummary.title + ' 예약',
        amount: data.amount,
        customerKey: data.customerKey,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      }).catch((err) => {
        // 토스 SDK reject 는 두 가지 흐름이 섞임:
        //   (1) 결제 완료 후 successUrl 로 redirect 직전 (server-side saga 가 곧
        //       COMPLETED 로 진행됨) — 여기서 failed 를 set 하면 redirect 직전에
        //       "실패" 가 잠깐 보이고 곧 success 가 덮어써 깜빡임 발생.
        //   (2) 진짜 오류 (USER_CANCEL / SDK init 실패 / network down 등) — 이
        //       경우 saga 는 widget 결과를 기다리다가 timeout(15분) 까지 무한
        //       대기. 여기서 failed 를 set 하지 않으면 사용자는 빈 화면.
        // 두 흐름 모두 안전하게 처리하기 위해 (a) failed 를 set 하되 (b) 아래
        // setPaymentResultSafe 의 success-우선 guard 가 깜빡임을 흡수한다 —
        // saga 가 먼저 COMPLETED 를 받아 success 가 set 됐다면 이 failed 는 거부됨.
        // eslint-disable-next-line no-console
        console.warn('[toss] requestPayment rejected', err);
        setSagaPending(false);
        setPaymentResultSafe('failed');
      });
    }

    if (sagaState.timedOut) {
      setSagaPending(false);
      setPaymentResultSafe('failed');
      return;
    }
    if (sagaState.status === 'COMPLETED') {
      setSagaPending(false);
      if (data?.bookingId) {
        sessionStorage.setItem('bander_pending_booking_id', data.bookingId);
      }
      // orchestrator path completes payment server-side via PaymentService;
      // surface success directly without driving toss-payments client SDK.
      setPaymentResult('success');
      return;
    }
    if (sagaState.status === 'FAILED') {
      setSagaPending(false);
      setPaymentResultSafe('failed');
    }
  }, [sagaPending, sagaState.status, sagaState.timedOut, sagaState.data, reservationSummary.title, setPaymentResultSafe]);

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
              <div>
                <span>예약 인원</span>
                <strong>2명</strong>
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
          <p className="space-reservation__timeline-lead">최소 30분 단위로 선택</p>
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
                  <div className="space-reservation__timeline-slots">
                    {column.slots.map((slot, slotIndex) => {
                      const selected = selectedTimes.includes(slot.label);
                      const slotLinearIndex = column.hour * 2 + slotIndex;

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
                  <div className="space-reservation__timeline-minutes">
                    <span>00</span>
                    <span>30</span>
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
            <button className="space-reservation__select" onClick={() => setOptionsOpen(true)} type="button">
              <span>{selectedOptionSummary || '상품 옵션 선택'}</span>
              <ChevronIcon />
            </button>
            <label className="space-reservation__field">
              <span>예약자 이름</span>
              <input defaultValue="김은수" type="text" />
            </label>
            <label className="space-reservation__field">
              <span>연락처</span>
              <input defaultValue="010-1234-5678" type="text" />
            </label>
            <label className="space-reservation__field">
              <span>추가 요청사항</span>
              <textarea
                defaultValue={
                  '일렉기타 앰프는 마샬로 부탁드립니다.\n환기 잘되는 방으로 부탁드려요'
                }
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
              <img alt="토스페이" className="space-reservation__payment-method-image" src={TOSS_PAY_IMAGE} />
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
                <strong>{selectedCoupon ? `${selectedCoupon.discountLabel} 적용 예정` : '- 0원'}</strong>
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

      {sagaPending && modalRoot
        ? createPortal(
            <div className="space-reservation__modal" role="dialog" aria-live="polite">
              <div className="space-reservation__modal-backdrop" />
              <div className="space-reservation__result-dialog">
                <h2>
                  {sagaState.status === 'COMPENSATING' ? '취소 처리 중...' : '결제 준비 중...'}
                </h2>
                <p className="space-reservation__result-desc">
                  {sagaState.status === 'COMPENSATING'
                    ? '예약을 안전하게 취소하고 있습니다.'
                    : '잠시만 기다려주세요. 예약을 처리하고 있습니다.'}
                </p>
              </div>
            </div>,
            modalRoot,
          )
        : null}

      {paymentResult && modalRoot
        ? createPortal(
            <div className="space-reservation__modal">
              <div className="space-reservation__modal-backdrop" onClick={() => setPaymentResult(null)} />
              <div className="space-reservation__result-dialog">
                <button className="space-reservation__result-close" onClick={() => setPaymentResult(null)} type="button">
                  ×
                </button>
                <div
                  className={`space-reservation__result-icon ${paymentResult === 'success' ? 'space-reservation__result-icon--success' : 'space-reservation__result-icon--failed'}`}
                >
                  {paymentResult === 'success' ? '✓' : '×'}
                </div>
                <h2>{paymentResult === 'success' ? '예약 완료!' : '결제 실패'}</h2>
                <p className="space-reservation__result-desc">
                  {paymentResult === 'success'
                    ? '업체의 승인 후 공간 사용 가능합니다.'
                    : '사유 : 결제 금액 부족'}
                </p>
                <div className="space-reservation__result-summary">
                  <img alt="" src={reservationSummary.image} />
                  <div>
                    <p>{reservationSummary.title}</p>
                    <span>{reservationSummary.address}</span>
                  </div>
                </div>
                <div className="space-reservation__result-info">
                  <div><span>예약 날짜</span><strong>{reservationDateLabel}</strong></div>
                  <div><span>예약 시간</span><strong>{selectedTimeRange === '-' ? '16:00 ~ 17:00 (총 1시간)' : selectedTimeRange}</strong></div>
                  <div><span>예약 인원</span><strong>2명</strong></div>
                  <div><span>상품 옵션</span><strong>{selectedOptionSummary || '-'}</strong></div>
                  <div><span>가격</span><strong>{totalPrice.toLocaleString()}원</strong></div>
                </div>
                <div className="space-reservation__result-actions">
                  <button onClick={() => navigate('/')} type="button">홈으로</button>
                  <button
                    className="space-reservation__result-primary"
                    onClick={() => navigate(paymentResult === 'success' ? '/search?q=합주' : `/spaces/${slug}/reserve?date=${dateParam}${roomId ? `&roomId=${roomId}` : ''}`)}
                    type="button"
                  >
                    {paymentResult === 'success' ? '예약현황 이동' : '다시 예약하기'}
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
