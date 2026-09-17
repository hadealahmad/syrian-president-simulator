<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import GameIcon from './GameIcon.svelte';
  import {
    SUSPENDED_CARD_CLASS,
    SUSPENDED_CONTENT_CLASS,
    SUSPENDED_ICON,
  } from './panels/shared';

  function formatMillionUSD(usd: number): string {
    return (usd / 1_000_000).toFixed(1);
  }

  function formatBillionSYP(syp: number): string {
    return (syp / 1_000_000_000).toFixed(2);
  }

  const GOV_NAMES: Record<string, string> = {
    damascus: "دمشق",
    rif_dimashq: "ريف دمشق",
    aleppo: "حلب",
    homs: "حمص",
    hama: "حماة",
    latakia: "اللاذقية",
    tartus: "طرطوس",
    idlib: "إدلب",
    deir_ez_zor: "دير الزور",
    raqqa: "الرقة",
    hasakeh: "الحسكة",
    daraa: "درعا",
    as_suwayda: "السويداء",
    quneitra: "القنيطرة",
  };

  function getGovName(id: string): string {
    return GOV_NAMES[id] || id;
  }

  let currentEvent = $derived(
    $gameStore.activeEvents.length > 0 ? $gameStore.activeEvents[0] : null
  );

  // Alert stage of the end-turn flow: visible on top of the receded review
  // modal ('events'), or standalone on resume when events are pending and no
  // flow is open ('closed'). Never pops over review/results mid-flow.
  let showEventsModal = $derived(
    currentEvent !== null &&
      ($uiStore.turnFlowStage === 'events' || $uiStore.turnFlowStage === 'closed')
  );

  $effect(() => {
    // Last event resolved while the alert sits on top: retire the whole flow
    // (the receded review modal underneath unmounts with it).
    if ($uiStore.turnFlowStage === 'events' && !currentEvent) {
      uiStore.setTurnFlowStage('closed');
    }
  });

  // Dynamically evaluate whether each option is affordable with the current political credit and reserves
  let evaluatedOptions = $derived(
    currentEvent
      ? currentEvent.options.map((opt) => {
          const hasSufficientPC = opt.costPC <= 0 || $gameStore.macro.politicalCapital >= opt.costPC;
          const hasSufficientUSD = opt.costUSD <= 0 || $gameStore.macro.reservesUSD >= opt.costUSD;
          const canChoose = hasSufficientPC && hasSufficientUSD;

          let deficitReason: string | null = null;
          if (!hasSufficientPC && !hasSufficientUSD) {
            deficitReason = `عجز في الرصيد السياسي (يتطلب ${opt.costPC} نقطة والمتاح ${$gameStore.macro.politicalCapital} نقطة) ونقص في النقد الأجنبي`;
          } else if (!hasSufficientPC) {
            deficitReason = `عجز في الرصيد السياسي: يتطلب ${opt.costPC} نقطة رصيد سياسي بينما المتاح لديك فقط ${$gameStore.macro.politicalCapital} نقطة`;
          } else if (!hasSufficientUSD) {
            deficitReason = `نقص في احتياطي النقد الأجنبي: يتطلب $${(opt.costUSD / 1_000_000).toFixed(1)}M بينما المتاح $${($gameStore.macro.reservesUSD / 1_000_000).toFixed(1)}M`;
          }

          return {
            ...opt,
            canChoose,
            deficitReason,
          };
        })
      : []
  );

  let canDoAnyOption = $derived(
    evaluatedOptions.some((opt) => opt.canChoose)
  );

  // Confirmation state
  let selectedOptionForConfirm = $state<(typeof evaluatedOptions)[number] | null>(null);
  let isConfirmingPenalty = $state<boolean>(false);

  // When clicking an option card, open confirmation prompt
  function handleSelectOption(opt: (typeof evaluatedOptions)[number]): void {
    if (!opt.canChoose) return;
    selectedOptionForConfirm = opt;
  }

  // When confirming option execution
  function handleExecuteConfirmedOption(): void {
    if (currentEvent && selectedOptionForConfirm) {
      const optionId = selectedOptionForConfirm.id;
      selectedOptionForConfirm = null;
      gameStore.chooseEventOption(currentEvent.id, optionId);
    }
  }

  // When confirming penalty
  function handleExecutePenalty(): void {
    if (currentEvent) {
      isConfirmingPenalty = false;
      gameStore.triggerUnresolvedCrisisPenalty(currentEvent.id);
    }
  }
</script>

<svelte:window onkeydown={(e) => {
  if (e.key === 'Escape') {
    if (selectedOptionForConfirm) selectedOptionForConfirm = null;
    if (isConfirmingPenalty) isConfirmingPenalty = false;
  }
}} />

{#if showEventsModal && currentEvent}
  <div class="pointer-events-auto fixed inset-0 z-[60] bg-black/25" aria-hidden="true"></div>
  <div
    class="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none select-none font-arabic"
  >
    <div
      class="pointer-events-auto relative modal-tall h-[70vh] aspect-[3/4] max-w-[94vw] bg-forest-deep/95 modal-frame-stripes modal-frame-red shadow-2xl overflow-hidden flex flex-col rounded-none text-wheat-light modal-enter"
    >
      <!-- Content -->
      <div class="scroll-area scroll-umber p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
        <div class="border-b border-charcoal-mid pb-3 shrink-0">
          <div class="flex items-center gap-2">
            <GameIcon name="siren" cls="w-5 h-5 shrink-0 text-umber-crimson" />
            <h2 class="text-base font-bold text-wheat-light font-heading">{currentEvent.titleAr}</h2>
          </div>
        </div>
        <div>
          <p class="text-xs text-wheat-light leading-relaxed">{currentEvent.descriptionAr}</p>
        </div>

        <!-- Default/Incapacity Alert Card when No Options can be chosen -->
        {#if !canDoAnyOption}
          <div class="p-4 bg-umber-deep border-2 border-umber-border text-wheat-light space-y-3 rounded-none">
            <div class="flex items-center gap-2 text-umber-crimson font-bold text-xs font-heading">
              <span class="w-2.5 h-2.5 bg-umber-crimson"></span>
              <span>عجز سيادي شامل — تعذر الوفاء بمتطلبات أي خيار!</span>
            </div>
            <p class="text-xs leading-relaxed text-wheat-light">
              لا تملك مؤسسات الدولة النقد الأجنبي ($) أو سيولة الخزينة (SP) أو الرصيد السياسي المطلوب لتنفيذ أي من خيارات الاستجابة المتاحة.
              سيؤدي التخلف عن المعالجة إلى فرض عقوبة سيادية كارثية (ارتفاع الاحتقان الشعبي +25 نقطة، انهيار الثقة -25، تآكل الرصيد السياسي -30، وارتكاسات ميدانية عبر المحافظات).
            </p>
            <div class="pt-1 flex justify-end">
              <button
                onclick={() => { isConfirmingPenalty = true; }}
                class="px-5 py-2.5 bg-umber-mid hover:bg-umber-border text-wheat-light font-bold text-xs border border-umber-crimson transition-colors cursor-pointer rounded-none font-heading active:translate-y-0.5"
              >
                تحمل العقوبة الكارثية ومحاولة الصمود
              </button>
            </div>
          </div>
        {/if}

        <!-- Options -->
        <div class="space-y-3">
          {#each evaluatedOptions as opt}
            <div
              role="button"
              tabindex={opt.canChoose ? 0 : -1}
              aria-label={opt.labelAr}
              aria-disabled={!opt.canChoose}
              onclick={() => handleSelectOption(opt)}
              onkeydown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && opt.canChoose) { e.preventDefault(); handleSelectOption(opt); } }}
              class="p-4 border transition-colors rounded-none {opt.canChoose ? 'bg-forest-mid border-charcoal-mid hover:border-wheat-mid/60 cursor-pointer gloss-hover' : 'bg-charcoal-surface/80 border-charcoal-mid/60'} {opt.canChoose ? '' : SUSPENDED_CARD_CLASS}"
            >
              <div class="flex items-start justify-between gap-4 {opt.canChoose ? '' : SUSPENDED_CONTENT_CLASS}">
                <div class="space-y-1.5 flex-1">
                  <h3 class="text-sm font-bold text-wheat-gold font-heading mb-1">{opt.labelAr}</h3>
                  <p class="text-xs text-wheat-light leading-relaxed">{opt.descriptionAr} {opt.customEffectAr}</p>

                  <!-- Cost & Effect Tags with Red/Green Pills -->
                  <div class="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    {#if opt.costUSD > 0}
                      <span class="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold {$gameStore.macro.reservesUSD < opt.costUSD ? 'bg-umber-deep/80 border border-umber-crimson text-umber-glow' : 'bg-umber-deep border border-umber-border text-umber-crimson'}">
                        -${formatMillionUSD(opt.costUSD)}M
                      </span>
                    {:else if opt.costUSD < 0}
                      <span class="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-forest-mid border border-forest-accent/60 text-forest-accent">
                        +${formatMillionUSD(-opt.costUSD)}M
                      </span>
                    {/if}

                    {#if opt.costSYP > 0}
                      <span class="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold {$gameStore.macro.treasurySYP < opt.costSYP ? 'bg-umber-deep/80 border border-umber-crimson text-umber-glow' : 'bg-umber-deep border border-umber-border text-umber-crimson'}">
                        -{formatBillionSYP(opt.costSYP)}B SP
                      </span>
                    {:else if opt.costSYP < 0}
                      <span class="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-forest-mid border border-forest-accent/60 text-forest-accent">
                        +{formatBillionSYP(-opt.costSYP)}B SP
                      </span>
                    {/if}

                    {#if opt.costPC > 0}
                      <span class="px-1.5 py-0.5 border font-mono rounded-none {$gameStore.macro.politicalCapital < opt.costPC ? 'bg-umber-deep/80 border-umber-crimson text-umber-glow font-bold' : 'bg-charcoal-surface border-charcoal-light text-wheat-mid'}">
                        -{opt.costPC} نقطة رصيد سياسي
                      </span>
                    {/if}
                    {#if opt.governorateEffects && opt.governorateEffects.length > 0}
                      <div class="flex flex-wrap items-center gap-1.5 pt-1.5 w-full">
                        {#each opt.governorateEffects as eff}
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-charcoal-deep/90 border border-wheat-gold/50 text-[10px] text-wheat-light font-mono shadow-sm">
                            <span class="text-wheat-gold font-bold font-heading">{getGovName(eff.governorateId)}:</span>
                            {#if eff.customSummaryAr}
                              <span>{eff.customSummaryAr}</span>
                            {:else}
                              {#if eff.prri !== undefined}
                                <span class={eff.prri > 0 ? "text-umber-crimson font-bold" : "text-forest-accent font-bold"}>
                                  {eff.prri > 0 ? `+${eff.prri}` : eff.prri} احتقان
                                </span>
                              {/if}
                              {#if eff.dailyBlackoutHours !== undefined}
                                <span class={eff.dailyBlackoutHours > 0 ? "text-umber-crimson font-bold" : "text-forest-accent font-bold"}>
                                  {eff.dailyBlackoutHours > 0 ? `+${eff.dailyBlackoutHours}` : eff.dailyBlackoutHours} سا تقنين
                                </span>
                              {/if}
                              {#if eff.securityEfficacy !== undefined}
                                <span class={eff.securityEfficacy > 0 ? "text-forest-accent font-bold" : "text-umber-crimson font-bold"}>
                                  {eff.securityEfficacy > 0 ? `+${eff.securityEfficacy}` : eff.securityEfficacy} أمن
                                </span>
                              {/if}
                              {#if eff.reconstructionScore !== undefined}
                                <span class={eff.reconstructionScore > 0 ? "text-forest-accent font-bold" : "text-umber-crimson font-bold"}>
                                  {eff.reconstructionScore > 0 ? `+${eff.reconstructionScore}` : eff.reconstructionScore} إعمار
                                </span>
                              {/if}
                              {#if eff.activeHospitalsPct !== undefined}
                                <span class={eff.activeHospitalsPct > 0 ? "text-forest-accent font-bold" : "text-umber-crimson font-bold"}>
                                  {eff.activeHospitalsPct > 0 ? `+${eff.activeHospitalsPct}` : eff.activeHospitalsPct} مشافي
                                </span>
                              {/if}
                            {/if}
                          </span>
                        {/each}
                      </div>
                    {/if}
                  </div>

                  {#if !opt.canChoose && opt.deficitReason}
                    <div class="text-[11px] text-umber-glow font-medium pt-1 flex items-center gap-1.5">
                      <GameIcon name="cross-mark" cls="w-3.5 h-3.5 shrink-0 text-umber-crimson" />
                      <span>{opt.deficitReason}</span>
                    </div>
                  {:else if !opt.canChoose && opt.requirementsDescriptionAr}
                    <div class="text-[11px] text-umber-crimson font-semibold pt-1">
                      [متطلبات غير متوفرة]: {opt.requirementsDescriptionAr}
                    </div>
                  {/if}
                </div>
              </div>
              {#if !opt.canChoose}
                <span class="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <GameIcon name={SUSPENDED_ICON} cls="w-10 h-10 text-umber-glow opacity-90 drop-shadow-lg" />
                </span>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Confirmation Modal Prompt for Selected Option -->
      {#if selectedOptionForConfirm}
        <div
          class="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 select-none font-arabic"
        >
          <div
            class="modal-confirm h-[56vh] aspect-[3/4] max-w-[90%] bg-forest-deep border-2 border-wheat-gold shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-6 space-y-4 rounded-none text-wheat-light scroll-area overflow-y-auto"
          >
            <!-- Confirmation Header -->
            <div class="border-b border-charcoal-mid pb-3">
              <div class="flex items-center gap-2">
                <GameIcon name="check-mark" cls="w-5 h-5 shrink-0 text-wheat-gold" />
                <h3 class="text-base font-bold text-wheat-light font-heading">
                  تأكيد الخيار
                </h3>
              </div>
            </div>

            <!-- Selected Option Summary Box -->
            <div class="space-y-2.5">
              <h3 class="text-sm font-bold text-wheat-light font-heading">{selectedOptionForConfirm.labelAr}</h3>
              <p class="text-xs text-wheat-light leading-relaxed">
                {selectedOptionForConfirm.descriptionAr} {selectedOptionForConfirm.customEffectAr}
              </p>

              <!-- Before / after snapshot for this decision -->
              <div class="pt-2 border-t border-charcoal-mid/60 text-[11px] space-y-1.5">
                <span class="text-wheat-dark font-heading block">القيم قبل القرار وبعده:</span>
                {#if selectedOptionForConfirm.costPC > 0}
                  <div class="flex items-center justify-between font-mono">
                    <span class="text-wheat-dark">الرصيد السياسي</span>
                    <span dir="ltr">
                      <span class="text-wheat-light font-bold">{Math.round($gameStore.macro.politicalCapital)}</span>
                      <span class="text-wheat-dark"> ← </span>
                      <span class="font-bold text-umber-crimson">{Math.round($gameStore.macro.politicalCapital - selectedOptionForConfirm.costPC)}</span>
                    </span>
                  </div>
                {/if}
                {#if selectedOptionForConfirm.costUSD !== 0}
                  <div class="flex items-center justify-between font-mono">
                    <span class="text-wheat-dark">احتياطي النقد الأجنبي</span>
                    <span dir="ltr">
                      <span class="text-wheat-light font-bold">${formatMillionUSD($gameStore.macro.reservesUSD)}M</span>
                      <span class="text-wheat-dark"> ← </span>
                      <span class="font-bold {selectedOptionForConfirm.costUSD > 0 ? 'text-umber-crimson' : 'text-forest-accent'}">${formatMillionUSD($gameStore.macro.reservesUSD - selectedOptionForConfirm.costUSD)}M</span>
                    </span>
                  </div>
                {/if}
                {#if selectedOptionForConfirm.costSYP !== 0}
                  <div class="flex items-center justify-between font-mono">
                    <span class="text-wheat-dark">سيولة الخزينة</span>
                    <span dir="ltr">
                      <span class="text-wheat-light font-bold">{formatBillionSYP($gameStore.macro.treasurySYP)}B SP</span>
                      <span class="text-wheat-dark"> ← </span>
                      <span class="font-bold {selectedOptionForConfirm.costSYP > 0 ? 'text-umber-crimson' : 'text-forest-accent'}">{formatBillionSYP($gameStore.macro.treasurySYP - selectedOptionForConfirm.costSYP)}B SP</span>
                    </span>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="border-t border-charcoal-mid pt-3 flex items-center gap-3">
              <button
                onclick={handleExecuteConfirmedOption}
                class="flex-1 px-6 py-2.5 bg-wheat-gold hover:bg-wheat-light text-forest-deep border border-wheat-mid font-bold text-xs shadow-lg transition-all cursor-pointer gloss-hover font-heading active:translate-y-0.5 text-center"
              >
                تأكيد واعتماد القرار
              </button>
              <button
                onclick={() => { selectedOptionForConfirm = null; }}
                class="flex-1 px-4 py-2.5 bg-forest-mid hover:bg-forest-surface text-wheat-mid hover:text-wheat-light border border-charcoal-mid hover:border-wheat-mid/60 transition-colors text-xs font-bold cursor-pointer gloss-hover font-heading text-center"
              >
                تراجع واختيار آخر
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Confirmation Modal Prompt for Catastrophic Penalty -->
      {#if isConfirmingPenalty}
        <div
          class="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 select-none font-arabic"
        >
          <div
            class="w-full max-w-lg bg-forest-deep border-2 border-umber-crimson shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-6 space-y-4 rounded-none text-wheat-light"
          >
            <div class="border-b border-charcoal-mid pb-3">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-umber-crimson shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h3 class="text-base font-bold text-wheat-light font-heading">
                  تأكيد تحمل العقوبة الكارثية
                </h3>
              </div>
            </div>

            <div class="p-4 bg-umber-deep/80 border border-umber-border text-xs leading-relaxed space-y-2 text-wheat-light">
              <p class="font-bold text-umber-glow">
                هل أنت متأكد من العجز عن الاستجابة وتحمل الآثار الميدانية والسياسية الكاملة؟
              </p>
              <div class="text-[11px] text-wheat-mid space-y-1 pt-1">
                <div>• ارتفاع حاد في الاحتقان الشعبي (+25 نقطة).</div>
                <div>• انهيار فادح في الثقة المدنية والمجتمعية (-25 نقطة).</div>
                <div>• تآكل رصيدك السياسي القيادي (-30 نقطة).</div>
              </div>
            </div>

            <div class="border-t border-charcoal-mid pt-3 flex items-center gap-3">
              <button
                onclick={handleExecutePenalty}
                class="flex-1 px-6 py-2.5 bg-umber-mid hover:bg-umber-crimson text-wheat-light border border-umber-border hover:border-wheat-mid/60 font-bold text-xs shadow-lg transition-all cursor-pointer gloss-hover font-heading active:translate-y-0.5 text-center"
              >
                تأكيد تحمل العقوبة
              </button>
              <button
                onclick={() => { isConfirmingPenalty = false; }}
                class="flex-1 px-4 py-2.5 bg-forest-mid hover:bg-forest-surface text-wheat-mid hover:text-wheat-light border border-charcoal-mid hover:border-wheat-mid/60 transition-colors text-xs font-bold cursor-pointer gloss-hover font-heading text-center"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
