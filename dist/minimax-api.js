import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const execAsync = promisify(exec);
const TIMEOUT_MS = 5000;
const MAX_BUFFER = 64 * 1024; // 64KB
const isDebug = process.env.DEBUG?.includes('claude-hud') ?? false;
function debug(msg) {
    if (isDebug) {
        console.error(`[claude-hud:minimax-api] ${msg}`);
    }
}
// The MiniMax API endpoint for coding plan quota
const API_URL = 'https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains';
function msToDate(ms) {
    return new Date(ms);
}
/**
 * Fetch MiniMax quota data via curl.
 * Returns null on any failure (no token, network error, parse error).
 *
 * IMPORTANT: The API returns REMAINING quota in *_usage_count fields, not USED quota.
 * We calculate used = total - remaining, then percent = (used / total) * 100.
 */
export async function fetchMiniMaxQuota() {
    const token = process.env.ANTHROPIC_AUTH_TOKEN;
    if (!token) {
        debug('No ANTHROPIC_AUTH_TOKEN found, skipping MiniMax quota');
        return null;
    }
    // Build curl command
    const curlCmd = [
        'curl',
        '-s',
        '-L',
        '-X', 'GET',
        `"${API_URL}"`,
        '-H', `"Authorization: Bearer ${token}"`,
        '-H', '"Content-Type: application/json"',
        '--max-time', String(Math.floor(TIMEOUT_MS / 1000)),
    ].join(' ');
    try {
        const { stdout } = await execAsync(curlCmd, {
            timeout: TIMEOUT_MS,
            maxBuffer: MAX_BUFFER,
        });
        const json = JSON.parse(stdout.trim());
        if (json.base_resp?.status_code !== 0) {
            debug(`API error: ${json.base_resp?.status_msg ?? 'unknown'}`);
            return null;
        }
        const entries = json.model_remains;
        if (!entries || entries.length === 0) {
            debug('No model_remains in response');
            return null;
        }
        // Find the current model entry (match by model name prefix)
        const currentModel = process.env.ANTHROPIC_MODEL ?? '';
        const entry = entries.find(e => currentModel.startsWith('MiniMax-M') && e.model_name.startsWith('MiniMax-M')) ?? entries[0];
        if (!entry) {
            debug('Could not find matching model entry');
            return null;
        }
        // Calculate 5h window usage from remaining quota
        // The API returns REMAINING in *_usage_count fields
        const intervalTotal = entry.current_interval_total_count;
        const intervalRemaining = entry.current_interval_usage_count;
        const intervalUsed = intervalTotal - intervalRemaining;
        const intervalPercent = intervalTotal > 0
            ? Math.min(100, Math.round((intervalUsed / intervalTotal) * 100))
            : null;
        // Calculate weekly usage from remaining quota
        const weeklyTotal = entry.current_weekly_total_count;
        const weeklyRemaining = entry.current_weekly_usage_count;
        const weeklyUsed = weeklyTotal - weeklyRemaining;
        const weeklyPercent = weeklyTotal > 0
            ? Math.min(100, Math.round((weeklyUsed / weeklyTotal) * 100))
            : null;
        return {
            intervalPercent,
            intervalRemaining,
            intervalTotal,
            intervalResetsAt: entry.end_time > 0 ? msToDate(entry.end_time) : null,
            weeklyPercent,
            weeklyRemaining,
            weeklyTotal,
            weeklyResetsAt: entry.weekly_end_time > 0 ? msToDate(entry.weekly_end_time) : null,
        };
    }
    catch (err) {
        if (err instanceof Error) {
            if (err.message.includes('TIMEOUT') || err.message.includes('killed')) {
                debug(`curl timed out after ${TIMEOUT_MS}ms`);
            }
            else {
                debug(`curl failed: ${err.message}`);
            }
        }
        return null;
    }
}
//# sourceMappingURL=minimax-api.js.map