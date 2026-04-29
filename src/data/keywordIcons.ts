/**
 * Keyword → Figma SVG icon mapping.
 *
 * Currently only the 6 `company_benefit` icons exist in the Figma file:
 *   coffee, internat, charging, monitor, drop, car
 *
 * Keywords without a Figma asset render as plain-text chips (no icon).
 * If new icons are added to Figma, sync them and extend FIGMA_MAP.
 */
import benefitCar from '../assets/icons/mobile/mobile-company-benefit-car.svg';
import benefitCharging from '../assets/icons/mobile/mobile-company-benefit-charging.svg';
import benefitCoffee from '../assets/icons/mobile/mobile-company-benefit-coffee.svg';
import benefitDrop from '../assets/icons/mobile/mobile-company-benefit-drop.svg';
import benefitInternet from '../assets/icons/mobile/mobile-company-benefit-internat.svg';
import benefitMonitor from '../assets/icons/mobile/mobile-company-benefit-monitor.svg';

const FIGMA_MAP: Record<string, string> = {
  '주차': benefitCar,
  '주차가능': benefitCar,
  '주차 가능': benefitCar,
  '고속충전기': benefitCharging,
  '충전기': benefitCharging,
  '커피': benefitCoffee,
  '카페': benefitCoffee,
  '정수기': benefitDrop,
  '인터넷': benefitInternet,
  '와이파이': benefitInternet,
  'Wi-Fi': benefitInternet,
  'WIFI': benefitInternet,
  '모니터': benefitMonitor,
};

export type KeywordIcon = { kind: 'svg'; src: string } | null;

function lookup<V>(map: Record<string, V>, label: string): V | null {
  if (map[label]) return map[label];
  for (const key of Object.keys(map)) {
    if (label.includes(key)) return map[key];
  }
  return null;
}

export function resolveKeywordIcon(label: string): KeywordIcon {
  const normalized = label.replace(/^#/, '').trim();
  if (!normalized) return null;
  const svg = lookup(FIGMA_MAP, normalized);
  if (svg) return { kind: 'svg', src: svg };
  return null;
}
