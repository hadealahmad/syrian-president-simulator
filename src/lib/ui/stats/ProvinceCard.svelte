<script lang="ts">
  import type { GovernorateNode } from '../../engine/types';
  import { STAT_EXPLAINERS_AR } from '../panels/shared';
  import { prriToneClass, TIER_CHIP, TIER_FILL, TIER_NAMES_AR } from './stat-catalog';

  // Compact province card: map silhouette, name + tier pill, then unrest,
  // blackout and damage as the headline numbers (plus the three secondary
  // figures the old cards carried). Tapping opens the provincial dossier via
  // the same store call map clicks use.
  interface Props {
    node: GovernorateNode;
    shape?: { d: string; vb: string };
    onselect: (id: string) => void;
  }

  let { node, shape, onselect }: Props = $props();

  let tierName = $derived(TIER_NAMES_AR[node.tier] ?? node.tier);
  let tierChip = $derived(TIER_CHIP[node.tier] ?? TIER_CHIP.CALM);
  let damageB = $derived((node.unrepairedDamageUSD / 1_000_000_000).toFixed(1));
  let capitalB = $derived((node.totalCapitalUSD / 1_000_000_000).toFixed(1));
  let reconstruction = $derived(Math.round(node.reconstructionScore * 100));
</script>

<button
  type="button"
  onclick={() => onselect(node.id)}
  aria-label="فتح ملف محافظة {node.nameAr}"
  class="group flex min-h-11 w-full min-w-0 flex-col gap-1.5 border border-wheat-mid/15 bg-forest-mid/20 p-2 text-start shell-round-item transition-colors hover:border-forest-accent/40 hover:bg-forest-accent/[0.06] focus-visible:border-wheat-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-wheat-gold"
>
  <div class="flex items-center gap-1.5">
    {#if shape}
      <svg
        viewBox={shape.vb}
        class="h-7 w-8 shrink-0"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <path
          d={shape.d}
          fill={TIER_FILL[node.tier] ?? 'var(--color-forest-accent-muted)'}
          fill-opacity="0.55"
          stroke="var(--color-wheat-mid)"
          stroke-width="1.5"
          vector-effect="non-scaling-stroke"
          stroke-linejoin="round"
        />
      </svg>
    {/if}
    <div class="min-w-0 flex-1">
      <div class="truncate text-[11.5px] font-bold leading-tight text-wheat-light font-heading">
        {node.nameAr}
      </div>
      <span
        class="mt-0.5 inline-flex items-center gap-1 border px-1.5 py-px text-[8px] font-bold shell-round-chip {tierChip}"
      >
        <span class="h-1 w-1 bg-current shell-round-chip" aria-hidden="true"></span>
        {tierName}
      </span>
    </div>
    <span class="shrink-0 text-[13px] leading-none text-wheat-dark transition-colors group-hover:text-wheat-gold" aria-hidden="true">←</span>
  </div>

  <div class="grid grid-cols-3 gap-1">
    <div class="min-w-0 border border-wheat-mid/10 bg-charcoal-deep/40 px-1.5 py-1" title={STAT_EXPLAINERS_AR.prri}>
      <div class="truncate text-[8px] text-wheat-dark">الاحتقان</div>
      <div class="flex items-baseline gap-0.5">
        <span dir="ltr" class="font-heading text-[14px] font-semibold leading-none {node.prri >= 65 ? 'text-umber-crimson' : node.prri >= 40 ? 'text-status-warn' : 'text-wheat-light'}">{node.prri}</span>
        <span class="text-[7.5px] text-wheat-dark">/100</span>
      </div>
      <div class="mt-1 h-0.5 w-full overflow-hidden bg-wheat-light/10 shell-round-chip">
        <span class="block h-full {prriToneClass(node.prri)}" style="width: {Math.min(100, Math.max(2, node.prri))}%"></span>
      </div>
    </div>

    <div class="min-w-0 border border-wheat-mid/10 bg-charcoal-deep/40 px-1.5 py-1" title={STAT_EXPLAINERS_AR.dailyPowerHours}>
      <div class="truncate text-[8px] text-wheat-dark">الظلام</div>
      <div class="flex items-baseline gap-0.5">
        <span dir="ltr" class="font-heading text-[14px] font-semibold leading-none {node.dailyBlackoutHours > 12 ? 'text-umber-crimson' : 'text-wheat-light'}">{node.dailyBlackoutHours}</span>
        <span class="text-[7.5px] text-wheat-dark">س/يوم</span>
      </div>
    </div>

    <div class="min-w-0 border border-wheat-mid/10 bg-charcoal-deep/40 px-1.5 py-1" title={STAT_EXPLAINERS_AR.unrepairedDamageUSD}>
      <div class="truncate text-[8px] text-wheat-dark">الخسائر</div>
      <div class="flex items-baseline gap-0.5">
        <span dir="ltr" class="font-heading text-[14px] font-semibold leading-none text-umber-crimson">{damageB}</span>
        <span class="text-[7.5px] text-wheat-dark">B$</span>
      </div>
    </div>
  </div>

  <div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 border-t border-wheat-mid/10 pt-1 text-[8.5px] text-wheat-dark">
    <span title={STAT_EXPLAINERS_AR.reconstructionScore}>
      الإعمار <span dir="ltr" class="font-mono font-bold text-wheat-gold">{reconstruction}%</span>
    </span>
    <span title={STAT_EXPLAINERS_AR.mineSaturationPct}>
      الألغام <span dir="ltr" class="font-mono font-bold {node.mineSaturationPct > 8 ? 'text-wheat-gold' : 'text-forest-accent'}">{node.mineSaturationPct}%</span>
    </span>
    <span title="إجمالي الأصول الرأسمالية قبل الحرب">
      أصول قبل الحرب <span dir="ltr" class="font-mono font-bold text-wheat-light">{capitalB}B$</span>
    </span>
  </div>
</button>
