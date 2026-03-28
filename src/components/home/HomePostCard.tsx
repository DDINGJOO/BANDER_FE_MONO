import React from 'react';
import { CommentIcon, HeartIcon } from '../shared/Icons';

type HomePostCardProps = {
  author: string;
  category: string;
  comments: number;
  image: string;
  likes: number;
  title: string;
};

export function HomePostCard(props: HomePostCardProps) {
  return (
    <article className="home-post-card">
      <div className="home-post-card__content">
        <div className="home-post-card__text">
          <p className="home-post-card__category">{props.category}</p>
          <p className="home-post-card__title">{props.title}</p>
        </div>
        <img alt="" className="home-post-card__thumb" src={props.image} />
      </div>
      <div className="home-post-card__footer">
        <span className="home-post-card__author">{props.author}</span>
        <div className="home-meta">
          <span className="home-meta__group">
            <HeartIcon />
            <span>{props.likes}</span>
          </span>
          <span className="home-meta__group">
            <CommentIcon />
            <span>{props.comments}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
