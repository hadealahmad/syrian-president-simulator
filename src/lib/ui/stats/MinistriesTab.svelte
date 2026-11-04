<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import MeterBar from './MeterBar.svelte';

  // Executive ministries: competence as a big serif number + meter, opposition
  // coalition flagged as a chip. Same fields as the old list, grouped in cards.
  let ministries = $derived(Object.values($gameStore.ministries));
</script>

<section class="space-y-2">
  <h3 class="flex items-center gap-2 text-[9px] font-bold tracking-[1.2px] text-forest-accent/90">
    <span class="h-px w-3 bg-forest-accent/50" aria-hidden="true"></span>
    الحقائب التنفيذية وتصنيف الكفاءة
    <span class="ms-auto font-mono text-[8.5px] font-normal text-wheat-dark">{ministries.length} حقيبة</span>
  </h3>

  <div class="grid grid-cols-1 gap-2 md:grid-cols-2 phone-l:grid-cols-1">
    {#each ministries as min (min.id)}
      <article class="border border-wheat-mid/15 bg-forest-mid/20 p-2.5 shell-round-item">
        <div class="flex items-start justify-between gap-2">
          <h4 class="min-w-0 text-[12px] font-bold leading-tight text-wheat-gold font-heading">
            {min.nameAr}
          </h4>
          <div class="flex shrink-0 items-baseline gap-0.5" dir="ltr">
            <span class="font-heading text-[20px] font-semibold leading-none text-forest-accent">{min.competence}</span>
            <span class="text-[9px] text-wheat-dark">%</span>
          </div>
        </div>

        <div class="mt-1.5">
          <MeterBar
            min={0}
            max={100}
            current={min.competence}
            fillClass={min.competence >= 60 ? 'bg-forest-accent' : min.competence >= 40 ? 'bg-status-warn' : 'bg-umber-crimson'}
          />
        </div>

        <div class="mt-2 flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-wheat-dark">
          <span class="min-w-0 truncate">الوزير: <span class="text-wheat-mid">{min.ministerNameAr}</span></span>
          {#if min.isOpposition}
            <span class="shrink-0 border border-wheat-gold/30 bg-wheat-gold/10 px-1.5 py-0.5 text-[8.5px] font-bold text-wheat-gold shell-round-chip">
              معارضة ائتلافية
            </span>
          {/if}
        </div>
      </article>
    {/each}
  </div>
</section>
