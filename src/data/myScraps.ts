/**
 * Figma 6054:3805 (저장 탭) / 6406:76230 (최근 본 탭) — 내 스크랩
 * 서버 연동 시 대체 대상:
 *   - 저장:   GET /api/v1/users/me/scraps
 *   - 최근 본: GET /api/v1/users/me/recent-views
 */

export type MyScrapCard = {
  id: string;
  detailPath: string;
  imageUrl: string;
  bookmarkSaved: boolean;
  spaceType: string;
  studio: string;
  title: string;
  rating: string;
  location: string;
  priceLabel: string;
  priceSuffix: string;
  tags: [string, string];
};

const THUMB = {
  moon: 'https://www.figma.com/api/mcp/asset/aa910e8b-35a9-4295-9f5e-7c97b2bc514f',
  soundShell: 'https://www.figma.com/api/mcp/asset/7ad596f4-4c0a-4a2e-aaf6-c2cd80f6bb3a',
  harmony: 'https://www.figma.com/api/mcp/asset/6bd447b2-a525-424d-8bcf-d86cee55284e',
  soundBase: 'https://www.figma.com/api/mcp/asset/c1c89983-892a-473c-893f-8018ed149c33',
  drum: 'https://www.figma.com/api/mcp/asset/6878b07b-b7d0-4817-be61-af5342b90354',
  allegro: 'https://www.figma.com/api/mcp/asset/6878b33c-3f0e-4cd2-b6b3-8812bdcc974f',
  dogSound: 'https://www.figma.com/api/mcp/asset/39b92eb5-dfff-4099-ae41-1b805450bf9e',
  theSounds: 'https://www.figma.com/api/mcp/asset/faf24acb-5b97-4dc9-b496-b8cfd2bf7e18',
  groove: 'https://www.figma.com/api/mcp/asset/e67d2886-a49d-4cbf-8cce-8625f14a725f',
  guild: 'https://www.figma.com/api/mcp/asset/aa910e8b-35a9-4295-9f5e-7c97b2bc514f',
  biju: 'https://www.figma.com/api/mcp/asset/7ad596f4-4c0a-4a2e-aaf6-c2cd80f6bb3a',
} as const;

function card(row: Omit<MyScrapCard, 'tags' | 'priceSuffix'> & { tags?: [string, string]; priceSuffix?: string }): MyScrapCard {
  return {
    tags: row.tags ?? ['주차가능', '예약가능'],
    priceSuffix: row.priceSuffix ?? '/60분',
    ...row,
  };
}

export const MY_SCRAP_SAVED: MyScrapCard[] = [
  card({
    id: 'mscrap-saved-1',
    detailPath: '/spaces/moon-ensemble-room',
    imageUrl: THUMB.moon,
    bookmarkSaved: true,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: 'Moon 합주실 룸',
    rating: '4.9',
    location: '서울 마포구 동교동',
    priceLabel: '15,000원',
  }),
  card({
    id: 'mscrap-saved-2',
    detailPath: '/spaces/sound-shell-ensemble-a',
    imageUrl: THUMB.soundShell,
    bookmarkSaved: true,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: 'Sound Shell 합주실 A',
    rating: '4.5',
    location: '서울 마포구 서교동',
    priceLabel: '13,000원',
  }),
  card({
    id: 'mscrap-saved-3',
    detailPath: '/spaces/harmony-ensemble-a',
    imageUrl: THUMB.harmony,
    bookmarkSaved: true,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: 'Harmony 합주실 A룸',
    rating: '4.5',
    location: '서울 마포구 신수동',
    priceLabel: '18,000원',
  }),
  card({
    id: 'mscrap-saved-4',
    detailPath: '/spaces/sound-base',
    imageUrl: THUMB.soundBase,
    bookmarkSaved: true,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: 'Sound Base',
    rating: '4.4',
    location: '서울 마포구 연남동',
    priceLabel: '14,000원',
  }),
  card({
    id: 'mscrap-saved-5',
    detailPath: '/spaces/drum-studio-b',
    imageUrl: THUMB.drum,
    bookmarkSaved: true,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: '드럼스튜디오 B룸',
    rating: '4.8',
    location: '서울 마포구 연남동',
    priceLabel: '10,000원',
  }),
  card({
    id: 'mscrap-saved-6',
    detailPath: '/spaces/allegro-ensemble',
    imageUrl: THUMB.allegro,
    bookmarkSaved: true,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: 'Allegro 합주실',
    rating: '4.5',
    location: '서울 마포구 망원동',
    priceLabel: '12,000원',
  }),
];

export const MY_SCRAP_RECENT: MyScrapCard[] = [
  card({
    id: 'mscrap-recent-1',
    detailPath: '/spaces/allegro-ensemble',
    imageUrl: THUMB.allegro,
    bookmarkSaved: false,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: 'Allegro 합주실',
    rating: '4.5',
    location: '서울 마포구 망원동',
    priceLabel: '12,000원',
  }),
  card({
    id: 'mscrap-recent-2',
    detailPath: '/spaces/sound-base',
    imageUrl: THUMB.soundBase,
    bookmarkSaved: false,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: 'Sound Base',
    rating: '4.4',
    location: '서울 마포구 연남동',
    priceLabel: '14,000원',
  }),
  card({
    id: 'mscrap-recent-3',
    detailPath: '/spaces/dog-sound-studio',
    imageUrl: THUMB.dogSound,
    bookmarkSaved: false,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: 'Dog Sound Studio',
    rating: '4.5',
    location: '서울 마포구 망원동',
    priceLabel: '12,000원',
  }),
  card({
    id: 'mscrap-recent-4',
    detailPath: '/spaces/moon-ensemble-room',
    imageUrl: THUMB.moon,
    bookmarkSaved: true,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: 'Moon 합주실 룸',
    rating: '4.9',
    location: '서울 마포구 동교동',
    priceLabel: '15,000원',
  }),
  card({
    id: 'mscrap-recent-5',
    detailPath: '/spaces/the-sounds-studio',
    imageUrl: THUMB.theSounds,
    bookmarkSaved: false,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: '더사운즈스튜디오',
    rating: '4.5',
    location: '서울 마포구 망원동',
    priceLabel: '12,000원',
  }),
  card({
    id: 'mscrap-recent-6',
    detailPath: '/spaces/groove',
    imageUrl: THUMB.groove,
    bookmarkSaved: false,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: 'GROOVE',
    rating: '4.5',
    location: '서울 마포구 서교동',
    priceLabel: '13,000원',
  }),
  card({
    id: 'mscrap-recent-7',
    detailPath: '/spaces/allegro-ensemble-2',
    imageUrl: THUMB.allegro,
    bookmarkSaved: false,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: 'Allegro 합주실',
    rating: '4.5',
    location: '서울 마포구 망원동',
    priceLabel: '12,000원',
  }),
  card({
    id: 'mscrap-recent-8',
    detailPath: '/spaces/drum-studio-b',
    imageUrl: THUMB.drum,
    bookmarkSaved: true,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: '드럼스튜디오 B룸',
    rating: '4.8',
    location: '서울 마포구 연남동',
    priceLabel: '10,000원',
  }),
  card({
    id: 'mscrap-recent-9',
    detailPath: '/spaces/guild-ensemble',
    imageUrl: THUMB.guild,
    bookmarkSaved: false,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: '길드 합주실',
    rating: '4.5',
    location: '서울 마포구 신수동',
    priceLabel: '18,000원',
  }),
  card({
    id: 'mscrap-recent-10',
    detailPath: '/spaces/biju-ensemble-3',
    imageUrl: THUMB.biju,
    bookmarkSaved: false,
    spaceType: '합주실',
    studio: '유스뮤직',
    title: '비쥬합주실 3호점',
    rating: '4.5',
    location: '서울 마포구 망원동',
    priceLabel: '12,000원',
  }),
];
