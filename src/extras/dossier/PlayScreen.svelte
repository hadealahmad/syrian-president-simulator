<script lang="ts">
  import ExtrasBar from '../shared/ExtrasBar.svelte';
  import GameIcon from '../../lib/ui/GameIcon.svelte';
  import { fx } from '../../lib/ui/fx/feedback';
  import { STANDING_DECREES } from './content/decrees';
  import { getHintMagnitudes, getSeasonLabel } from './engine/engine';
  import { METER_IDS, type DossierCard, type DossierState } from './engine/types';
  import MeterBar from './MeterBar.svelte';
  import { METER_META, fileGlyphKey, formatSigned, pad2 } from './ui-helpers';
  import { CRISIS_GLYPHS } from '../crisis/glyphs';

  let {
    state: game,
    card,
    howToOpen,
    onAnswer,
    onPostpone,
    onOpenHowTo,
  }: {
    state: DossierState;
    card: DossierCard | null;
    howToOpen: boolean;
    onAnswer: (side: 'right' | 'left') => void;
    onPostpone: () => void;
    onOpenHowTo: () => void;
  } = $props();

  const DRAG_COMMIT_PX = 56;
  const DRAG_HINT_PX = 14;

  let dragging = $state(false);
  let activePointerId = $state<number | null>(null);
  let startX = $state(0);
  let startY = $state(0);
  let dragX = $state(0);
  let dragY = $state(0);

  let hoverSide = $state<'right' | 'left' | null>(null);
  let kbdSide = $state<'right' | 'left' | null>(null);

  // Reset transient selection whenever the active card changes
  $effect(() => {
    void card?.id;
    void game.filesResolved;
    dragging = false;
    activePointerId = null;
    dragX = 0;
    dragY = 0;
    hoverSide = null;
    kbdSide = null;
  });

  let dragCommitSide = $derived<'right' | 'left' | null>(
    dragX >= DRAG_COMMIT_PX ? 'right' : dragX <= -DRAG_COMMIT_PX ? 'left' : null,
  );

  let previewSide = $derived<'right' | 'left' | null>(
    dragging && Math.abs(dragX) >= DRAG_HINT_PX
      ? dragX > 0
        ? 'right'
        : 'left'
      : (hoverSide ?? kbdSide),
  );

  let hints = $derived(getHintMagnitudes(card, previewSide));

  let cardTransform = $derived(
    dragging || dragX !== 0 || dragY !== 0
      ? `transform: translate3d(${dragX.toFixed(1)}px, ${dragY.toFixed(1)}px, 0) rotate(${(dragX * 0.035).toFixed(2)}deg);`
      : '',
  );

  function handlePointerDown(e: PointerEvent): void {
    if (!card || howToOpen || e.button > 0) return;
    dragging = true;
    activePointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    dragX = 0;
    dragY = 0;
    try {
      (e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);
    } catch {
      /* synthetic pointer events may not have an active pointer id */
    }
  }

  function handlePointerMove(e: PointerEvent): void {
    if (!dragging || e.pointerId !== activePointerId) return;
    dragX = e.clientX - startX;
    dragY = (e.clientY - startY) * 0.16;
  }

  function finishPointer(e: PointerEvent, cancelled: boolean): void {
    if (!dragging || e.pointerId !== activePointerId) return;
    const committed = !cancelled ? dragCommitSide : null;
    dragging = false;
    activePointerId = null;
    dragX = 0;
    dragY = 0;
    try {
      (e.currentTarget as HTMLElement)?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    if (committed) {
      onAnswer(committed);
    }
  }

  function focusAnswerBtn(side: 'right' | 'left'): void {
    const btn = document.querySelector<HTMLButtonElement>(`button[data-side="${side}"]`);
    btn?.focus();
  }

  function handleWindowKeydown(e: KeyboardEvent): void {
    if (howToOpen || !card || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (kbdSide === 'right') {
        onAnswer('right');
      } else {
        kbdSide = 'right';
        focusAnswerBtn('right');
        fx('select');
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (kbdSide === 'left') {
        onAnswer('left');
      } else {
        kbdSide = 'left';
        focusAnswerBtn('left');
        fx('select');
      }
    } else if (e.key === 'Enter' && kbdSide) {
      const active = document.activeElement as HTMLElement | null;
      const tag = active?.tagName;
      const isOtherControl =
        (tag === 'BUTTON' || tag === 'A') && active?.getAttribute('data-side') !== kbdSide;
      if (!isOtherControl) {
        e.preventDefault();
        onAnswer(kbdSide);
      }
    } else if (e.key === 'Escape' && kbdSide) {
      e.preventDefault();
      kbdSide = null;
      fx('cancel');
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<ExtrasBar title="قرارات عاجلة" backHref="../index.html" backLabel="الألعاب">
  <div class="ms-auto flex items-center">
    <button
      type="button"
      aria-label="كيف تلعب"
      title="كيف تلعب"
      onclick={() => {
        fx('tap');
        onOpenHowTo();
      }}
      class="pressable flex h-full min-h-[44px] min-w-[48px] items-center justify-center border-s border-[var(--c-line)] px-3 text-[var(--c-muted)] hover:bg-[var(--c-panel)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
    >
      <GameIcon name="help" cls="h-4 w-4" />
    </button>
  </div>
</ExtrasBar>

<main
  class="dos-scroll mx-auto flex min-h-0 w-full max-w-[var(--dos-col-max)] flex-1 flex-col gap-1.5 overflow-y-auto px-2.5 py-2 sm:gap-2.5 sm:px-4 sm:py-3.5"
>
  <MeterBar
    meters={game.meters}
    deltas={game.lastOutcome ? game.lastOutcome.deltas : null}
    {hints}
  />

  {#if game.decrees.length > 0}
    <div
      aria-label="المراسيم النافذة"
      class="dos-no-scrollbar flex shrink-0 items-center gap-1.5 overflow-x-auto border border-[var(--c-line)] bg-[var(--c-strip)] px-2.5 py-1.5"
    >
      <span class="shrink-0 text-[11px] font-bold text-[var(--c-muted)]">مراسيم:</span>
      {#each game.decrees as decId (decId)}
        {@const dec = STANDING_DECREES[decId]}
        {#if dec}
          <span class="inline-flex shrink-0 items-center gap-1.5 border border-[var(--c-line)] bg-[var(--c-panel)] px-2 py-0.5 text-[11px] font-bold text-[var(--c-text-2)]">
            <span>{dec.name}</span>
            {#each METER_IDS as mId (mId)}
              {@const dVal = dec.drift[mId] ?? 0}
              {#if dVal !== 0}
                <span
                  class="inline-flex items-center gap-0.5 text-[10.5px] {dVal > 0
                    ? 'text-[var(--c-pos)]'
                    : 'text-[var(--c-neg)]'}"
                >
                  <span>{METER_META[mId].label}</span>
                  <bdi dir="ltr" class="num">{formatSigned(dVal)}</bdi>
                </span>
              {/if}
            {/each}
          </span>
        {/if}
      {/each}
    </div>
  {/if}

  <!-- Turn & file strip -->
  <div class="flex shrink-0 items-center justify-between border border-[var(--c-line)] bg-[var(--c-strip)] px-3 py-1.5 text-[12px] sm:text-[13px]">
    <div class="flex items-center gap-1.5 text-[var(--c-text-2)]">
      <span>الدور</span>
      <bdi dir="ltr" class="num font-bold text-[var(--c-accent)]">
        {pad2(game.turn)}/{game.maxTurns}
      </bdi>
      <span class="text-[var(--c-muted)]">·</span>
      <bdi dir="ltr" class="num font-medium text-[var(--c-text)]">{game.year}</bdi>
      <span class="text-[var(--c-muted)]">·</span>
      <span>{getSeasonLabel(game.season)}</span>
    </div>
    <div class="num font-bold text-[var(--c-muted)]">
      ملف <bdi dir="ltr" class="text-[var(--c-text)]">{game.fileInTurn}/2</bdi>
    </div>
  </div>

  <!-- Result headline strip -->
  <div
    aria-live="polite"
    class="flex shrink-0 items-start gap-2 border border-[var(--c-line)] bg-[var(--c-strip)] px-2.5 py-2 sm:px-3"
  >
    <span
      class="mt-0.5 shrink-0 px-1.5 py-0.5 text-[11px] font-bold leading-tight {game.lastOutcome
        ? 'bg-[var(--c-accent)] text-[var(--c-ink)]'
        : 'border border-[var(--c-line-strong)] text-[var(--c-muted)]'}"
    >
      النتيجة
    </span>
    <p class="min-w-0 flex-1 text-[12.5px] leading-[1.45] sm:text-[13.5px] {game.lastOutcome ? 'font-medium text-[var(--c-text)]' : 'text-[var(--c-muted)]'}">
      {game.lastOutcome
        ? game.lastOutcome.headline
        : 'اسحب الملف يمينًا أو يسارًا أو اضغط أحد القرارين لبدء الولاية.'}
    </p>
  </div>

  <!-- Active File Card -->
  {#if card}
    <article
      data-testid="dossier-card"
      onpointerdown={handlePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={(e) => finishPointer(e, false)}
      onpointercancel={(e) => finishPointer(e, true)}
      style={cardTransform}
      class="dos-file-card flex min-h-[168px] flex-1 flex-col justify-between p-3.5 sm:min-h-[220px] sm:p-5 {card.kind ===
      'overreach'
        ? 'is-overreach'
        : ''} {dragging ? 'is-dragging' : 'is-snapback'} {dragCommitSide ? 'commit-edge' : ''}"
    >
      {#if dragCommitSide === 'right'}
        <div
          class="pointer-events-none absolute top-2.5 left-2.5 z-20 max-w-[85%] border-2 border-[var(--c-accent)] bg-[var(--c-bg)] px-2.5 py-1 text-[12.5px] font-bold text-[var(--c-accent)] sm:text-[13.5px]"
        >
          <bdi dir="ltr">→</bdi> {card.right.label}
        </div>
      {:else if dragCommitSide === 'left'}
        <div
          class="pointer-events-none absolute top-2.5 right-2.5 z-20 max-w-[85%] border-2 border-[var(--c-accent)] bg-[var(--c-bg)] px-2.5 py-1 text-[12.5px] font-bold text-[var(--c-accent)] sm:text-[13.5px]"
        >
          {card.left.label} <bdi dir="ltr">←</bdi>
        </div>
      {/if}

      <div>
        <div class="flex items-center justify-between gap-2 border-b border-[var(--c-line)] pb-2">
          <span
            class="text-[12px] font-bold sm:text-[13px] {card.kind === 'overreach'
              ? 'text-[var(--c-neg)]'
              : 'text-[var(--c-accent)]'}"
          >
            من: {card.from}
          </span>
          {#if card.kind === 'followup'}
            <span class="border border-[var(--c-line-strong)] bg-[var(--c-strip)] px-1.5 py-0.5 text-[10.5px] font-bold text-[var(--c-text-2)]">
              تبعات سابقة
            </span>
          {:else if card.kind === 'overreach'}
            <span class="border border-[var(--c-neg)] bg-[var(--c-ev-bg)] px-1.5 py-0.5 text-[10.5px] font-bold text-[var(--c-neg)]">
              ملف جموح
            </span>
          {/if}
        </div>

      </div>

      <!-- Title + text centred in the card, in the game-name display font.
           The faded file glyph sits behind them. -->
      <div class="relative flex min-h-0 flex-1 flex-col items-center justify-center px-1 py-4 text-center">
        {#if CRISIS_GLYPHS[fileGlyphKey(card.tags)]}
          <svg
            viewBox={CRISIS_GLYPHS[fileGlyphKey(card.tags)].vb}
            class="dos-watermark pointer-events-none absolute inset-0 m-auto h-[70%] max-h-[220px] w-auto max-w-[60%]"
            fill="currentColor"
            aria-hidden="true"
          >
            {@html CRISIS_GLYPHS[fileGlyphKey(card.tags)].body}
          </svg>
        {/if}
        <h2 class="dos-card-display relative text-[length:var(--dos-card-title-fs)] font-bold leading-[1.35] text-[var(--c-text)]">
          {card.title}
        </h2>
        <p class="dos-card-display relative mt-3 max-w-[34em] text-[length:var(--dos-card-body-fs)] leading-[1.75] text-[var(--c-text-2)]">
          {card.text}
        </p>
      </div>

      <div class="mt-3 flex items-center justify-between border-t border-[var(--c-line)] pt-2 text-[11px] text-[var(--c-muted)]">
        <span><bdi dir="ltr">→</bdi> اسحب يمينًا</span>
        <span>اسحب يسارًا <bdi dir="ltr">←</bdi></span>
      </div>
    </article>

    <!-- Two-column answer buttons (RTL: col 1 = right, col 2 = left) -->
    <div class="grid shrink-0 grid-cols-2 gap-2">
      <button
        type="button"
        data-side="right"
        onpointerenter={() => (hoverSide = 'right')}
        onpointerleave={() => {
          if (hoverSide === 'right') hoverSide = null;
        }}
        onfocus={() => (kbdSide = 'right')}
        onblur={() => {
          if (kbdSide === 'right') kbdSide = null;
        }}
        onclick={() => onAnswer('right')}
        class="dos-ans-btn text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {previewSide ===
        'right'
          ? 'is-active'
          : ''}"
      >
        <bdi dir="ltr" class="shrink-0 text-[16px] text-[var(--c-accent)]" aria-hidden="true">→</bdi>
        <span class="min-w-0 flex-1">{card.right.label}</span>
      </button>

      <button
        type="button"
        data-side="left"
        onpointerenter={() => (hoverSide = 'left')}
        onpointerleave={() => {
          if (hoverSide === 'left') hoverSide = null;
        }}
        onfocus={() => (kbdSide = 'left')}
        onblur={() => {
          if (kbdSide === 'left') kbdSide = null;
        }}
        onclick={() => onAnswer('left')}
        class="dos-ans-btn text-end focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] {previewSide ===
        'left'
          ? 'is-active'
          : ''}"
      >
        <span class="min-w-0 flex-1">{card.left.label}</span>
        <bdi dir="ltr" class="shrink-0 text-[16px] text-[var(--c-accent)]" aria-hidden="true">←</bdi>
      </button>
    </div>

    <!-- Postpone button -->
    <button
      type="button"
      disabled={game.postponesLeft <= 0}
      onclick={onPostpone}
      class="kit-btn sec pressable flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 bg-[var(--c-strip)] px-4 text-[13.5px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] disabled:opacity-45"
    >
      <span>أجّل الملف</span>
      <span class="text-[var(--c-muted)]">·</span>
      <bdi dir="ltr" class="num text-[var(--c-accent)]">{game.postponesLeft}</bdi>
    </button>
  {/if}
</main>
