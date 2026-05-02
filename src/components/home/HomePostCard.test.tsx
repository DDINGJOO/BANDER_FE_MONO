import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePostCard } from './HomePostCard';

jest.mock('../shared/Icons', () => ({
  CommentIcon: () => <span data-testid="comment-icon" />,
  HeartIcon: () => <span data-testid="heart-icon" />,
}));

function renderCard(image: string) {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <HomePostCard
        author="작성자"
        category="자유"
        comments={1}
        image={image}
        likes={3}
        title="이미지 없는 포스트"
      />
    </MemoryRouter>,
  );
}

test('renders a fixed-size placeholder when a hot post has no thumbnail', () => {
  const { container } = renderCard('');

  expect(container.querySelector('img.home-post-card__thumb')).not.toBeInTheDocument();
  expect(container.querySelector('.home-post-card__thumb--placeholder')).toBeInTheDocument();
});

test('renders a thumbnail image when a hot post has an image', () => {
  const { container } = renderCard('https://cdn.example.com/thumb.jpg');

  expect(container.querySelector('img.home-post-card__thumb')).toHaveAttribute(
    'src',
    'https://cdn.example.com/thumb.jpg',
  );
  expect(container.querySelector('.home-post-card__thumb--placeholder')).not.toBeInTheDocument();
});
