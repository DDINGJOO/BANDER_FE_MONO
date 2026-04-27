import { expect, test, type Route } from '@playwright/test';

const image = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

const vendorDetail = {
  vendorId: '7001',
  ownerUserId: '1001',
  slug: 'test-studio',
  name: '테스트 스튜디오',
  description: '비즈에서 등록되고 공개 승인된 테스트 스튜디오입니다.',
  contactPhone: '010-1234-5678',
  address: {
    roadAddress: '서울시 마포구 테스트로 1',
    detailAddress: '2층',
    latitude: 37.55,
    longitude: 126.92,
  },
  parkingPolicy: {
    parkingType: 'FREE',
    parkingMethod: '건물 뒤편',
    parkingFeeDescription: '무료',
  },
  homepageUrls: ['https://example.com/test-studio'],
  keywords: [{ primaryCategory: '연습실', secondaryKeyword: '합주실' }],
  businessHours: [
    { dayOfWeek: 'MONDAY', closed: false, openTime: '09:00', closeTime: '23:00' },
  ],
  holidays: [],
  rooms: [
    {
      roomId: '8001',
      slug: 'client-visible-room',
      title: '클라이언트 노출 룸',
      categoryLabel: '연습실',
      imageUrl: image,
      location: '서울시 마포구 테스트로 1',
      priceLabel: '20,000원',
      priceSuffix: '/60분',
      rating: '4.8',
      studioLabel: '테스트 스튜디오',
      tags: ['와이파이', '주차가능'],
    },
  ],
  hashTags: ['#합주실', '#와이파이'],
  basicInfoRows: [
    { field: 'address', primaryLine: '서울시 마포구 테스트로 1', secondaryLine: '2층' },
    { field: 'phone', phone: '010-1234-5678' },
    { field: 'parking', left: '주차가능', right: '무료' },
  ],
};

const spaceDetail = {
  id: '8001',
  studioId: '7001',
  slug: 'client-visible-room',
  title: '클라이언트 노출 룸',
  category: '연습실',
  studioName: '테스트 스튜디오',
  vendorSlug: 'test-studio',
  location: '서울시 마포구 테스트로 1',
  address: '서울시 마포구 테스트로 1 2층',
  stationDistanceLabel: '합정역 도보 5분',
  rating: '4.8',
  reviewCount: 3,
  priceLabel: '20,000원',
  priceSuffix: '/60분',
  pricingLines: [{ label: '기본 이용료', value: '20,000원/60분' }],
  hashTags: ['#합주실', '#와이파이'],
  operatingSummary: '오늘 09:00 - 23:00',
  operatingWeek: [
    { weekday: '월', hours: '09:00 - 23:00', isToday: true },
    { weekday: '화', hours: '09:00 - 23:00', isToday: false },
  ],
  galleryUrls: [image, image],
  facilityChips: [{ key: 'wifi', label: '와이파이' }],
  detailBenefitChips: [{ label: '주차가능' }],
  notices: [{ title: '이용 안내', body: '사용 후 정리해주세요.', imageUrl: null }],
  policies: [{ title: '환불 규정', body: '예약 취소는 정책을 따릅니다.', imageUrl: null }],
  description: '비즈 등록 후 공개 승인된 룸 상세입니다.',
  couponStripLabel: '사용 가능한 쿠폰',
  trustBanner: '믿고 예약할 수 있는 공간',
  vendor: { name: '테스트 스튜디오', spaces: '1개 공간 운영 중' },
  latitude: 37.55,
  longitude: 126.92,
};

async function fulfillJson(route: Route, data: unknown) {
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data }),
  });
}

test('vendor detail renders public rooms from the client API binding', async ({ page }) => {
  let loadedVendor = false;

  await page.route('**/api/v1/vendors/slug/test-studio', async (route) => {
    loadedVendor = true;
    await fulfillJson(route, vendorDetail);
  });

  await page.goto('/vendors/test-studio');

  await expect(page.getByRole('heading', { name: '테스트 스튜디오' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '룸 정보 1' })).toBeVisible();
  await expect(page.getByRole('link', { name: /클라이언트 노출 룸/ })).toBeVisible();
  await expect(page.getByText('#합주실')).toBeVisible();
  await expect(page.getByText('서울시 마포구 테스트로 1').first()).toBeVisible();
  expect(loadedVendor).toBe(true);
});

test('space detail renders the published room detail from the client API binding', async ({ page }) => {
  let loadedSpace = false;
  let loadedReviews = false;

  await page.route('**/api/v1/spaces/slug/client-visible-room', async (route) => {
    loadedSpace = true;
    await fulfillJson(route, spaceDetail);
  });
  await page.route('**/api/v1/spaces/7001/reviews?roomId=8001', async (route) => {
    loadedReviews = true;
    await fulfillJson(route, { items: [] });
  });

  await page.goto('/spaces/client-visible-room');

  await expect(page.getByRole('heading', { name: '클라이언트 노출 룸' })).toBeVisible();
  await expect(page.getByText('테스트 스튜디오').first()).toBeVisible();
  await expect(page.getByText('20,000원').first()).toBeVisible();
  await expect(page.getByText('#합주실')).toBeVisible();
  await expect(page.getByText('비즈 등록 후 공개 승인된 룸 상세입니다.')).toBeVisible();
  await expect(page.getByRole('link', { name: /테스트 스튜디오/ })).toHaveAttribute('href', '/vendors/test-studio');
  expect(loadedSpace).toBe(true);
  expect(loadedReviews).toBe(true);
});
