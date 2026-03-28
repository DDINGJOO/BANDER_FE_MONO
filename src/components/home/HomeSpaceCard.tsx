import React from 'react';
import { BookmarkIcon, StarIcon } from '../shared/Icons';

type HomeSpaceCardProps = {
  image: string;
  location: string;
  price: string;
  rating: string;
  studio: string;
  subtitle: string;
  title: string;
};

export function HomeSpaceCard(props: HomeSpaceCardProps) {
  return (
    <article className="home-space-card">
      <div className="home-space-card__image-wrap">
        <img alt="" className="home-space-card__image" src={props.image} />
        <BookmarkIcon />
      </div>
      <div className="home-space-card__body">
        <p className="home-space-card__meta">
          {props.subtitle} <span className="home-space-card__dot" /> {props.studio}
        </p>
        <h3 className="home-space-card__title">{props.title}</h3>
        <div className="home-space-card__rating">
          <span className="home-meta__group">
            <StarIcon />
            <span className="home-space-card__rating-number">{props.rating}</span>
          </span>
          <span className="home-space-card__location">{props.location}</span>
        </div>
        <div className="home-space-card__bottom">
          <div className="home-space-card__price">
            <strong>{props.price}</strong>
            <span>/60분</span>
          </div>
          <p className="home-space-card__tags">주차가능 · 예약가능</p>
        </div>
      </div>
    </article>
  );
}
