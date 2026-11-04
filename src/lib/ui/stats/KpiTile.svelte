<script lang="ts">
  import GameIcon from '../GameIcon.svelte';
  import MeterBar from './MeterBar.svelte';

  // One projected-turn KPI tile: big current value, projected next-turn value,
  // delta chip, optional range meter, tappable explainer and the per-stat
  // "options related to this stat" toggle (uiStore.selectedStatForOptions).
  interface Props {
    label: string;
    icon: string;
    value: string;
    suffix?: string;
    projected?: string;
    delta?: string;
    changed?: boolean;
    beneficial?: boolean;
    valueClass?: string;
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
    /** Span both grid columns (used for an odd trailing tile). */
    wide?: boolean;
  }

  let {
    label,
    icon,
    value,
    suffix = '',
    projected = '',
    delta = '',
    changed = false,
    beneficial = false,
    valueClass = 'text-wheat-light',
    fillClass = 'bg-forest-accent',
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
  let hasRange = $derived(Number.isFinite(min) && Number.isFinite(max) && max > min);
</script>

<article
  class="flex min-w-0 flex-col gap-1.5 border p-2.5 shell-round-item transition-colors {wide
    ? 'col-span-2'
    : ''} {selected
    ? 'border-wheat-gold/70 bg-wheat-gold/[0.06]'
    : 'border-wheat-mid/15 bg-forest-mid/20'}"
>
  <header class="flex items-start gap-1.5">
    <span class="mt-px flex h-6 w-6 shrink-0 items-center justify-center bg-forest-mid/70 text-wheat-mid">
      <GameIcon name={icon} cls="h-3.5 w-3.5 shrink-0" />
    </span>
    <h3 class="min-w-0 flex-1 text-[10px] leading-tight text-wheat-dark">{label}</h3>
    {#if explainer}
      <button
        type="button"
        onclick={() => (helpOpen = !helpOpen)}
        aria-expanded={helpOpen}
        aria-label="شرح مؤشر {label}"
        title="شرح المؤشر"
        class="-me-1.5 -mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-wheat-gold phone-p:h-11 phone-p:w-11 phone-l:h-10 phone-l:w-10 {helpOpen
          ? 'text-wheat-gold'
          : ''}"
      >
        <GameIcon name="help" cls="h-3.5 w-3.5 shrink-0" />
      </button>
    {/if}
  </header>

  <div class="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
    <span dir="ltr" class="font-heading text-[23px] font-semibold leading-none {valueClass} phone-p:text-[20px] phone-l:text-[20px]">
      {value}
    </span>
    {#if suffix}<span class="text-[9px] leading-none text-wheat-dark">{suffix}</span>{/if}
  </div>

  {#if hasRange}
    <MeterBar
      {min}
      {max}
      {dangerAt}
      current={current}
      projected={projectedValue}
      fillClass={fillClass}
    />
  {/if}

  <div class="flex min-h-5 items-center justify-between gap-1.5 text-[9px]">
    <span class="text-wheat-dark">بعد الدور</span>
    {#if changed}
      <span class="flex items-center gap-1">
        <span aria-hidden="true" class="text-wheat-dark">←</span>
        <span dir="ltr" class="font-heading text-[13px] font-semibold leading-none {beneficial ? 'text-forest-accent' : 'text-umber-crimson'}">
          {projected}
        </span>
        <span
          dir="ltr"
          class="px-1 py-0.5 text-[8px] font-bold leading-none shell-round-chip {beneficial
            ? 'bg-status-ok/15 text-status-ok'
            : 'bg-umber-deep/80 text-umber-crimson'}"
        >
          {delta}
        </span>
      </span>
    {:else}
      <span class="text-wheat-dark/70">بلا تغيير</span>
    {/if}
  </div>

  {#if helpOpen && explainer}
    <p class="border-t border-wheat-mid/10 pt-1.5 text-[9.5px] leading-relaxed text-wheat-mid/90">
      {explainer}
    </p>
  {/if}

  {#if statId && onfilter}
    <button
      type="button"
      onclick={() => onfilter(statId)}
      aria-pressed={selected}
      class="mt-auto flex min-h-8 w-full items-center justify-center gap-1 border-t px-1 pt-1 text-[9px] font-bold leading-tight transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-wheat-gold phone-p:min-h-11 phone-l:min-h-10 {selected
        ? 'border-wheat-gold/40 text-wheat-gold'
        : 'border-wheat-mid/10 text-wheat-dark hover:text-wheat-gold'}"
    >
      <GameIcon name={selected ? 'cross-mark' : 'check-mark'} cls="h-3 w-3 shrink-0" />
      {selected ? 'إلغاء التصفية' : 'الخيارات المرتبطة'}
    </button>
  {/if}
</article>
