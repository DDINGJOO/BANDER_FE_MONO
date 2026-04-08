/**
 * UC-04 홈·발견 — GET /api/v1/home/feed
 * @see docs/BACKEND_API.md §3
 */

export type HomeHotPostDto = {
  id: string;
  category: string;
  title: string;
  author: string;
  likes: number;
  comments: number;
  thumbnailUrl: string | null;
  detailPath: string;
};

export type HomeRecommendedSpaceDto = {
  slug: string;
  title: string;
  subtitle: string;
  studio: string;
  location: string;
  price: string;
  rating: string;
  imageUrl: string;
  detailPath: string;
};

export type HomeReviewCardDto = {
  id: string;
  author: string;
  date: string;
  rating: string;
  text: string;
  spaceTitle: string;
  imageUrl: string | null;
};

export type HomeCategoryBubbleDto = {
  label: string;
  accentHex: string;
  searchQueryOrTag: string;
};

export type HomeVendorCardDto = {
  slug: string;
  name: string;
  description: string;
  location: string;
  roomCount: string;
  rating: string;
  imageUrl: string;
  detailPath: string;
};

export type HomeFeedResponseDto = {
  hotPosts: HomeHotPostDto[];
  recommendedSpaces: HomeRecommendedSpaceDto[];
  reviewCards: HomeReviewCardDto[];
  categoryBubbles: HomeCategoryBubbleDto[];
  vendorCards: HomeVendorCardDto[];
};
