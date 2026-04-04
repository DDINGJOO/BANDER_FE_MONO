import type { SpaceSummaryFeatureKey } from '../../types/space';

const svgProps = {
  'aria-hidden': true as const,
  fill: 'none',
  height: 20,
  viewBox: '0 0 20 20',
  width: 20,
  xmlns: 'http://www.w3.org/2000/svg',
};

/**
 * 룸 상세 요약 칩용 라인 아이콘.
 */
export function SpaceSummaryFeatureIcon({ featureKey }: { featureKey: SpaceSummaryFeatureKey }) {
  switch (featureKey) {
    case 'parking':
      return (
        <svg {...svgProps}>
          <path
            d="M4.5 13.25h11l-1.1-4.5H5.6l-1.1 4.5z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.35"
          />
          <path d="M5 10.25h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
          <circle cx="7.25" cy="13.5" fill="currentColor" r="1.05" />
          <circle cx="12.75" cy="13.5" fill="currentColor" r="1.05" />
        </svg>
      );
    case 'booking':
      return (
        <svg {...svgProps}>
          <rect height="13" rx="1.8" stroke="currentColor" strokeWidth="1.35" width="14" x="3" y="4.5" />
          <path d="M3 8.25h14" stroke="currentColor" strokeWidth="1.35" />
          <path d="M7 2.75v3M13 2.75v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.35" />
        </svg>
      );
    case 'hvac':
      return (
        <svg {...svgProps}>
          <path
            d="M10 3.25v13.5M6.75 5.5a3.25 3.25 0 0 0 0 4.6M13.25 5.5a3.25 3.25 0 0 1 0 4.6M6.75 14.5a3.25 3.25 0 0 1 0-4.6M13.25 14.5a3.25 3.25 0 0 0 0-4.6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.25"
          />
        </svg>
      );
    case 'wifi':
      return (
        <svg {...svgProps}>
          <path
            d="M4.2 8.35a7.8 7.8 0 0 1 11.6 0M6.35 10.5a4.9 4.9 0 0 1 7.3 0M8.5 12.65a2 2 0 0 1 3 0"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.35"
          />
          <circle cx="10" cy="15.25" fill="currentColor" r="1.15" />
        </svg>
      );
  }
}
