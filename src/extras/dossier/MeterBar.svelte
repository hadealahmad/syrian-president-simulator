<script lang="ts">
  import GameIcon from '../../lib/ui/GameIcon.svelte';
  import { METER_IDS, type MeterId } from './engine/types';
  import { METER_META } from './ui-helpers';

  let {
    meters,
    deltas,
    hints,
  }: {
    meters: Record<MeterId, number>;
    deltas: Record<MeterId, number> | null;
    hints: Record<MeterId, 0 | 1 | 2 | 3>;
  } = $props();

  const DOT_SIZES: Record<1 | 2 | 3, string> = {
    1: 'h-[6px] w-[6px]',
    2: 'h-[9px] w-[9px]',
    3: 'h-[12px] w-[12px]',
  };
</script>

<section
  aria-label="موازين الدولة الأربعة"
  class="grid grid-cols-4 border border-[var(--c-line)] bg-[var(--c-panel)]"
>
  {#each METER_IDS as id (id)}
    {@const meta = METER_META[id]}
    {@const val = meters[id]}
    {@const delta = deltas ? deltas[id] : 0}
    {@const mag = hints[id]}
    {@const isCritical = val <= 20}
    <div
      class="relative flex min-w-0 flex-col justify-between gap-1 border-s border-[var(--c-line)] first:border-s-0 px-2 py-2 sm:px-3 sm:py-2.5"
    >
      <div class="flex min-h-[16px] items-center justify-between gap-1">
        <span class="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium leading-none text-[var(--c-muted)] sm:text-[12px]">
          <GameIcon name={meta.icon} cls="h-3 w-3 shrink-0 opacity-80 hidden min-[380px]:inline-block" />
          <span class="truncate">{meta.label}</span>
        </span>
        {#if mag === 1 || mag === 2 || mag === 3}
          <span
            aria-label="يتأثر بهذا القرار"
            class="shrink-0 bg-[var(--c-accent)] transition-transform duration-100 {DOT_SIZES[mag]}"
          ></span>
        {/if}
      </div>

      <div class="flex min-w-0 items-baseline justify-between gap-1 pb-1 leading-none">
        <bdi
          dir="ltr"
          class="num text-[18px] font-bold tracking-tight sm:text-[20px] md:text-[22px] {isCritical
            ? 'text-[var(--c-neg)]'
            : 'text-[var(--c-text)]'}"
        >
          {val}
        </bdi>

        {#if delta !== 0}
          <bdi
            dir="ltr"
            class="num text-[11px] font-bold leading-none sm:text-[12px] {delta > 0
              ? 'text-[var(--c-pos)]'
              : 'text-[var(--c-neg)]'}"
          >
            {delta > 0 ? '▲' : '▼'}{Math.abs(delta)}
          </bdi>
        {/if}
      </div>

      <div class="h-[3px] w-full bg-[var(--c-track)]" aria-hidden="true">
        <div
          class="h-full transition-[width] duration-200"
          style="width: {Math.max(0, Math.min(100, val))}%; background: {isCritical
            ? 'var(--c-neg)'
            : meta.strokeColor};"
        ></div>
      </div>
    </div>
  {/each}
</section>
