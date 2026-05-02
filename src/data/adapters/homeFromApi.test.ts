import { homeHotPostCardFromDto } from './homeFromApi';

const baseHotPost = {
  id: '11',
  author: '작성자',
  category: '자유',
  comments: 1,
  detailPath: '/community/post/11',
  likes: 3,
  thumbnailUrl: null,
  title: '이미지 없는 포스트',
};

test('keeps the hot post thumbnail empty when the API has no image', () => {
  expect(homeHotPostCardFromDto(baseHotPost).image).toBe('');
});

test('treats legacy picsum hot post thumbnails as missing images', () => {
  expect(
    homeHotPostCardFromDto({
      ...baseHotPost,
      thumbnailUrl: 'https://fastly.picsum.photos/id/28/640/420.jpg?hmac=legacy',
    }).image,
  ).toBe('');
});
