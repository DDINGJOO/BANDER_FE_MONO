export const KOREA_REGIONS = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전북특별자치도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
] as const;

export type TermsKey = 'service' | 'privacy' | 'marketing' | 'location';

export const TERMS_ITEMS: Array<{
  href: string;
  key: TermsKey;
  kind: 'required' | 'optional';
  label: string;
}> = [
  {
    href: 'https://bander-co-kr.notion.site/BANDER-2025-12-08-2c17b25b471a806faf7df1d45351977d?pvs=74',
    key: 'service',
    kind: 'required',
    label: '서비스 이용약관 동의',
  },
  {
    href: 'https://bander-co-kr.notion.site/2025-12-08-2c17b25b471a8072bc14ce45cade65f1?pvs=74',
    key: 'privacy',
    kind: 'required',
    label: '개인정보 제3자 정보 제공 동의',
  },
  {
    href: 'https://bander-co-kr.notion.site/2025-12-08-2c17b25b471a8069ba13dd9732d107e7?pvs=74',
    key: 'marketing',
    kind: 'optional',
    label: '마케팅 정보 수신동의',
  },
  {
    href: 'https://bander-co-kr.notion.site/2025-12-08-2c17b25b471a8096b3c2e4a952c6aa1b?pvs=74',
    key: 'location',
    kind: 'optional',
    label: '위치기반 서비스 이용약관 동의',
  },
];
