import React from 'react';
import { Link } from 'react-router-dom';
import { BookmarkIcon, StarIcon } from '../shared/Icons';

type HomeSpaceCardProps = {
  detailPath?: string;
  image: string;
  location: string;
  price: string;
  rating: string;
  studio: string;
  subtitle: string;
  title: string;
};

export function HomeSpaceCard(props: HomeSpaceCardProps) {
  const cardContent = (
    <>
      <div className="home-space-card__image-wrap">
        {props.image ? <img alt="" className="home-space-card__image" src={props.image} /> : <div className="home-space-card__image home-space-card__image--placeholder" />}
        <BookmarkIcon />
      </div>
      <div className="home-space-card__body">
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
            <span>/시간</span>
          </div>
          <p className="home-space-card__tags">주차가능 · 예약가능</p>
        </div>
        {props.subtitle ? (
          <p className="home-space-card__meta">
            {props.subtitle} {props.studio ? <><span className="home-space-card__dot" /> {props.studio}</> : null}
          </p>
        ) : null}
      </div>
    </>
  );

  if (props.detailPath) {
    return (
      <Link className="home-space-card home-space-card__link" to={props.detailPath}>
        {cardContent}
      </Link>
    );
  }

  return (
    <article className="home-space-card">
      {cardContent}
    </article>
  );
}
