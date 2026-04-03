import React from 'react';

export type HomeReviewCardProps = {
  author: string;
  date: string;
  image: string;
  rating: string;
  spaceName: string;
  text: string;
};

export function HomeReviewCard({ author, date, image, rating, spaceName, text }: HomeReviewCardProps) {
  return (
    <article className="home-review-card">
      <div className="home-review-card__top">
        <div className="home-review-card__stars" aria-hidden="true">
          ★★★★★
        </div>
        <span className="home-review-card__date">{date}</span>
      </div>
      <p className="home-review-card__score">{rating}</p>
      <p className="home-review-card__text">{text}</p>
      <div className="home-review-card__foot">
        <img alt="" className="home-review-card__space-thumb" src={image} />
        <div className="home-review-card__space-meta">
          <p className="home-review-card__space-name">{spaceName}</p>
          <p className="home-review-card__author">@{author}</p>
        </div>
      </div>
    </article>
  );
}
