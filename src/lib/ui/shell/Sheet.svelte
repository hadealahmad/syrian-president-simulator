<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import type { Snippet } from 'svelte';
  import { focusTrap } from '../actions/focus-trap';
  import { fx } from '../fx/feedback';
  import GameIcon from '../GameIcon.svelte';
  import { shellLayout } from './viewport';

  interface Props {
    open: boolean;
    title: string;
    onclose: () => void;
    /** Desktop drawer width token (CSS length / var). */
    widthToken?: string;
    /** Active section identifier (switching section resets scroll to top). */
    sectionKey?: string;
    /** Active sub-tab identifier (switching sub-tab saves/restores scroll). */
    subTabKey?: string;
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
    widthToken = 'var(--shell-dock-w)',
    sectionKey = '',
    subTabKey = '',
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

  // ── Portrait snap points above the bottom tab bar ──
  let viewportH = $state(typeof window !== 'undefined' ? window.innerHeight : 820);
  let measuredTopH = $state(98);
  let measuredBottomH = $state(58);
  let reducedMotion = $state(false);
  let snap = $state<0 | 1 | 2>(untrack(() => defaultSnap));
  let dragY = $state(0);
  let dragging = $state(false);
  let dragStartY: number | null = null;
  let dragStartH = 0;
  let scrollEl: HTMLDivElement | null = $state(null);
  let animateSideEnter = $state(false);
  let sideAnimTimer: ReturnType<typeof setTimeout> | null = null;
  const subTabScrollMap = new Map<string, number>();

  function readCssPx(varName: string, fallback: number): number {
    if (typeof window === 'undefined') return fallback;
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  let topH = $derived(measuredTopH || (layout === 'phone-p' ? 98 : layout === 'phone-l' ? 54 : 60));
  let bottomH = $derived(isPortrait ? (measuredBottomH || 58) : 0);
  let availableH = $derived(Math.max(240, viewportH - topH - bottomH));
  let peekH = $derived(Math.max(180, Math.round(availableH * 0.34)));
  let halfH = $derived(Math.max(peekH + 64, Math.round(availableH * 0.62)));
  let fullH = $derived(availableH);
  let heights = $derived([peekH, halfH, fullH]);
  let sheetH = $derived(heights[snap] ?? halfH);
  let effectiveSheetH = $derived(
    open && isPortrait ? Math.max(0, Math.min(fullH, Math.round(sheetH - dragY))) : 0
  );

  onMount(() => {
    const onResize = (): void => {
      viewportH = window.innerHeight;
      measuredTopH = readCssPx('--shell-top-h', 98);
      measuredBottomH = readCssPx('--shell-bottom-h', 58);
    };
    onResize();
    reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mo = new MutationObserver(() => {
      const nextTop = readCssPx('--shell-top-h', 98);
      const nextBottom = readCssPx('--shell-bottom-h', 58);
      if (nextTop !== measuredTopH) measuredTopH = nextTop;
      if (nextBottom !== measuredBottomH) measuredBottomH = nextBottom;
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => onResize())
        : null;
    ro?.observe(document.documentElement);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      mo.disconnect();
      ro?.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  });

  // Publish --shell-sheet-h on <html> so the map keeps selected provinces visible.
  $effect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--shell-sheet-h', `${effectiveSheetH}px`);
  });

  onDestroy(() => {
    if (sideAnimTimer) clearTimeout(sideAnimTimer);
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--shell-sheet-h', '0px');
    }
  });

  let prevOpen = untrack(() => open);
  let prevDefaultSnap = untrack(() => defaultSnap);

  $effect(() => {
    const targetSnap = defaultSnap;
    const isOpening = open && !prevOpen;
    if (isOpening) {
      fx('tap');
      viewportH = window.innerHeight;
      measuredTopH = readCssPx('--shell-top-h', 98);
      measuredBottomH = readCssPx('--shell-bottom-h', 58);
      if (!isPortrait) {
        animateSideEnter = true;
        if (sideAnimTimer) clearTimeout(sideAnimTimer);
        sideAnimTimer = setTimeout(() => {
          animateSideEnter = false;
        }, 180);
      }
      if (isPortrait) {
        snap = targetSnap;
        dragY = 0;
        dragging = false;
        dragStartY = null;
      }
    } else if (open && targetSnap !== prevDefaultSnap) {
      viewportH = window.innerHeight;
      measuredTopH = readCssPx('--shell-top-h', 98);
      measuredBottomH = readCssPx('--shell-bottom-h', 58);
      if (isPortrait) {
        snap = targetSnap;
        dragY = 0;
        dragging = false;
        dragStartY = null;
      }
    } else if (!open && prevOpen) {
      animateSideEnter = false;
      if (sideAnimTimer) clearTimeout(sideAnimTimer);
      fx('cancel');
    }
    prevOpen = open;
    prevDefaultSnap = targetSnap;
  });

  let prevOpenForScroll = untrack(() => open);
  let prevSecForScroll = untrack(() => sectionKey);
  let prevTabForScroll = untrack(() => subTabKey);
  let appliedSec = untrack(() => (open ? sectionKey : ''));
  let appliedTab = untrack(() => (open ? subTabKey : ''));

  // Capture sub-tab scroll BEFORE Svelte swaps DOM children (switching to a shorter
  // tab otherwise clamps scrollTop down to 0 before a post-DOM $effect can read it).
  $effect.pre(() => {
    const isOpen = open;
    const curSec = sectionKey;
    const curTab = subTabKey;
    const el = scrollEl;
    if (el && prevOpenForScroll && prevSecForScroll) {
      if (!isOpen || curSec !== prevSecForScroll || curTab !== prevTabForScroll) {
        subTabScrollMap.set(`${prevSecForScroll}:${prevTabForScroll}`, el.scrollTop);
      }
    }
    prevOpenForScroll = isOpen;
    prevSecForScroll = curSec;
    prevTabForScroll = curTab;
  });

  // Reset scroll when switching section; restore saved scroll when switching sub-tab.
  $effect(() => {
    const isOpen = open;
    const curSec = sectionKey;
    const curTab = subTabKey;
    const el = scrollEl;

    if (!isOpen || !el) {
      appliedSec = '';
      appliedTab = '';
      return;
    }

    if (curSec !== appliedSec) {
      appliedSec = curSec;
      appliedTab = curTab;
      requestAnimationFrame(() => {
        if (scrollEl) scrollEl.scrollTop = 0;
      });
    } else if (curTab !== appliedTab) {
      appliedTab = curTab;
      const saved = subTabScrollMap.get(`${curSec}:${curTab}`) ?? 0;
      requestAnimationFrame(() => {
        if (scrollEl) scrollEl.scrollTop = saved;
      });
    }
  });

  function togglePortraitSnap(): void {
    if (!isPortrait) return;
    fx('tap');
    snap = snap === 2 ? 1 : 2;
  }

  function onDragStart(event: PointerEvent): void {
    if (!isPortrait) return;
    viewportH = window.innerHeight;
    measuredTopH = readCssPx('--shell-top-h', 98);
    measuredBottomH = readCssPx('--shell-bottom-h', 58);
    dragStartY = event.clientY;
    dragStartH = snap === 2 ? Math.max(240, viewportH - measuredTopH - measuredBottomH) : sheetH;
    dragging = true;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function onDragMove(event: PointerEvent): void {
    if (dragStartY === null) return;
    const raw = event.clientY - dragStartY;
    const maxUp = Math.max(0, fullH - dragStartH);
    const minH = 84;
    const maxDown = Math.max(0, dragStartH - minH);
    dragY = Math.max(-maxUp, Math.min(raw, maxDown));
  }

  function onDragEnd(): void {
    if (dragStartY === null) return;
    const visualH = dragStartH - dragY;
    dragStartY = null;
    dragging = false;
    dragY = 0;
    if (visualH < heights[0] - 42) {
      onclose();
      return;
    }
    let best: 0 | 1 | 2 = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    heights.forEach((h, i) => {
      const distance = Math.abs(h - visualH);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i as 0 | 1 | 2;
      }
    });
    if (best !== snap) fx('tap');
    snap = best;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!open || event.key !== 'Escape' || event.defaultPrevented) return;
    if (
      typeof document !== 'undefined' &&
      document.querySelector(
        '[aria-modal="true"]:not([data-sheet-root]), dialog[open], [data-topbar-popover], [data-tour-overlay]'
      )
    ) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    onclose();
  }

  let panelStyle = $derived.by(() => {
    if (isPortrait) {
      if (snap === 2 && !dragging && dragY === 0) {
        return 'top: var(--shell-top-h); bottom: var(--shell-bottom-h, 58px); height: auto; transform: none; transition: none;';
      }
      const transitionRule =
        dragging || reducedMotion
          ? 'none'
          : 'height .18s ease-out, transform .18s ease-out';
      return `bottom: var(--shell-bottom-h, 58px); height: ${sheetH}px; transform: translateY(${dragY}px); transition: ${transitionRule};`;
    }
    if (layout === 'phone-l') {
      return 'inset-block-start: var(--shell-top-h); inset-block-end: 0; inset-inline-end: 0; width: min(420px, calc(var(--vp-w) - var(--shell-rail-w, 72px)));';
    }
    return `inset-block-start: var(--shell-top-h); inset-block-end: 0; inset-inline-end: 0; width: min(${widthToken}, calc(var(--vp-w) - var(--shell-rail-w, 92px)));`;
  });
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  {#if isPhone}
    <div
      class="fixed inset-x-0 top-0 z-[38] bg-[var(--c-bg)]/55 shell-fade-in {mapInteractive
        ? 'pointer-events-none'
        : 'pointer-events-auto'}"
      style="bottom: var(--shell-bottom-h, 0px);"
      role="presentation"
      onclick={onclose}
      aria-hidden="true"
    ></div>
  {/if}

  <div
    use:focusTrap={{ enabled: isPhone }}
    data-sheet-root
    role="dialog"
    aria-modal={isPhone ? 'true' : undefined}
    aria-label={title}
    data-tour={tourId || undefined}
    class="hud-chrome pointer-events-auto fixed z-[39] flex flex-col overflow-hidden border-[var(--c-line)] bg-[var(--c-bg)] text-[var(--c-text)] font-arabic select-none
      {isPortrait
        ? `inset-x-0 border-t-2 border-t-[var(--c-accent)] ${snap === 2 ? '' : 'shell-enter-bottom'}`
        : `border-s ${animateSideEnter ? 'shell-enter-side' : ''}`}"
    style={panelStyle}
  >
    {#if isPortrait}
      <!-- Slim drag strip to switch peek / half / full -->
      <div
        class="flex h-4 w-full shrink-0 cursor-grab touch-none items-center justify-center bg-[var(--c-panel)] active:cursor-grabbing"
        role="separator"
        aria-label="سحب اللوحة لتغيير الحجم"
        onpointerdown={onDragStart}
        onpointermove={onDragMove}
        onpointerup={onDragEnd}
        onpointercancel={onDragEnd}
      >
        <span class="block h-[2px] w-8 bg-[var(--c-line-strong)]"></span>
      </div>
    {/if}

    <!-- Single compact header: title + close only, no eyebrow -->
    <header class="flex h-[42px] min-[1600px]:h-[46px] shrink-0 items-center justify-between gap-2 border-b border-[var(--c-line)] bg-[var(--c-panel)] px-3 min-[1600px]:px-4">
      {#if isPortrait}
        <button
          type="button"
          onclick={togglePortraitSnap}
          aria-label={snap === 2 ? 'تصغير اللوحة إلى النصف' : 'توسيع اللوحة لملء الشاشة'}
          class="pressable flex h-11 min-w-0 flex-1 items-center justify-start gap-2 text-start"
        >
          <h2 class="min-w-0 truncate font-heading text-[16px] font-bold leading-[1.4] text-[var(--c-text)]">
            {title}
          </h2>
          <GameIcon name={snap === 2 ? 'chevron-down' : 'chevron-up'} cls="h-4 w-4 shrink-0 text-[var(--c-muted)]" />
        </button>
      {:else}
        <h2 class="min-w-0 flex-1 truncate font-heading text-[16px] min-[1600px]:text-[17px] min-[2200px]:text-[18px] font-bold leading-[1.4] text-[var(--c-text)]">
          {title}
        </h2>
      {/if}

      <button
        type="button"
        onclick={onclose}
        class="pressable flex h-10 w-10 phone-p:h-11 phone-p:w-11 phone-l:h-11 phone-l:w-11 shrink-0 items-center justify-center text-[var(--c-muted)] hover:text-[var(--c-text)]"
        aria-label="إغلاق اللوحة"
        title={isPhone ? 'إغلاق اللوحة' : 'إغلاق اللوحة (Esc)'}
      >
        <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
      </button>
    </header>

    <div
      bind:this={scrollEl}
      class="sheet-body scroll-area min-h-0 flex-1 overflow-y-auto px-[var(--sheet-px,16px)] phone-p:px-3 phone-l:px-3 pt-0 {isLandscape
        ? 'pb-[calc(1rem+env(safe-area-inset-bottom))]'
        : 'pb-[calc(1.25rem+env(safe-area-inset-bottom))]'} focus:outline-none"
      style="container-type: inline-size; container-name: sheet-body;"
      tabindex="-1"
      data-autofocus
    >
      {@render children()}
    </div>

    {#if footer}
      <div class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-[var(--sheet-px,16px)] phone-p:px-3 phone-l:px-3 py-2">
        {@render footer()}
      </div>
    {/if}
  </div>
{/if}
