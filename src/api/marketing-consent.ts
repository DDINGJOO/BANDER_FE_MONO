import { getJson, patchJson } from './client';

export interface MarketingConsentView {
  granted: boolean;
  nightGranted: boolean;
  grantedAt: string | null;
  withdrawnAt: string | null;
  nightConsentAt: string | null;
  nightWithdrawnAt: string | null;
  lastReconfirmedAt: string | null;
}

export interface MarketingConsentChange {
  granted?: boolean | null;
  nightGranted?: boolean | null;
}

export function getMarketingConsent(): Promise<MarketingConsentView> {
  return getJson<MarketingConsentView>('/api/v1/users/me/marketing-consent');
}

export function updateMarketingConsent(
  change: MarketingConsentChange,
): Promise<MarketingConsentView> {
  return patchJson<MarketingConsentView>('/api/v1/users/me/marketing-consent', change);
}
