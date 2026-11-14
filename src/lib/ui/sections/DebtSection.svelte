<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { previewRangesStore } from '../../stores/draft-store';
  import Meters, { type MeterItem } from '../kit/Meters.svelte';
  import EmergencyPanel from '../panels/EmergencyPanel.svelte';

  let debtB = $derived(($gameStore.macro.sovereignDebtUSD / 1_000_000_000).toFixed(2));
  let reservesM = $derived(Math.round($gameStore.macro.reservesUSD / 1_000_000));
  let debtServiceM = $derived.by(() => {
    const raw = ($previewRangesStore.debtServiceUSD ?? 0) / 1_000_000;
    return Number.isInteger(raw) ? String(raw) : raw.toFixed(1);
  });

  let meters = $derived<MeterItem[]>([
    {
      label: 'الدين الخارجي',
      value: `$${debtB}B`,
      tone: $gameStore.macro.sovereignDebtUSD > 0 ? 'neg' : 'pos',
    },
    {
      label: 'الاحتياطي',
      value: `$${reservesM}M`,
      tone: $gameStore.macro.reservesUSD < 100_000_000 ? 'neg' : 'default',
    },
    {
      label: 'خدمة الدين / دور',
      value: `$${debtServiceM}M`,
      tone: 'default',
    },
  ]);
</script>

<div class="flex flex-col">
  <div class="sticky top-0 z-20 bg-[var(--c-bg)]">
    <Meters items={meters} columns={3} flush />
  </div>
  <div class="pt-2">
    <EmergencyPanel />
  </div>
</div>
