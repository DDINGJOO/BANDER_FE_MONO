import React from 'react';
import { BrandMark } from '../shared/BrandMark';

export function HomeFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer__inner">
        <div className="home-footer__brand-block">
          <BrandMark compact />
          <div className="home-footer__navline">
            <span>홈</span>
            <span>탐색</span>
            <span>합주실</span>
            <span>내정보</span>
          </div>
          <div className="home-footer__company">
            <p>주소 : 서울시 마포구 와우산로 15길 30</p>
            <p>(주)팀바인드</p>
            <p>대표자명 : 주자연</p>
            <p>사업자등록번호 : 113-23-79817</p>
          </div>
          <p className="home-footer__meta">COPYRIGHT(C) © 2025 Bander. All rights reserved.</p>
        </div>
        <div className="home-footer__support">
          <p className="home-footer__support-label">고객센터</p>
          <p className="home-footer__support-number">02-1234-5678</p>
          <p className="home-footer__support-time">AM 09:00 ~ PM 06:00 (일요일, 공휴일 휴무)</p>
        </div>
      </div>
    </footer>
  );
}
