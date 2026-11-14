/**
 * Parse and format a numeric delta string (e.g. "+$12.5M", "-4.20B", "15,000", "42")
 * so the hero figure on each turn-result headline card can count up smoothly.
 */
export interface ParsedDelta {
  prefix: string;
  target: number;
  decimals: number;
  useCommas: boolean;
  suffix: string;
}

export function parseHeroDelta(raw: string): ParsedDelta | null {
  const match = raw.match(/^([+\-−]?\$?)([0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const clean = numStr.replace(/,/g, '');
  const target = Number(clean);
  if (!Number.isFinite(target)) return null;
  const dotIdx = clean.indexOf('.');
  const decimals = dotIdx >= 0 ? clean.length - dotIdx - 1 : 0;
  const useCommas = numStr.includes(',');
  return { prefix, target, decimals, useCommas, suffix };
}

export function formatHeroDeltaAt(parsed: ParsedDelta, progress: number): string {
  const value = parsed.target * progress;
  if (parsed.useCommas) {
    const rounded = Math.round(value);
    return `${parsed.prefix}${new Intl.NumberFormat('en-US').format(rounded)}${parsed.suffix}`;
  }
  const formatted = value.toFixed(parsed.decimals);
  return `${parsed.prefix}${formatted}${parsed.suffix}`;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
