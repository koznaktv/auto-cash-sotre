import fs from 'fs';
import path from 'path';

export interface StoredProviderConfig {
  activeProvider?: 'othman';
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

// Default fallback URL and token - permanently locked to Othman Store
const DEFAULT_URL = (process.env.OTHMAN_STORE_BASE_URL || process.env.SYRIA4GAME_BASE_URL || 'https://api.othman-storee.com').trim();
const DEFAULT_TOKEN = (process.env.OTHMAN_STORE_API_TOKEN || process.env.OTHMAN_STORE_API_KEY || process.env.SYRIA4GAME_API_TOKEN || process.env.SYRIA4GAME_API_KEY || '-OrFU2hk5qtDMWfei8SpSmYWhtgD1O5Na57FKQH9G0Q8EAv2a2OS12Vqag5Q5AKN').trim();

let memoryCachedConfig: StoredProviderConfig | null = null;

function normalizeUrl(url: string): string {
  let clean = (url || '').trim().replace(/\/+$/, '');
  if (!clean || clean.includes('sahl-cash.com') || clean.includes('syria4game.com')) {
    return 'https://api.othman-storee.com';
  }
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  return clean;
}

/**
 * Loads persistent provider configuration.
 * Always resolves to Othman Store as the sole wholesale top-up provider.
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
        let token = (parsed.othmanApiKey || parsed.providerApiKey || DEFAULT_TOKEN || '').trim();
        let url = normalizeUrl(parsed.othmanApiUrl || parsed.providerApiUrl || DEFAULT_URL);

        // Sanitize any legacy sahl-cash references
        if (url.includes('sahl-cash') || url.includes('syria4game.com')) {
          url = 'https://api.othman-storee.com';
        }
        if (!token || token.startsWith('1c96e0')) {
          token = (process.env.OTHMAN_STORE_API_TOKEN || '-OrFU2hk5qtDMWfei8SpSmYWhtgD1O5Na57FKQH9G0Q8EAv2a2OS12Vqag5Q5AKN').trim();
        }

        memoryCachedConfig = {
          activeProvider: 'othman',
          providerApiUrl: url,
          providerApiKey: token,
          providerApiType: parsed.providerApiType || 'syria4game',
          providerApiSecret: parsed.providerApiSecret || '',
          providerEnabled: parsed.providerEnabled !== false,
          othmanApiUrl: url,
          othmanApiKey: token,
          othmanApiType: 'syria4game',
          othmanApiSecret: '',
          othmanEnabled: true,
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
    providerEnabled: true,
    othmanApiUrl: 'https://api.othman-storee.com',
    othmanApiKey: DEFAULT_TOKEN,
    othmanApiType: 'syria4game',
    othmanApiSecret: '',
    othmanEnabled: true,
    smsProviderType: (process.env.SMS_PROVIDER_TYPE as any) || 'sms_activate',
    smsApiUrl: (process.env.SMS_API_URL || process.env.SMS_PROVIDER_URL || 'https://api.sms-activate.org/stubs/handler_api.php').trim(),
    smsApiKey: (process.env.SMS_API_KEY || process.env.SMS_PROVIDER_API_KEY || '').trim(),
    smsEnabled: Boolean(process.env.SMS_API_KEY || process.env.SMS_PROVIDER_API_KEY),
  };

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
    : updates.othmanApiUrl !== undefined
    ? normalizeUrl(updates.othmanApiUrl)
    : (current.othmanApiUrl || 'https://api.othman-storee.com');

  const nextToken = updates.providerApiKey !== undefined && updates.providerApiKey.trim().length > 0
    ? updates.providerApiKey.trim()
    : updates.othmanApiKey !== undefined && updates.othmanApiKey.trim().length > 0
    ? updates.othmanApiKey.trim()
    : (current.othmanApiKey || DEFAULT_TOKEN);

  const nextType = updates.providerApiType || updates.othmanApiType || 'syria4game';
  const nextSecret = updates.providerApiSecret || updates.othmanApiSecret || '';
  const nextEnabled = updates.providerEnabled !== undefined ? Boolean(updates.providerEnabled) : true;

  const nextSmsType = updates.smsProviderType !== undefined ? updates.smsProviderType : (current.smsProviderType || 'sms_activate');
  const nextSmsUrl = updates.smsApiUrl !== undefined ? updates.smsApiUrl.trim() : (current.smsApiUrl || 'https://api.sms-activate.org/stubs/handler_api.php');
  const nextSmsKey = updates.smsApiKey !== undefined ? updates.smsApiKey.trim() : (current.smsApiKey || '');
  const nextSmsEnabled = updates.smsEnabled !== undefined ? Boolean(updates.smsEnabled) : (current.smsEnabled !== false);

  const newConfig: StoredProviderConfig = {
    activeProvider: 'othman',
    providerApiUrl: nextUrl,
    providerApiKey: nextToken,
    providerApiType: nextType,
    providerApiSecret: nextSecret,
    providerEnabled: nextEnabled,
    othmanApiUrl: nextUrl,
    othmanApiKey: nextToken,
    othmanApiType: nextType,
    othmanApiSecret: nextSecret,
    othmanEnabled: nextEnabled,
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
  process.env.OTHMAN_STORE_BASE_URL = nextUrl;
  process.env.OTHMAN_STORE_API_TOKEN = nextToken;
  process.env.SYRIA4GAME_BASE_URL = nextUrl;
  process.env.SYRIA4GAME_API_TOKEN = nextToken;

  // 3. Update .env.local file if present
  try {
    if (fs.existsSync(ENV_LOCAL_FILE)) {
      let envContent = fs.readFileSync(ENV_LOCAL_FILE, 'utf-8');
      if (/^OTHMAN_STORE_BASE_URL=.*/m.test(envContent)) {
        envContent = envContent.replace(/^OTHMAN_STORE_BASE_URL=.*/m, `OTHMAN_STORE_BASE_URL=${nextUrl}`);
      } else {
        envContent += `\nOTHMAN_STORE_BASE_URL=${nextUrl}`;
      }

      if (nextToken) {
        if (/^OTHMAN_STORE_API_TOKEN=.*/m.test(envContent)) {
          envContent = envContent.replace(/^OTHMAN_STORE_API_TOKEN=.*/m, `OTHMAN_STORE_API_TOKEN=${nextToken}`);
        } else {
          envContent += `\nOTHMAN_STORE_API_TOKEN=${nextToken}`;
        }
      }

      if (/^SYRIA4GAME_BASE_URL=.*/m.test(envContent)) {
        envContent = envContent.replace(/^SYRIA4GAME_BASE_URL=.*/m, `SYRIA4GAME_BASE_URL=${nextUrl}`);
      }
      if (nextToken && /^SYRIA4GAME_API_TOKEN=.*/m.test(envContent)) {
        envContent = envContent.replace(/^SYRIA4GAME_API_TOKEN=.*/m, `SYRIA4GAME_API_TOKEN=${nextToken}`);
      }

      fs.writeFileSync(ENV_LOCAL_FILE, envContent, 'utf-8');
    }
  } catch (err) {
    console.error('Error syncing .env.local with provider config:', err);
  }

  return { ...newConfig };
}
