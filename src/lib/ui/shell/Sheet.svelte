<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { focusTrap } from '../actions/focus-trap';
  import { shellLayout } from './viewport';
  import GameIcon from '../GameIcon.svelte';

  interface Props {
    open: boolean;
    title: string;
    onclose: () => void;
    subtitle?: string;
    /** Desktop drawer width in CSS px (default 440). */
    width?: number;
    /** Optional glyph in the header tile. */
    icon?: string;
    /** Optional `data-tour` hook for the mounted panel root. */
    tourId?: string;
    /** Portrait opening snap: 1 = half sheet, 2 = full sheet (default half). */
    defaultSnap?: 1 | 2;
    /** Keep the visible map interactive above a half-height portrait sheet. */
    mapInteractive?: boolean;
    children: Snippet;
    footer?: Snippet;
  }

  let {
    open,
    title,
    onclose,
    subtitle = '',
    width = 440,
    icon = '',
    tourId = '',
    defaultSnap = 1,
    mapInteractive = false,
    children,
    footer,
  }: Props = $props();

  let layout = $derived($shellLayout);
  let isPhone = $derived(layout !== 'desktop');
  let isPortrait = $derived(layout === 'phone-p');
  let isLandscape = $derived(layout === 'phone-l');

  // ── Portrait snap points (peek ~30vh, half ~55vh, full = below top bar) ──
  let viewportH = $state(typeof window !== 'undefined' ? window.innerHeight : 820);
  let snap = $state(1);
  let dragY = $state(0);
  let dragging = $state(false);
  let dragStartY: number | null = null;
  let dragStartH = 0;

  let topH = $derived(layout === 'phone-p' ? 56 : layout === 'phone-l' ? 44 : 64);
  let peekH = $derived(Math.max(230, viewportH * 0.3));
  let halfH = $derived(Math.max(peekH + 48, viewportH * 0.55));
  let fullH = $derived(Math.max(halfH + 48, viewportH - topH - 8));
  let heights = $derived([peekH, halfH, fullH]);
  let sheetH = $derived(heights[snap] ?? halfH);

  onMount(() => {
    const onResize = (): void => {
      viewportH = window.innerHeight;
    };
    viewportH = window.innerHeight;
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  });

  // Every fresh open starts at the requested snap (full for most panels so
  // cards are visible, half for the province sheet so the map stays visible);
  // closing and reopening must not remember a dismissed peek.
  $effect(() => {
    if (open && isPortrait) {
      snap = defaultSnap;
      dragY = 0;
      dragging = false;
      dragStartY = null;
    }
  });

  function onDragStart(event: PointerEvent): void {
    if (!isPortrait) return;
    dragStartY = event.clientY;
    dragStartH = sheetH;
    dragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function onDragMove(event: PointerEvent): void {
    if (dragStartY === null) return;
    const raw = event.clientY - dragStartY;
    const maxUp = Math.max(0, fullH - dragStartH);
    const minH = Math.max(120, heights[0] * 0.45);
    const maxDown = Math.max(0, dragStartH - minH);
    dragY = Math.max(-maxUp, Math.min(raw, maxDown));
  }

  function onDragEnd(): void {
    if (dragStartY === null) return;
    const visualH = dragStartH - dragY;
    const startWasPeek = dragStartH <= heights[0] + 18;
    dragStartY = null;
    dragging = false;
    dragY = 0;
    if (startWasPeek && visualH < heights[0] - 56) {
      onclose();
      return;
    }
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    heights.forEach((h, i) => {
      const distance = Math.abs(h - visualH);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    snap = best;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (open && event.key === 'Escape') {
      event.stopPropagation();
      onclose();
    }
  }

  let panelStyle = $derived.by(() => {
    if (isPortrait) {
      return `height:${sheetH}px; transform: translateY(${dragY}px); transition:${
        dragging
          ? 'none'
          : 'height .26s cubic-bezier(.2,.8,.2,1), transform .26s cubic-bezier(.2,.8,.2,1)'
      };`;
    }
    if (layout === 'phone-l') {
      return 'inset-block-start: calc(var(--shell-top-h) + 4px); inset-block-end: 6px; inset-inline-end: 0; width: min(420px, calc(var(--vp-w) * 0.6));';
    }
    return `inset-block-start: calc(var(--shell-top-h) + var(--shell-gap)); inset-block-end: 12px; inset-inline-end: 0; width: min(${width}px, calc(var(--vp-w) - 32px));`;
  });
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  {#if isPhone}
    <div
      class="fixed inset-0 z-[49] bg-charcoal-deep/55 shell-fade-in {mapInteractive
        ? 'pointer-events-none'
        : 'pointer-events-auto'}"
      role="presentation"
      onclick={onclose}
      aria-hidden="true"
    ></div>
  {/if}

  <div
    use:focusTrap={{ enabled: isPhone }}
    role="dialog"
    aria-modal={isPhone ? 'true' : undefined}
    aria-label={title}
    data-tour={tourId || undefined}
    class="pointer-events-auto fixed z-50 flex flex-col overflow-hidden border border-wheat-mid/20 bg-forest-deep text-wheat-light font-arabic select-none
      {isPortrait ? 'inset-x-0 bottom-0 shell-round-sheet-bottom shell-enter-bottom' : ''}
      {!isPortrait ? 'shell-round-sheet-side shell-enter-side' : ''}"
    style="{panelStyle} background: var(--shell-surface); box-shadow: var(--shell-shadow-sheet);"
  >
    {#if isPortrait}
      <!-- Drag handle: pointer capture changes the snap point on release. -->
      <div
        class="flex min-h-11 w-full shrink-0 cursor-grab touch-none items-center justify-center py-2 active:cursor-grabbing"
        role="separator"
        aria-label="سحب اللوحة لتغيير الحجم"
        onpointerdown={onDragStart}
        onpointermove={onDragMove}
        onpointerup={onDragEnd}
        onpointercancel={onDragEnd}
      >
        <span class="block h-[3px] w-10 bg-wheat-mid/30 shell-round-chip"></span>
      </div>
    {/if}

    {#if isLandscape}
      <!-- Landscape phone: one compact line (≤44px) so the panel body keeps
           almost the entire sheet height. -->
      <header
        class="flex h-11 shrink-0 items-center gap-2 border-b border-wheat-mid/10 px-2"
      >
        {#if icon}
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center border border-wheat-gold/25 bg-wheat-gold/10 text-wheat-gold shell-round-item"
          >
            <GameIcon name={icon} cls="h-4 w-4 shrink-0" />
          </span>
        {/if}
        <h2
          class="min-w-0 flex-1 truncate font-heading text-[14px] font-semibold leading-none text-wheat-light"
        >
          {title}
        </h2>
        <button
          type="button"
          onclick={onclose}
          class="flex h-11 w-11 shrink-0 items-center justify-center border border-transparent text-wheat-dark transition-colors hover:border-wheat-mid/25 hover:bg-wheat-light/5 hover:text-wheat-light focus-visible:border-wheat-gold shell-round-item"
          aria-label="إغلاق اللوحة"
          title="إغلاق اللوحة"
        >
          <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
        </button>
      </header>
    {:else}
      <header
        class="flex shrink-0 items-start gap-3 border-b border-wheat-mid/10 px-4 pb-3 {isPortrait ? 'pt-1' : 'pt-4'}"
      >
        {#if icon}
          <span
            class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-wheat-gold/25 bg-wheat-gold/10 text-wheat-gold shell-round-item"
          >
            <GameIcon name={icon} cls="h-4 w-4 shrink-0" />
          </span>
        {/if}
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 text-[8.5px] tracking-[1.6px] text-forest-accent/90">
            <span class="h-px w-3.5 bg-forest-accent/60"></span>
            لوحة القيادة
          </div>
          <h2 class="mt-0.5 truncate font-heading text-[20px] font-semibold leading-tight text-wheat-light">
            {title}
          </h2>
          {#if subtitle}
            <p class="mt-0.5 truncate text-[10px] text-wheat-dark">{subtitle}</p>
          {/if}
        </div>
        <button
          type="button"
          onclick={onclose}
          class="flex h-11 w-11 shrink-0 items-center justify-center border border-transparent text-wheat-dark transition-colors hover:border-wheat-mid/25 hover:bg-wheat-light/5 hover:text-wheat-light focus-visible:border-wheat-gold shell-round-item"
          aria-label="إغلاق اللوحة"
          title="إغلاق اللوحة"
        >
          <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
        </button>
      </header>
    {/if}

    <div
      class="scroll-area min-h-0 flex-1 overflow-y-auto px-4 {isLandscape ? 'py-2' : 'py-3'} focus:outline-none {isPortrait ? 'pb-[calc(1rem+env(safe-area-inset-bottom))]' : ''}"
      tabindex="-1"
      data-autofocus
    >
      {@render children()}
    </div>

    {#if footer}
      <div class="shrink-0 border-t border-wheat-mid/10 bg-forest-deep/60 px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {@render footer()}
      </div>
    {/if}
  </div>
{/if}
