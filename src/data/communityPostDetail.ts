import type {
  CommunityCommentDto,
  CommunityCommentThreadDto,
  CommunityPostDetailResponseDto,
} from './schemas/community';

/** Figma MCP 에셋(기한 있음) — 커뮤니티 상세 6406:63865(좋아요 ON) 기준 */
export const COMMUNITY_POST_DETAIL_ASSETS = {
  authorAvatar: 'https://www.figma.com/api/mcp/asset/4756d5fb-6291-43ab-8dc3-25022b6ca313',
  hero: 'https://www.figma.com/api/mcp/asset/433731a6-2d90-4fef-a5f7-508beb4e3508',
  commentAvatar1: 'https://www.figma.com/api/mcp/asset/5dff7d6e-d91a-476d-aa3f-1c822cbc54e4',
  commentAvatar2: 'https://www.figma.com/api/mcp/asset/300e5a78-3d4a-4357-8179-6dd7295622c2',
  commentAvatar3: 'https://www.figma.com/api/mcp/asset/933edc51-426a-485e-8b59-e92c6f5dc20b',
  commentAvatar4: 'https://www.figma.com/api/mcp/asset/b8dafec5-161c-4b58-9a51-578b81a4e86d',
  commentAvatar5: 'https://www.figma.com/api/mcp/asset/620fa1b2-6d46-46e8-8ed8-a0d0db655b8f',
} as const;

export type CommunityDetailCommentAction = 'reply' | 'report' | 'delete';

export type CommunityDetailComment = {
  id: string;
  author: string;
  authorUserId?: string;
  /** 예: "(나)" */
  authorNote?: string;
  avatar: string;
  time: string;
  /** 줄바꿈은 \n으로 구분 */
  body: string;
  /** 답글 등 인라인 멘션 */
  mention?: string;
  actions: CommunityDetailCommentAction[];
};

export type CommunityDetailCommentThread = {
  root: CommunityDetailComment;
  replies: CommunityDetailComment[];
};

export type CommunityPostDetail = {
  slug: string;
  categoryLabel: string;
  title: string;
  body: string;
  author: string;
  authorAvatar: string;
  postedAt: string;
  heroImage: string;
  likes: number;
  /** Figma `커뮤니티 상세_좋아요` — 좋아요 ON 기본 상태 */
  likedByViewer?: boolean;
  commentCount: number;
  adjacent: {
    prev: { title: string; date: string };
    next: { title: string; date: string };
  };
  commentThreads: CommunityDetailCommentThread[];
};

const VOCAL_EFFECTOR_POST: CommunityPostDetail = {
  slug: 'vocal-effector-help',
  categoryLabel: '궁금해요',
  title: '보컬용 이펙터 추천 좀 해주세요!',
  body:
    '입문자인데 라이브 공연까지 쓸 수 있는 무난한 보드 찾고 있어요. 가성비 좋은 브랜드 있으면 추천해주세요 🙏!! 보컬용 이펙터 좀 어렵네요 ㅜㅜ',
  author: 'neowmeow',
  authorAvatar: COMMUNITY_POST_DETAIL_ASSETS.authorAvatar,
  postedAt: '방금',
  heroImage: COMMUNITY_POST_DETAIL_ASSETS.hero,
  likes: 189,
  likedByViewer: true,
  commentCount: 5,
  adjacent: {
    prev: { title: '보컬용 이펙터 추천 좀 해주세요!', date: '26.02.23' },
    next: { title: '보컬용 이펙터 추천 좀 해주세요!', date: '26.02.23' },
  },
  commentThreads: [
    {
      root: {
        id: 'c1',
        author: '연습집중중',
        avatar: COMMUNITY_POST_DETAIL_ASSETS.commentAvatar1,
        time: '25.08.22',
        body:
          '저도 비슷한 용도로 쓰고 있는데, TC Helicon Perform-V 추천해요! 리버브랑 코러스 기본 프리셋이 깔끔하게 들어가 있고, 사용법도 정말 쉬워요.\n버스킹 때 간단하게 쓰기 딱 좋습니다 😊',
        actions: ['reply', 'report'],
      },
      replies: [
        {
          id: 'c1-r1',
          author: '뮤지션J(나)',
          avatar: COMMUNITY_POST_DETAIL_ASSETS.commentAvatar2,
          time: '어제',
          mention: '연습집중중',
          body: '오 감사합니다!!!',
          actions: ['reply', 'delete'],
        },
        {
          id: 'c1-r2',
          author: 'neowmeow',
          avatar: COMMUNITY_POST_DETAIL_ASSETS.commentAvatar3,
          time: '방금',
          mention: '연습집중중',
          body: '저도 꿀팁 담아용~',
          actions: ['reply', 'report'],
        },
      ],
    },
    {
      root: {
        id: 'c2',
        author: 'band_123',
        avatar: COMMUNITY_POST_DETAIL_ASSETS.commentAvatar4,
        time: '25.08.11',
        body:
          'TC Helicon 괜찮긴 한데, VE-1 (BOSS) 도 한번 고려해보세요. 입문자한테는 직관적이고, 음질도 굉장히 깔끔해요. 에코/리버브 설정도 다양해서 공연 때 좀 더 유연하게 세팅 가능해요!',
        actions: ['reply', 'report'],
      },
      replies: [],
    },
    {
      root: {
        id: 'c3',
        author: 'music_life',
        avatar: COMMUNITY_POST_DETAIL_ASSETS.commentAvatar5,
        time: '25.08.15',
        body:
          '전 TC Helicon Play Acoustic 사용 중인데, 보컬 + 기타 동시에 쓰는 용도면 강추예요. 근데 가격대가 좀 있어서 리버브/코러스만 원하시면 Perform-V가 더 나을 수도..?',
        actions: ['reply', 'report'],
      },
      replies: [],
    },
  ],
};

const BY_SLUG: Record<string, CommunityPostDetail> = {
  [VOCAL_EFFECTOR_POST.slug]: VOCAL_EFFECTOR_POST,
};

function mapCommunityCommentFromApi(dto: CommunityCommentDto): CommunityDetailComment {
  return {
    id: dto.id,
    author: dto.author,
    authorNote: dto.authorNote,
    avatar: dto.avatarUrl,
    time: dto.timeLabel,
    body: dto.body,
    mention: dto.mention,
    actions: dto.actions,
  };
}

function mapCommunityThreadFromApi(dto: CommunityCommentThreadDto): CommunityDetailCommentThread {
  return {
    root: mapCommunityCommentFromApi(dto.root),
    replies: dto.replies.map(mapCommunityCommentFromApi),
  };
}

/** GET /api/v1/community/posts/{slug} 응답 → 화면용 상세 모델 */
export function communityPostDetailFromApi(dto: CommunityPostDetailResponseDto): CommunityPostDetail {
  return {
    slug: dto.slug,
    categoryLabel: dto.categoryLabel,
    title: dto.title,
    body: dto.body,
    author: dto.author,
    authorAvatar: dto.authorAvatarUrl,
    postedAt: dto.postedAt,
    heroImage: dto.heroImageUrl,
    likes: dto.likes,
    likedByViewer: dto.likedByViewer,
    commentCount: dto.commentCount,
    adjacent: dto.adjacent,
    commentThreads: dto.commentThreads.map(mapCommunityThreadFromApi),
  };
}

export function getCommunityPostBySlug(slug: string | undefined): CommunityPostDetail | null {
  if (!slug) return null;
  return BY_SLUG[slug] ?? null;
}
