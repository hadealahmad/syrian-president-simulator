<script lang="ts">
  import GameIcon from '../../lib/ui/GameIcon.svelte';
  import { fx } from '../../lib/ui/fx/feedback';
  import type { DossierIconName } from './ui-helpers';

  let { onClose }: { onClose: () => void } = $props();

  const RULES: { icon: DossierIconName; title: string; body: string }[] = [
    {
      icon: 'scales',
      title: 'أربعة موازين للدولة',
      body: 'حافظ على الخزينة والثقة والأمن والسيادة فوق الصفر حتى نهاية الدور الأربعين.',
    },
    {
      icon: 'scroll-quill',
      title: 'ملفان في كل دور',
      body: 'اسحب البطاقة يمينًا أو يسارًا، أو استعمل الزرين وأسهم لوحة المفاتيح لحسم القرار.',
    },
    {
      icon: 'siren',
      title: 'نقاط الأثر وملفات الجموح',
      body: 'تكشف النقاط حجم التغيير قبل الحسم دون كشف اتجاهه، وبلوغ تسعين يفتح ملفات خطرة.',
    },
    {
      icon: 'gavel',
      title: 'مراسيم دائمة وتبعات لاحقة',
      body: 'تفعّل بعض الخيارات مراسيم تزحزح الموازين كل دور، أو تستدعي ملفًا تبعيًا بعد حين.',
    },
    {
      icon: 'hourglass',
      title: 'ثلاثة تأجيلات في الولاية',
      body: 'استعمل «أجّل الملف» لاستبعاد ملف حرج واستبداله بغيره ثلاث مرات فقط طوال الولاية.',
    },
  ];

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      fx('cancel');
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="howto-title"
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5"
>
  <button
    type="button"
    aria-label="أغلِق النافذة"
    onclick={() => {
      fx('cancel');
      onClose();
    }}
    class="absolute inset-0 cursor-default border-0 bg-transparent"
  ></button>

  <div
    class="dos-scroll relative z-10 flex max-h-[90dvh] w-full max-w-[500px] flex-col overflow-y-auto border border-[var(--c-line-strong)] border-t-2 border-t-[var(--c-accent)] bg-[var(--c-panel)] p-4 sm:p-6"
  >
    <header class="flex items-start justify-between gap-3 border-b border-[var(--c-line)] pb-3">
      <div>
        <span class="block text-[12px] font-bold text-[var(--c-accent)]">قواعد المكتب الرئاسي</span>
        <h2 id="howto-title" class="mt-0.5 font-heading text-[20px] font-bold text-[var(--c-text)] sm:text-[22px]">
          كيف تلعب
        </h2>
      </div>
      <button
        type="button"
        aria-label="أغلِق الدليل"
        onclick={() => {
          fx('cancel');
          onClose();
        }}
        class="pressable flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-strip)] text-[var(--c-muted)] hover:border-[var(--c-text)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
      >
        <GameIcon name="cross-mark" cls="h-4 w-4" />
      </button>
    </header>

    <ul class="my-4 flex flex-col divide-y divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-strip)]">
      {#each RULES as rule (rule.title)}
        <li class="flex items-start gap-3 px-3 py-2.5 sm:px-3.5 sm:py-3">
          <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-accent)]">
            <GameIcon name={rule.icon} cls="h-4 w-4" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="text-[13.5px] font-bold text-[var(--c-text)] sm:text-[14px]">{rule.title}</div>
            <p class="mt-0.5 text-[12.5px] leading-[1.55] text-[var(--c-muted)] sm:text-[13px]">{rule.body}</p>
          </div>
        </li>
      {/each}
    </ul>

    <button
      type="button"
      onclick={() => {
        fx('confirm');
        onClose();
      }}
      class="btn-primary-chamfer pressable min-h-[48px] w-full px-5 text-[15px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)]"
    >
      ابدأ المراجعة
    </button>
  </div>
</div>
