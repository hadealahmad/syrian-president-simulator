<script lang="ts">
  import GameIcon from './GameIcon.svelte';
  import { pwaStore } from '../stores/pwa-store';

  let dismissed = $state(false);
  let iosHintOpen = $state(false);

  const canFullscreen =
    typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;
  let canInstall = $derived(!$pwaStore.isInstalled && ($pwaStore.canInstall || $pwaStore.isIos));

  async function startLandscape(): Promise<void> {
    await pwaStore.enterFullscreenLandscape();
  }

  async function install(): Promise<void> {
    if ($pwaStore.canInstall) {
      await pwaStore.promptInstall();
      return;
    }
    iosHintOpen = !iosHintOpen;
  }
</script>

<!-- Portrait-blocker: covers phones and small tablets held vertically and
  asks for landscape, which the HUD layout requires. Purely CSS-gated
  (portrait + below lg) so it needs no JS, works in both themes, and never
  renders on desktop landscape. -->
{#if !dismissed}
<div
  class="pointer-events-auto fixed inset-0 z-[100] hidden portrait:max-lg:flex items-center justify-center bg-black/70 p-6 select-none font-arabic"
  role="dialog"
  aria-modal="true"
  aria-label="يرجى تدوير الشاشة"
>
  <div
    class="w-[min(80vw,300px)] bg-forest-deep/95 modal-frame-stripes modal-frame-gold shadow-2xl p-6 space-y-3 text-center rounded-none"
  >
    <GameIcon name="cycle" cls="w-10 h-10 mx-auto text-wheat-gold shrink-0" />
    <h2 class="text-base font-bold text-wheat-light font-heading">
      يرجى تدوير الشاشة
    </h2>
    <p class="text-xs text-wheat-dark leading-relaxed">
      صُممت المحاكاة للعب بالوضع الأفقي. أدر جهازك أفقياً لبدء إدارة الدولة.
    </p>
    {#if canFullscreen}
      <button
        onclick={startLandscape}
        class="w-full py-2.5 flex items-center justify-center gap-2 bg-wheat-gold hover:bg-wheat-light text-forest-deep text-xs font-bold border border-wheat-gold gloss-hover transition-all active:scale-95 cursor-pointer rounded-none font-heading"
      >
        <GameIcon name="expand" cls="w-4 h-4 shrink-0" />
        <span>ابدأ بالوضع الأفقي</span>
      </button>
    {/if}
    {#if canInstall}
      <button
        onclick={install}
        class="w-full py-2 flex items-center justify-center gap-2 bg-charcoal-surface hover:bg-forest-mid text-wheat-mid hover:text-wheat-light text-xs border border-charcoal-mid hover:border-wheat-mid/60 gloss-hover transition-colors cursor-pointer rounded-none font-heading"
      >
        <GameIcon name="download" cls="w-4 h-4 shrink-0 text-wheat-gold" />
        <span>ثبّت اللعبة كتطبيق</span>
      </button>
    {/if}
    {#if iosHintOpen}
      <p
        class="text-[11px] text-wheat-dark leading-relaxed border border-charcoal-mid bg-charcoal-deep/60 px-3 py-2"
      >
        اضغط زر المشاركة في متصفح سفاري، ثم اختر «إضافة إلى الشاشة الرئيسية».
      </p>
    {/if}
    <button
      onclick={() => (dismissed = true)}
      class="w-full py-2 bg-charcoal-surface hover:bg-forest-mid text-wheat-dark hover:text-wheat-light text-xs border border-charcoal-mid hover:border-wheat-mid/60 gloss-hover transition-colors cursor-pointer rounded-none font-heading"
    >
      معلش بدي اتعذب
    </button>
  </div>
</div>
{/if}
