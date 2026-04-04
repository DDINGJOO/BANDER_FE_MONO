/**
 * Figma 6426:24854 — 밴더 이용정책 모달 본문
 * `string` 한 줄 / `readonly string[]` 한 불릿 안 여러 줄
 */
export type BanderPolicyBullet = string | readonly string[];

export type BanderPolicySection = {
  bullets: readonly BanderPolicyBullet[];
  title: string;
};

export const BANDER_USAGE_POLICY_SECTIONS: readonly BanderPolicySection[] = [
  {
    title: '예약 및 결제',
    bullets: [
      '모든 공간은 사전 예약 후 이용 가능합니다.',
      '결제는 플랫폼 내에서만 진행되며, 현장 결제는 불가합니다.',
      '예약 확정 후 변경/취소는 각 공간의 정책에 따릅니다.',
      '중복 예약 또는 허위 예약 시 이용이 제한될 수 있습니다.',
    ],
  },
  {
    title: '입실 및 이용 규칙',
    bullets: [
      ['예약 시간에 맞춰 입실 및 퇴실해 주세요.', '(조기 입실/지연 퇴실 시 추가 요금 발생 가능)'],
      ['공간은 정해진 용도에 맞게 사용해야 하며, 무단 상업적 사용은', '금지됩니다.'],
      '모든 공간 내 흡연, 음주, 불법 행위는 절대 금지입니다.',
      ['고의 또는 과실로 인한 기물 파손/오염 시 손해 배상 책임이 발생할 수', '있습니다.'],
    ],
  },
  {
    title: '플랫폼 운영자 권한',
    bullets: [
      '밴더는 플랫폼 내 질서 유지를 위해 필요 시 사용자에게 경고, 이용 제한, 강제 탈퇴 등의 조치를 취할 수 있습니다.',
      ['공간에 대한 신고 또는 문제 발생 시 운영팀이 조사 및 중재에 나설 수', '있습니다.'],
    ],
  },
] as const;
