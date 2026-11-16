<script lang="ts">
  import { CATEGORIES, type ForecastSlotView } from '../engine';
  import Glyph from './Glyph.svelte';

  let {
    slots,
    revealed = false,
  }: {
    slots: [ForecastSlotView, ForecastSlotView, ForecastSlotView, ForecastSlotView];
    revealed?: boolean;
  } = $props();
</script>

<div class="crisis-board-group" aria-label="شريط التوقعات للجولة بعد المقبلة">
  <div class="crisis-board-row">
    {#each slots as slot, lane (lane)}
      {#if slot.status === 'empty'}
        <div
          class="h-[16px] w-full border border-[var(--c-line)]/45 bg-transparent sm:h-[18px] lg:h-[22px]"
          title="لا موجة متوقعة في هذا المسار"
        ></div>
      {:else if slot.status === 'hidden'}
        <div
          class="crisis-hatch-dark flex h-[16px] w-full items-center justify-center border border-[var(--c-line)] bg-[var(--c-strip)] text-[11px] font-bold leading-none text-[var(--c-muted)] sm:h-[18px] lg:h-[22px] lg:text-[12px]"
          title="مسار مظلم — التوقع مخفي"
        >
          ؟
        </div>
      {:else if slot.status === 'silhouette'}
        <div
          data-cat={slot.category}
          class="flex h-[16px] w-full items-center justify-center border border-[var(--c-line)] bg-[var(--c-strip)] sm:h-[18px] lg:h-[22px]"
          title={`موجة قادمة: ${CATEGORIES[slot.category].name}`}
        >
          <span style="color: var(--cat-color);">
            <Glyph name={slot.glyph} cls="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
          </span>
        </div>
      {:else}
        <div
          data-cat={slot.category}
          class="flex h-[16px] w-full items-center justify-between gap-0.5 border border-[var(--c-line-strong)] bg-[var(--c-ev-bg)] px-1.5 sm:h-[18px] lg:h-[22px]"
          title={`${slot.name} (${slot.power}/${slot.health})`}
        >
          <span class="flex items-center gap-1 truncate" style="color: var(--cat-color);">
            <Glyph name={CATEGORIES[slot.category].glyph} cls="h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5" />
            <span class="hidden truncate text-[10px] font-bold text-[var(--c-text)] lg:inline">{slot.name}</span>
          </span>
          <span class="num text-[10px] font-bold leading-none text-[var(--c-text)] lg:text-[11px]">
            <bdi dir="ltr">{slot.power}/{slot.health}</bdi>
          </span>
        </div>
      {/if}
    {/each}
  </div>
</div>
