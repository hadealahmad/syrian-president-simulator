import type { GameState, PredictivePreviewRanges } from '../../engine/types';
import { openSection } from './section-nav';

export type AlertSeverity = 'high' | 'warn' | 'info';

export interface ShellAlert {
  id: string;
  severity: AlertSeverity;
  icon: string;
  title: string;
  detail: string;
  run: () => void;
}

const TIER_AR: Record<string, string> = {
  CALM: 'مستقرة',
  TENSE: 'متوترة',
  RIOT: 'اضطرابات',
  REVOLT: 'تمرد مسلح',
};

const SEVERITY_RANK: Record<AlertSeverity, number> = { high: 0, warn: 1, info: 2 };

function formatBillion(syp: number): string {
  const val = Number((syp / 1_000_000_000).toFixed(2));
  if (Object.is(val, -0) || val === 0) return '0.00';
  return val.toFixed(2);
}

export function buildShellAlerts(
  game: GameState,
  preview: PredictivePreviewRanges,
  dismissedAlertIds: string[],
  selectGov: (id: string) => void,
): ShellAlert[] {
  const list: ShellAlert[] = [];

  // 1. Provinces in open unrest (highest RRI first, max two).
  const unrestProvinces = Object.values(game.governorates)
    .filter((g) => g.tier === 'RIOT' || g.tier === 'REVOLT')
    .sort((a, b) => b.prri - a.prri)
    .slice(0, 2);
  for (const gov of unrestProvinces) {
    list.push({
      id: `gov:${gov.id}`,
      severity: gov.tier === 'REVOLT' ? 'high' : 'warn',
      icon: gov.tier === 'REVOLT' ? 'siren' : 'flame',
      title: `${TIER_AR[gov.tier] ?? 'اضطرابات'} في ${gov.nameAr}`,
      detail: `مؤشر الاحتقان ${Math.round(gov.prri)}/100 · ${Math.round(gov.dailyBlackoutHours)} ساعة كهرباء`,
      run: () => selectGov(gov.id),
    });
  }

  // 2. FX reserves runway under four months.
  const runway = preview.runwayMonthsEstimated;
  if (runway < 4) {
    list.push({
      id: 'reserves-runway',
      severity: runway < 2 ? 'high' : 'warn',
      icon: 'coins',
      title: 'الاحتياطي على وشك النفاد',
      detail: `يكفي ${runway} شهراً من الاستيراد — الإفلاس السيادي يقترب`,
      run: () => openSection('emergency'),
    });
  }

  // 3. Negative treasury.
  const treasury = game.macro.treasurySYP;
  if (treasury < 0) {
    list.push({
      id: 'treasury-negative',
      severity: 'high',
      icon: 'money-stack',
      title: 'الخزينة العامة في العجز',
      detail: `الرصيد ${formatBillion(treasury)} مليار ل.س — راجع الخزينة والإنفاق`,
      run: () => openSection('tax', 'spending'),
    });
  }

  // 4. Political capital shortage.
  const pc = game.macro.politicalCapital;
  if (pc < 15) {
    list.push({
      id: 'political-capital',
      severity: pc < 8 ? 'high' : 'warn',
      icon: 'crown-coin',
      title: 'الرصيد السياسي حرج',
      detail: `${Math.round(pc)} نقطة فقط — المراسيم والقرارات الكبرى مهددة`,
      run: () => openSection('decrees', 'decrees'),
    });
  }

  // 5. Events waiting for a decision.
  const waiting = game.activeEvents.length;
  if (waiting > 0) {
    list.push({
      id: 'events-waiting',
      severity: 'high',
      icon: 'siren',
      title: `${waiting} أزمة بانتظار قرار رئاسي`,
      detail: game.activeEvents[0]?.titleAr ?? 'افتح ملف الدَّين والتمويل',
      run: () => openSection('emergency'),
    });
  }

  // 6. Collapsing public trust.
  const trust = game.macro.civicTrust;
  if (trust < 25) {
    list.push({
      id: 'trust-low',
      severity: trust < 15 ? 'high' : 'warn',
      icon: 'crowned-heart',
      title: 'الثقة الشعبية منهارة',
      detail: `${Math.round(trust)}% فقط — الشرعية تتبخر والشارع يغلي`,
      run: () => openSection('decrees', 'stances'),
    });
  }

  return list
    .filter((a) => !dismissedAlertIds.includes(a.id))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .slice(0, 5);
}

export function formatAlertBadge(count: number): string {
  if (count === 1) return 'تنبيه 1';
  if (count === 2) return 'تنبيهان';
  if (count >= 3 && count <= 10) return `${count} تنبيهات`;
  return `${count} تنبيه`;
}
