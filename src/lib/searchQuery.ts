import type {
  SpaceDateFilterState,
  SpaceFilterState,
} from '../components/home/HomeSpaceExplorer';

const DAY_OF_WEEK_PARAMS = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const;

function formatDateParam(date: SpaceDateFilterState): string {
  return [
    String(date.year).padStart(4, '0'),
    String(date.month).padStart(2, '0'),
    String(date.day).padStart(2, '0'),
  ].join('-');
}

export function getDayOfWeekParam(date: SpaceDateFilterState): string {
  return DAY_OF_WEEK_PARAMS[new Date(date.year, date.month - 1, date.day).getDay()];
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function keywordParamToFilterValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function parsePositiveIntParam(searchParams: URLSearchParams, key: string): number | undefined {
  const value = searchParams.get(key);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/** 0~24 정수만 허용. 24 는 endHour 의 "자정 직전" sentinel 로도 사용. */
function parseHourParam(
  searchParams: URLSearchParams,
  key: string,
  fallback: number,
): number {
  const value = searchParams.get(key);
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 24 ? parsed : fallback;
}

function parseBooleanParam(searchParams: URLSearchParams, key: string): boolean | undefined {
  const value = searchParams.get(key);
  return value === 'true' || value === '1' ? true : undefined;
}

function parseDateFilter(searchParams: URLSearchParams): SpaceDateFilterState | undefined {
  const value = searchParams.get('date');
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return undefined;
  }

  const startHour = parseHourParam(searchParams, 'startHour', 0);
  const endHour = parseHourParam(searchParams, 'endHour', 24);
  if (startHour >= endHour) {
    return undefined;
  }

  return { day, endHour, month, startHour, year };
}

/**
 * SpaceFilterState (+ optional q) 를 URLSearchParams 로 직렬화한다.
 * - 빈 필드 (undefined / null / 빈 배열 / 빈 문자열) 는 키를 추가하지 않음.
 * - 배열 필드 (regions, keywords) 는 같은 키를 반복 (`regions=A&regions=B`).
 *   `searchRooms` 의 `buildQuery` 와 일치.
 * - date 는 `date` (YYYY-MM-DD) + `startHour` + `endHour` 로 분해. `dayOfWeek` 는
 *   호출부가 `getDayOfWeekParam(date)` 로 재계산하므로 URL 에는 박지 않는다.
 * - keywords 는 선행 `#` 을 제거하고 직렬화.
 * - boolean 필드 (parking, reservable) 는 truthy(true) 만 직렬화한다.
 *   UI 가 2-state (true / unset) 라는 가정. 향후 3-state (true/false/unset) 도입 시 정책 재검토 필요.
 */
export function serializeSearchFilters(
  filters: SpaceFilterState,
  q?: string,
): URLSearchParams {
  const search = new URLSearchParams();

  const trimmedQ = q?.trim();
  if (trimmedQ) {
    search.set('q', trimmedQ);
  }

  if (filters.category) {
    search.set('category', filters.category);
  }
  if (filters.capacity) {
    search.set('capacity', String(filters.capacity));
  }
  if (filters.parking) {
    search.set('parking', 'true');
  }
  if (filters.reservable) {
    search.set('reservable', 'true');
  }
  filters.regions?.filter(Boolean).forEach((region) => {
    search.append('regions', region);
  });
  filters.keywords
    ?.map((keyword) => keyword.replace(/^#/, ''))
    .filter(Boolean)
    .forEach((keyword) => {
      search.append('keywords', keyword);
    });
  if (filters.date) {
    search.set('date', formatDateParam(filters.date));
    search.set('startHour', String(filters.date.startHour));
    search.set('endHour', String(filters.date.endHour));
  }

  return search;
}

/**
 * URLSearchParams 를 q 와 SpaceFilterState 로 파싱한다.
 * - serializeSearchFilters 의 역. 라운드트립 가능.
 * - 누락된 키는 default (undefined / 빈 배열은 undefined).
 * - `region` 단일 키도 `regions[]` 에 흡수 (단일/복수 호환).
 * - 알 수 없는 키는 무시.
 * - keywords 는 선행 `#` 을 복원해서 반환 (UI 표시 형식).
 */
export function parseSearchFilters(searchParams: URLSearchParams): {
  q?: string;
  filters: SpaceFilterState;
} {
  const q = searchParams.get('q')?.trim() || undefined;

  const regions = dedupe([
    ...searchParams.getAll('regions'),
    ...searchParams.getAll('region'),
  ]);
  const keywords = dedupe(
    searchParams.getAll('keywords').map(keywordParamToFilterValue),
  );
  const category = searchParams.get('category')?.trim() || undefined;

  const filters: SpaceFilterState = {
    category,
    capacity: parsePositiveIntParam(searchParams, 'capacity'),
    date: parseDateFilter(searchParams),
    parking: parseBooleanParam(searchParams, 'parking'),
    regions: regions.length ? regions : undefined,
    reservable: parseBooleanParam(searchParams, 'reservable'),
    keywords: keywords.length ? keywords : undefined,
  };

  return { q, filters };
}
