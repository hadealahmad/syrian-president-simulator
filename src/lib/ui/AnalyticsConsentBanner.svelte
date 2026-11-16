<script lang="ts">
  import { analyticsStore } from '../stores/analytics-store';
  import { uiStore } from '../stores/ui-store';
  import { tourActive } from './guide-tour';
  import { fx } from './fx/feedback';
  import GameIcon from './GameIcon.svelte';
  import { shellLayout } from './shell/viewport';
  import { settingsMenuSubView } from './flow/settings-menu';
  import './flow/flow-desktop.css';

  const suppressInAutomatedPlay =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('play') === '1' &&
    new URLSearchParams(window.location.search).get('consent_banner') !== '1';

  let layout = $derived($shellLayout);
  let isDesktop = $derived(layout === 'desktop');

  let visible = $derived(
    !suppressInAutomatedPlay &&
      $analyticsStore.consent === 'unset' &&
      !($uiStore.isSettingsOpen && $settingsMenuSubView !== 'main') &&
      !$uiStore.isAboutOpen &&
      !$uiStore.isRecordsOpen &&
      !$uiStore.isRestartModalOpen &&
      !$tourActive
  );

  let positionStyle = $derived.by(() => {
    if (isDesktop) {
      const endOffset = $uiStore.isSettingsOpen ? '24px' : 'calc(var(--shell-map-end, 0px) + 16px)';
      return `bottom: 20px; inset-inline-end: ${endOffset}; width: min(430px, calc(100vw - 32px));`;
    }
    if (!$uiStore.isSettingsOpen && layout === 'phone-p') {
      return 'bottom: calc(var(--shell-bottom-h, 58px) + 10px); inset-inline: 12px;';
    }
    return 'bottom: calc(12px + env(safe-area-inset-bottom)); inset-inline: 12px;';
  });

  function acceptTracking(): void {
    fx('confirm');
    analyticsStore.setConsent(true);
  }

  function declineTracking(): void {
    fx('cancel');
    analyticsStore.setConsent(false);
  }
</script>

{#if visible}
  <aside
    dir="rtl"
    role="region"
    aria-label="إشعار الخصوصية وإحصاءات اللعب"
    data-consent-banner
    data-focus-trap-exempt
    class="pointer-events-auto fixed z-[155] border border-[var(--c-line-strong)] border-t-2 border-t-[var(--c-accent)] bg-[var(--c-panel)] font-arabic text-[var(--c-text)] shadow-2xl shell-toast-in {isDesktop
      ? 'flow-desktop p-4'
      : 'mx-auto max-w-[520px] p-3.5'}"
    style={positionStyle}
  >
    <div class="flex items-start gap-2.5">
      <span
        class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--c-accent)]/40 bg-[var(--c-chip-bg)] text-[var(--c-accent)]"
        aria-hidden="true"
      >
        <GameIcon name="checked-shield" cls="h-4 w-4 shrink-0" />
      </span>

      <div class="min-w-0 flex-1 text-start">
        <div
          class="font-heading font-bold text-[var(--c-accent)] {isDesktop
            ? 'text-[var(--flow-fs-sm)]'
            : 'text-[13px]'}"
        >
          الخصوصية وإحصاءات اللعب
        </div>
        <p
          class="mt-1 leading-[1.55] text-[var(--c-text-2)] {isDesktop
            ? 'text-[var(--flow-fs-xs)]'
            : 'text-[12px]'}"
        >
          نستخدم إحصاءات مجهولة الهوية (الأدوار والأحداث والنهايات) لتحسين توازن المحاكاة. يمكنك تغيير خيارك في أي وقت من الإعدادات.
        </p>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        data-consent-action="accept"
        onclick={acceptTracking}
        aria-label="الموافقة على تفعيل إحصاءات اللعب"
        class="kit-btn pri min-h-11 md:min-h-10 px-3 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)] {isDesktop
          ? 'text-[var(--flow-fs-xs)]'
          : 'text-[12.5px]'}"
      >
        <GameIcon name="check-mark" cls="h-4 w-4 shrink-0" />
        <span>موافقة</span>
      </button>

      <button
        type="button"
        data-consent-action="decline"
        onclick={declineTracking}
        aria-label="رفض إحصاءات اللعب"
        class="kit-btn sec min-h-11 md:min-h-10 bg-[var(--c-bg)] px-3 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {isDesktop
          ? 'text-[var(--flow-fs-xs)]'
          : 'text-[12.5px]'}"
      >
        <span>رفض</span>
      </button>
    </div>
  </aside>
{/if}
