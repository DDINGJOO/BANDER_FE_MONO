import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CommentIcon, HeartIcon } from '../shared/Icons';

type HomePostCardProps = {
  author: string;
  category: string;
  comments: number;
  detailPath?: string;
  image: string;
  likes: number;
  title: string;
};

export function HomePostCard(props: HomePostCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (props.detailPath) {
      navigate(props.detailPath);
    }
  };

  return (
    <article
      className="home-post-card"
      onClick={handleClick}
      role={props.detailPath ? 'link' : undefined}
      style={props.detailPath ? { cursor: 'pointer' } : undefined}
    >
      <div className="home-post-card__content">
        <div className="home-post-card__text">
          <p className="home-post-card__category">{props.category}</p>
          <p className="home-post-card__title">{props.title}</p>
        </div>
        {props.image ? (
          <img alt="" className="home-post-card__thumb" src={props.image} />
        ) : (
          <div aria-hidden="true" className="home-post-card__thumb home-post-card__thumb--placeholder" />
        )}
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
