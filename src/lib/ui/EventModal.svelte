<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import { canAffordEventOption } from '../engine/events';
  import GameIcon from './GameIcon.svelte';
  import { focusTrap } from './actions/focus-trap';
  import { shellLayout } from './shell/viewport';
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

  const CATEGORY_NAMES_AR: Record<string, string> = {
    EXOGENOUS: 'خارجي',
    ENDOGENOUS: 'داخلي',
    MACRO: 'اقتصادي كلي',
    SOUTHERN: 'الجبهة الجنوبية',
    SECURITY: 'أمني',
    INFRASTRUCTURE: 'بنية تحتية',
    AGRICULTURE: 'زراعة',
    ENERGY: 'طاقة',
    INDUSTRY: 'صناعة',
    HEALTH: 'صحة',
    ENVIRONMENT: 'بيئة',
    TRADE: 'تجارة',
    FOOD: 'غذاء',
    LOGISTICS: 'لوجستيات',
    SOVEREIGNTY: 'سيادة',
    EDUCATION: 'تعليم',
  };

  function getGovName(id: string): string {
    return GOV_NAMES[id] || id;
  }

  let layout = $derived($shellLayout);
  let isPortrait = $derived(layout === 'phone-p');
  let isDesktop = $derived(layout === 'desktop');

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

  // Dynamically evaluate whether each option can be chosen. `canAffordEventOption`
  // is the engine's own gate, so the card can never offer an option that
  // resolveEventOption() would silently reject (the old PC+USD check ignored the
  // SYP leg and its FX cover, which soft-locked the modal).
  let evaluatedOptions = $derived(
    currentEvent
      ? currentEvent.options.map((opt) => {
          const verdict = canAffordEventOption($gameStore, opt);
          return {
            ...opt,
            canChoose: verdict.ok,
            deficitReason: verdict.ok ? null : verdict.reasonAr ?? null,
          };
        })
      : []
  );

  let canDoAnyOption = $derived(evaluatedOptions.some((opt) => opt.canChoose));

  // Selected radio row (Concept D) + the existing explicit confirmation step.
  let selectedOptionId = $state<string | null>(null);
  let selectedOptionForConfirm = $state<(typeof evaluatedOptions)[number] | null>(null);
  let isConfirmingPenalty = $state<boolean>(false);
  let lastEventId: string | null = null;

  let selectedOption = $derived(
    evaluatedOptions.find((opt) => opt.id === selectedOptionId) ?? null
  );

  $effect(() => {
    const id = currentEvent?.id ?? null;
    if (id !== lastEventId) {
      lastEventId = id;
      selectedOptionId = null;
      selectedOptionForConfirm = null;
      isConfirmingPenalty = false;
    }
  });

  function handleSelectOption(opt: (typeof evaluatedOptions)[number]): void {
    if (!opt.canChoose) return;
    selectedOptionId = opt.id;
  }

  function openConfirm(): void {
    if (!selectedOption) return;
    selectedOptionForConfirm = selectedOption;
  }

  // When confirming option execution
  function handleExecuteConfirmedOption(): void {
    if (currentEvent && selectedOptionForConfirm) {
      const optionId = selectedOptionForConfirm.id;
      selectedOptionForConfirm = null;
      selectedOptionId = null;
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

  function signed(value: number): string {
    return `${value > 0 ? '+' : ''}${value}`;
  }

  function effectChips(opt: (typeof evaluatedOptions)[number]): { text: string; tone: 'good' | 'bad' }[] {
    const chips: { text: string; tone: 'good' | 'bad' }[] = [];
    if (opt.effectTrust !== 0) {
      chips.push({ text: `ثقة ${signed(opt.effectTrust)}`, tone: opt.effectTrust > 0 ? 'good' : 'bad' });
    }
    if (opt.effectRRI !== 0) {
      chips.push({ text: `احتقان ${signed(opt.effectRRI)}`, tone: opt.effectRRI > 0 ? 'bad' : 'good' });
    }
    if (opt.effectCorruption !== 0) {
      chips.push({ text: `فساد ${signed(opt.effectCorruption)}`, tone: opt.effectCorruption > 0 ? 'bad' : 'good' });
    }
    if (opt.effectCompetence !== 0) {
      chips.push({
        text: `كفاءة ${signed(opt.effectCompetence)}`,
        tone: opt.effectCompetence > 0 ? 'good' : 'bad',
      });
    }
    return chips;
  }

  let eventCardClass = $derived(
    isPortrait
      ? 'h-full w-full shell-round-sheet-bottom'
      : isDesktop
        ? 'max-h-[calc(100dvh-40px)] w-[min(760px,calc(var(--vp-w)-48px))] shell-round-pop'
        : 'max-h-[calc(100dvh-16px)] w-full max-w-[min(780px,calc(var(--vp-w)-16px))] shell-round-pop'
  );
  let eventOverlayClass = $derived(
    isPortrait
      ? 'items-end pt-[var(--shell-top-h)]'
      : isDesktop
        ? 'items-center justify-center p-5'
        : 'items-center justify-center p-2'
  );
</script>

<svelte:window onkeydown={(e) => {
  if (e.key === 'Escape') {
    if (selectedOptionForConfirm) selectedOptionForConfirm = null;
    if (isConfirmingPenalty) isConfirmingPenalty = false;
  }
}} />

{#if showEventsModal && currentEvent}
  <div class="pointer-events-auto fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]" aria-hidden="true"></div>
  <div class="pointer-events-none fixed inset-0 z-[70] flex select-none font-arabic {eventOverlayClass}">
    <div
      use:focusTrap
      role="dialog"
      aria-modal="true"
      aria-label="برقية عاجلة: {currentEvent.titleAr}"
      data-flow-stage="events"
      class="pointer-events-auto relative flex flex-col overflow-hidden border border-umber-border/35 bg-forest-deep text-wheat-light shadow-2xl modal-enter {eventCardClass}"
      style="background: radial-gradient(700px 240px at 100% 0%, rgb(from var(--color-status-danger) r g b / 0.13), transparent 70%), var(--shell-surface);"
    >
      <!-- Red/gold telegram rule across the top edge. -->
      <span
        class="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style="background: linear-gradient(90deg, transparent, var(--color-status-danger), var(--color-wheat-gold), var(--color-status-danger), transparent);"
        aria-hidden="true"
      ></span>

      <!-- Header -->
      <header class="relative shrink-0 border-b border-wheat-mid/10 px-4 pb-2.5 pt-3">
        <div class="flex items-center gap-2 pe-16 text-[8.5px] tracking-[1.6px] text-umber-crimson">
          <span class="h-1.5 w-1.5 animate-pulse bg-status-danger shell-round-chip" aria-hidden="true"></span>
          برقية عاجلة · {CATEGORY_NAMES_AR[currentEvent.category] ?? 'داخلي'} · الدور
          {String($gameStore.turnNumber).padStart(2, '0')}
        </div>
        <div class="mt-1 flex items-center gap-1.5 text-[8.5px] text-wheat-dark">
          <GameIcon name="castle" cls="h-3 w-3 shrink-0 opacity-70" />
          {currentEvent.sourceAr}
        </div>
        <span
          class="pointer-events-none absolute end-3 top-2.5 -rotate-6 border-2 border-umber-border/60 px-2 py-0.5 font-heading text-[12px] tracking-[2px] text-umber-crimson opacity-85 shell-round-item"
          aria-hidden="true"
        >
          عاجل
        </span>
      </header>

      <!-- Body -->
      <div class="scroll-area scroll-umber min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-1 pt-3">
        <h2 class="font-heading text-[clamp(20px,2.5vw,30px)] font-semibold leading-snug text-wheat-light">
          {currentEvent.titleAr}
        </h2>
        <p class="max-w-[66ch] text-[11.5px] leading-relaxed text-wheat-light/85">
          {currentEvent.descriptionAr}
        </p>

        <!-- Availability strip -->
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 border border-wheat-mid/15 bg-charcoal-deep/50 px-2.5 py-1.5 text-[8.5px] text-wheat-dark shell-round-item">
          <span>المتاح الآن:</span>
          <b dir="ltr" class="font-mono text-[10.5px] text-wheat-gold">{$gameStore.macro.politicalCapital} رصيد</b>
          <span class="h-3 w-px bg-wheat-mid/20"></span>
          <b dir="ltr" class="font-mono text-[10.5px] text-wheat-gold">${formatMillionUSD($gameStore.macro.reservesUSD)}M</b>
          <span class="h-3 w-px bg-wheat-mid/20"></span>
          <b dir="ltr" class="font-mono text-[10.5px] text-wheat-gold">{formatBillionSYP($gameStore.macro.treasurySYP)}B ل.س</b>
          <span class="h-3 w-px bg-wheat-mid/20"></span>
          <span>القرار يُحسم قبل إنهاء الدور</span>
        </div>

        <!-- Default/Incapacity Alert Card when no option can be chosen -->
        {#if !canDoAnyOption}
          <div class="border-2 border-umber-border bg-umber-deep/70 p-3.5 shell-round-item">
            <div class="flex items-center gap-2 font-heading text-[11.5px] font-bold text-umber-crimson">
              <span class="h-2 w-2 bg-umber-crimson" aria-hidden="true"></span>
              عجز سيادي شامل — تعذر الوفاء بمتطلبات أي خيار!
            </div>
            <p class="mt-1.5 text-[10.5px] leading-relaxed text-wheat-light">
              لا تملك مؤسسات الدولة النقد الأجنبي ($) أو سيولة الخزينة (SP) أو الرصيد السياسي المطلوب لتنفيذ أي من خيارات الاستجابة المتاحة.
              سيؤدي التخلف عن المعالجة إلى فرض عقوبة سيادية كارثية (ارتفاع الاحتقان الشعبي +25 نقطة، انهيار الثقة -25، تآكل الرصيد السياسي -30، وارتكاسات ميدانية عبر المحافظات).
            </p>
            <div class="mt-2 flex justify-end">
              <button
                type="button"
                onclick={() => { isConfirmingPenalty = true; }}
                class="min-h-11 border border-umber-crimson bg-umber-mid px-4 py-2 text-[11px] font-bold text-wheat-light transition-colors hover:bg-umber-border active:translate-y-0.5 shell-round-item"
              >
                تحمل العقوبة الكارثية ومحاولة الصمود
              </button>
            </div>
          </div>
        {/if}

        <!-- Options as selectable rows -->
        <div class="flex flex-col gap-1.5 pb-1">
          {#each evaluatedOptions as opt, i (opt.id)}
            {@const isSelected = selectedOptionId === opt.id}
            {@const chips = effectChips(opt)}
            <button
              type="button"
              aria-pressed={isSelected}
              aria-disabled={!opt.canChoose}
              disabled={!opt.canChoose}
              onclick={() => handleSelectOption(opt)}
              class="relative flex w-full items-start gap-2.5 border p-2.5 text-start transition-colors shell-round-item {opt.canChoose
                ? isSelected
                  ? 'cursor-pointer border-wheat-gold bg-wheat-gold/[0.07]'
                  : 'cursor-pointer border-wheat-mid/15 bg-charcoal-deep/50 hover:border-forest-accent/35 hover:bg-forest-mid/70'
                : `cursor-not-allowed opacity-80 saturate-50 ${SUSPENDED_CARD_CLASS}`}"
            >
              <span
                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border shell-round-chip {isSelected
                  ? 'border-wheat-gold bg-wheat-gold text-forest-deep'
                  : opt.canChoose
                    ? 'border-wheat-mid/35 text-transparent'
                    : 'border-umber-border/45 text-transparent'}"
                aria-hidden="true"
              >
                <GameIcon name="check-mark" cls="h-2.5 w-2.5 shrink-0" />
              </span>

              <span class="min-w-0 flex-1 {opt.canChoose ? '' : SUSPENDED_CONTENT_CLASS}">
                <span class="flex items-baseline gap-1.5 text-[11.5px] font-bold leading-snug text-wheat-light">
                  <span class="shrink-0 font-mono text-[9px] text-wheat-gold/80">{String(i + 1).padStart(2, '0')}</span>
                  <span>{opt.labelAr}</span>
                </span>
                <span class="mt-0.5 block text-[10px] leading-relaxed text-wheat-dark">
                  {opt.descriptionAr}
                </span>
                {#if opt.customEffectAr}
                  <span class="mt-0.5 block text-[9.5px] leading-relaxed text-wheat-mid/75">{opt.customEffectAr}</span>
                {/if}

                <!-- Cost & effect chips -->
                <span class="mt-1 flex flex-wrap items-center gap-1">
                  {#if opt.costUSD > 0}
                    <span class="shell-round-chip px-1.5 py-0.5 font-mono text-[9px] font-bold {$gameStore.macro.reservesUSD < opt.costUSD
                      ? 'border border-umber-crimson bg-umber-deep/80 text-umber-glow'
                      : 'border border-umber-border/60 bg-umber-deep/70 text-umber-crimson'}">
                      -${formatMillionUSD(opt.costUSD)}M
                    </span>
                  {:else if opt.costUSD < 0}
                    <span class="border border-forest-accent/40 bg-forest-mid/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-forest-accent shell-round-chip">
                      +${formatMillionUSD(-opt.costUSD)}M
                    </span>
                  {/if}

                  {#if opt.costSYP > 0}
                    <span class="shell-round-chip px-1.5 py-0.5 font-mono text-[9px] font-bold {$gameStore.macro.treasurySYP < opt.costSYP
                      ? 'border border-umber-crimson bg-umber-deep/80 text-umber-glow'
                      : 'border border-umber-border/60 bg-umber-deep/70 text-umber-crimson'}">
                      -{formatBillionSYP(opt.costSYP)}B SP
                    </span>
                  {:else if opt.costSYP < 0}
                    <span class="border border-forest-accent/40 bg-forest-mid/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-forest-accent shell-round-chip">
                      +{formatBillionSYP(-opt.costSYP)}B SP
                    </span>
                  {/if}

                  {#if opt.costPC > 0}
                    <span class="shell-round-chip px-1.5 py-0.5 font-mono text-[9px] font-bold {$gameStore.macro.politicalCapital < opt.costPC
                      ? 'border border-umber-crimson bg-umber-deep/80 text-umber-glow'
                      : 'border border-wheat-gold/40 bg-wheat-gold/10 text-wheat-gold'}">
                      -{opt.costPC} رصيد سياسي
                    </span>
                  {/if}

                  {#if opt.costUSD === 0 && opt.costSYP === 0 && opt.costPC === 0}
                    <span class="border border-wheat-mid/20 bg-charcoal-deep/60 px-1.5 py-0.5 text-[9px] text-wheat-mid shell-round-chip">
                      بدون كلفة مباشرة
                    </span>
                  {/if}

                  {#each chips as chip}
                    <span class="shell-round-chip px-1.5 py-0.5 text-[9px] font-bold {chip.tone === 'good'
                      ? 'border border-forest-accent/35 bg-forest-accent/10 text-forest-accent'
                      : 'border border-umber-border/40 bg-umber-deep/50 text-umber-glow'}">
                      {chip.text}
                    </span>
                  {/each}
                </span>

                <!-- Governorate effects (existing chips, unchanged values) -->
                {#if opt.governorateEffects && opt.governorateEffects.length > 0}
                  <span class="mt-1 flex w-full flex-wrap items-center gap-1">
                    {#each opt.governorateEffects as eff}
                      <span class="inline-flex items-center gap-1 border border-wheat-gold/35 bg-charcoal-deep/80 px-1.5 py-0.5 font-mono text-[9px] text-wheat-light shadow-sm shell-round-chip">
                        <span class="font-heading font-bold text-wheat-gold">{getGovName(eff.governorateId)}:</span>
                        {#if eff.customSummaryAr}
                          <span>{eff.customSummaryAr}</span>
                        {:else}
                          {#if eff.prri !== undefined}
                            <span class={eff.prri > 0 ? 'font-bold text-umber-crimson' : 'font-bold text-forest-accent'}>
                              {eff.prri > 0 ? `+${eff.prri}` : eff.prri} احتقان
                            </span>
                          {/if}
                          {#if eff.dailyBlackoutHours !== undefined}
                            <span class={eff.dailyBlackoutHours > 0 ? 'font-bold text-umber-crimson' : 'font-bold text-forest-accent'}>
                              {eff.dailyBlackoutHours > 0 ? `+${eff.dailyBlackoutHours}` : eff.dailyBlackoutHours} سا تقنين
                            </span>
                          {/if}
                          {#if eff.securityEfficacy !== undefined}
                            <span class={eff.securityEfficacy > 0 ? 'font-bold text-forest-accent' : 'font-bold text-umber-crimson'}>
                              {eff.securityEfficacy > 0 ? `+${eff.securityEfficacy}` : eff.securityEfficacy} أمن
                            </span>
                          {/if}
                          {#if eff.reconstructionScore !== undefined}
                            <span class={eff.reconstructionScore > 0 ? 'font-bold text-forest-accent' : 'font-bold text-umber-crimson'}>
                              {eff.reconstructionScore > 0 ? `+${eff.reconstructionScore}` : eff.reconstructionScore} إعمار
                            </span>
                          {/if}
                          {#if eff.activeHospitalsPct !== undefined}
                            <span class={eff.activeHospitalsPct > 0 ? 'font-bold text-forest-accent' : 'font-bold text-umber-crimson'}>
                              {eff.activeHospitalsPct > 0 ? `+${eff.activeHospitalsPct}` : eff.activeHospitalsPct} مشافي
                            </span>
                          {/if}
                        {/if}
                      </span>
                    {/each}
                  </span>
                {/if}

                {#if !opt.canChoose && opt.deficitReason}
                  <span class="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-umber-glow">
                    <GameIcon name="barrier" cls="h-3.5 w-3.5 shrink-0 text-umber-crimson" />
                    <span>{opt.deficitReason}</span>
                  </span>
                {:else if !opt.canChoose && opt.requirementsDescriptionAr}
                  <span class="mt-1 block text-[10px] font-semibold text-umber-crimson">
                    [متطلبات غير متوفرة]: {opt.requirementsDescriptionAr}
                  </span>
                {/if}
              </span>

              {#if !opt.canChoose}
                <span class="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <GameIcon name={SUSPENDED_ICON} cls="h-9 w-9 text-umber-glow opacity-90 drop-shadow-lg" />
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <!-- Footer: selected summary + confirm -->
      <footer class="flex shrink-0 flex-col items-stretch gap-2 border-t border-wheat-mid/10 bg-charcoal-deep/40 px-4 py-2.5 sm:flex-row sm:items-center">
        <div class="min-w-0 flex-1 text-[8.5px] leading-snug text-wheat-dark">
          <b class="block truncate font-heading text-[12px] text-wheat-gold">
            {selectedOption ? selectedOption.labelAr : 'لم يُتخذ قرار بعد'}
          </b>
          <span>
            {selectedOption
              ? 'سيُطبَّق أثره مع نتائج هذا الدور'
              : canDoAnyOption
                ? 'اختر أحد الخيارات لمتابعة البرقية'
                : 'لا خيار متاح — المضي في مسار العقوبة السيادية'}
          </span>
        </div>
        <button
          type="button"
          disabled={!selectedOption}
          onclick={openConfirm}
          class="min-h-11 shrink-0 border px-5 py-2 text-[11.5px] font-bold transition-colors shell-round-item {selectedOption
            ? 'border-wheat-gold bg-wheat-gold text-forest-deep hover:bg-wheat-light'
            : 'cursor-not-allowed border-charcoal-mid bg-charcoal-surface text-wheat-dark opacity-60'}"
        >
          تنفيذ القرار
        </button>
      </footer>

      <!-- Confirmation prompt for the selected option -->
      {#if selectedOptionForConfirm}
        <div class="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-label="تأكيد الخيار"
            class="scroll-area max-h-full w-full max-w-[520px] space-y-3 overflow-y-auto border-2 border-wheat-gold bg-forest-deep p-5 text-wheat-light shadow-[0_25px_60px_rgba(0,0,0,0.95)] shell-round-pop"
          >
            <div class="flex items-center gap-2 border-b border-wheat-mid/10 pb-2.5">
              <GameIcon name="check-mark" cls="h-4 w-4 shrink-0 text-wheat-gold" />
              <h3 class="font-heading text-[15px] font-bold text-wheat-light">تأكيد الخيار</h3>
            </div>

            <div class="space-y-2">
              <h4 class="font-heading text-[13px] font-bold text-wheat-light">{selectedOptionForConfirm.labelAr}</h4>
              <p class="text-[10.5px] leading-relaxed text-wheat-light/85">
                {selectedOptionForConfirm.descriptionAr} {selectedOptionForConfirm.customEffectAr}
              </p>

              <!-- Before / after snapshot for this decision -->
              <div class="space-y-1 border-t border-wheat-mid/10 pt-2 text-[10.5px]">
                <span class="mb-1 block font-heading text-[10px] text-wheat-dark">القيم قبل القرار وبعده:</span>
                {#if selectedOptionForConfirm.costPC > 0}
                  <div class="flex items-center justify-between font-mono">
                    <span class="text-wheat-dark">الرصيد السياسي</span>
                    <span dir="ltr">
                      <span class="font-bold text-wheat-light">{Math.round($gameStore.macro.politicalCapital)}</span>
                      <span class="text-wheat-dark"> ← </span>
                      <span class="font-bold text-umber-crimson">{Math.round($gameStore.macro.politicalCapital - selectedOptionForConfirm.costPC)}</span>
                    </span>
                  </div>
                {/if}
                {#if selectedOptionForConfirm.costUSD !== 0}
                  <div class="flex items-center justify-between font-mono">
                    <span class="text-wheat-dark">احتياطي النقد الأجنبي</span>
                    <span dir="ltr">
                      <span class="font-bold text-wheat-light">${formatMillionUSD($gameStore.macro.reservesUSD)}M</span>
                      <span class="text-wheat-dark"> ← </span>
                      <span class="font-bold {selectedOptionForConfirm.costUSD > 0 ? 'text-umber-crimson' : 'text-forest-accent'}">${formatMillionUSD($gameStore.macro.reservesUSD - selectedOptionForConfirm.costUSD)}M</span>
                    </span>
                  </div>
                {/if}
                {#if selectedOptionForConfirm.costSYP !== 0}
                  <div class="flex items-center justify-between font-mono">
                    <span class="text-wheat-dark">سيولة الخزينة</span>
                    <span dir="ltr">
                      <span class="font-bold text-wheat-light">{formatBillionSYP($gameStore.macro.treasurySYP)}B SP</span>
                      <span class="text-wheat-dark"> ← </span>
                      <span class="font-bold {selectedOptionForConfirm.costSYP > 0 ? 'text-umber-crimson' : 'text-forest-accent'}">{formatBillionSYP($gameStore.macro.treasurySYP - selectedOptionForConfirm.costSYP)}B SP</span>
                    </span>
                  </div>
                {/if}
              </div>
            </div>

            <div class="flex items-center gap-2 border-t border-wheat-mid/10 pt-3">
              <button
                type="button"
                onclick={handleExecuteConfirmedOption}
                class="min-h-11 flex-1 border border-wheat-gold bg-wheat-gold px-4 py-2 text-[11px] font-bold text-forest-deep transition-colors hover:bg-wheat-light active:translate-y-0.5 shell-round-item"
              >
                تأكيد واعتماد القرار
              </button>
              <button
                type="button"
                onclick={() => { selectedOptionForConfirm = null; }}
                class="min-h-11 flex-1 border border-charcoal-mid bg-forest-mid px-4 py-2 text-[11px] font-bold text-wheat-mid transition-colors hover:border-wheat-mid/60 hover:text-wheat-light shell-round-item"
              >
                تراجع واختيار آخر
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Confirmation prompt for the catastrophic penalty -->
      {#if isConfirmingPenalty}
        <div class="absolute inset-0 z-30 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-label="تأكيد تحمل العقوبة الكارثية"
            class="scroll-area scroll-umber max-h-full w-full max-w-[520px] space-y-3 overflow-y-auto border-2 border-umber-crimson bg-forest-deep p-5 text-wheat-light shadow-[0_25px_60px_rgba(0,0,0,0.95)] shell-round-pop"
          >
            <div class="flex items-center gap-2 border-b border-wheat-mid/10 pb-2.5">
              <GameIcon name="siren" cls="h-4 w-4 shrink-0 text-umber-crimson" />
              <h3 class="font-heading text-[15px] font-bold text-wheat-light">تأكيد تحمل العقوبة الكارثية</h3>
            </div>

            <div class="space-y-1.5 border border-umber-border bg-umber-deep/60 p-3 text-[10.5px] leading-relaxed text-wheat-light shell-round-item">
              <p class="font-bold text-umber-glow">
                هل أنت متأكد من العجز عن الاستجابة وتحمل الآثار الميدانية والسياسية الكاملة؟
              </p>
              <div class="space-y-0.5 pt-1 text-[10px] text-wheat-mid">
                <div>• ارتفاع حاد في الاحتقان الشعبي (+25 نقطة).</div>
                <div>• انهيار فادح في الثقة المدنية والمجتمعية (-25 نقطة).</div>
                <div>• تآكل رصيدك السياسي القيادي (-30 نقطة).</div>
              </div>
            </div>

            <div class="flex items-center gap-2 border-t border-wheat-mid/10 pt-3">
              <button
                type="button"
                onclick={handleExecutePenalty}
                class="min-h-11 flex-1 border border-umber-border bg-umber-mid px-4 py-2 text-[11px] font-bold text-wheat-light transition-colors hover:bg-umber-crimson active:translate-y-0.5 shell-round-item"
              >
                تأكيد تحمل العقوبة
              </button>
              <button
                type="button"
                onclick={() => { isConfirmingPenalty = false; }}
                class="min-h-11 flex-1 border border-charcoal-mid bg-forest-mid px-4 py-2 text-[11px] font-bold text-wheat-mid transition-colors hover:border-wheat-mid/60 hover:text-wheat-light shell-round-item"
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
