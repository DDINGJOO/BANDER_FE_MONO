import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';

type Step = {
  id: number;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    id: 1,
    title: '업체 정보를 알려주세요.',
    description: '사업자 유형, 업체명, 대표자명, 전화번호, 업체 주소 및 기타 정보가 필요해요.',
  },
  {
    id: 2,
    title: '사업자 정보를 알려주세요.',
    description:
      '사업자 등록번호 및 정산용 계좌 정보가 필요해요.\n(은행명, 예금주, 계좌번호)',
  },
  {
    id: 3,
    title: '신청서 제출 후 관리자 검토 및 승인처리돼요.',
    description:
      '검토 후 승인 시 업체용 기능이 활성화됩니다. 승인 결과는 이메일/SMS/앱 푸시로 안내드립니다.\n(7 영업일 이내에 최대한 빨리 전달드릴게요!)',
  },
];

export function BusinessApplyPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

  const filteredSuggestions = useMemo(
    () =>
      HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
        item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
      ),
    [headerSearchQuery],
  );

  const onHeaderSearchSubmit = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      navigate(`/search?q=${encodeURIComponent(q)}`);
    },
    [navigate],
  );

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!headerSearchRef.current?.contains(event.target as Node)) {
        setHeaderSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <main className="business-apply-page">
      <HomeHeader
        authenticated={isAuthenticated}
        filteredSuggestions={filteredSuggestions}
        onGuestCta={() => navigate('/login')}
        onSearchChange={(value) => {
          setHeaderSearchQuery(value);
          setHeaderSearchOpen(Boolean(value.trim()));
        }}
        onSearchClear={() => {
          setHeaderSearchQuery('');
          setHeaderSearchOpen(false);
        }}
        onSearchFocus={() => setHeaderSearchOpen(Boolean(headerSearchQuery.trim()))}
        onSearchSubmit={onHeaderSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          onHeaderSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <section className="business-apply">
        <div className="business-apply__inner">
          <span className="business-apply__kicker">Business</span>
          <h1 className="business-apply__title">
            비즈니스 신청은 아래의 절차와
            <br />
            준비 서류를 통해 진행됩니다.
          </h1>
          <p className="business-apply__subtitle">
            당신의 공간, 밴더와 함께하고 수익 창출을 누려보세요.
          </p>

          <ol className="business-apply__steps">
            {STEPS.map((step) => (
              <li className="business-apply__step" key={step.id}>
                <div className="business-apply__step-head">
                  <span className="business-apply__step-number">{step.id}</span>
                  <span className="business-apply__step-title">{step.title}</span>
                </div>
                <p className="business-apply__step-description">{step.description}</p>
              </li>
            ))}
          </ol>

          <button
            className="business-apply__cta"
            onClick={() => {
              // TODO: 실제 비즈니스 신청 플로우로 이동. 현재는 외부 절차로 이메일 접수.
              window.location.href = 'mailto:business@bander.co.kr?subject=%EB%B0%B4%EB%8D%94%20%EB%B9%84%EC%A6%88%EB%8B%88%EC%8A%A4%20%EC%8B%A0%EC%B2%AD';
            }}
            type="button"
          >
            비즈니스 신청하러 가기
          </button>
        </div>
      </section>

      <HomeFooter />
    </main>
  );
}
