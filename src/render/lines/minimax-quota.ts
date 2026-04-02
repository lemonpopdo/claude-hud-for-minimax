import type { RenderContext } from '../../types.js';
import { critical, label, getQuotaColor, quotaBar, RESET } from '../colors.js';
import { getAdaptiveBarWidth } from '../../utils/terminal.js';

export function renderMiniMaxQuotaLine(ctx: RenderContext): string | null {
  const display = ctx.config?.display;
  const colors = ctx.config?.colors;

  if (display?.showMiniMaxQuota !== true) {
    return null;
  }

  if (!ctx.miniMaxQuota) {
    return null;
  }

  const quota = ctx.miniMaxQuota;
  const barEnabled = display?.miniMaxQuotaBarEnabled ?? true;
  const showWeekly = display?.miniMaxQuotaShowWeekly ?? true;
  const barWidth = getAdaptiveBarWidth();

  const mmLabel = label('MiniMax', colors);

  // Show warning if either window is exhausted
  if (quota.intervalPercent === 100 || (showWeekly && quota.weeklyPercent === 100)) {
    const part = formatWindowPart({
      label: '5h',
      percent: quota.intervalPercent,
      remaining: quota.intervalRemaining,
      total: quota.intervalTotal,
      resetAt: quota.intervalResetsAt,
      colors,
      barEnabled,
      barWidth,
    });
    return `${mmLabel} ${critical(`⚠ Quota exhausted`, colors)} — ${part}`;
  }

  const fiveHourPart = formatWindowPart({
    label: '5h',
    percent: quota.intervalPercent,
    remaining: quota.intervalRemaining,
    total: quota.intervalTotal,
    resetAt: quota.intervalResetsAt,
    colors,
    barEnabled,
    barWidth,
  });

  if (!showWeekly || quota.weeklyPercent === null) {
    return `${mmLabel} ${fiveHourPart}`;
  }

  const weeklyPart = formatWindowPart({
    label: '7d',
    percent: quota.weeklyPercent,
    remaining: quota.weeklyRemaining,
    total: quota.weeklyTotal,
    resetAt: quota.weeklyResetsAt,
    colors,
    barEnabled,
    barWidth,
  });

  return `${mmLabel} ${fiveHourPart} | ${weeklyPart}`;
}

function formatWindowPart({
  label: windowLabel,
  percent,
  remaining,
  total,
  resetAt,
  colors,
  barEnabled,
  barWidth,
}: {
  label: string;
  percent: number | null;
  remaining: number | null;
  total: number | null;
  resetAt: Date | null;
  colors?: RenderContext['config']['colors'];
  barEnabled: boolean;
  barWidth: number;
}): string {
  const resetStr = formatResetTime(resetAt);
  const labelStr = `${windowLabel}:`;
  const percentStr = percent !== null ? `${getQuotaColor(percent, colors)}${percent}%${RESET}` : '--%';
  const usedStr = (remaining !== null && total !== null) ? formatCount(total - remaining) : '--';
  const totalStr = total !== null ? formatCount(total) : '--';

  if (barEnabled) {
    const bar = quotaBar(percent ?? 0, barWidth, colors);
    const body = resetStr
      ? `${bar} ${percentStr} (${usedStr}/${totalStr}, resets ${resetStr})`
      : `${bar} ${percentStr} (${usedStr}/${totalStr})`;
    return `${labelStr} ${body}`;
  }

  const body = resetStr
    ? `${percentStr} (${usedStr}/${totalStr}, resets ${resetStr})`
    : `${percentStr} (${usedStr}/${totalStr})`;
  return `${labelStr} ${body}`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function formatResetTime(resetAt: Date | null): string {
  if (!resetAt) return '';
  const now = new Date();
  const diffMs = resetAt.getTime() - now.getTime();
  if (diffMs <= 0) return 'now';

  const diffMins = Math.ceil(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    if (remHours > 0) return `${days}d ${remHours}h`;
    return `${days}d`;
  }

  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
