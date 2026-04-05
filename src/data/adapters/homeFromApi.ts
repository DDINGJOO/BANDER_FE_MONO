/**
 * GET /api/v1/home/feed → `src/data/home.ts` 목업과 동일 UI 모양
 */

import type {
  HomeCategoryBubbleDto,
  HomeFeedResponseDto,
  HomeHotPostDto,
  HomeRecommendedSpaceDto,
  HomeReviewCardDto,
} from '../schemas/homeFeed';

/** HOME_HOT_POSTS 행 */
export function homeHotPostCardFromDto(row: HomeHotPostDto) {
  return {
    author: row.author,
    category: row.category,
    comments: row.comments,
    image: row.thumbnailUrl ?? '',
    likes: row.likes,
    title: row.title,
    detailPath: row.detailPath,
  };
}

/** HOME_SPACE_CARDS 행 */
export function homeSpaceCardFromDto(row: HomeRecommendedSpaceDto) {
  return {
    detailPath: row.detailPath,
    image: row.imageUrl,
    location: row.location,
    price: row.price,
    rating: row.rating,
    studio: row.studio,
    subtitle: row.subtitle,
    title: row.title,
  };
}

/** HOME_REVIEW_CARDS 행 */
export function homeReviewCardFromDto(row: HomeReviewCardDto) {
  return {
    author: row.author,
    date: row.date,
    image: row.imageUrl ?? '',
    rating: row.rating,
    spaceName: row.spaceTitle,
    text: row.text,
  };
}

/** HOME_CATEGORY_BUBBLES 행 — 검색 쿼리는 별도로 라우팅 합의 */
export function homeCategoryBubbleFromDto(row: HomeCategoryBubbleDto) {
  return {
    accent: row.accentHex,
    label: row.label,
    searchQueryOrTag: row.searchQueryOrTag,
  };
}

export function normalizeHomeFeedForUi(dto: HomeFeedResponseDto) {
  return {
    hotPosts: dto.hotPosts.map(homeHotPostCardFromDto),
    recommendedSpaces: dto.recommendedSpaces.map(homeSpaceCardFromDto),
    reviewCards: dto.reviewCards.map(homeReviewCardFromDto),
    categoryBubbles: dto.categoryBubbles.map(homeCategoryBubbleFromDto),
  };
}
