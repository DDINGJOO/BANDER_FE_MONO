/**
 * 업체 상세 Figma 6136:30539 — 기본 정보 행
 * `field`는 API/DB 필드와 1:1로 매핑하기 위한 식별자입니다.
 */
export type VendorBasicInfoField =
  | 'address'
  | 'capacity'
  | 'custom'
  | 'directions'
  | 'extra_link'
  | 'hours'
  | 'parking'
  | 'phone'
  | 'price';

/** 주소 — 1행 + 보조(역 거리), 우측 쉐브론 */
export type VendorBasicInfoAddress = {
  field: 'address';
  primaryLine: string;
  secondaryLine?: string;
};

/** 오는 길 — 1행 + 쉐브론 */
export type VendorBasicInfoDirections = {
  field: 'directions';
  primaryLine: string;
};

/** 영업시간 — 요일(옵션) SB + 시간 M + 쉐브론 */
export type VendorBasicInfoHours = {
  dayLabel?: string;
  field: 'hours';
  hoursLine: string;
};

/** 전화번호 — 번호 + 복사 UI */
export type VendorBasicInfoPhone = {
  field: 'phone';
  phone: string;
};

/** 가격 — 한 줄 + 쉐브론 */
export type VendorBasicInfoPrice = {
  field: 'price';
  line: string;
};

/** 인원 등 단순 텍스트(쉐브론 없음) */
export type VendorBasicInfoPlain = {
  field: 'capacity';
  value: string;
};

/** 주차정보 — 두 토막 + 중간 점 + 쉐브론 */
export type VendorBasicInfoParking = {
  field: 'parking';
  left: string;
  right: string;
};

/** 추가정보 — 링크 */
export type VendorBasicInfoExtraLink = {
  displayText: string;
  field: 'extra_link';
  href: string;
};

/** API 전용 필드(옵션가격 등) — 라벨·값만 전달 */
export type VendorBasicInfoCustom = {
  field: 'custom';
  label: string;
  /** true면 Figma처럼 우측 쉐브론 */
  trailingChevron?: boolean;
  value: string;
};

export type VendorBasicInfoRow =
  | VendorBasicInfoAddress
  | VendorBasicInfoCustom
  | VendorBasicInfoDirections
  | VendorBasicInfoExtraLink
  | VendorBasicInfoHours
  | VendorBasicInfoParking
  | VendorBasicInfoPhone
  | VendorBasicInfoPlain
  | VendorBasicInfoPrice;

/** `field` → 화면 라벨 (custom 제외) */
export const VENDOR_BASIC_INFO_LABEL: Record<Exclude<VendorBasicInfoField, 'custom'>, string> = {
  address: '주소',
  capacity: '인원',
  directions: '오는 길',
  extra_link: '추가정보',
  hours: '영업시간',
  parking: '주차정보',
  phone: '전화번호',
  price: '가격',
};

export function vendorBasicInfoRowLabel(row: VendorBasicInfoRow): string {
  if (row.field === 'custom') {
    return row.label;
  }
  return VENDOR_BASIC_INFO_LABEL[row.field];
}
