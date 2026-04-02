import type { MiniMaxQuotaData } from './types.js';
/**
 * Fetch MiniMax quota data via curl.
 * Returns null on any failure (no token, network error, parse error).
 *
 * IMPORTANT: The API returns REMAINING quota in *_usage_count fields, not USED quota.
 * We calculate used = total - remaining, then percent = (used / total) * 100.
 */
export declare function fetchMiniMaxQuota(): Promise<MiniMaxQuotaData | null>;
//# sourceMappingURL=minimax-api.d.ts.map