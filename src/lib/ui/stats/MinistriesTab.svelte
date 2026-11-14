<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import MeterBar from './MeterBar.svelte';
  import { fx } from './fx-bridge';

  let ministries = $derived(Object.values($gameStore.ministries));
  let avgCompetence = $derived(
    ministries.length > 0
      ? Math.round(ministries.reduce((acc, m) => acc + m.competence, 0) / ministries.length)
      : 0
  );
  let oppositionCount = $derived(ministries.filter((m) => m.isOpposition).length);

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
      الحقائب التنفيذية وتصنيف الكفاءة
    </span>
    <span class="flex items-center gap-2 text-[11px] text-[var(--c-muted)]">
      <span class="oc-kit-num">{ministries.length} حقيبة</span>
      <span aria-hidden="true" class="oc-kit-num text-[14px] font-bold leading-none">
        {groupOpen ? '−' : '+'}
      </span>
    </span>
  </button>

  {#if groupOpen}
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-t border-[var(--c-line)] bg-[var(--c-strip)] text-[11px] text-[var(--c-muted)]">
          <th scope="col" class="px-3 py-1.5 text-start font-medium">الحقيبة والوزير</th>
          <th scope="col" class="w-24 px-3 py-1.5 text-end font-medium">الكفاءة</th>
        </tr>
      </thead>
      <tbody>
        {#each ministries as min (min.id)}
          <tr class="border-t border-[var(--c-line)]">
            <td class="px-3 py-2 align-top">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-[13px] font-bold leading-[1.4] text-[var(--c-text)]">
                  {min.nameAr}
                </span>
                {#if min.isOpposition}
                  <span class="border border-[var(--c-line-strong)] bg-[var(--c-strip)] px-1.5 py-0.5 text-[11px] font-bold leading-[1.3] text-[var(--c-text-2)]">
                    معارضة ائتلافية
                  </span>
                {/if}
              </div>
              <div class="mt-0.5 text-[11.5px] leading-[1.4] text-[var(--c-muted)]">
                الوزير: <span class="text-[var(--c-text-2)]">{min.ministerNameAr}</span>
              </div>
            </td>
            <td class="w-24 px-3 py-2 text-end align-middle">
              <div class="flex flex-col items-end gap-1">
                <span
                  dir="ltr"
                  class="oc-kit-num text-[15px] font-bold leading-none tabular-nums {min.competence >= 60
                    ? 'text-[var(--c-pos)]'
                    : min.competence >= 40
                      ? 'text-[var(--c-accent)]'
                      : 'text-[var(--c-neg)]'}"
                >
                  {min.competence}<span class="text-[11px] font-normal text-[var(--c-muted)]">%</span>
                </span>
                <MeterBar
                  min={0}
                  max={100}
                  current={min.competence}
                  sizeClass="h-[3px]"
                  fillClass={min.competence >= 60
                    ? 'bg-[var(--c-pos)]'
                    : min.competence >= 40
                      ? 'bg-[var(--c-accent)]'
                      : 'bg-[var(--c-neg)]'}
                />
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr class="border-t border-[var(--c-line-strong)] bg-[var(--c-strip)]">
          <th scope="row" class="px-3 py-2 text-start text-[12px] font-bold text-[var(--c-text)]">
            متوسط الكفاءة العام
            {#if oppositionCount > 0}
              <span class="ms-1.5 text-[11px] font-normal text-[var(--c-muted)]">
                · <span class="oc-kit-num">{oppositionCount}</span> ائتلافية
              </span>
            {/if}
          </th>
          <td class="oc-kit-num px-3 py-2 text-end text-[16px] font-bold leading-none tabular-nums text-[var(--c-text)]">
            <bdi dir="ltr">{avgCompetence}<span class="text-[11px] font-normal text-[var(--c-muted)]">%</span></bdi>
          </td>
        </tr>
      </tfoot>
    </table>
  {/if}
</section>
