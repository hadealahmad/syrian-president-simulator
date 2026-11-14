<script lang="ts">
  import GameIcon from '../GameIcon.svelte';
  import StatTile from '../kit/StatTile.svelte';
  import MeterBar from './MeterBar.svelte';
  import { fx } from './fx-bridge';
  import type { StatFmt } from './stat-catalog';

  interface Props {
    label: string;
    icon?: string;
    fmt?: StatFmt;
    value: string;
    suffix?: string;
    projected?: string;
    pctChange?: number;
    pctText?: string;
    delta?: string;
    deltaArrow?: '▲' | '▼' | '';
    changed?: boolean;
    beneficial?: boolean;
    valueTone?: 'default' | 'pos' | 'neg' | 'accent';
    fillClass?: string;
    min?: number;
    max?: number;
    dangerAt?: number;
    current?: number;
    projectedValue?: number | null;
    explainer?: string;
    statId?: string;
    selected?: boolean;
    onfilter?: (id: string) => void;
    wide?: boolean;
  }

  let {
    label,
    value,
    suffix = '',
    projected = '',
    pctText = '',
    delta = '',
    deltaArrow = '',
    changed = false,
    beneficial = false,
    valueTone = 'default',
    fillClass = 'bg-[var(--c-pos)]',
    min = Number.NaN,
    max = Number.NaN,
    dangerAt,
    current = 0,
    projectedValue = null,
    explainer = '',
    statId = '',
    selected = false,
    onfilter,
    wide = false,
  }: Props = $props();

  let helpOpen = $state(false);
  let hasRange = $derived(min === 0 && max === 100);

  let deltaTone = $derived<'pos' | 'neg' | 'muted'>(
    changed ? (beneficial ? 'pos' : 'neg') : 'muted'
  );
</script>

{#snippet deltaRow()}
  <span class="inline-flex flex-wrap items-baseline gap-1" dir="rtl">
    {#if projected}
      <span aria-hidden="true">←</span>
      <bdi dir="ltr">{projected}</bdi>
    {/if}
    {#if delta}
      <bdi dir="ltr" class="text-[10.5px]">({deltaArrow ? `${deltaArrow} ` : ''}{delta})</bdi>
    {/if}
  </span>
{/snippet}

{#snippet tileActions()}
  {#if explainer}
    <button
      type="button"
      onclick={(e) => {
        e.stopPropagation();
        helpOpen = !helpOpen;
        fx('tap');
      }}
      aria-expanded={helpOpen}
      aria-label="شرح مؤشر {label}"
      title="شرح المؤشر"
      class="pressable flex h-11 w-11 -my-3 -mx-1.5 items-center justify-center opacity-75 transition-opacity hover:opacity-100 {helpOpen
        ? 'text-[var(--c-accent)] opacity-100'
        : 'text-[var(--c-muted)] hover:text-[var(--c-text)]'}"
    >
      <GameIcon name="help" cls="h-3.5 w-3.5 shrink-0" />
    </button>
  {/if}

  {#if statId && onfilter}
    <button
      type="button"
      onclick={(e) => {
        e.stopPropagation();
        fx(selected ? 'cancel' : 'select');
        onfilter(statId);
      }}
      aria-pressed={selected}
      aria-label={selected ? `إلغاء التصفية: ${label}` : `الخيارات المرتبطة: ${label}`}
      title={selected ? 'إلغاء التصفية' : 'الخيارات المرتبطة'}
      class="pressable flex h-11 w-11 -my-3 -ms-1.5 -me-3 items-center justify-center opacity-75 transition-opacity hover:opacity-100 {selected
        ? 'text-[var(--c-text)] opacity-100'
        : 'text-[var(--c-muted)] hover:text-[var(--c-text)]'}"
    >
      <GameIcon name={selected ? 'cross-mark' : 'filter'} cls="h-3.5 w-3.5 shrink-0" />
    </button>
  {/if}
{/snippet}

<article
  class="relative flex h-full min-w-0 flex-col justify-between border bg-[var(--c-panel)] {wide
    ? 'oc-kpi-last-wide'
    : ''} {selected ? 'border-[var(--c-text)]' : 'border-[var(--c-line)]'}"
>
  <StatTile
    {label}
    {value}
    unit={suffix}
    {valueTone}
    {deltaTone}
    deltaContent={changed ? deltaRow : undefined}
    headerActions={explainer || (statId && onfilter) ? tileActions : undefined}
    class="!flex-1 !border-0 !bg-transparent"
  />

  {#if hasRange}
    <div class="px-2.5 pb-2">
      <MeterBar
        {min}
        {max}
        {dangerAt}
        {current}
        projected={projectedValue}
        {fillClass}
        sizeClass="h-[3px]"
      />
    </div>
  {/if}

  {#if helpOpen && explainer}
    <div class="border-t border-[var(--c-line)] bg-[var(--c-strip)] px-2.5 py-2 text-[11.5px] leading-relaxed text-[var(--c-text-2)]">
      <p>{explainer}</p>
      {#if changed && pctText}
        <p class="mt-1 text-[11px] font-bold text-[var(--c-muted)]">
          نسبة التغير المتوقعة:
          <bdi dir="ltr" class="oc-kit-num text-[var(--c-text)]">{pctText}</bdi>
        </p>
      {/if}
    </div>
  {/if}
</article>
