import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { HomeHeader } from '../components/home/HomeHeader';
import { CouponDownloadModal } from '../components/space/CouponDownloadModal';
import { ChevronIcon } from '../components/shared/Icons';
import { loadAuthSession } from '../data/authSession';
import { COUPON_ITEMS } from '../data/couponDownloadModal';
import { HOME_SPACE_CARDS } from '../data/home';
import { useCouponDownloads } from '../hooks/useCouponDownloads';
import {
  getSpaceAvailability,
  createBooking,
  type SpaceAvailabilitySlot,
} from '../api/bookings';
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

function formatReservationDate(dateParam: string | null) {
  if (!dateParam) {
    return '25.08.20 (수)';
  }

  const parsed = new Date(dateParam);
  if (Number.isNaN(parsed.getTime())) {
    return '25.08.20 (수)';
  }

  const weekday = ['일', '월', '화', '수', '목', '금', '토'][parsed.getDay()];
  return `${String(parsed.getFullYear()).slice(2)}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${String(parsed.getDate()).padStart(2, '0')} (${weekday})`;
}

function slotLabelToIso(date: string, label: string): string {
  return `${date}T${label}:00`;
}

export function SpaceReservationPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
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
  const { downloadCoupon, downloadedCouponIds } = useCouponDownloads();
  const [paymentResult, setPaymentResult] = useState<PaymentResultState>(null);
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

  const dateParam = searchParams.get('date') ?? '2025-08-20';
  const roomIdParam = searchParams.get('roomId');
  const roomId = roomIdParam ?? null;

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
    if (isMockMode()) return;
    if (!roomId) return;
    getSpaceAvailability(roomId, dateParam)
      .then((res) => setAvailabilitySlots(res.slots))
      .catch(() => setAvailabilitySlots([]));
  }, [roomId, dateParam]);

  const timeColumns = useMemo(() => {
    return Array.from({ length: 24 }, (_, hour) => {
      const firstLabel = `${String(hour).padStart(2, '0')}:00`;
      const secondLabel = `${String(hour).padStart(2, '0')}:30`;

      const findSlot = (label: string) =>
        availabilitySlots.find((s) => s.startTime.slice(0, 5) === label);

      const firstApiSlot = findSlot(firstLabel);
      const secondApiSlot = findSlot(secondLabel);

      return {
        hour,
        slots: [
          {
            available: firstApiSlot ? firstApiSlot.bookable : !(hour < 6 || hour === 17),
            label: firstLabel,
            price: firstApiSlot ? firstApiSlot.priceWon : (hour >= 18 ? 8000 : 5000),
          },
          {
            available: secondApiSlot ? secondApiSlot.bookable : !(hour < 6 || (hour === 18 && secondLabel === '18:30')),
            label: secondLabel,
            price: secondApiSlot ? secondApiSlot.priceWon : (hour >= 18 ? 8000 : 5000),
          },
        ],
      };
    });
  }, [availabilitySlots]);

  const spaceCard = useMemo(
    () => HOME_SPACE_CARDS.find((item) => item.detailPath === `/spaces/${slug}`) ?? HOME_SPACE_CARDS[1],
    [slug]
  );

  const reservationDateLabel = formatReservationDate(dateParam);
  const linearSlots = timeColumns.flatMap((column) => column.slots);
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
  const canSubmitPayment = requiredAgreementsChecked && selectedTimes.length > 0;
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

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
    const startsAt = slotLabelToIso(dateParam, sorted[0]);
    const last = sorted[sorted.length - 1];
    const [hour, minute] = last.split(':').map(Number);
    const nextMinute = minute + 30;
    const endHour = nextMinute >= 60 ? hour + 1 : hour;
    const endMinute = nextMinute >= 60 ? 0 : nextMinute;
    const endsAt = slotLabelToIso(dateParam, `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`);

    try {
      const booking = await createBooking({ roomId: roomId ?? '', startsAt, endsAt });

      const clientKey = getTossPaymentsClientKey();
      if (!clientKey || !booking.orderId) {
        setPaymentResult('failed');
        return;
      }

      sessionStorage.setItem('bander_pending_booking_id', booking.bookingId);

      await requestTossPayment({
        clientKey,
        orderId: booking.orderId,
        orderName: spaceCard.title + ' 예약',
        amount: booking.totalPrice,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch {
      setPaymentResult('failed');
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
            <img alt="" className="space-reservation__summary-thumb" src={spaceCard.image} />
            <div>
              <p className="space-reservation__summary-title">{spaceCard.title}</p>
              <p className="space-reservation__summary-address">서울시 마포구 독막로9길 31 지하 1층</p>
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
              <span className="space-reservation__discount-input-value">적용 가능 {COUPON_ITEMS.length}장</span>
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
                <strong>- 0원</strong>
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
        downloadedCouponIds={downloadedCouponIds}
        onClose={() => setCouponModalOpen(false)}
        onDownloadCoupon={downloadCoupon}
        open={couponModalOpen}
      />

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
                  <img alt="" src={spaceCard.image} />
                  <div>
                    <p>{spaceCard.title}</p>
                    <span>서울시 마포구 독막로9길 31 지하 1층</span>
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
