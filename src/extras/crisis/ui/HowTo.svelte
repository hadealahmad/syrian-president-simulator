<script lang="ts">
  import GameIcon from '../../../lib/ui/GameIcon.svelte';
  import { fx } from '../../../lib/ui/fx/feedback';
  import { howToOpen } from '../stores';
  import BdiText from './BdiText.svelte';
  import Glyph from './Glyph.svelte';

  let open = $derived($howToOpen);

  function close(): void {
    fx('cancel');
    howToOpen.set(false);
  }

  const RULES = [
    {
      glyph: 'deck',
      title: 'اختر الإمداد مطلع كل جولة',
      line: 'التقط بطاقة واحدة من ثلاث بطاقات معروضة لتعزيز يدك مجانًا.',
    },
    {
      glyph: 'cost',
      title: 'انشر الفرق واستثمر الاختصاص',
      line: 'ادفع الكلفة من الخزينة؛ تصيب فرقك الأزمة المطابقة لفئتها بضرر +1 إضافي.',
    },
    {
      glyph: 'warn',
      title: 'اقرأ صف القادم والتوقعات',
      line: 'تنزل بطاقات صف «القادم» إلى خط الأزمات في الجولة المقبلة.',
    },
    {
      glyph: 'gauge',
      title: 'شاهد المستقبل قبل التنفيذ',
      line: 'تُظهر الشارات الضرر المتوقع وموضع الإبرة الشبحية فور تحريك بطاقاتك.',
    },
    {
      glyph: 'power',
      title: 'احسم الميزان لصالحك',
      line: 'بلوغ +5 يحسم المعركة، وهبوط الميزان إلى −5 يكلفك نقطة ثقة.',
    },
  ];
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    onclick={(e) => {
      if (e.target === e.currentTarget) close();
    }}
    class="fixed inset-0 z-[130] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label="كيف تلعب غرفة الأزمات"
      class="shell-enter-bottom flex max-h-[calc(100dvh-24px)] w-full max-w-[500px] flex-col border-t-2 border-t-[var(--c-accent)] bg-[var(--c-panel)] sm:border sm:border-[var(--c-line-strong)] sm:border-t-2 sm:border-t-[var(--c-accent)]"
    >
      <header class="flex min-h-[50px] shrink-0 items-center justify-between border-b border-[var(--c-line)] bg-[var(--c-strip)] ps-4">
        <h2 class="font-heading text-[16px] font-bold text-[var(--c-text)]">كيف تلعب</h2>
        <button
          type="button"
          onclick={close}
          aria-label="إغلاق الدليل"
          class="pressable flex min-h-[44px] min-w-[44px] items-center justify-center border-s border-[var(--c-line)] text-[var(--c-muted)] hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]"
        >
          <GameIcon name="cross-mark" cls="h-4 w-4" />
        </button>
      </header>

      <div class="scroll-area min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
        {#each RULES as r, i (i)}
          <div class="flex items-start gap-3 border border-[var(--c-line)] bg-[var(--c-bg)] p-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--c-line-strong)] bg-[var(--c-strip)] text-[var(--c-accent)]">
              <Glyph name={r.glyph} cls="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1 text-start">
              <b class="block text-[13.5px] font-bold text-[var(--c-text)]">{r.title}</b>
              <p class="mt-0.5 text-[13px] leading-[1.55] text-[var(--c-text-2)]"><BdiText text={r.line} /></p>
            </div>
          </div>
        {/each}
      </div>

      <footer class="shrink-0 border-t border-[var(--c-line)] bg-[var(--c-strip)] px-4 py-2.5 pb-[calc(0.65rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onclick={close}
          class="btn-primary-chamfer min-h-[44px] w-full text-[14px] font-bold"
        >
          أغلق الدليل
        </button>
      </footer>
    </div>
  </div>
{/if}
