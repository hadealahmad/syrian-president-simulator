<script lang="ts">
  import { gameStore } from '../stores/game-store';

  function formatMillionUSD(usd: number): string {
    return (usd / 1_000_000).toFixed(1);
  }

  function formatTrillionSYP(syp: number): string {
    return (syp / 1_000_000_000_000).toFixed(2);
  }

  let currentEvent = $derived(
    $gameStore.activeEvents.length > 0 ? $gameStore.activeEvents[0] : null
  );

  let canDoAnyOption = $derived(
    currentEvent ? currentEvent.options.some((opt) => opt.canChoose) : true
  );

  function handleSelectOption(optionId: string): void {
    if (currentEvent) {
      gameStore.chooseEventOption(currentEvent.id, optionId);
    }
  }

  function handleTriggerPenalty(): void {
    if (currentEvent) {
      gameStore.triggerUnresolvedCrisisPenalty(currentEvent.id);
    }
  }
</script>

{#if currentEvent}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 select-none font-arabic"
  >
    <div
      class="w-full max-w-[620px] bg-forest-deep/95 border-2 border-wheat-mid/80 shadow-2xl overflow-hidden flex flex-col rounded-none text-wheat-light"
    >
      <!-- Telex Header -->
      <div class="px-6 py-3.5 bg-forest-mid border-b border-charcoal-mid flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 bg-umber-deep border border-umber-border text-umber-crimson text-[11px] font-bold rounded-none font-heading">
            برقية استخبارية طارئة
          </span>
          <span class="text-xs text-wheat-mid font-mono">
            {currentEvent.category === 'SOUTHERN' ? 'الجبهة الجنوبية' : 'غرفة الأزمات المركزية'}
          </span>
        </div>
        <span class="text-xs text-wheat-gold font-medium font-heading">{currentEvent.sourceAr}</span>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
        <div>
          <h2 class="text-base font-bold text-wheat-light mb-2 font-heading">{currentEvent.titleAr}</h2>
          <p class="text-xs text-wheat-light leading-relaxed bg-charcoal-surface p-3.5 border border-charcoal-mid rounded-none">
            {currentEvent.descriptionAr}
          </p>
        </div>

        <!-- Default/Incapacity Alert Card when No Options can be chosen -->
        {#if !canDoAnyOption}
          <div class="p-4 bg-umber-deep border-2 border-umber-border text-wheat-light space-y-3 rounded-none">
            <div class="flex items-center gap-2 text-umber-crimson font-bold text-xs font-heading">
              <span class="w-2.5 h-2.5 bg-umber-crimson"></span>
              <span>عجز سيادي شامل — تعذر الوفاء بمتطلبات أي خيار!</span>
            </div>
            <p class="text-xs leading-relaxed text-wheat-light">
              لا تملك مؤسسات الدولة النقد الأجنبي ($) أو سيولة الخزينة (ل.س) أو الرصيد السياسي المطلوب لتنفيذ أي من خيارات الاستجابة المتاحة.
              سيؤدي التخلف عن المعالجة إلى فرض عقوبة سيادية كارثية (ارتفاع الاحتقان الشعبي +25 نقطة، انهيار الثقة -25، تآكل الرصيد السياسي -30، وارتكاسات ميدانية عبر المحافظات).
            </p>
            <div class="pt-1 flex justify-end">
              <button
                onclick={handleTriggerPenalty}
                class="px-5 py-2.5 bg-umber-mid hover:bg-umber-border text-wheat-light font-bold text-xs border border-umber-crimson transition-colors cursor-pointer rounded-none font-heading active:translate-y-0.5"
              >
                تحمل العقوبة الكارثية ومحاولة الصمود
              </button>
            </div>
          </div>
        {/if}

        <!-- Options -->
        <div class="space-y-3">
          <span class="text-xs text-wheat-dark font-semibold block font-heading">خيارات الاستجابة الرئاسية:</span>
          {#each currentEvent.options as opt}
            <div
              class="p-4 border transition-colors rounded-none {opt.canChoose ? 'bg-forest-mid border-charcoal-mid hover:border-wheat-mid/60' : 'bg-charcoal-surface opacity-60 border-charcoal-mid'}"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1.5">
                  <h3 class="text-sm font-bold text-wheat-light font-heading">{opt.labelAr}</h3>
                  <p class="text-xs text-wheat-dark">{opt.descriptionAr}</p>

                  <!-- Cost & Effect Tags -->
                  <div class="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    {#if opt.costUSD > 0}
                      <span class="px-1.5 py-0.5 bg-umber-deep border border-umber-border text-umber-crimson font-mono rounded-none">
                        -${formatMillionUSD(opt.costUSD)}M نقد أجنبي
                      </span>
                    {/if}
                    {#if opt.costSYP > 0}
                      <span class="px-1.5 py-0.5 bg-charcoal-surface border border-wheat-mid/60 text-wheat-gold font-mono rounded-none">
                        -{formatTrillionSYP(opt.costSYP)}T ليرة
                      </span>
                    {/if}
                    {#if opt.costPC > 0}
                      <span class="px-1.5 py-0.5 bg-charcoal-surface border border-charcoal-light text-wheat-mid font-mono rounded-none">
                        -{opt.costPC}% رصيد سياسي
                      </span>
                    {/if}
                    <span class="text-forest-accent font-medium">
                      {opt.customEffectAr}
                    </span>
                  </div>

                  {#if !opt.canChoose && opt.requirementsDescriptionAr}
                    <div class="text-[11px] text-umber-crimson font-semibold pt-1">
                      [متطلبات غير متوفرة]: {opt.requirementsDescriptionAr}
                    </div>
                  {/if}
                </div>

                <button
                  disabled={!opt.canChoose}
                  onclick={() => handleSelectOption(opt.id)}
                  class="px-4 py-2 text-xs font-bold shrink-0 border transition-colors rounded-none {opt.canChoose ? 'bg-wheat-gold hover:bg-wheat-light text-forest-deep border-wheat-gold active:translate-y-0.5 cursor-pointer shadow-md' : 'bg-charcoal-surface text-wheat-dark/40 border-charcoal-mid cursor-not-allowed'}"
                >
                  اعتماد التوجيه
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
