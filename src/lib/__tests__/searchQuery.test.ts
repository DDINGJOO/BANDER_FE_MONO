import type { SpaceFilterState } from '../../components/home/HomeSpaceExplorer';
import {
  getDayOfWeekParam,
  parseSearchFilters,
  serializeSearchFilters,
} from '../searchQuery';

describe('serializeSearchFilters / parseSearchFilters', () => {
  describe('serialize', () => {
    it('빈 필터 + q 없음 -> 빈 URLSearchParams', () => {
      const params = serializeSearchFilters({});
      expect(params.toString()).toBe('');
    });

    it('q 만 주어지면 q 키만 추가', () => {
      const params = serializeSearchFilters({}, '드럼');
      expect(params.get('q')).toBe('드럼');
      expect(Array.from(params.keys())).toEqual(['q']);
    });

    it('빈 q (공백) 는 무시', () => {
      const params = serializeSearchFilters({}, '   ');
      expect(params.toString()).toBe('');
    });

    it('빈 배열 / undefined / null 필드는 키를 추가하지 않음', () => {
      const params = serializeSearchFilters({
        category: undefined,
        capacity: undefined,
        regions: [],
        keywords: [],
        parking: undefined,
        reservable: undefined,
        date: undefined,
      });
      expect(params.toString()).toBe('');
    });

    it('regions 는 같은 키 반복으로 직렬화', () => {
      const params = serializeSearchFilters({ regions: ['강남구', '마포구'] });
      expect(params.getAll('regions')).toEqual(['강남구', '마포구']);
    });

    it('keywords 는 선행 # 을 제거하고 직렬화', () => {
      const params = serializeSearchFilters({ keywords: ['#밴드', '#재즈'] });
      expect(params.getAll('keywords')).toEqual(['밴드', '재즈']);
    });

    it('parking=false / reservable=false 는 직렬화 안 함', () => {
      const params = serializeSearchFilters({ parking: false, reservable: false });
      expect(params.has('parking')).toBe(false);
      expect(params.has('reservable')).toBe(false);
    });

    it('date 는 date + startHour + endHour 로 분해 (dayOfWeek 는 직렬화하지 않음)', () => {
      const params = serializeSearchFilters({
        date: { year: 2026, month: 1, day: 15, startHour: 10, endHour: 18 },
      });
      expect(params.get('date')).toBe('2026-01-15');
      expect(params.has('dayOfWeek')).toBe(false);
      expect(params.get('startHour')).toBe('10');
      expect(params.get('endHour')).toBe('18');
    });
  });

  describe('parse', () => {
    it('빈 URLSearchParams -> q=undefined, filters 모두 undefined', () => {
      const { q, filters } = parseSearchFilters(new URLSearchParams());
      expect(q).toBeUndefined();
      expect(filters).toEqual({
        category: undefined,
        capacity: undefined,
        date: undefined,
        parking: undefined,
        regions: undefined,
        reservable: undefined,
        keywords: undefined,
      });
    });

    it('q 만 있는 URL', () => {
      const { q, filters } = parseSearchFilters(new URLSearchParams('q=드럼'));
      expect(q).toBe('드럼');
      expect(filters.category).toBeUndefined();
      expect(filters.regions).toBeUndefined();
    });

    it('region 단일 키도 regions[] 에 흡수', () => {
      const { filters } = parseSearchFilters(new URLSearchParams('region=강남구'));
      expect(filters.regions).toEqual(['강남구']);
    });

    it('region + regions 혼합도 dedupe', () => {
      const { filters } = parseSearchFilters(
        new URLSearchParams('region=강남구&regions=강남구&regions=마포구'),
      );
      expect(filters.regions).toEqual(['강남구', '마포구']);
    });

    it('keywords 는 선행 # 을 복원', () => {
      const { filters } = parseSearchFilters(new URLSearchParams('keywords=밴드&keywords=재즈'));
      expect(filters.keywords).toEqual(['#밴드', '#재즈']);
    });

    it('알 수 없는 키는 무시', () => {
      const { q, filters } = parseSearchFilters(
        new URLSearchParams('q=피아노&unknown=foo&category=합주실'),
      );
      expect(q).toBe('피아노');
      expect(filters.category).toBe('합주실');
    });

    it('잘못된 capacity (음수, 0, 비정수) 는 undefined', () => {
      expect(parseSearchFilters(new URLSearchParams('capacity=-3')).filters.capacity).toBeUndefined();
      expect(parseSearchFilters(new URLSearchParams('capacity=0')).filters.capacity).toBeUndefined();
      expect(parseSearchFilters(new URLSearchParams('capacity=abc')).filters.capacity).toBeUndefined();
      expect(parseSearchFilters(new URLSearchParams('capacity=4')).filters.capacity).toBe(4);
    });

    it('parking=true / parking=1 만 true, 그 외는 undefined', () => {
      expect(parseSearchFilters(new URLSearchParams('parking=true')).filters.parking).toBe(true);
      expect(parseSearchFilters(new URLSearchParams('parking=1')).filters.parking).toBe(true);
      expect(parseSearchFilters(new URLSearchParams('parking=false')).filters.parking).toBeUndefined();
      expect(parseSearchFilters(new URLSearchParams('parking=0')).filters.parking).toBeUndefined();
    });

    it('잘못된 date 형식은 undefined', () => {
      expect(parseSearchFilters(new URLSearchParams('date=2026/01/15')).filters.date).toBeUndefined();
      expect(parseSearchFilters(new URLSearchParams('date=2026-13-01')).filters.date).toBeUndefined();
      expect(parseSearchFilters(new URLSearchParams('date=2026-02-30')).filters.date).toBeUndefined();
    });

    it('date 유효 + startHour >= endHour 면 date 무시', () => {
      const { filters } = parseSearchFilters(
        new URLSearchParams('date=2026-01-15&startHour=18&endHour=10'),
      );
      expect(filters.date).toBeUndefined();
    });

    it('date 유효 + 시간 default (0~24)', () => {
      const { filters } = parseSearchFilters(new URLSearchParams('date=2026-01-15'));
      expect(filters.date).toEqual({
        year: 2026, month: 1, day: 15, startHour: 0, endHour: 24,
      });
    });
  });

  describe('round-trip', () => {
    const cases: Array<{ name: string; q?: string; filters: SpaceFilterState }> = [
      { name: '빈 필터 + 빈 q', filters: {} },
      { name: 'q 만', q: '드럼', filters: {} },
      { name: 'category 만', filters: { category: '합주실' } },
      { name: 'capacity 만', filters: { capacity: 5 } },
      { name: 'parking true', filters: { parking: true } },
      { name: 'reservable true', filters: { reservable: true } },
      { name: 'regions 단일', filters: { regions: ['강남구'] } },
      { name: 'regions 복수', filters: { regions: ['강남구', '마포구', '용산구'] } },
      { name: 'keywords 복수 (#)', filters: { keywords: ['#밴드', '#재즈'] } },
      {
        name: 'date 풀세트',
        filters: { date: { year: 2026, month: 5, day: 4, startHour: 9, endHour: 21 } },
      },
      {
        name: '복합 필터 + q',
        q: '드럼',
        filters: {
          category: '합주실',
          capacity: 4,
          parking: true,
          regions: ['강남구', '마포구'],
          keywords: ['#밴드'],
          date: { year: 2026, month: 5, day: 4, startHour: 10, endHour: 18 },
        },
      },
    ];

    cases.forEach(({ name, q, filters }) => {
      it(`${name}: serialize -> parse -> 동일`, () => {
        const params = serializeSearchFilters(filters, q);
        const parsed = parseSearchFilters(new URLSearchParams(params.toString()));
        expect(parsed.q).toBe(q?.trim() || undefined);
        // dayOfWeek 는 직렬화에만 등장하고 파싱은 무시 (date 로 재계산되므로 필터 객체에 영향 X).
        // 빈 배열·undefined 는 모두 undefined 로 normalize 되어 비교.
        expect(parsed.filters).toEqual({
          category: filters.category,
          capacity: filters.capacity,
          date: filters.date,
          parking: filters.parking,
          regions: filters.regions?.length ? filters.regions : undefined,
          reservable: filters.reservable,
          keywords: filters.keywords?.length ? filters.keywords : undefined,
        });
      });
    });
  });
});
