<script lang="ts">
  import CardDialog from './CardDialog.svelte';
  import EffectChip from '../controls/EffectChip.svelte';
  import { allEffectChips, decreePcCost, decreeTypeLabel } from './decree-meta';
  import type { PoliticalDecreeItem } from '../panels/shared';

  interface Props {
    /** The decree awaiting confirmation (null closes the dialog). */
    decree: PoliticalDecreeItem | null;
    isActive: boolean;
    /** Budget remaining after every queued action. */
    remainingPC: number;
    onconfirm: () => void;
    onclose: () => void;
  }

  let { decree, isActive, remainingPC, onconfirm, onclose }: Props = $props();

  let costPC = $derived(decree ? decreePcCost(decree.id) : 0);
  let canAfford = $derived(isActive || costPC <= remainingPC);
  let chips = $derived(decree ? allEffectChips(decree) : []);
  let confirmLabel = $derived(
    isActive
      ? 'إلغاء التفعيل'
      : !canAfford
        ? `رصيد غير كافٍ (${costPC})`
        : 'تأكيد التفعيل'
  );
</script>

<CardDialog
  open={decree !== null}
  title={decree?.titleAr ?? ''}
  ariaLabel={decree?.titleAr ?? 'تفاصيل المرسوم'}
  kicker="دفتر التوقيع"
  {confirmLabel}
  confirmDisabled={!isActive && !canAfford}
  {onconfirm}
  {onclose}
>
  {#if decree}
    <div class="space-y-3">
      <p class="text-[11px] leading-relaxed text-wheat-dark">{decree.descAr}</p>

      <div class="flex flex-wrap items-center gap-1.5">
        {#each chips as chip, i (chip.text + i)}
          <EffectChip icon="" text={chip.text} tone={chip.tone} class="text-[9px] px-2 py-0.5" />
        {/each}
        {#if costPC > 0}
          <EffectChip icon="" text="−{costPC} رصيد سياسي" tone="bad" class="text-[9px] px-2 py-0.5" />
        {:else if costPC < 0}
          <EffectChip icon="" text="+{Math.abs(costPC)} رصيد سياسي" tone="good" class="text-[9px] px-2 py-0.5" />
        {:else}
          <EffectChip icon="" text="دون كلفة سياسية" tone="neutral" class="text-[9px] px-2 py-0.5" />
        {/if}
      </div>

      <div class="flex items-center justify-between gap-2 border-t border-wheat-mid/10 pt-2 text-[9px] text-wheat-dark">
        <span class="inline-flex items-center gap-1">
          <span class="h-1 w-1 bg-wheat-mid shell-round-chip"></span>
          {decreeTypeLabel(decree.behavior)}
        </span>
        <span class="font-mono">
          المتاح بعد الحصيلة: {Math.max(0, Math.floor(remainingPC))} نقطة
        </span>
      </div>
    </div>
  {/if}
</CardDialog>
