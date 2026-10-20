import fs from 'fs';
import path from 'path';

export interface StoredProviderConfig {
  providerApiUrl: string;
  providerApiKey: string;
  providerApiType: 'syria4game' | 'smm' | 'custom_rest';
  providerApiSecret?: string;
  providerEnabled: boolean;
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

        memoryCachedConfig = {
          providerApiUrl: url,
          providerApiKey: token,
          providerApiType: parsed.providerApiType || 'syria4game',
          providerApiSecret: parsed.providerApiSecret || '',
          providerEnabled: parsed.providerEnabled !== false,
        };
        return { ...memoryCachedConfig };
      }
    }
  } catch (err) {
    console.error('Error reading provider_config.json:', err);
  }

  // Fallback to environment variables
  const initialConfig: StoredProviderConfig = {
    providerApiUrl: normalizeUrl(DEFAULT_URL),
    providerApiKey: DEFAULT_TOKEN,
    providerApiType: 'syria4game',
    providerApiSecret: '',
    providerEnabled: true,
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

  const newConfig: StoredProviderConfig = {
    providerApiUrl: nextUrl,
    providerApiKey: nextToken,
    providerApiType: nextType,
    providerApiSecret: nextSecret,
    providerEnabled: nextEnabled,
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
