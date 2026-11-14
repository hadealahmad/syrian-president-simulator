<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import type { TopStat } from './topbar-stats';
  import type { ShellLayout } from './viewport';

  interface Props {
    stat: TopStat;
    layout: ShellLayout;
    expanded: boolean;
    selected: boolean;
    onclick: () => void;
    class?: string;
  }

  let {
    stat,
    layout,
    expanded,
    selected,
    onclick,
    class: extraClass = '',
  }: Props = $props();

  let displayRaw = $state(untrack(() => stat.rawCurrent));
  let floatDelta = $state<{ id: number; text: string; beneficial: boolean } | null>(null);

  let prevCurrent = untrack(() => stat.rawCurrent);
  let prevProjected = untrack(() => stat.rawProjected);
  let rafId: number | null = null;
  let floatTimer: ReturnType<typeof setTimeout> | null = null;
  let floatSeq = 0;

  const LOWER_IS_BETTER = new Set([
    'unrestIndex',
    'systemicCorruption',
    'parallelRate',
    'sovereignDebtUSD',
  ]);

  function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function showFloatingDelta(text: string, beneficial: boolean): void {
    floatSeq += 1;
    floatDelta = { id: floatSeq, text, beneficial };
    if (floatTimer) clearTimeout(floatTimer);
    floatTimer = setTimeout(() => {
      floatDelta = null;
    }, 820);
  }

  $effect(() => {
    const target = stat.rawCurrent;
    const projected = stat.rawProjected;

    if (target !== prevCurrent) {
      const from = displayRaw;
      const diff = target - prevCurrent;
      prevCurrent = target;
      prevProjected = projected;

      if (Math.abs(diff) > 1e-6) {
        const isUp = diff > 0;
        const beneficial = LOWER_IS_BETTER.has(stat.id) ? !isUp : isUp;
        const arrow = isUp ? '▲' : '▼';
        const sign = isUp ? '+' : '−';
        showFloatingDelta(`${arrow} ${sign}${stat.formatValue(Math.abs(diff))}`, beneficial);
      }

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      if (prefersReducedMotion()) {
        displayRaw = target;
        return;
      }

      const start = performance.now();
      const duration = 400;
      const step = (now: number): void => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        displayRaw = from + (target - from) * eased;
        if (t < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          displayRaw = target;
          rafId = null;
        }
      };
      rafId = requestAnimationFrame(step);
      return;
    }

    if (projected !== prevProjected) {
      prevProjected = projected;
    }
  });

  onDestroy(() => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (floatTimer) clearTimeout(floatTimer);
  });

  let displayValue = $derived(stat.formatValue(displayRaw));
  let isPortrait = $derived(layout === 'phone-p');
  let isLandscape = $derived(layout === 'phone-l');
  let activeSuffix = $derived(isLandscape ? (stat.shortSuffix ?? stat.suffix) : stat.suffix);
  let hasArabicSuffix = $derived(/[\u0600-\u06FF]/.test(activeSuffix));
  let deltaColorClass = $derived(
    !stat.hasDelta
      ? 'text-[var(--c-line-strong)]'
      : stat.beneficial
        ? 'text-[var(--c-pos)]'
        : 'text-[var(--c-neg)]'
  );
  let valueColorClass = $derived(stat.isCritical ? 'text-[var(--c-neg)]' : stat.toneClass);
</script>

<button
  type="button"
  data-tour={stat.tour}
  {onclick}
  aria-haspopup="dialog"
  aria-expanded={expanded}
  aria-pressed={selected}
  title={stat.explainer}
  class="pressable group relative grid min-w-0 content-between border-s border-[var(--c-line)] first:border-s-0 text-start transition-colors
    {isPortrait
      ? 'min-h-[58px] grid-rows-[15px_1fr_14px] px-1.5 py-1.5'
      : isLandscape
        ? 'min-h-[50px] flex-1 grid-rows-[13px_1fr_13px] px-1.5 py-1'
        : 'h-full flex-1 basis-0 max-w-[200px] min-[1600px]:max-w-[216px] min-[2200px]:max-w-[244px] last:border-e content-center grid-rows-[auto_auto] gap-0.5 px-3 min-[1600px]:px-3.5 py-1.5'}
    {selected || expanded
      ? 'bg-[var(--c-chip-bg)]'
      : 'bg-transparent hover:bg-[var(--c-panel)]'}
    {extraClass}"
>
  {#if isPortrait}
    <!-- Portrait phone: label above, big number, absolute change below on fixed baseline grid -->
    <span class="block w-full truncate self-center text-[11px] font-medium leading-[1.3] text-[var(--c-muted)]">
      {stat.shortLabelAr}
    </span>
    <span dir="ltr" class="flex w-full items-baseline justify-end {hasArabicSuffix ? 'gap-1' : 'gap-0'} self-center whitespace-nowrap leading-[1.15]">
      <bdi dir="ltr" class="num text-[16px] min-[400px]:text-[18px] font-bold tracking-tight {valueColorClass}">
        {stat.prefix ?? ''}{displayValue}{#if !hasArabicSuffix && activeSuffix}<small class="text-[11px] font-medium text-[var(--c-muted)]">{activeSuffix}</small>{/if}
      </bdi>
      {#if hasArabicSuffix && activeSuffix}
        <bdi dir="rtl" class="text-[11px] font-medium text-[var(--c-muted)]">
          {activeSuffix}
        </bdi>
      {/if}
    </span>
    <span class="num flex w-full items-center justify-start self-center text-[11px] font-bold leading-none {deltaColorClass}">
      {#if stat.hasDelta}
        <bdi dir="ltr">{stat.deltaArrow} {stat.deltaText}</bdi>
      {:else}
        —
      {/if}
    </span>
  {:else if isLandscape}
    <!-- Landscape phone: aligned 3-row stack (label top, value middle, change bottom) -->
    <span class="block w-full truncate self-center text-[10.5px] font-medium leading-none text-[var(--c-muted)]">
      {stat.shortLabelAr}
    </span>
    <span dir="ltr" class="flex w-full items-baseline justify-end {hasArabicSuffix ? 'gap-0.5' : 'gap-0'} self-center whitespace-nowrap leading-none">
      <bdi dir="ltr" class="num text-[13.5px] font-bold tracking-tight {valueColorClass}">
        {stat.prefix ?? ''}{displayValue}{#if !hasArabicSuffix && activeSuffix}<small class="text-[10px] font-medium text-[var(--c-muted)]">{activeSuffix}</small>{/if}
      </bdi>
      {#if hasArabicSuffix && activeSuffix}
        <bdi dir="rtl" class="text-[10px] font-medium text-[var(--c-muted)]">
          {activeSuffix}
        </bdi>
      {/if}
    </span>
    <span class="num flex w-full items-center justify-start self-center text-[10px] font-bold leading-none {deltaColorClass}">
      {#if stat.hasDelta}
        <bdi dir="ltr">{stat.deltaArrow} {stat.deltaText}</bdi>
      {:else}
        —
      {/if}
    </span>
  {:else}
    <!-- Desktop: content-led ruled cell — label top, value + change adjacent 8px apart on baseline -->
    <span class="block w-full truncate self-center text-[11.5px] min-[1600px]:text-[12.5px] min-[2200px]:text-[13.5px] font-medium leading-[1.3] text-[var(--c-muted)]">
      {stat.labelAr}
    </span>
    <span class="flex w-full min-w-0 items-baseline justify-start gap-2 self-center leading-none">
      <span dir="ltr" class="inline-flex shrink-0 items-baseline {hasArabicSuffix ? 'gap-1' : 'gap-0'} whitespace-nowrap leading-none">
        <bdi dir="ltr" class="num text-[19px] min-[1600px]:text-[21px] min-[2200px]:text-[24px] font-bold tracking-tight {valueColorClass}">
          {stat.prefix ?? ''}{displayValue}{#if !hasArabicSuffix && activeSuffix}<small class="text-[11px] min-[1600px]:text-[12px] min-[2200px]:text-[13px] font-medium text-[var(--c-muted)]">{activeSuffix}</small>{/if}
        </bdi>
        {#if hasArabicSuffix && activeSuffix}
          <bdi dir="rtl" class="text-[11px] min-[1600px]:text-[12px] min-[2200px]:text-[13px] font-medium text-[var(--c-muted)]">
            {activeSuffix}
          </bdi>
        {/if}
      </span>
      <span class="num min-w-0 truncate text-[11.5px] min-[1600px]:text-[12.5px] min-[2200px]:text-[13.5px] font-bold leading-none {deltaColorClass}">
        {#if stat.hasDelta}
          <bdi dir="ltr">{stat.deltaArrow} {stat.deltaText}</bdi>
        {:else}
          —
        {/if}
      </span>
    </span>
  {/if}

  {#if floatDelta}
    {#key floatDelta.id}
      <span
        dir="ltr"
        aria-hidden="true"
        class="shell-float-delta num pointer-events-none absolute top-0.5 inset-x-0 z-20 mx-auto w-max border px-1.5 py-0.5 text-[11px] font-bold leading-none
          {floatDelta.beneficial
            ? 'border-[var(--c-pos)] bg-[var(--c-bg)] text-[var(--c-pos)]'
            : 'border-[var(--c-neg)] bg-[var(--c-bg)] text-[var(--c-neg)]'}"
      >
        {floatDelta.text}
      </span>
    {/key}
  {/if}

  {#if selected}
    <span class="absolute bottom-0 inset-x-0 h-[2px] bg-[var(--c-accent)]" aria-hidden="true"></span>
  {/if}
</button>
