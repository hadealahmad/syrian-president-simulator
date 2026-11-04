<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import MeterBar from './MeterBar.svelte';

  // Sovereign commissions: completion as a big serif number + meter, leader
  // name kept exactly as the old list showed it.
  let commissions = $derived(Object.values($gameStore.commissions));
</script>

<section class="space-y-2">
  <h3 class="flex items-center gap-2 text-[9px] font-bold tracking-[1.2px] text-forest-accent/90">
    <span class="h-px w-3 bg-forest-accent/50" aria-hidden="true"></span>
    الهيئات واللجان السيادية
    <span class="ms-auto font-mono text-[8.5px] font-normal text-wheat-dark">{commissions.length} هيئة</span>
  </h3>

  <div class="grid grid-cols-1 gap-2 md:grid-cols-2 phone-l:grid-cols-1">
    {#each commissions as comm (comm.id)}
      <article class="border border-wheat-mid/15 bg-forest-mid/20 p-2.5 shell-round-item">
        <div class="flex items-start justify-between gap-2">
          <h4 class="min-w-0 text-[12px] font-bold leading-tight text-wheat-gold font-heading">
            {comm.nameAr}
          </h4>
          <div class="flex shrink-0 items-baseline gap-0.5">
            <span class="text-[8.5px] text-wheat-dark">إنجاز</span>
            <span dir="ltr" class="font-heading text-[20px] font-semibold leading-none text-wheat-gold">{comm.progress}</span>
            <span class="text-[9px] text-wheat-dark">%</span>
          </div>
        </div>

        <div class="mt-1.5">
          <MeterBar
            min={0}
            max={100}
            current={comm.progress}
            fillClass="bg-wheat-gold"
          />
        </div>

        {#if comm.leaderNameAr}
          <div class="mt-2 truncate text-[10px] text-wheat-dark">
            رئيس الهيئة: <span class="text-wheat-mid">{comm.leaderNameAr}</span>
          </div>
        {/if}
      </article>
    {/each}
  </div>
</section>
