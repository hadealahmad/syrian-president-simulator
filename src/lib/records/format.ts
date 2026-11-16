/**
 * Pure date, time and duration formatters in Modern Standard Arabic
 * with Levantine month names and Western digits.
 */

export const LEVANTINE_MONTHS: readonly string[] = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
];

function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

function safeDate(epochMs: number): Date {
  const safe = Number.isFinite(epochMs) ? epochMs : 0;
  return new Date(safe);
}

export interface DatePartsAr {
  day: string;
  month: string;
  year: string;
}

export function formatDatePartsAr(epochMs: number): DatePartsAr {
  const d = safeDate(epochMs);
  return {
    day: String(d.getDate()),
    month: LEVANTINE_MONTHS[d.getMonth()] ?? LEVANTINE_MONTHS[0],
    year: String(d.getFullYear()),
  };
}

/** e.g. «16 تشرين الثاني 2026» */
export function formatDateAr(epochMs: number): string {
  const p = formatDatePartsAr(epochMs);
  return `${p.day} ${p.month} ${p.year}`;
}

/** e.g. «21:04» */
export function formatTimeAr(epochMs: number): string {
  const d = safeDate(epochMs);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatSecondsUnit(sec: number): string {
  if (sec <= 1) return 'ثانية واحدة';
  if (sec === 2) return 'ثانيتان';
  if (sec <= 10) return `${sec} ثوانٍ`;
  return `${sec} ثانية`;
}

function formatMinutesUnit(min: number): string {
  if (min === 1) return 'دقيقة واحدة';
  if (min === 2) return 'دقيقتان';
  if (min <= 10) return `${min} دقائق`;
  return `${min} دقيقة`;
}

function formatHoursUnit(hr: number): string {
  if (hr === 1) return 'ساعة واحدة';
  if (hr === 2) return 'ساعتان';
  if (hr <= 10) return `${hr} ساعات`;
  return `${hr} ساعة`;
}

/**
 * Format a duration in milliseconds using Arabic count grammar and Western digits.
 * Examples: «35 ثانية», «43 دقيقة», «ساعة واحدة و15 دقيقة».
 */
export function formatDurationAr(durationMs: number): string {
  const clamped = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
  const totalSeconds = Math.round(clamped / 1000);
  if (totalSeconds < 60) {
    return formatSecondsUnit(Math.max(1, totalSeconds));
  }
  const totalMinutes = Math.round(clamped / 60_000);
  if (totalMinutes < 60) {
    return formatMinutesUnit(Math.max(1, totalMinutes));
  }
  const hours = Math.floor(totalMinutes / 60);
  const remMinutes = totalMinutes % 60;
  const hoursPart = formatHoursUnit(hours);
  if (remMinutes === 0) return hoursPart;
  return `${hoursPart} و${formatMinutesUnit(remMinutes)}`;
}

export interface RunTimelineParts {
  startDate: DatePartsAr;
  startTime: string;
  sameDay: boolean;
  endDate: DatePartsAr;
  endTime: string;
  duration: string;
}

export function formatRunTimelineParts(startedAt: number, endedAt: number): RunTimelineParts {
  const safeStart = Number.isFinite(startedAt) ? startedAt : 0;
  const safeEnd = Number.isFinite(endedAt) ? Math.max(safeStart, endedAt) : safeStart;
  const startDate = formatDatePartsAr(safeStart);
  const endDate = formatDatePartsAr(safeEnd);
  const sameDay =
    startDate.day === endDate.day &&
    startDate.month === endDate.month &&
    startDate.year === endDate.year;

  return {
    startDate,
    startTime: formatTimeAr(safeStart),
    sameDay,
    endDate,
    endTime: formatTimeAr(safeEnd),
    duration: formatDurationAr(safeEnd - safeStart),
  };
}

/**
 * Full timeline summary string:
 * Same day: «بدأت 16 تشرين الثاني 2026 · 21:04 — انتهت 21:47 (43 دقيقة)»
 * Cross day: «بدأت 16 تشرين الثاني 2026 · 23:50 — انتهت 17 تشرين الثاني 2026 · 00:33 (43 دقيقة)»
 */
export function formatRunTimelineAr(startedAt: number, endedAt: number): string {
  const p = formatRunTimelineParts(startedAt, endedAt);
  const startStr = `${p.startDate.day} ${p.startDate.month} ${p.startDate.year} · ${p.startTime}`;
  const endStr = p.sameDay
    ? p.endTime
    : `${p.endDate.day} ${p.endDate.month} ${p.endDate.year} · ${p.endTime}`;
  return `بدأت ${startStr} — انتهت ${endStr} (${p.duration})`;
}
