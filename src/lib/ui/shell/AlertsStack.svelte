<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { previewRangesStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import { shellLayout } from './viewport';

  type Severity = 'high' | 'warn' | 'info';

  interface ShellAlert {
    id: string;
    severity: Severity;
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

  const SEVERITY_RANK: Record<Severity, number> = { high: 0, warn: 1, info: 2 };

  function formatBillion(syp: number): string {
    const val = Number((syp / 1_000_000_000).toFixed(2));
    if (Object.is(val, -0) || val === 0) return '0.00';
    return val.toFixed(2);
  }

  let layout = $derived($shellLayout);
  let isPortrait = $derived(layout === 'phone-p');
  let isLandscape = $derived(layout === 'phone-l');
  let trayOpen = $derived($uiStore.isAlertsOpen);

  let allAlerts = $derived.by<ShellAlert[]>(() => {
    const list: ShellAlert[] = [];

    // 1. Provinces in open unrest (highest RRI first, max two).
    const unrestProvinces = Object.values($gameStore.governorates)
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
        run: () => uiStore.selectGovernorate(gov.id),
      });
    }

    // 2. FX reserves runway under four months.
    const runway = $previewRangesStore.runwayMonthsEstimated;
    if (runway < 4) {
      list.push({
        id: 'reserves-runway',
        severity: runway < 2 ? 'high' : 'warn',
        icon: 'coins',
        title: 'الاحتياطي على وشك النفاد',
        detail: `يكفي ${runway} شهراً من الاستيراد — الإفلاس السيادي يقترب`,
        run: () => uiStore.openCommandPanel('emergency', true),
      });
    }

    // 3. Negative treasury.
    const treasury = $gameStore.macro.treasurySYP;
    if (treasury < 0) {
      list.push({
        id: 'treasury-negative',
        severity: 'high',
        icon: 'money-stack',
        title: 'الخزينة العامة في العجز',
        detail: `الرصيد ${formatBillion(treasury)} مليار ل.س — راجع المالية والإنفاق`,
        run: () => uiStore.openCommandPanel('tax', true),
      });
    }

    // 4. Political capital shortage.
    const pc = $gameStore.macro.politicalCapital;
    if (pc < 15) {
      list.push({
        id: 'political-capital',
        severity: pc < 8 ? 'high' : 'warn',
        icon: 'crown-coin',
        title: 'الرصيد السياسي حرج',
        detail: `${Math.round(pc)} نقطة فقط — المراسيم والقرارات الكبرى مهددة`,
        run: () => uiStore.openCommandPanel('decrees', true),
      });
    }

    // 5. Events waiting for a decision.
    const waiting = $gameStore.activeEvents.length;
    if (waiting > 0) {
      list.push({
        id: 'events-waiting',
        severity: 'high',
        icon: 'siren',
        title: `${waiting} أزمة بانتظار قرار رئاسي`,
        detail: $gameStore.activeEvents[0]?.titleAr ?? 'افتح غرفة الأزمات',
        run: () => uiStore.openCommandPanel('emergency', true),
      });
    }

    // 6. Collapsing public trust.
    const trust = $gameStore.macro.civicTrust;
    if (trust < 25) {
      list.push({
        id: 'trust-low',
        severity: trust < 15 ? 'high' : 'warn',
        icon: 'crowned-heart',
        title: 'الثقة الشعبية منهارة',
        detail: `${Math.round(trust)}% فقط — الشرعية تتبخر والشارع يغلي`,
        run: () => uiStore.openCommandPanel('policies', true),
      });
    }

    const dismissed = $uiStore.dismissedAlertIds;
    return list
      .filter((a) => !dismissed.includes(a.id))
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  });

  let visibleAlerts = $derived(allAlerts.slice(0, 5));
  let count = $derived(visibleAlerts.length);

  let lastTurn = $state($gameStore.turnNumber);
  $effect(() => {
    const turn = $gameStore.turnNumber;
    if (turn !== lastTurn) {
      lastTurn = turn;
      uiStore.clearDismissedAlerts();
    }
  });

  $effect(() => {
    if (visibleAlerts.length === 0 && $uiStore.isAlertsOpen) {
      uiStore.setAlertsOpen(false);
    }
  });

  function dismiss(event: MouseEvent, id: string): void {
    event.stopPropagation();
    uiStore.dismissAlert(id);
  }
</script>

{#if visibleAlerts.length > 0}
  <!-- Portrait: a single pill that expands into the stack. -->
  {#if isPortrait}
    <div class="pointer-events-auto fixed z-[35] flex flex-col gap-1.5" style="top: calc(var(--shell-top-h) + 8px); inset-inline-start: 8px;">
      <button
        type="button"
        onclick={() => uiStore.setAlertsOpen(!trayOpen)}
        aria-expanded={trayOpen}
        aria-label="الإنذارات المفتوحة"
        class="flex min-h-11 w-fit shrink-0 self-start items-center gap-2 border border-wheat-mid/25 bg-forest-deep/90 px-3 text-[10px] text-wheat-mid shadow-lg backdrop-blur-md shell-round-chip"
      >
        <span class="h-1.5 w-1.5 shrink-0 bg-status-danger shell-round-chip shell-alert-live"></span>
        <span class="font-heading font-bold text-wheat-light">{count} إنذارات</span>
        <span class="text-wheat-dark">{trayOpen ? '▲' : '▼'}</span>
      </button>

      {#if trayOpen}
        <div
          class="scroll-area max-h-[58vh] w-[calc(var(--vp-w)-16px)] overflow-y-auto border border-wheat-mid/20 bg-forest-deep/97 p-1.5 shadow-2xl backdrop-blur-md shell-round-pop shell-fade-in"
          role="dialog"
          aria-label="قائمة الإنذارات"
        >
          <div class="flex items-center justify-between px-1 pb-1.5">
            <span class="flex items-center gap-1.5 text-[8.5px] tracking-[1.2px] text-wheat-dark">
              <span class="h-1.5 w-1.5 bg-status-danger shell-round-chip shell-alert-live"></span>
              الإنذارات المفتوحة
            </span>
            <button
              type="button"
              onclick={() => uiStore.setAlertsOpen(false)}
              class="flex h-11 w-11 items-center justify-center text-wheat-dark"
              aria-label="إغلاق الإنذارات"
            >
              <GameIcon name="cross-mark" cls="h-3.5 w-3.5 shrink-0" />
            </button>
          </div>
          {#each visibleAlerts as alert (alert.id)}
            <div
              class="relative mb-1 shell-round-alert {alert.severity === 'high' ? 'border-s-2 border-s-status-danger' : alert.severity === 'warn' ? 'border-s-2 border-s-status-warn' : 'border-s-2 border-s-wheat-gold'}"
            >
              <button
                type="button"
                onclick={alert.run}
                class="flex w-full items-start gap-2 border border-wheat-mid/10 bg-forest-deep/80 p-2 pe-12 text-start shell-round-alert"
              >
                <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center {alert.severity === 'high' ? 'bg-umber-deep text-umber-crimson' : alert.severity === 'warn' ? 'bg-wheat-gold/10 text-status-warn' : 'bg-forest-mid text-forest-accent'}">
                  <GameIcon name={alert.icon} cls="h-3.5 w-3.5 shrink-0" />
                </span>
                <span class="min-w-0 flex-1 pe-5">
                  <span class="block text-[10.5px] font-semibold leading-snug text-wheat-light">{alert.title}</span>
                  <span class="mt-0.5 block text-[8px] leading-snug text-wheat-dark">{alert.detail}</span>
                </span>
              </button>
              <button
                type="button"
                onclick={(event) => dismiss(event, alert.id)}
                class="absolute top-0 end-0 flex h-11 w-11 items-center justify-center text-wheat-dark hover:text-wheat-light"
                aria-label="تجاهل الإنذار"
              >
                <GameIcon name="cross-mark" cls="h-3 w-3 shrink-0" />
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Landscape phone: the bell in the TopBar toggles the stack. -->
  {#if isLandscape}
    {#if trayOpen}
      <div
        class="pointer-events-auto fixed inset-0 z-[34] bg-charcoal-deep/35"
        role="presentation"
        onclick={() => uiStore.setAlertsOpen(false)}
        aria-hidden="true"
      ></div>
      <aside
        class="pointer-events-auto fixed z-[35] flex w-[270px] flex-col gap-1.5 shell-fade-in"
        style="top: calc(var(--shell-top-h) + 6px); inset-inline-end: 8px; max-height: calc(var(--vp-h) - var(--shell-top-h) - 76px);"
        aria-label="الإنذارات المفتوحة"
      >
        <div class="flex items-center gap-1.5 px-1 text-[8px] tracking-[1.2px] text-wheat-dark">
          <span class="h-1.5 w-1.5 bg-status-danger shell-round-chip shell-alert-live"></span>
          الإنذارات المفتوحة
          <span class="ms-auto font-heading text-[11px] text-wheat-mid">{count}</span>
          <button
            type="button"
            onclick={() => uiStore.setAlertsOpen(false)}
            class="flex h-11 w-11 items-center justify-center text-wheat-dark"
            aria-label="إغلاق الإنذارات"
          >
            <GameIcon name="cross-mark" cls="h-3 w-3 shrink-0" />
          </button>
        </div>
        <div class="scroll-area min-h-0 flex-1 space-y-1 overflow-y-auto">
          {#each visibleAlerts as alert (alert.id)}
            <div
              class="relative shell-round-alert {alert.severity === 'high' ? 'border-s-2 border-s-status-danger' : alert.severity === 'warn' ? 'border-s-2 border-s-status-warn' : 'border-s-2 border-s-wheat-gold'}"
            >
              <button
                type="button"
                onclick={alert.run}
                class="flex w-full items-start gap-2 border border-wheat-mid/10 bg-forest-deep/90 p-2 pe-12 text-start backdrop-blur-md shell-round-alert"
              >
                <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center {alert.severity === 'high' ? 'bg-umber-deep text-umber-crimson' : alert.severity === 'warn' ? 'bg-wheat-gold/10 text-status-warn' : 'bg-forest-mid text-forest-accent'}">
                  <GameIcon name={alert.icon} cls="h-3 w-3 shrink-0" />
                </span>
                <span class="min-w-0 flex-1 pe-5">
                  <span class="block text-[9.5px] font-semibold leading-snug text-wheat-light">{alert.title}</span>
                  <span class="mt-0.5 block text-[7.5px] leading-snug text-wheat-dark">{alert.detail}</span>
                </span>
              </button>
              <button
                type="button"
                onclick={(event) => dismiss(event, alert.id)}
                class="absolute top-0 end-0 flex h-11 w-11 items-center justify-center text-wheat-dark hover:text-wheat-light"
                aria-label="تجاهل الإنذار"
              >
                <GameIcon name="cross-mark" cls="h-2.5 w-2.5 shrink-0" />
              </button>
            </div>
          {/each}
        </div>
      </aside>
    {/if}
  {/if}

  <!-- Desktop/tablet: always-on stack under the top bar. -->
  {#if layout === 'desktop'}
    <aside
      class="pointer-events-auto fixed z-[35] flex w-[268px] flex-col gap-1.5"
      style="top: calc(var(--shell-top-h) + 12px); inset-inline-start: 16px;"
      aria-label="الإنذارات المفتوحة"
    >
      <div class="flex items-center gap-1.5 px-0.5 pb-0.5 text-[9px] tracking-[1.4px] text-wheat-dark">
        <span class="h-1.5 w-1.5 bg-status-danger shell-round-chip shell-alert-live"></span>
        الإنذارات المفتوحة
        <span class="ms-auto font-heading text-[12px] text-wheat-mid">{count}</span>
      </div>
      {#each visibleAlerts as alert (alert.id)}
        <div
          class="group relative shell-round-alert {alert.severity === 'high' ? 'border-s-2 border-s-status-danger' : alert.severity === 'warn' ? 'border-s-2 border-s-status-warn' : 'border-s-2 border-s-wheat-gold'}"
        >
          <button
            type="button"
            onclick={alert.run}
            class="flex w-full items-start gap-2.5 border border-wheat-mid/10 bg-forest-deep/85 p-2.5 text-start shadow-lg backdrop-blur-md transition-transform hover:-translate-y-px hover:border-wheat-mid/25 hover:bg-forest-mid/90 shell-round-alert"
          >
            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center {alert.severity === 'high' ? 'bg-umber-deep text-umber-crimson' : alert.severity === 'warn' ? 'bg-wheat-gold/10 text-status-warn' : 'bg-forest-mid text-forest-accent'}">
              <GameIcon name={alert.icon} cls="h-3.5 w-3.5 shrink-0" />
            </span>
            <span class="min-w-0 flex-1 pe-4">
              <span class="block text-[11px] font-semibold leading-snug text-wheat-light">{alert.title}</span>
              <span class="mt-0.5 block text-[8.5px] leading-snug text-wheat-dark">{alert.detail}</span>
            </span>
          </button>
          <button
            type="button"
            onclick={(event) => dismiss(event, alert.id)}
            class="absolute top-1 end-1 flex h-6 w-6 items-center justify-center text-wheat-dark/70 hover:bg-wheat-light/10 hover:text-wheat-light"
            aria-label="تجاهل الإنذار حتى الدور القادم"
            title="تجاهل حتى الدور القادم"
          >
            <GameIcon name="cross-mark" cls="h-2.5 w-2.5 shrink-0" />
          </button>
        </div>
      {/each}
    </aside>
  {/if}
{:else if isLandscape && trayOpen}
  <div
    class="pointer-events-auto fixed inset-0 z-[34] bg-charcoal-deep/35"
    role="presentation"
    onclick={() => uiStore.setAlertsOpen(false)}
    aria-hidden="true"
  ></div>
  <aside
    class="pointer-events-auto fixed z-[35] w-[270px] border border-wheat-mid/20 bg-forest-deep/95 p-3 text-[10px] text-wheat-dark shadow-2xl backdrop-blur-md shell-round-pop shell-fade-in"
    style="top: calc(var(--shell-top-h) + 6px); inset-inline-end: 8px;"
    aria-label="الإنذارات المفتوحة"
  >
    <div class="flex items-center justify-between gap-2">
      <span>لا إنذارات مفتوحة حالياً</span>
      <button
        type="button"
        onclick={() => uiStore.setAlertsOpen(false)}
        class="flex h-11 w-11 items-center justify-center text-wheat-dark"
        aria-label="إغلاق الإنذارات"
      >
        <GameIcon name="cross-mark" cls="h-3 w-3 shrink-0" />
      </button>
    </div>
  </aside>
{/if}
