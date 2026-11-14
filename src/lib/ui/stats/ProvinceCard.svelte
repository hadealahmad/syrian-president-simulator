<script lang="ts">
  import type { GovernorateNode } from '../../engine/types';
  import { STAT_EXPLAINERS_AR } from '../panels/shared';
  import { TIER_NAMES_AR } from './stat-catalog';
  import { fx } from './fx-bridge';

  interface Props {
    node: GovernorateNode;
    shape?: { d: string; vb: string };
    onselect: (id: string) => void;
  }

  let { node, onselect }: Props = $props();

  let tierName = $derived(TIER_NAMES_AR[node.tier] ?? node.tier);
  let damageB = $derived((node.unrepairedDamageUSD / 1_000_000_000).toFixed(1));
  let prriRounded = $derived(Math.min(100, Math.max(0, Math.round(node.prri))));

  let prriToneClass = $derived(
    prriRounded >= 85
      ? 'text-[var(--c-neg)]'
      : prriRounded >= 65
        ? 'text-[var(--c-neg)]'
        : prriRounded >= 40
          ? 'text-[var(--c-accent)]'
          : 'text-[var(--c-pos)]'
  );

  let prriBarClass = $derived(
    prriRounded >= 65
      ? 'bg-[var(--c-neg)]'
      : prriRounded >= 40
        ? 'bg-[var(--c-accent)]'
        : 'bg-[var(--c-pos)]'
  );
</script>

<button
  type="button"
  data-gov-id={node.id}
  onclick={() => {
    fx('select');
    onselect(node.id);
  }}
  aria-label="فتح ملف محافظة {node.nameAr}"
  class="pressable grid min-h-11 w-full grid-cols-[minmax(0,1.4fr)_52px_46px_54px_46px] items-center gap-1.5 border-t border-[var(--c-line)] bg-[var(--c-panel)] px-2.5 py-2 text-start hover:bg-[var(--c-strip)]"
>
  <span class="min-w-0">
    <span class="block truncate text-[12.5px] font-bold leading-[1.35] text-[var(--c-text)]">
      {node.nameAr}
    </span>
    <span class="block truncate text-[10.5px] leading-[1.3] text-[var(--c-muted)]">
      {tierName}
    </span>
  </span>

  <span
    class="flex flex-col items-end gap-0.5"
    title={STAT_EXPLAINERS_AR.prri}
  >
    <bdi dir="ltr" class="oc-kit-num text-[13px] font-bold leading-none tabular-nums {prriToneClass}">
      {prriRounded}
    </bdi>
    <span class="block h-[2px] w-full bg-[var(--c-track)]" aria-hidden="true">
      <span class="block h-full {prriBarClass}" style="width: {prriRounded}%"></span>
    </span>
  </span>

  <span
    class="oc-kit-num text-end text-[12px] font-semibold tabular-nums {node.dailyBlackoutHours > 12
      ? 'text-[var(--c-neg)]'
      : 'text-[var(--c-text)]'}"
    title="{STAT_EXPLAINERS_AR.dailyPowerHours} — ظلام {node.dailyBlackoutHours} س/يوم"
  >
    <bdi dir="ltr">{node.dailyBlackoutHours}</bdi><span class="ms-0.5 text-[10.5px] font-normal text-[var(--c-muted)]">س</span>
  </span>

  <span
    class="oc-kit-num text-end text-[12px] font-semibold tabular-nums text-[var(--c-text)]"
    title={STAT_EXPLAINERS_AR.unrepairedDamageUSD}
  >
    <bdi dir="ltr">{damageB}B</bdi>
  </span>

  <span
    class="oc-kit-num text-end text-[12px] font-semibold tabular-nums {node.mineSaturationPct > 8
      ? 'text-[var(--c-accent)]'
      : 'text-[var(--c-pos)]'}"
    title={STAT_EXPLAINERS_AR.mineSaturationPct}
  >
    <bdi dir="ltr">{node.mineSaturationPct}%</bdi>
  </span>
</button>
