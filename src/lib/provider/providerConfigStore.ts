import fs from 'fs';
import path from 'path';

export interface StoredProviderConfig {
  activeProvider?: 'othman' | 'sahl';
  providerApiUrl: string;
  providerApiKey: string;
  providerApiType: 'syria4game' | 'smm' | 'custom_rest';
  providerApiSecret?: string;
  providerEnabled: boolean;
  othmanApiUrl?: string;
  othmanApiKey?: string;
  othmanApiType?: 'syria4game' | 'smm' | 'custom_rest';
  othmanApiSecret?: string;
  othmanEnabled?: boolean;
  smsProviderType?: 'sms_activate' | '5sim' | 'custom_rest';
  smsApiUrl?: string;
  smsApiKey?: string;
  smsEnabled?: boolean;
}

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const BUNDLED_DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'provider_config.json');
const BUNDLED_CONFIG_FILE = path.join(BUNDLED_DATA_DIR, 'provider_config.json');
const ENV_LOCAL_FILE = path.join(process.cwd(), '.env.local');

// Default fallback URL and token
const DEFAULT_URL = (process.env.SAHL_CASH_BASE_URL || process.env.SYRIA4GAME_BASE_URL || 'https://api.sahl-cash.com').trim();
const DEFAULT_TOKEN = (process.env.SAHL_CASH_API_TOKEN || process.env.SAHL_CASH_API_KEY || process.env.SYRIA4GAME_API_TOKEN || process.env.SYRIA4GAME_API_KEY || '').trim();

let memoryCachedConfig: StoredProviderConfig | null = null;

function normalizeUrl(url: string): string {
  let clean = (url || '').trim().replace(/\/+$/, '');
  if (!clean) return 'https://api.sahl-cash.com';
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  if (/^https?:\/\/sahl-cash\.com/i.test(clean)) {
    clean = clean.replace(/^https?:\/\/sahl-cash\.com/i, 'https://api.sahl-cash.com');
  }
  return clean;
}

/**
 * Loads persistent provider configuration.
 * Order of priority:
 * 1. data/provider_config.json
 * 2. process.env (SYRIA4GAME_BASE_URL / SYRIA4GAME_API_TOKEN)
 * 3. Default sahl-cash settings
 */
export function loadStoredProviderConfig(): StoredProviderConfig {
  if (memoryCachedConfig) {
    return { ...memoryCachedConfig };
  }

  try {
    const fileToRead = fs.existsSync(CONFIG_FILE)
      ? CONFIG_FILE
      : fs.existsSync(BUNDLED_CONFIG_FILE)
      ? BUNDLED_CONFIG_FILE
      : null;
    if (fileToRead) {
      const raw = fs.readFileSync(fileToRead, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const token = (parsed.providerApiKey || DEFAULT_TOKEN || '').trim();
        let url = normalizeUrl(parsed.providerApiUrl || DEFAULT_URL);

        // If the URL was left as the legacy syria4game.com, but the token or env is for sahl-cash, correct it
        if (url === 'https://syria4game.com' && (DEFAULT_URL.includes('sahl-cash') || token.length >= 40)) {
          url = 'https://api.sahl-cash.com';
        }

        const defaultOthmanToken = (process.env.OTHMAN_STORE_API_TOKEN || '').trim();
        const othmanToken = (parsed.othmanApiKey !== undefined ? parsed.othmanApiKey : defaultOthmanToken).trim();
        const othmanUrl = (parsed.othmanApiUrl || process.env.OTHMAN_STORE_BASE_URL || 'https://api.othman-storee.com').trim();

        const activeProvider: 'othman' | 'sahl' =
          parsed.activeProvider === 'sahl' ? 'sahl' : 'othman';

        memoryCachedConfig = {
          activeProvider,
          providerApiUrl: url,
          providerApiKey: token,
          providerApiType: parsed.providerApiType || 'syria4game',
          providerApiSecret: parsed.providerApiSecret || '',
          providerEnabled: parsed.providerEnabled === true,
          othmanApiUrl: othmanUrl,
          othmanApiKey: othmanToken,
          othmanApiType: parsed.othmanApiType || 'syria4game',
          othmanApiSecret: parsed.othmanApiSecret || '',
          othmanEnabled: parsed.othmanEnabled !== false,
          smsProviderType: parsed.smsProviderType || (process.env.SMS_PROVIDER_TYPE as any) || 'sms_activate',
          smsApiUrl: (parsed.smsApiUrl || process.env.SMS_API_URL || process.env.SMS_PROVIDER_URL || 'https://api.sms-activate.org/stubs/handler_api.php').trim(),
          smsApiKey: (parsed.smsApiKey !== undefined ? parsed.smsApiKey : (process.env.SMS_API_KEY || process.env.SMS_PROVIDER_API_KEY || '')).trim(),
          smsEnabled: parsed.smsEnabled !== undefined ? Boolean(parsed.smsEnabled) : Boolean(process.env.SMS_API_KEY || process.env.SMS_PROVIDER_API_KEY),
        };
        return { ...memoryCachedConfig };
      }
    }
  } catch (err) {
    console.error('Error reading provider_config.json:', err);
  }

  // Fallback to environment variables
  const initialConfig: StoredProviderConfig = {
    activeProvider: 'othman',
    providerApiUrl: normalizeUrl(DEFAULT_URL),
    providerApiKey: DEFAULT_TOKEN,
    providerApiType: 'syria4game',
    providerApiSecret: '',
    providerEnabled: false,
    othmanApiUrl: (process.env.OTHMAN_STORE_BASE_URL || 'https://api.othman-storee.com').trim(),
    othmanApiKey: (process.env.OTHMAN_STORE_API_TOKEN || '').trim(),
    othmanApiType: 'syria4game',
    othmanApiSecret: '',
    othmanEnabled: true,
    smsProviderType: (process.env.SMS_PROVIDER_TYPE as any) || 'sms_activate',
    smsApiUrl: (process.env.SMS_API_URL || process.env.SMS_PROVIDER_URL || 'https://api.sms-activate.org/stubs/handler_api.php').trim(),
    smsApiKey: (process.env.SMS_API_KEY || process.env.SMS_PROVIDER_API_KEY || '').trim(),
    smsEnabled: Boolean(process.env.SMS_API_KEY || process.env.SMS_PROVIDER_API_KEY),
  };

  // Persist the default file immediately so it doesn't get lost
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(initialConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error initializing provider_config.json:', err);
  }

  memoryCachedConfig = initialConfig;
  return { ...initialConfig };
}

/**
 * Persistently saves provider configuration.
 * Saves to:
 * 1. data/provider_config.json
 * 2. in-memory cache
 * 3. process.env
 * 4. .env.local (if file exists)
 */
export function saveStoredProviderConfig(updates: Partial<StoredProviderConfig>): StoredProviderConfig {
  const current = loadStoredProviderConfig();

  const nextUrl = updates.providerApiUrl !== undefined
    ? normalizeUrl(updates.providerApiUrl)
    : current.providerApiUrl;

  const nextToken = updates.providerApiKey !== undefined
    ? updates.providerApiKey.trim()
    : current.providerApiKey;

  const nextType = updates.providerApiType !== undefined
    ? updates.providerApiType
    : current.providerApiType;

  const nextSecret = updates.providerApiSecret !== undefined
    ? updates.providerApiSecret.trim()
    : current.providerApiSecret;

  const nextEnabled = updates.providerEnabled !== undefined
    ? Boolean(updates.providerEnabled)
    : current.providerEnabled;

  const nextOthmanUrl = updates.othmanApiUrl !== undefined
    ? normalizeUrl(updates.othmanApiUrl)
    : (current.othmanApiUrl || 'https://api.othman-storee.com');

  const nextOthmanToken = updates.othmanApiKey !== undefined
    ? updates.othmanApiKey.trim()
    : (current.othmanApiKey || '');

  const nextOthmanType = updates.othmanApiType !== undefined
    ? updates.othmanApiType
    : (current.othmanApiType || 'syria4game');

  const nextOthmanSecret = updates.othmanApiSecret !== undefined
    ? updates.othmanApiSecret.trim()
    : (current.othmanApiSecret || '');

  const nextOthmanEnabled = updates.othmanEnabled !== undefined
    ? Boolean(updates.othmanEnabled)
    : (current.othmanEnabled !== false);

  const nextActive = updates.activeProvider !== undefined
    ? updates.activeProvider
    : (current.activeProvider || 'othman');

  const nextSmsType = updates.smsProviderType !== undefined ? updates.smsProviderType : (current.smsProviderType || 'sms_activate');
  const nextSmsUrl = updates.smsApiUrl !== undefined ? updates.smsApiUrl.trim() : (current.smsApiUrl || 'https://api.sms-activate.org/stubs/handler_api.php');
  const nextSmsKey = updates.smsApiKey !== undefined ? updates.smsApiKey.trim() : (current.smsApiKey || '');
  const nextSmsEnabled = updates.smsEnabled !== undefined ? Boolean(updates.smsEnabled) : (current.smsEnabled !== false);

  const newConfig: StoredProviderConfig = {
    activeProvider: nextActive,
    providerApiUrl: nextUrl,
    providerApiKey: nextToken,
    providerApiType: nextType,
    providerApiSecret: nextSecret,
    providerEnabled: nextEnabled,
    othmanApiUrl: nextOthmanUrl,
    othmanApiKey: nextOthmanToken,
    othmanApiType: nextOthmanType,
    othmanApiSecret: nextOthmanSecret,
    othmanEnabled: nextOthmanEnabled,
    smsProviderType: nextSmsType,
    smsApiUrl: nextSmsUrl,
    smsApiKey: nextSmsKey,
    smsEnabled: nextSmsEnabled,
  };

  memoryCachedConfig = newConfig;

  // 1. Write to data/provider_config.json
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${CONFIG_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(newConfig, null, 2), 'utf-8');
    fs.renameSync(tempFile, CONFIG_FILE);
  } catch (err) {
    console.error('Error writing provider_config.json:', err);
  }

  // 2. Update process.env
  process.env.SMS_API_URL = nextSmsUrl;
  if (nextSmsKey) process.env.SMS_API_KEY = nextSmsKey;
  process.env.SAHL_CASH_BASE_URL = nextUrl;
  process.env.SYRIA4GAME_BASE_URL = nextUrl;
  if (nextToken) {
    process.env.SAHL_CASH_API_TOKEN = nextToken;
    process.env.SYRIA4GAME_API_TOKEN = nextToken;
  }

  // 3. Update .env.local file if present
  try {
    if (fs.existsSync(ENV_LOCAL_FILE)) {
      let envContent = fs.readFileSync(ENV_LOCAL_FILE, 'utf-8');
      if (/^SYRIA4GAME_BASE_URL=.*/m.test(envContent)) {
        envContent = envContent.replace(/^SYRIA4GAME_BASE_URL=.*/m, `SYRIA4GAME_BASE_URL=${nextUrl}`);
      } else {
        envContent += `\nSYRIA4GAME_BASE_URL=${nextUrl}`;
      }

      if (nextToken) {
        if (/^SYRIA4GAME_API_TOKEN=.*/m.test(envContent)) {
          envContent = envContent.replace(/^SYRIA4GAME_API_TOKEN=.*/m, `SYRIA4GAME_API_TOKEN=${nextToken}`);
        } else {
          envContent += `\nSYRIA4GAME_API_TOKEN=${nextToken}`;
        }
      }
      fs.writeFileSync(ENV_LOCAL_FILE, envContent, 'utf-8');
    }
  } catch (err) {
    console.error('Error syncing .env.local with provider config:', err);
  }

  return { ...newConfig };
}
