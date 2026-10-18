import fs from 'fs';
import path from 'path';
import { getSupabase } from '../supabase';

export interface ProviderCallLog {
  orderId?: string | null;
  endpoint: string;
  urlRedacted: string;
  httpStatus: number;
  durationMs: number;
  outcome: string;
  errorCode?: number | null;
  responseBody?: string;
  createdAt?: string;
}

const MAX_BODY = 16 * 1024;
const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);
const LOCAL_FILE = IS_SERVERLESS ? path.join('/tmp', 'provider_calls.json') : path.join(process.cwd(), 'data', 'provider_calls.json');
const LOCAL_LIMIT = 500;

function readLocal(): ProviderCallLog[] {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

/** Records one provider API call. Never throws: logging must not break an order. */
export async function logProviderCall(entry: ProviderCallLog): Promise<void> {
  const row = {
    ...entry,
    responseBody: (entry.responseBody || '').slice(0, MAX_BODY),
    createdAt: new Date().toISOString(),
  };
  try {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from('provider_calls').insert({
        order_id: row.orderId || null,
        endpoint: row.endpoint,
        url_redacted: row.urlRedacted,
        http_status: row.httpStatus,
        duration_ms: row.durationMs,
        outcome: row.outcome,
        error_code: row.errorCode ?? null,
        response_body: row.responseBody,
        created_at: row.createdAt,
      });
      if (error) console.warn('provider_calls insert failed:', error.message);
      return;
    }
    const all = readLocal();
    all.unshift(row);
    fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(all.slice(0, LOCAL_LIMIT), null, 2), 'utf-8');
  } catch (err) {
    console.warn('Provider call logging failed:', err);
  }
}

export async function listProviderCalls(options: { orderId?: string; limit?: number } = {}): Promise<ProviderCallLog[]> {
  const limit = Math.min(Math.max(options.limit || 50, 1), 200);
  const sb = getSupabase();
  if (sb) {
    let query = sb.from('provider_calls').select('*').order('created_at', { ascending: false }).limit(limit);
    if (options.orderId) query = query.eq('order_id', options.orderId);
    const { data, error } = await query;
    if (error) throw new Error(`provider_calls: ${error.message}`);
    return (data || []).map((r: any) => ({
      orderId: r.order_id,
      endpoint: r.endpoint,
      urlRedacted: r.url_redacted,
      httpStatus: r.http_status,
      durationMs: r.duration_ms,
      outcome: r.outcome,
      errorCode: r.error_code,
      responseBody: r.response_body,
      createdAt: r.created_at,
    }));
  }
  return readLocal()
    .filter((r) => !options.orderId || r.orderId === options.orderId)
    .slice(0, limit);
}

/** Housekeeping: drop call logs older than `days`. */
export async function pruneProviderCalls(days = 30): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  await sb.from('provider_calls').delete().lt('created_at', cutoff);
}
