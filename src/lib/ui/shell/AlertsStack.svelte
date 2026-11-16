<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { previewRangesStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import { fx } from '../fx/feedback';
  import GameIcon from '../GameIcon.svelte';
  import { buildShellAlerts, type AlertSeverity, type ShellAlert } from './alerts';
  import { shellLayout } from './viewport';

  // Alerts stay out of the way while a full-screen flow or modal owns the screen.
  let overlayBusy = $derived(
    $uiStore.turnFlowStage !== 'closed' ||
      $uiStore.isSettingsOpen ||
      $uiStore.isRestartModalOpen ||
      $uiStore.isAboutOpen ||
      $uiStore.isRecordsOpen ||
      $gameStore.isGameOver,
  );

  let layout = $derived($shellLayout);
  let isPhone = $derived(layout !== 'desktop');
  let trayOpen = $derived($uiStore.isAlertsOpen);

  let visibleAlerts = $derived(
    buildShellAlerts(
      $gameStore,
      $previewRangesStore,
      $uiStore.dismissedAlertIds,
      (id) => uiStore.selectGovernorate(id),
    )
  );
  let count = $derived(visibleAlerts.length);

  let lastTurn = $state($gameStore.turnNumber);
  $effect(() => {
    const turn = $gameStore.turnNumber;
    if (turn !== lastTurn) {
      lastTurn = turn;
      uiStore.clearDismissedAlerts();
    }
  });

  // Trigger fx('event') only when a new critical alert appears after initial mount.
  let initializedAlerts = false;
  let seenAlertIds = new Set<string>();
  $effect(() => {
    const currentIds = new Set(visibleAlerts.map((a) => a.id));
    if (!initializedAlerts) {
      initializedAlerts = true;
      seenAlertIds = currentIds;
      return;
    }
    const hasNewCritical = visibleAlerts.some(
      (a) => a.severity === 'high' && !seenAlertIds.has(a.id)
    );
    seenAlertIds = currentIds;
    if (hasNewCritical) {
      fx('event');
    }
  });

  $effect(() => {
    if (visibleAlerts.length === 0 && $uiStore.isAlertsOpen) {
      uiStore.setAlertsOpen(false);
    }
  });

  function closeTray(): void {
    fx('cancel');
    uiStore.setAlertsOpen(false);
  }

  function runAlert(alert: ShellAlert): void {
    fx('tap');
    uiStore.setAlertsOpen(false);
    alert.run();
  }

  function dismiss(event: MouseEvent, id: string): void {
    event.stopPropagation();
    fx('cancel');
    uiStore.dismissAlert(id);
  }

  let showAllDesktop = $state(false);
  let desktopAlerts = $derived(showAllDesktop ? visibleAlerts : visibleAlerts.slice(0, 3));
  let hiddenAlertsCount = $derived(Math.max(0, visibleAlerts.length - desktopAlerts.length));

  function severityClass(severity: AlertSeverity): string {
    return severity === 'high'
      ? 'border-s-[3px] border-s-[var(--c-neg)]'
      : 'border-s-[3px] border-s-[var(--c-disabled)]';
  }
</script>

{#if layout === 'desktop' && count > 0 && !overlayBusy}
  <!-- Desktop: flat severity-ruled alert stack at top-END corner of map under mode strip (max 3 visible + "+N") -->
  <aside
    class="hud-chrome pointer-events-auto fixed z-[35] flex w-[252px] min-[1600px]:w-[280px] min-[2200px]:w-[312px] flex-col gap-1.5"
    style="top: calc(var(--shell-top-h) + var(--shell-map-mode-h, 38px) + 12px); inset-inline-end: calc(var(--shell-map-end, 0px) + 14px);"
    aria-label="الإنذارات المفتوحة"
  >
    {#each desktopAlerts as alert (alert.id)}
      <div
        class="shell-toast-in group relative border border-[var(--c-line)] bg-[var(--c-panel)] {severityClass(alert.severity)}"
      >
        <button
          type="button"
          onclick={() => runAlert(alert)}
          class="pressable flex min-h-11 w-full flex-col justify-center px-2.5 py-2 pe-9 text-start hover:bg-[var(--c-strip)]"
        >
          <b class="block text-[12.5px] min-[1600px]:text-[13.5px] font-bold leading-snug {alert.severity === 'high' ? 'text-[var(--c-neg)]' : 'text-[var(--c-text)]'}">
            {alert.title}
          </b>
          <span class="mt-0.5 block text-[11.5px] min-[1600px]:text-[12.5px] leading-snug text-[var(--c-muted)]">
            {alert.detail}
          </span>
        </button>
        <button
          type="button"
          onclick={(event) => dismiss(event, alert.id)}
          class="pressable absolute top-0 end-0 flex h-9 w-9 items-center justify-center text-[var(--c-muted)] hover:text-[var(--c-text)]"
          aria-label="تجاهل الإنذار حتى الدور القادم"
          title="تجاهل حتى الدور القادم"
        >
          <GameIcon name="cross-mark" cls="h-3.5 w-3.5 shrink-0" />
        </button>
      </div>
    {/each}

    {#if visibleAlerts.length > 3}
      <button
        type="button"
        onclick={() => {
          fx('tap');
          showAllDesktop = !showAllDesktop;
        }}
        class="pressable flex items-center justify-between border border-[var(--c-line-strong)] bg-[var(--c-strip)] px-2.5 py-1.5 text-[11.5px] font-bold text-[var(--c-text-2)] hover:border-[var(--c-text)] hover:text-[var(--c-text)]"
      >
        <span>{showAllDesktop ? 'طيّ الإنذارات الإضافية' : `+${hiddenAlertsCount} إنذارات إضافية`}</span>
        <span class="num text-[var(--c-accent)]">{visibleAlerts.length}</span>
      </button>
    {/if}
  </aside>
{:else if isPhone && trayOpen}
  <!-- Phone (portrait & landscape): alerts drawer opened from the TopBar alerts chip/bell -->
  <div
    class="pointer-events-auto fixed inset-0 z-[54] bg-[var(--c-bg)]/60 shell-fade-in"
    role="presentation"
    onclick={closeTray}
    aria-hidden="true"
  ></div>
  <div
    class="pointer-events-auto fixed z-[55] flex flex-col border border-[var(--c-line-strong)] border-t-2 border-t-[var(--c-neg)] bg-[var(--c-panel)] shell-toast-in"
    style="top: calc(var(--shell-top-h) + 6px); inset-inline-end: 8px; width: min(340px, calc(var(--vp-w) - 16px)); max-height: calc(var(--vp-h) - var(--shell-top-h) - var(--shell-bottom-h, 0px) - 16px);"
    role="dialog"
    aria-label="قائمة الإنذارات"
  >
    <div class="flex items-center justify-between border-b border-[var(--c-line)] bg-[var(--c-strip)] px-3 py-2">
      <span class="font-heading text-[13px] font-bold text-[var(--c-neg)]">
        الإنذارات المفتوحة ({count})
      </span>
      <button
        type="button"
        onclick={closeTray}
        class="pressable flex h-11 w-11 items-center justify-center text-[var(--c-muted)] hover:text-[var(--c-text)]"
        aria-label="إغلاق الإنذارات"
      >
        <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
      </button>
    </div>

    {#if count === 0}
      <div class="p-3 text-[12px] text-[var(--c-muted)]">لا إنذارات مفتوحة حالياً</div>
    {:else}
      <div class="scroll-area min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {#each visibleAlerts as alert (alert.id)}
          <div class="relative border border-[var(--c-line)] bg-[var(--c-bg)] {severityClass(alert.severity)}">
            <button
              type="button"
              onclick={() => runAlert(alert)}
              class="pressable flex min-h-11 w-full flex-col justify-center px-2.5 py-2 pe-11 text-start"
            >
              <b class="block text-[13px] font-bold leading-snug {alert.severity === 'high' ? 'text-[var(--c-neg)]' : 'text-[var(--c-text)]'}">
                {alert.title}
              </b>
              <span class="mt-0.5 block text-[12px] leading-snug text-[var(--c-muted)]">
                {alert.detail}
              </span>
            </button>
            <button
              type="button"
              onclick={(event) => dismiss(event, alert.id)}
              class="pressable absolute top-0 end-0 flex h-11 w-11 items-center justify-center text-[var(--c-muted)] hover:text-[var(--c-text)]"
              aria-label="تجاهل الإنذار"
            >
              <GameIcon name="cross-mark" cls="h-3.5 w-3.5 shrink-0" />
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
