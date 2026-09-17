<script lang="ts">
  import GameIcon from './GameIcon.svelte';

  let dismissed = $state(false);
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
    <button
      onclick={() => (dismissed = true)}
      class="w-full py-2 bg-charcoal-surface hover:bg-forest-mid text-wheat-dark hover:text-wheat-light text-xs border border-charcoal-mid hover:border-wheat-mid/60 gloss-hover transition-colors cursor-pointer rounded-none font-heading"
    >
      معلش بدي اتعذب
    </button>
  </div>
</div>
{/if}
