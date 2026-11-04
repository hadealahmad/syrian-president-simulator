<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import { countPendingDraftActions } from './pending-actions';
  import { shellLayout } from './viewport';

  let layout = $derived($shellLayout);
  let isPortrait = $derived(layout === 'phone-p');
  let isLandscape = $derived(layout === 'phone-l');
  let pending = $derived(countPendingDraftActions($draftStore));
  let gameOver = $derived($gameStore.isGameOver);
  let seasonText = $derived($gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء');
  let turnText = $derived(String($gameStore.turnNumber).padStart(2, '0'));

  // Concept D wax seal: 104px on desktop, never below the 64px phone touch
  // minimum on either phone orientation.
  let size = $derived(isPortrait ? 68 : isLandscape ? 66 : 104);
  let positionStyle = $derived(
    isPortrait
      ? 'bottom: calc(var(--shell-tab-h) + env(safe-area-inset-bottom) + 10px); inset-inline-start: 12px;'
      : isLandscape
        ? 'bottom: 8px; inset-inline-end: 8px;'
        : 'bottom: calc(20px + env(safe-area-inset-bottom)); inset-inline-start: 22px;'
  );
  // The global angular reset lives in `@layer base` with !important, and for
  // important declarations layered styles beat unlayered ones — so the shared
  // `.shell-round-*` overrides cannot win here. An inline !important radius is
  // the one form the cascade puts above every author layer; the embedded rings
  // are real spans (not pseudo-elements) so they round with it.
  let sealStyle = $derived(
    `${positionStyle} width: ${size}px; height: ${size}px; ` +
      'border-radius: 50% !important; ' +
      'background: var(--shell-seal-gold); color: var(--shell-seal-ink); ' +
      'border: 1px solid color-mix(in srgb, var(--color-wheat-light) 78%, transparent); ' +
      'box-shadow: 0 14px 40px rgb(from var(--color-wheat-gold) r g b / 0.24), 0 4px 12px rgb(0 0 0 / 0.4), inset 0 0 0 5px rgb(0 0 0 / 0.08);'
  );

  function endTurn(): void {
    if (gameOver) return;
    if ($uiStore.turnFlowStage !== 'closed') return;
    uiStore.closeActivePanel();
    uiStore.setAlertsOpen(false);
    uiStore.setTurnFlowStage('review');
  }
</script>

<button
  type="button"
  data-tour="end-turn"
  data-flow-open="review"
  onclick={endTurn}
  disabled={gameOver}
  aria-label="إنهاء الدور والمصادقة على القرارات"
  title={gameOver
    ? 'انتهت اللعبة'
    : 'مراجعة القرارات المعتمدة لهذا الدور والمصادقة عليها'}
  class="pointer-events-auto fixed z-[46] flex flex-col items-center justify-center transition-transform duration-150 hover:scale-[1.045] active:scale-[0.97] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-45 disabled:grayscale"
  style={sealStyle}
>
  <!-- Embossed rings pressed into the wax. -->
  <span
    class="pointer-events-none absolute inset-[6px] border border-dashed"
    style="border-radius: 50% !important; border-color: rgb(0 0 0 / 0.42);"
    aria-hidden="true"
  ></span>
  <span
    class="pointer-events-none absolute inset-[13px] border"
    style="border-radius: 50% !important; border-color: rgb(0 0 0 / 0.16);"
    aria-hidden="true"
  ></span>

  <!-- Embossed star watermark pressed into the wax. -->
  <span
    class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.14]"
    aria-hidden="true"
  >
    <svg viewBox="0 0 40 40" fill="currentColor" class="h-[72%] w-[72%]">
      <path d="M20 4.6l4.7 11.4 12.4.8-9.6 7.9 3.2 12-10.7-6.6-10.7 6.6 3.2-12-9.6-7.9 12.4-.8L20 4.6Z" />
    </svg>
  </span>

  <span class="relative z-10 flex flex-col items-center justify-center gap-0.5 leading-none">
    {#if !isPortrait && !isLandscape}
      <svg viewBox="0 0 40 40" fill="currentColor" class="mb-1 h-[18px] w-[18px] opacity-80" aria-hidden="true">
        <path d="M20 3.4l4.9 11.9 12.9.9-9.9 8.3 3.3 12.5L20 30.1 8.8 37l3.3-12.5-9.9-8.3 12.9-.9L20 3.4Z" />
      </svg>
      <span class="text-center font-heading text-[14.5px] font-bold leading-[1.1]">إنهاء الدور</span>
      <span class="text-[7.5px] tracking-[0.6px] opacity-70">{seasonText} · <bdi>{$gameStore.calendarYear}</bdi></span>
      <span class="mt-0.5 font-mono text-[7px] opacity-65">الدور <bdi>{turnText}/40</bdi></span>
    {:else}
      <svg viewBox="0 0 40 40" fill="currentColor" class="h-[13px] w-[13px] opacity-80" aria-hidden="true">
        <path d="M20 3.4l4.9 11.9 12.9.9-9.9 8.3 3.3 12.5L20 30.1 8.8 37l3.3-12.5-9.9-8.3 12.9-.9L20 3.4Z" />
      </svg>
      <span class="text-center font-heading text-[9px] font-bold leading-[1.15]">إنهاء الدور</span>
      <span class="mt-0.5 font-mono text-[6.5px] opacity-70" dir="ltr">{turnText}/40</span>
    {/if}
  </span>

  {#if pending > 0}
    <span
      class="absolute -top-1 -end-1 z-20 flex h-[23px] min-w-[23px] items-center justify-center px-1 font-mono text-[10px] font-bold leading-none text-charcoal-white shadow-md"
      style="border-radius: 50% !important; background: var(--color-status-danger); border: 2px solid var(--color-charcoal-deep);"
      aria-label="{pending} قرارات معلّقة"
      title="{pending} قرار معلّق في المسودة"
    >
      {pending > 99 ? '99+' : pending}
    </span>
  {/if}
</button>
