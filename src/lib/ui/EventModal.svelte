<script lang="ts">
  import { gameStore } from '../stores/game-store';

  function formatMillionUSD(usd: number): string {
    return (usd / 1_000_000).toFixed(1);
  }

  function formatTrillionSYP(syp: number): string {
    return (syp / 1_000_000_000_000).toFixed(2);
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

  // Dynamically evaluate whether each option is affordable with the current political credit and reserves
  let evaluatedOptions = $derived(
    currentEvent
      ? currentEvent.options.map((opt) => {
          const hasSufficientPC = opt.costPC <= 0 || $gameStore.macro.politicalCapital >= opt.costPC;
          const hasSufficientUSD = opt.costUSD <= 0 || $gameStore.macro.reservesUSD >= opt.costUSD;
          const canChoose = hasSufficientPC && hasSufficientUSD;

          let deficitReason: string | null = null;
          if (!hasSufficientPC && !hasSufficientUSD) {
            deficitReason = `عجز في الرصيد السياسي (يتطلب ${opt.costPC}% والمتاح ${$gameStore.macro.politicalCapital}%) ونقص في النقد الأجنبي`;
          } else if (!hasSufficientPC) {
            deficitReason = `عجز في الرصيد السياسي: يتطلب ${opt.costPC}% رصيد سياسي بينما المتاح لديك فقط ${$gameStore.macro.politicalCapital}%`;
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

{#if currentEvent}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 select-none font-arabic pointer-events-auto"
  >
    <div
      class="relative w-full max-w-[620px] bg-forest-deep/95 border-2 border-wheat-mid/80 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col rounded-none text-wheat-light"
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
          <div class="flex items-center justify-between">
            <span class="text-xs text-wheat-dark font-semibold block font-heading">خيارات الاستجابة الرئاسية:</span>
            <div class="flex items-center gap-1.5 text-[11px] font-mono text-wheat-mid">
              <span>الرصيد السياسي المتاح:</span>
              <span class="text-wheat-gold font-bold">{$gameStore.macro.politicalCapital}%</span>
            </div>
          </div>

          {#each evaluatedOptions as opt}
            <div
              class="p-4 border transition-colors rounded-none {opt.canChoose ? 'bg-forest-mid border-charcoal-mid hover:border-wheat-mid/60' : 'bg-charcoal-surface/80 border-charcoal-mid/60'}"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="space-y-1.5 flex-1">
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold text-wheat-light font-heading">{opt.labelAr}</h3>
                    {#if !opt.canChoose}
                      <span class="px-1.5 py-0.2 bg-umber-deep border border-umber-border text-umber-crimson text-[9px] font-bold font-mono">
                        غير متاح
                      </span>
                    {/if}
                  </div>
                  <p class="text-xs text-wheat-dark">{opt.descriptionAr}</p>

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
                        -{formatTrillionSYP(opt.costSYP)}T ل.س
                      </span>
                    {:else if opt.costSYP < 0}
                      <span class="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-forest-mid border border-forest-accent/60 text-forest-accent">
                        +{formatTrillionSYP(-opt.costSYP)}T ل.س
                      </span>
                    {/if}

                    {#if opt.costPC > 0}
                      <span class="px-1.5 py-0.5 border font-mono rounded-none {$gameStore.macro.politicalCapital < opt.costPC ? 'bg-umber-deep/80 border-umber-crimson text-umber-glow font-bold' : 'bg-charcoal-surface border-charcoal-light text-wheat-mid'}">
                        -{opt.costPC}% رصيد سياسي
                      </span>
                    {/if}
                    <span class="text-forest-accent font-medium">
                      {opt.customEffectAr}
                    </span>

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
                      <svg class="w-3 h-3 shrink-0 text-umber-crimson" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{opt.deficitReason}</span>
                    </div>
                  {:else if !opt.canChoose && opt.requirementsDescriptionAr}
                    <div class="text-[11px] text-umber-crimson font-semibold pt-1">
                      [متطلبات غير متوفرة]: {opt.requirementsDescriptionAr}
                    </div>
                  {/if}
                </div>

                <button
                  disabled={!opt.canChoose}
                  onclick={() => handleSelectOption(opt)}
                  class="px-5 py-2 text-xs font-bold shrink-0 border transition-colors rounded-none {opt.canChoose ? 'bg-forest-surface hover:bg-wheat-gold text-wheat-light hover:text-forest-deep border-wheat-mid shadow-md cursor-pointer' : 'bg-charcoal-surface text-wheat-dark border-charcoal-mid cursor-not-allowed opacity-50'}"
                >
                  اعتماد الخيار
                </button>
              </div>
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
            class="w-full max-w-lg bg-forest-deep border-2 border-wheat-gold shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-6 space-y-4 rounded-none text-wheat-light"
          >
            <!-- Confirmation Header -->
            <div class="border-b border-charcoal-mid pb-3">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 bg-wheat-gold rounded-none shrink-0"></span>
                <h3 class="text-base font-bold text-wheat-light font-heading">
                  تأكيد الأمر الرئاسي الصادر
                </h3>
              </div>
              <p class="text-xs text-wheat-dark mt-1">
                يرجى مراجعة تفاصيل الاستجابة السيادية قبل اعتمادها رسمياً
              </p>
            </div>

            <!-- Selected Option Summary Box -->
            <div class="p-4 bg-forest-surface border border-charcoal-mid space-y-2.5">
              <h4 class="text-sm font-bold text-wheat-gold font-heading">
                {selectedOptionForConfirm.labelAr}
              </h4>
              <p class="text-xs text-wheat-light leading-relaxed">
                {selectedOptionForConfirm.descriptionAr}
              </p>

              <!-- Cost & Impact Pills -->
              <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-charcoal-mid/60 text-[11px]">
                {#if selectedOptionForConfirm.costUSD > 0}
                  <span class="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-umber-deep border border-umber-border text-umber-crimson">
                    -${formatMillionUSD(selectedOptionForConfirm.costUSD)}M من الاحتياطي
                  </span>
                {:else if selectedOptionForConfirm.costUSD < 0}
                  <span class="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-forest-mid border border-forest-accent/60 text-forest-accent">
                    +${formatMillionUSD(-selectedOptionForConfirm.costUSD)}M سيولة أجنبية
                  </span>
                {/if}

                {#if selectedOptionForConfirm.costSYP > 0}
                  <span class="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-umber-deep border border-umber-border text-umber-crimson">
                    -{formatTrillionSYP(selectedOptionForConfirm.costSYP)}T ل.س
                  </span>
                {:else if selectedOptionForConfirm.costSYP < 0}
                  <span class="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-forest-mid border border-forest-accent/60 text-forest-accent">
                    +{formatTrillionSYP(-selectedOptionForConfirm.costSYP)}T ل.س
                  </span>
                {/if}

                {#if selectedOptionForConfirm.costPC > 0}
                  <span class="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-charcoal-surface border border-charcoal-light text-wheat-mid">
                    -{selectedOptionForConfirm.costPC}% رصيد سياسي
                  </span>
                {/if}

                <span class="text-forest-accent font-medium">
                  {selectedOptionForConfirm.customEffectAr}
                </span>

                {#if selectedOptionForConfirm.governorateEffects && selectedOptionForConfirm.governorateEffects.length > 0}
                  <div class="flex flex-wrap items-center gap-1.5 pt-1.5 w-full">
                    {#each selectedOptionForConfirm.governorateEffects as eff}
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-charcoal-deep border border-wheat-gold/60 text-[10px] text-wheat-light font-mono">
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
                        {/if}
                      </span>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>

            <!-- Warning note -->
            <div class="text-[11px] text-wheat-dark leading-relaxed flex items-start gap-2 bg-charcoal-surface/70 p-2.5 border border-charcoal-mid">
              <svg class="w-4 h-4 text-wheat-gold shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>
                عند تأكيد هذا الخيار، سيتم إنفاذ الأمر الرئاسي وخصم التكاليف من الموازنة واختتام معالجة هذه البرقية الطارئة.
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                onclick={() => { selectedOptionForConfirm = null; }}
                class="px-4 py-2.5 bg-forest-mid hover:bg-forest-surface text-wheat-mid hover:text-wheat-light border border-charcoal-mid transition-colors text-xs font-bold cursor-pointer font-heading"
              >
                تراجع واختيار آخر
              </button>
              <button
                onclick={handleExecuteConfirmedOption}
                class="px-6 py-2.5 bg-wheat-gold hover:bg-wheat-light text-forest-deep border border-wheat-mid font-bold text-xs shadow-lg transition-all cursor-pointer font-heading active:translate-y-0.5"
              >
                تأكيد واعتماد القرار
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
              <div class="flex items-center gap-2 text-umber-crimson">
                <span class="w-3 h-3 bg-umber-crimson rounded-none shrink-0"></span>
                <h3 class="text-base font-bold font-heading">
                  تأكيد تحمل العقوبة الكارثية
                </h3>
              </div>
              <p class="text-xs text-wheat-dark mt-1">
                تحذير سيادي من الآثار المدمرة للتخلف عن معالجة الأزمة
              </p>
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

            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                onclick={() => { isConfirmingPenalty = false; }}
                class="px-4 py-2.5 bg-forest-mid hover:bg-forest-surface text-wheat-mid hover:text-wheat-light border border-charcoal-mid transition-colors text-xs font-bold cursor-pointer font-heading"
              >
                تراجع
              </button>
              <button
                onclick={handleExecutePenalty}
                class="px-6 py-2.5 bg-umber-mid hover:bg-umber-crimson text-wheat-light border border-umber-border font-bold text-xs shadow-lg transition-all cursor-pointer font-heading active:translate-y-0.5"
              >
                تأكيد تحمل العقوبة
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
