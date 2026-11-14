<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import MeterBar from './MeterBar.svelte';
  import { fx } from './fx-bridge';

  let commissions = $derived(Object.values($gameStore.commissions));
  let avgProgress = $derived(
    commissions.length > 0
      ? Math.round(commissions.reduce((acc, c) => acc + c.progress, 0) / commissions.length)
      : 0
  );

  let groupOpen = $state(true);
</script>

<section class="border border-[var(--c-line)] bg-[var(--c-panel)]">
  <button
    type="button"
    onclick={() => {
      groupOpen = !groupOpen;
      fx('tap');
    }}
    aria-expanded={groupOpen}
    class="pressable flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-start hover:bg-[var(--c-strip)]"
  >
    <span class="text-[12px] font-bold text-[var(--c-text)]">
      الهيئات واللجان السيادية
    </span>
    <span class="flex items-center gap-2 text-[11px] text-[var(--c-muted)]">
      <span class="oc-kit-num">{commissions.length} هيئة</span>
      <span aria-hidden="true" class="oc-kit-num text-[14px] font-bold leading-none">
        {groupOpen ? '−' : '+'}
      </span>
    </span>
  </button>

  {#if groupOpen}
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-t border-[var(--c-line)] bg-[var(--c-strip)] text-[11px] text-[var(--c-muted)]">
          <th scope="col" class="px-3 py-1.5 text-start font-medium">الهيئة والرئيس</th>
          <th scope="col" class="w-24 px-3 py-1.5 text-end font-medium">الإنجاز</th>
        </tr>
      </thead>
      <tbody>
        {#each commissions as comm (comm.id)}
          <tr class="border-t border-[var(--c-line)]">
            <td class="px-3 py-2 align-top">
              <div class="text-[13px] font-bold leading-[1.4] text-[var(--c-text)]">
                {comm.nameAr}
              </div>
              {#if comm.leaderNameAr}
                <div class="mt-0.5 text-[11.5px] leading-[1.4] text-[var(--c-muted)]">
                  رئيس الهيئة: <span class="text-[var(--c-text-2)]">{comm.leaderNameAr}</span>
                </div>
              {/if}
            </td>
            <td class="w-24 px-3 py-2 text-end align-middle">
              <div class="flex flex-col items-end gap-1">
                <span
                  dir="ltr"
                  class="oc-kit-num text-[15px] font-bold leading-none tabular-nums text-[var(--c-text)]"
                >
                  {comm.progress}<span class="text-[11px] font-normal text-[var(--c-muted)]">%</span>
                </span>
                <MeterBar
                  min={0}
                  max={100}
                  current={comm.progress}
                  fillClass="bg-[var(--c-accent)]"
                  sizeClass="h-[3px]"
                />
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr class="border-t border-[var(--c-line-strong)] bg-[var(--c-strip)]">
          <th scope="row" class="px-3 py-2 text-start text-[12px] font-bold text-[var(--c-text)]">
            متوسط الإنجاز الكلي
          </th>
          <td class="oc-kit-num px-3 py-2 text-end text-[16px] font-bold leading-none tabular-nums text-[var(--c-text)]">
            <bdi dir="ltr">{avgProgress}<span class="text-[11px] font-normal text-[var(--c-muted)]">%</span></bdi>
          </td>
        </tr>
      </tfoot>
    </table>
  {/if}
</section>
