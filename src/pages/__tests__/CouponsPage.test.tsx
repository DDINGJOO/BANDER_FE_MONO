import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MyCoupon } from '../../data/myCoupons';
import { OwnedCouponItemDto } from '../../data/schemas/coupon';

jest.mock('../../components/home/HomeHeader', () => ({
  HomeHeader: () => <div data-testid="home-header" />,
}));

jest.mock('../../components/home/HomeFooter', () => ({
  HomeFooter: () => <div data-testid="home-footer" />,
}));

jest.mock('../../api/coupons', () => ({
  getMyCoupons: jest.fn(() => Promise.resolve({ items: [] })),
}));

// Stable seed reference shared by the mock factory and by tests that mutate it.
const SEED: { coupons: MyCoupon[] } = { coupons: [] };
jest.mock('../../data/myCoupons', () => {
  const actual = jest.requireActual('../../data/myCoupons');
  return {
    ...actual,
    get MY_COUPONS() {
      return SEED.coupons;
    },
  };
});

// Import AFTER jest.mock so the mocked MY_COUPONS getter is wired up.
// eslint-disable-next-line import/first
import {
  CouponsPage,
  formatAvailableLine,
  formatCapLine,
  formatConditionLine,
  toMyCoupon,
} from '../CouponsPage';

beforeEach(() => {
  window.sessionStorage.clear();
  SEED.coupons = [];
});

// --- Pure formatter unit tests ---

describe('formatConditionLine', () => {
  test('null/undefined/0 은 0원으로 표기', () => {
    expect(formatConditionLine(null)).toBe('조건 : 0원 이상 결제 시');
    expect(formatConditionLine(undefined)).toBe('조건 : 0원 이상 결제 시');
    expect(formatConditionLine(0)).toBe('조건 : 0원 이상 결제 시');
  });

  test('양수 값은 ko-KR locale 로 천단위 콤마 적용', () => {
    expect(formatConditionLine(10000)).toBe('조건 : 10,000원 이상 결제 시');
    expect(formatConditionLine(1234567)).toBe('조건 : 1,234,567원 이상 결제 시');
  });
});

describe('formatCapLine', () => {
  test('null / undefined / 0 / 음수는 undefined 반환', () => {
    expect(formatCapLine(null)).toBeUndefined();
    expect(formatCapLine(undefined)).toBeUndefined();
    expect(formatCapLine(0)).toBeUndefined();
    expect(formatCapLine(-1)).toBeUndefined();
  });

  test('양수는 "최대 N원 할인" 포맷', () => {
    expect(formatCapLine(10000)).toBe('최대 10,000원 할인');
    expect(formatCapLine(5000)).toBe('최대 5,000원 할인');
  });
});

describe('formatAvailableLine', () => {
  test('ALL scope 은 전체 안내 문구', () => {
    expect(formatAvailableLine('ALL', [])).toBe('모든 공간에서 사용 가능');
    expect(formatAvailableLine('ALL', ['A룸'])).toBe('모든 공간에서 사용 가능');
  });

  test('ROOM_LIST 빈 배열은 ALL 동일하게 처리 (defensive)', () => {
    expect(formatAvailableLine('ROOM_LIST', [])).toBe('모든 공간에서 사용 가능');
  });

  test('ROOM_LIST 단수는 그대로 노출', () => {
    expect(formatAvailableLine('ROOM_LIST', ['A룸'])).toBe('A룸');
  });

  test('ROOM_LIST 복수는 "외 N곳"', () => {
    expect(formatAvailableLine('ROOM_LIST', ['A룸', 'B룸'])).toBe('A룸 외 1곳');
    expect(formatAvailableLine('ROOM_LIST', ['A룸', 'B룸', 'C룸', 'D룸'])).toBe('A룸 외 3곳');
  });
});

describe('toMyCoupon', () => {
  const baseDto: OwnedCouponItemDto = {
    id: 'oc-1',
    couponId: 'c-1',
    title: '테스트 쿠폰',
    discountLabel: '10%',
  };

  test('scopeType 미지정시 ALL + scopeRooms 빈 배열', () => {
    const result = toMyCoupon(baseDto);
    expect(result.scopeType).toBe('ALL');
    expect(result.scopeRooms).toEqual([]);
    expect(result.availableLine).toBe('모든 공간에서 사용 가능');
  });

  test('ROOM_LIST + scopeRoomNames 매핑 (slug 는 항상 null)', () => {
    const result = toMyCoupon({
      ...baseDto,
      scopeType: 'ROOM_LIST',
      scopeRoomNames: ['A룸', 'B룸'],
    });
    expect(result.scopeType).toBe('ROOM_LIST');
    expect(result.scopeRooms).toEqual([
      { name: 'A룸', slug: null },
      { name: 'B룸', slug: null },
    ]);
    expect(result.availableLine).toBe('A룸 외 1곳');
  });

  test('maxDiscountWon null 이면 capLineRight 미렌더', () => {
    const result = toMyCoupon({ ...baseDto, maxDiscountWon: null });
    expect(result.capLineRight).toBeUndefined();
  });

  test('maxDiscountWon 양수면 capLineRight 채워짐', () => {
    const result = toMyCoupon({ ...baseDto, maxDiscountWon: 10000 });
    expect(result.capLineRight).toBe('최대 10,000원 할인');
  });

  test('만료일 과거면 EXPIRED', () => {
    const result = toMyCoupon({ ...baseDto, expiresAt: '2000-01-01T00:00:00Z' });
    expect(result.status).toBe('EXPIRED');
  });
});

// --- CouponCard scenario tests (via CouponsPage with seeded coupons) ---

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/coupons']}>
      <Routes>
        <Route element={<CouponsPage />} path="/coupons" />
        <Route element={<div data-testid="space-detail" />} path="/spaces/:slug" />
      </Routes>
    </MemoryRouter>
  );
}

const allCoupon: MyCoupon = {
  id: 'all-1',
  status: 'OWNED',
  label: '[유스뮤직 전용]',
  discountValue: '5%',
  availableLine: '모든 공간에서 사용 가능',
  conditionLine: '조건 : 10,000원 이상 결제 시',
  expiryLine: '기한 : 2025.09.13까지',
  scopeType: 'ALL',
  scopeRooms: [],
};

const roomListSingle: MyCoupon = {
  id: 'rl-1',
  status: 'OWNED',
  label: '[유스뮤직 전용]',
  discountValue: '3,000원',
  availableLine: 'A룸 그랜드 피아노 대관',
  conditionLine: '조건 : 10,000원 이상 결제 시',
  expiryLine: '기한 : 2025.09.13까지',
  scopeType: 'ROOM_LIST',
  scopeRooms: [{ name: 'A룸 그랜드 피아노 대관', slug: 'a-grand-piano' }],
};

const roomListMulti: MyCoupon = {
  id: 'rl-2',
  status: 'OWNED',
  label: '[유스뮤직 전용]',
  discountValue: '3,000원',
  availableLine: 'A룸 외 3곳',
  conditionLine: '조건 : 10,000원 이상 결제 시',
  expiryLine: '기한 : 2025.09.13까지',
  scopeType: 'ROOM_LIST',
  scopeRooms: [
    { name: 'A룸', slug: 'a-room' },
    { name: 'B룸', slug: 'b-room' },
    { name: 'C룸 (삭제됨)', slug: null },
    { name: 'D룸', slug: 'd-room' },
  ],
};

const expiredRoomList: MyCoupon = {
  ...roomListMulti,
  id: 'rl-expired',
  status: 'EXPIRED',
};

const allWithCap: MyCoupon = {
  ...allCoupon,
  id: 'all-cap',
  capLineRight: '최대 10,000원 할인',
};

describe('CouponCard rendering', () => {
  test('ALL scope: 안내 문구 노출 + 펼치기 화살표 없음', () => {
    SEED.coupons = [allCoupon];
    renderPage();
    expect(screen.getByText('모든 공간에서 사용 가능')).toBeInTheDocument();
    expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
  });

  test('ROOM_LIST 단수: 공간명 + 펼치기 버튼 노출', () => {
    SEED.coupons = [roomListSingle];
    renderPage();
    const toggleBtn = screen.getByRole('button', { expanded: false });
    expect(within(toggleBtn).getByText('A룸 그랜드 피아노 대관')).toBeInTheDocument();
  });

  test('ROOM_LIST 복수: "외 N곳" + 펼치기 버튼 노출', () => {
    SEED.coupons = [roomListMulti];
    renderPage();
    const toggleBtn = screen.getByRole('button', { expanded: false });
    expect(within(toggleBtn).getByText('A룸 외 3곳')).toBeInTheDocument();
  });

  test('펼치기 토글 시 공간 리스트 노출', () => {
    SEED.coupons = [roomListMulti];
    renderPage();
    const toggleBtn = screen.getByRole('button', { expanded: false });
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
    expect(screen.getByText('A룸')).toBeInTheDocument();
    expect(screen.getByText('B룸')).toBeInTheDocument();
    expect(screen.getByText('C룸 (삭제됨) (삭제된 공간)')).toBeInTheDocument();
    expect(screen.getByText('D룸')).toBeInTheDocument();
  });

  test('공간 클릭 시 /spaces/{slug} 로 이동', () => {
    SEED.coupons = [roomListMulti];
    renderPage();
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    const link = screen.getByRole('link', { name: 'A룸' }) as HTMLAnchorElement;
    expect(link).toHaveAttribute('href', '/spaces/a-room');
  });

  test('slug=null 인 공간은 비활성 표기 + 링크 아님', () => {
    SEED.coupons = [roomListMulti];
    renderPage();
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    const disabled = screen.getByText('C룸 (삭제됨) (삭제된 공간)');
    expect(disabled.tagName).toBe('SPAN');
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
  });

  test('EXPIRED 탭에서는 펼치기 화살표 비활성', () => {
    SEED.coupons = [expiredRoomList];
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: '기한만료' }));
    expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
    expect(screen.getByText('A룸 외 3곳')).toBeInTheDocument();
  });

  test('capLineRight 가 있으면 "최대 N원 할인" 라인 노출', () => {
    SEED.coupons = [allWithCap];
    renderPage();
    expect(screen.getByText('최대 10,000원 할인')).toBeInTheDocument();
  });

  test('capLineRight 가 없으면 해당 라인 미렌더', () => {
    SEED.coupons = [allCoupon];
    renderPage();
    expect(screen.queryByText(/최대 .*원 할인/)).not.toBeInTheDocument();
  });
});
