<script lang="ts">
  import CardDialog from './CardDialog.svelte';
  import FxChip from '../kit/FxChip.svelte';
  import { allEffectChips, decreePcCost, decreeTypeLabel } from './decree-meta';
  import type { PoliticalDecreeItem } from '../panels/shared';

  interface Props {
    /** The decree awaiting confirmation (null closes the dialog). */
    decree: PoliticalDecreeItem | null;
    isActive: boolean;
    /** Budget remaining after every queued action. */
    remainingPC: number;
    tone?: 'gold' | 'danger';
    onconfirm: () => void;
    onclose: () => void;
  }

  let {
    decree,
    isActive,
    remainingPC,
    tone = 'gold',
    onconfirm,
    onclose,
  }: Props = $props();

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
  kicker={tone === 'danger' ? 'قرار سيادي خطير' : 'دفتر التوقيع'}
  {tone}
  {confirmLabel}
  confirmDisabled={!isActive && !canAfford}
  {onconfirm}
  {onclose}
>
  {#if decree}
    <div class="space-y-3">
      <p class="text-[12.5px] leading-relaxed text-[var(--c-text-2)]">{decree.descAr}</p>

      <div class="fx">
        {#each chips as chip, i (chip.text + i)}
          <FxChip text={chip.text} tone={chip.tone} />
        {/each}
        {#if costPC > 0}
          <FxChip text="−{costPC} رصيد سياسي" tone="bad" />
        {:else if costPC < 0 && !chips.some((c) => c.text.includes('رصيد'))}
          <FxChip text="+{Math.abs(costPC)} رصيد سياسي" tone="good" />
        {:else if costPC === 0}
          <FxChip text="دون كلفة سياسية" tone="neutral" />
        {/if}
      </div>

      <div class="flex items-center justify-between gap-2 border-t border-[var(--c-line)] pt-2 text-[11px] text-[var(--c-muted)]">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 bg-[var(--c-muted)]"></span>
          {decreeTypeLabel(decree.behavior)}
        </span>
        <span class="oc-kit-num font-bold text-[var(--c-text-2)]">
          المتاح بعد الحصيلة: {Math.max(0, Math.floor(remainingPC))} نقطة
        </span>
      </div>
    </div>
  {/if}
</CardDialog>
