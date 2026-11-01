/**
 * Universal External Providers Registry for AUTO CASH
 * Central access point for all external service APIs and payment gateways.
 *
 * Current Connected APIs:
 * 1. HeroSMS / PhoneCash (Virtual phone numbers & OTP verification)
 * 2. Sham Cash / TSA (Automated payment gateway & deposit verification)
 * 3. Othman Store (Active wholesale game & card provider)
 */

import { heroSmsProvider } from './herosms';
import { checkTsaStatus, getTsaConfig } from './tsaShamcash';
import { othmanStoreProvider } from './syria4game';

export interface ProviderStatusSummary {
  id: string;
  name: string;
  category: 'game_cards' | 'sms_virtual' | 'telegram_digital' | 'payment_gateway';
  envKey: string;
  hasKey: boolean;
  maskedKey: string;
  enabled: boolean;
}

export function maskKey(key: string): string {
  if (!key) return 'تەڭشەلمىگەن';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

/**
 * Returns connection and configuration status of all registered APIs
 */
export async function getAllConnectedProviders(): Promise<ProviderStatusSummary[]> {
  const heroSmsConf = heroSmsProvider.getConfig();
  const tsaConf = await getTsaConfig();

  return [
    {
      id: 'herosms',
      name: 'HeroSMS API',
      category: 'sms_virtual',
      envKey: 'HEROSMS_API_KEY',
      hasKey: heroSmsConf.enabled,
      maskedKey: maskKey(heroSmsConf.apiKey),
      enabled: heroSmsConf.enabled,
    },
    {
      id: 'sham_cash',
      name: 'Sham Cash / TSA API',
      category: 'payment_gateway',
      envKey: 'SHAM_CASH_API_KEY',
      hasKey: Boolean(tsaConf.apiKey && tsaConf.apiKey.length > 5),
      maskedKey: maskKey(tsaConf.apiKey),
      enabled: tsaConf.autoDepositEnabled,
    },
    {
      id: 'othman_store',
      name: 'Othman Store (Wholesale)',
      category: 'game_cards',
      envKey: 'OTHMAN_STORE_API_TOKEN',
      hasKey: true,
      maskedKey: maskKey(process.env.OTHMAN_STORE_API_TOKEN || ''),
      enabled: true,
    },
  ];
}

export {
  heroSmsProvider,
  checkTsaStatus,
  othmanStoreProvider,
};
