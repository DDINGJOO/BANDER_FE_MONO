import React from 'react';
import { Link } from 'react-router-dom';

export function HomeFooter() {
  const logoSrc = `${process.env.PUBLIC_URL ?? ''}/logo-white.svg`;
  return (
    <footer className="home-footer">
      <div className="home-footer__inner">
        <div className="home-footer__brand-block">
          <Link aria-label="bander 메인으로 이동" className="home-footer__brand" to="/">
            <img alt="bander" className="home-footer__brand-image" src={logoSrc} />
          </Link>
          <div className="home-footer__company">
            <p>주소 : 인천시 연수구 인천타워대로 185번길 914호</p>
            <p>(주)팀바인드</p>
            <p>대표자명 : 주자연</p>
            <p>사업자등록번호 : 7348103472</p>
            <p>통신판매업 신고번호 : 제 2025-인천연수구-3178 호</p>
          </div>
          <p className="home-footer__meta">COPYRIGHT(C) © 2026 Bander. All rights reserved.</p>
        </div>
        <div className="home-footer__support">
          <p className="home-footer__support-label">고객센터</p>
          <p className="home-footer__support-number">
            <a href="mailto:support@teambind.co.kr">support@teambind.co.kr</a>
          </p>
          <p className="home-footer__support-time">연중무휴</p>
        </div>
      </div>
    </footer>
  );
}
