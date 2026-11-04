<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import GameIcon from './GameIcon.svelte';
  import {
    buildTurnHeadlines,
    formatBillionSYP,
    formatMillionUSD,
    formatNumber,
  } from './flow/turn-headlines';

  /** Results phase of the end-turn modal: a staged newspaper sequence
      (one headline card per significant movement) followed by the financial
      ledger. Rendered inside TurnReviewModal so review -> results swaps in
      place without closing or moving the modal. */
  let { onContinue }: { onContinue: () => void } = $props();

  let audit = $derived($gameStore.lastTurnAudit);
  let headlines = $derived(buildTurnHeadlines($gameStore));
  let total = $derived(headlines.length + 1);
  let stage = $state(0);
  let isLedger = $derived(stage >= headlines.length);
  let isLast = $derived(stage >= total - 1);
  let card = $derived(headlines[Math.min(stage, Math.max(0, headlines.length - 1))]);
  let seasonText = $derived($gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء');
  let completedTurn = $derived(String(Math.max(0, $gameStore.turnNumber - 1)).padStart(2, '0'));

  let realWage = $derived(
    ($gameStore.macro.civilServiceWageSYP / $gameStore.macro.parallelRateSYP).toFixed(1)
  );
  let provincesInRevoltCount = $derived(
    Object.values($gameStore.governorates).filter((g) => g.tier === 'REVOLT').length
  );
  // Exact fail predicate (fail-states.ts): national RRI ≥ 80 AND ≥ 4 revolts.
  // The old "3 / 3" indicator ignored RRI entirely and could show maximum
  // danger with no insurrection (or miss a real one at 4 revolts).
  let insurrectionRisk = $derived(
    $gameStore.macro.nationalRRI >= 80 && provincesInRevoltCount >= 4
  );
  // Operating share of SYP spending (old saves may lack the split fields).
  let opShare = $derived(
    audit && audit.expendedSYP > 0
      ? Math.round(((audit.operatingExpendedSYP ?? audit.expendedSYP) / audit.expendedSYP) * 100)
      : 0
  );

  let sortedGovernorates = $derived(
    Object.values($gameStore.governorates).sort((a, b) => b.prri - a.prri)
  );

  function next(): void {
    if (!isLast) stage += 1;
  }
  function prev(): void {
    if (stage > 0) stage -= 1;
  }
  function jump(index: number): void {
    stage = Math.max(0, Math.min(total - 1, index));
  }
  function skipToLedger(): void {
    stage = total - 1;
  }
  function primaryAction(): void {
    if (!isLast) {
      next();
      return;
    }
    onContinue();
  }

  function indexLabel(index: number): string {
    if (index >= headlines.length) return 'الملخص المالي';
    return headlines[index]?.title ?? '';
  }

  function tierLabel(tier: string): string {
    if (tier === 'REVOLT') return 'تمرد';
    if (tier === 'RIOT') return 'اضطراب';
    if (tier === 'TENSE') return 'توتر';
    return 'هادئ';
  }

  function tierClass(tier: string): string {
    if (tier === 'REVOLT') return 'border-umber-border/60 bg-umber-deep/60 text-umber-crimson';
    if (tier === 'RIOT') return 'border-umber-border/40 bg-umber-deep/35 text-umber-glow';
    if (tier === 'TENSE') return 'border-wheat-gold/40 bg-wheat-gold/10 text-wheat-gold';
    return 'border-forest-accent/30 bg-forest-accent/5 text-forest-accent';
  }

  function toneClass(tone: string): string {
    if (tone === 'good') return 'border-forest-accent/35 bg-forest-accent/5 text-forest-accent';
    if (tone === 'bad') return 'border-umber-border/50 bg-umber-deep/45 text-umber-crimson';
    return 'border-wheat-mid/25 bg-charcoal-deep/50 text-wheat-mid';
  }
</script>

<div class="flex min-h-0 flex-1 flex-col">
  {#if audit}
    <!-- Results header: title, skip, progress dots and RTL navigation. -->
    <header class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-wheat-mid/10 px-4 py-2.5">
      <div class="min-w-0 w-full sm:w-auto sm:flex-1">
        <div class="flex items-center gap-1.5 text-[8px] tracking-[1.6px] text-forest-accent/90">
          <span class="h-px w-3.5 bg-forest-accent/60"></span>
          نتائج الدور · {seasonText} {$gameStore.calendarYear}
        </div>
        <h2 class="mt-0.5 truncate font-heading text-[17px] font-semibold leading-tight text-wheat-light">
          تقرير الإغلاق · الدور {completedTurn}
        </h2>
      </div>

      {#if !isLast}
        <button
          type="button"
          onclick={skipToLedger}
          aria-label="تخطي إلى الملخص المالي"
          title="تخطي إلى الملخص المالي"
          class="flex min-h-11 w-11 shrink-0 items-center justify-center gap-1 border border-wheat-mid/20 px-2 text-[9.5px] font-bold text-wheat-dark transition-colors hover:border-wheat-mid/50 hover:text-wheat-light sm:w-auto sm:px-2.5 shell-round-item"
        >
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M18 18l-6-6 6-6M11 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="hidden sm:inline">تخطي إلى الملخص</span>
        </button>
      {/if}

      <div class="ms-auto flex shrink-0 items-center gap-1.5">
        <div class="flex items-center gap-1 pe-1.5" aria-hidden="true">
          {#each Array.from({ length: total }, (_, i) => i) as i (i)}
            <span
              class="h-1.5 w-1.5 shell-round-chip {i === stage ? 'bg-wheat-gold' : 'bg-wheat-mid/20'}"
            ></span>
          {/each}
        </div>
        <span class="font-mono text-[9px] text-wheat-dark" dir="ltr">
          {String(stage + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <button
          type="button"
          onclick={prev}
          disabled={stage === 0}
          aria-label="البطاقة السابقة"
          title="البطاقة السابقة"
          class="flex h-11 w-11 items-center justify-center border border-wheat-mid/20 text-wheat-mid transition-colors hover:border-wheat-mid/50 hover:text-wheat-light disabled:cursor-default disabled:opacity-30 shell-round-item"
        >
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onclick={next}
          disabled={isLast}
          aria-label="البطاقة التالية"
          title="البطاقة التالية"
          class="flex h-11 w-11 items-center justify-center border border-wheat-mid/20 text-wheat-mid transition-colors hover:border-wheat-mid/50 hover:text-wheat-light disabled:cursor-default disabled:opacity-30 shell-round-item"
        >
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </header>

    <div class="flex min-h-0 flex-1">
      <!-- Sequence index (desktop / wide landscape only). -->
      <aside
        class="hidden w-[215px] shrink-0 flex-col gap-0.5 overflow-y-auto border-e border-wheat-mid/10 bg-charcoal-deep/25 p-2.5 phone-p:hidden phone-l:hidden sm:flex"
        aria-label="تسلسل نتائج الدور"
      >
        <div class="mb-1 border-b border-wheat-mid/10 px-1 pb-1.5 text-[8px] tracking-[1.6px] text-forest-accent/90">
          تسلسل نتائج الدور
        </div>
        {#each Array.from({ length: total }, (_, i) => i) as i (i)}
          <button
            type="button"
            onclick={() => jump(i)}
            aria-current={i === stage ? 'step' : undefined}
            class="flex min-h-9 items-start gap-1.5 px-1.5 py-1 text-start transition-colors shell-round-item {i === stage
              ? 'bg-wheat-gold/10 text-wheat-light'
              : 'text-wheat-dark hover:bg-wheat-light/5 hover:text-wheat-mid'}"
          >
            <span class="min-w-[16px] shrink-0 font-mono text-[9px] {i === stage ? 'text-wheat-gold' : 'text-wheat-dark/70'}">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span class="text-[9.5px] leading-snug">{indexLabel(i)}</span>
          </button>
        {/each}
        <div class="mt-auto border-t border-wheat-mid/10 px-1 pt-1.5 text-[8px] leading-relaxed text-wheat-dark">
          الأرقام من تقرير الإغلاق الفعلي لهذا الدور.
        </div>
      </aside>

      <div class="scroll-area min-h-0 flex-1 overflow-y-auto p-3" data-results-stage={stage}>
        {#if isLedger}
          <!-- Ledger summary -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-1.5">
              <GameIcon name="chart" cls="h-4 w-4 shrink-0 text-wheat-gold" />
              <h3 class="font-heading text-[13px] font-bold text-wheat-gold">الملخص المالي والخدمي</h3>
            </div>

            <!-- Foreign currency -->
            <div class="overflow-hidden border border-wheat-mid/12 bg-charcoal-deep/40 shell-round-item">
              <div class="flex items-center justify-between gap-2 border-b border-wheat-mid/10 bg-forest-mid/30 px-2.5 py-1.5 text-[9px] tracking-wide text-wheat-mid">
                <span>صافي النقد الأجنبي (الدولار)</span>
                <b dir="ltr" class="font-mono text-[11px] text-wheat-gold">${formatMillionUSD($gameStore.macro.reservesUSD)}M</b>
              </div>
              <div class="flex items-center justify-between gap-3 px-2.5 py-1 text-[10px] text-wheat-dark">
                <span>صافي التغيّر هذا الدور</span>
                <b dir="ltr" class="font-mono {audit.netUSDDelta >= 0 ? 'text-forest-accent' : 'text-umber-crimson'}">
                  {audit.netUSDDelta >= 0 ? '+' : ''}${formatMillionUSD(audit.netUSDDelta)}M
                </b>
              </div>
              {#if (audit.debtServiceUSD ?? 0) > 0}
                <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                  <span>خدمة الدين</span>
                  <b dir="ltr" class="font-mono text-wheat-light">${formatMillionUSD(audit.debtServiceUSD)}M</b>
                </div>
              {/if}
              {#if (audit.iranOilCouponUSD ?? 0) > 0}
                <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                  <span>القسط النفطي الإيراني</span>
                  <b dir="ltr" class="font-mono text-wheat-light">${formatMillionUSD(audit.iranOilCouponUSD)}M</b>
                </div>
              {:else if ($gameStore.flags?.Debt_Repudiated_Iran_Formal ?? 0) === 1}
                <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                  <span>القسط الإيراني</span>
                  <b class="text-forest-accent">مُسقط ✓</b>
                </div>
              {/if}
              {#if (audit.mortgageDrainUSD ?? 0) > 0}
                <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                  <span>نزيف الرهون</span>
                  <b dir="ltr" class="font-mono text-umber-crimson">${formatMillionUSD(audit.mortgageDrainUSD)}M</b>
                </div>
              {/if}
              {#if (audit.debtRepaymentPaidUSD ?? 0) > 0}
                <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                  <span>سداد أصل</span>
                  <b dir="ltr" class="font-mono text-forest-accent">${formatMillionUSD(audit.debtRepaymentPaidUSD)}M</b>
                </div>
              {/if}
            </div>

            <!-- Treasury -->
            <div class="overflow-hidden border border-wheat-mid/12 bg-charcoal-deep/40 shell-round-item">
              <div class="flex items-center justify-between gap-2 border-b border-wheat-mid/10 bg-forest-mid/30 px-2.5 py-1.5 text-[9px] tracking-wide text-wheat-mid">
                <span>رصيد الخزينة (SP)</span>
                <b dir="ltr" class="font-mono text-[11px] {$gameStore.macro.treasurySYP < 0 ? 'text-umber-crimson' : 'text-wheat-gold'}">
                  {formatBillionSYP($gameStore.macro.treasurySYP)}B SP
                </b>
              </div>
              <div class="flex items-center justify-between gap-3 px-2.5 py-1 text-[10px] text-wheat-dark">
                <span>المحصّل مقابل المصروف</span>
                <b dir="ltr" class="font-mono text-wheat-light">
                  {formatBillionSYP(audit.grossCapturedSYP)}B − {formatBillionSYP(audit.expendedSYP)}B
                </b>
              </div>
              <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                <span>الصافي هذا الدور</span>
                <b dir="ltr" class="font-mono {audit.netSYPDelta >= 0 ? 'text-forest-accent' : 'text-umber-crimson'}">
                  {audit.netSYPDelta >= 0 ? '+' : ''}{formatBillionSYP(audit.netSYPDelta)}B
                </b>
              </div>
              <div class="border-t border-wheat-mid/8 px-2.5 py-1.5">
                <div class="flex items-center justify-between gap-2 text-[9.5px] text-wheat-dark">
                  <span>
                    تشغيلي <b dir="ltr" class="font-mono text-wheat-mid">{formatBillionSYP(audit.operatingExpendedSYP ?? audit.expendedSYP)}B</b>
                    ({opShare}%)
                  </span>
                  <span>
                    استثماري <b dir="ltr" class="font-mono text-forest-accent">{formatBillionSYP(audit.investmentExpendedSYP ?? 0)}B</b>
                    ({100 - opShare}%)
                  </span>
                </div>
                <div class="mt-1 flex h-1.5 w-full overflow-hidden bg-charcoal-surface shell-round-chip" aria-hidden="true">
                  <div class="h-full bg-wheat-gold/70" style="width: {opShare}%"></div>
                  <div class="h-full bg-forest-accent/80" style="width: {100 - opShare}%"></div>
                </div>
              </div>
              {#if (audit.capacityRevenueBonusSYP ?? 0) > 0 || (audit.projectRevenueSYP ?? 0) > 0}
                <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                  <span>إيراد متكرر جديد من النمو</span>
                  <b dir="ltr" class="font-mono text-forest-accent">
                    +{formatBillionSYP((audit.capacityRevenueBonusSYP ?? 0) + (audit.projectRevenueSYP ?? 0))}B
                  </b>
                </div>
              {/if}
              <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                <span>المسار قبل نفاد الاحتياطي</span>
                <b dir="ltr" class="font-mono text-wheat-light">~{audit.runwayTurnsEstimate ?? 99} دوراً</b>
              </div>
              <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                <span>عبء الفوائد من الإيرادات</span>
                <b dir="ltr" class="font-mono text-wheat-light">{audit.interestBurdenPct ?? 0}%</b>
              </div>
              <div class="border-t border-wheat-mid/8 px-2.5 pb-1 pt-1 text-[8px] leading-snug text-wheat-dark/80">
                تقديرات المسار مبنية على تثبيت سياسات هذا الدور.
              </div>
              {#if (audit.facilityInflowUSD ?? 0) > 0}
                <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                  <span>تسهيلات هذا الدور</span>
                  <b dir="ltr" class="font-mono text-forest-accent">+${formatMillionUSD(audit.facilityInflowUSD)}M</b>
                </div>
              {/if}
              {#if $gameStore.macro.treasurySYP < 0}
                <div class="border-t border-umber-border/40 bg-umber-deep/30 px-2.5 py-1 text-[10px] font-bold text-umber-crimson">
                  عجز مالي متراكم على الخزينة العامة
                </div>
              {:else if audit.seignioragePrintedSYP > 0}
                <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                  <span>إصدار نقدي</span>
                  <b dir="ltr" class="font-mono text-wheat-gold">+{formatBillionSYP(audit.seignioragePrintedSYP)}B</b>
                </div>
              {/if}
              {#if (audit.overdraftInterestSYP ?? 0) > 0}
                <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                  <span>فوائد العجز</span>
                  <b dir="ltr" class="font-mono text-umber-crimson">{formatBillionSYP(audit.overdraftInterestSYP)}B</b>
                </div>
              {/if}
              {#if (audit.auctionAbsorbedSYP ?? 0) > 0}
                <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                  <span>امتصاص المزاد (أُتلف)</span>
                  <b dir="ltr" class="font-mono text-wheat-light">{formatBillionSYP(audit.auctionAbsorbedSYP)}B</b>
                </div>
              {/if}
            </div>

            <!-- Services & living standards -->
            <div class="overflow-hidden border border-wheat-mid/12 bg-charcoal-deep/40 shell-round-item">
              <div class="border-b border-wheat-mid/10 bg-forest-mid/30 px-2.5 py-1.5 text-[9px] tracking-wide text-wheat-mid">
                الخدمات ومعيشة المواطنين
              </div>
              <div class="flex items-center justify-between gap-3 px-2.5 py-1 text-[10px] text-wheat-dark">
                <span>سعر الصرف في السوق الموازي</span>
                <b dir="ltr" class="font-mono text-wheat-gold">{formatNumber($gameStore.macro.parallelRateSYP)} SP</b>
              </div>
              <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                <span>متوسط الأجر الحقيقي للموظف</span>
                <b dir="ltr" class="font-mono text-forest-accent">${realWage} / شهرياً</b>
              </div>
              <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                <span>التوليد الكهربائي المتاح</span>
                <b dir="ltr" class="font-mono text-wheat-light">
                  {$gameStore.macro.gridCapacityMW} ميغاواط ({$gameStore.macro.dailyPowerHours} ساعة)
                </b>
              </div>
              <div class="flex items-center justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                <span>مؤشر الاحتقان الوطني العام</span>
                <b dir="ltr" class="font-mono {$gameStore.macro.nationalRRI < 40 ? 'text-forest-accent' : $gameStore.macro.nationalRRI < 65 ? 'text-wheat-gold' : 'text-umber-crimson'}">
                  {$gameStore.macro.nationalRRI} / 100
                </b>
              </div>
            </div>

            <!-- Distance from catastrophic fail states -->
            <div class="overflow-hidden border border-wheat-mid/12 bg-charcoal-deep/40 shell-round-item">
              <div class="border-b border-wheat-mid/10 bg-forest-mid/30 px-2.5 py-1.5 text-[9px] tracking-wide text-wheat-mid">
                المسافة من الانهيارات الكبرى
              </div>
              <div class="flex items-center justify-between gap-3 px-2.5 py-1 text-[10px] text-wheat-dark">
                <span>الاستدامة المالية للنقد الأجنبي</span>
                <b dir="ltr" class="font-mono {audit.runwayMonths <= 3.0 ? 'text-umber-crimson' : audit.runwayMonths <= 6.0 ? 'text-wheat-gold' : 'text-forest-accent'}">
                  {audit.runwayMonths} شهراً {audit.runwayMonths <= 3.0 ? '[منطقة خطر]' : '[مستقر]'}
                </b>
              </div>
              <div class="flex items-start justify-between gap-3 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] text-wheat-dark">
                <span class="shrink-0">العصيان المدني المسلح</span>
                <b class="text-end font-mono {insurrectionRisk ? 'text-umber-crimson' : 'text-wheat-light'}">
                  {provincesInRevoltCount} محافظة متمردة · احتقان {$gameStore.macro.nationalRRI}/100
                  <span class="block text-[9px] font-normal text-wheat-dark">الانهيار عند 4 محافظات متمردة واحتقان 80+</span>
                </b>
              </div>
            </div>

            <!-- Provinces (current post-turn state, sorted by unrest) -->
            <div class="overflow-hidden border border-wheat-mid/12 bg-charcoal-deep/40 shell-round-item">
              <div class="flex items-center justify-between gap-2 border-b border-wheat-mid/10 bg-forest-mid/30 px-2.5 py-1.5">
                <span class="text-[9px] tracking-wide text-wheat-mid">أوضاع المحافظات بعد الدور</span>
                <span class="text-[8px] text-wheat-dark">مرتبة بحسب الاحتقان</span>
              </div>
              {#each sortedGovernorates as gov (gov.id)}
                <div class="flex items-center justify-between gap-2 border-t border-wheat-mid/8 px-2.5 py-1 text-[10px] first:border-t-0">
                  <span class="flex min-w-0 items-center gap-1.5">
                    <span class="truncate text-wheat-mid">{gov.nameAr}</span>
                    <span class="shrink-0 border px-1 py-px text-[8px] font-bold shell-round-chip {tierClass(gov.tier)}">
                      {tierLabel(gov.tier)}
                    </span>
                  </span>
                  <span class="flex shrink-0 items-baseline gap-2 font-mono text-[9.5px]">
                    <span dir="ltr" class="text-wheat-light">RRI {gov.prri}</span>
                    <span dir="ltr" class="text-wheat-dark">{gov.dailyBlackoutHours}س</span>
                  </span>
                </div>
              {/each}
            </div>

            <!-- Five-figure mini strip -->
            <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              <div class="border border-wheat-mid/12 bg-charcoal-deep/40 px-2 py-1.5 shell-round-item">
                <div class="text-[8px] text-wheat-dark">الخزينة</div>
                <div dir="ltr" class="font-mono text-[13px] text-wheat-light">{formatBillionSYP($gameStore.macro.treasurySYP)}B</div>
                <div dir="ltr" class="font-mono text-[8px] {audit.netSYPDelta >= 0 ? 'text-forest-accent' : 'text-umber-crimson'}">
                  {audit.netSYPDelta >= 0 ? '+' : ''}{formatBillionSYP(audit.netSYPDelta)}B
                </div>
              </div>
              <div class="border border-wheat-mid/12 bg-charcoal-deep/40 px-2 py-1.5 shell-round-item">
                <div class="text-[8px] text-wheat-dark">الاحتياطي</div>
                <div dir="ltr" class="font-mono text-[13px] text-wheat-light">${formatMillionUSD($gameStore.macro.reservesUSD)}M</div>
                <div dir="ltr" class="font-mono text-[8px] {audit.netUSDDelta >= 0 ? 'text-forest-accent' : 'text-umber-crimson'}">
                  {audit.netUSDDelta >= 0 ? '+' : ''}${formatMillionUSD(audit.netUSDDelta)}M
                </div>
              </div>
              <div class="border border-wheat-mid/12 bg-charcoal-deep/40 px-2 py-1.5 shell-round-item">
                <div class="text-[8px] text-wheat-dark">الرصيد السياسي</div>
                <div dir="ltr" class="font-mono text-[13px] text-wheat-light">{Math.round($gameStore.macro.politicalCapital)}</div>
                <div dir="ltr" class="font-mono text-[8px] text-wheat-dark">/200</div>
              </div>
              <div class="border border-wheat-mid/12 bg-charcoal-deep/40 px-2 py-1.5 shell-round-item">
                <div class="text-[8px] text-wheat-dark">الثقة الشعبية</div>
                <div dir="ltr" class="font-mono text-[13px] text-wheat-light">{$gameStore.macro.civicTrust}%</div>
                <div dir="ltr" class="font-mono text-[8px] text-wheat-dark">/100</div>
              </div>
              <div class="border border-wheat-mid/12 bg-charcoal-deep/40 px-2 py-1.5 shell-round-item">
                <div class="text-[8px] text-wheat-dark">الاحتقان</div>
                <div dir="ltr" class="font-mono text-[13px] text-wheat-light">{$gameStore.macro.nationalRRI}</div>
                <div dir="ltr" class="font-mono text-[8px] text-wheat-dark">/100</div>
              </div>
            </div>
          </div>
        {:else if card}
          <!-- Newspaper headline card -->
          <article class="relative overflow-hidden border border-wheat-mid/15 bg-forest-mid/30 p-4 shell-round-item">
            <div class="flex items-start justify-between gap-2 text-[8px] tracking-[1.6px] text-wheat-gold">
              <span>{card.kicker}</span>
              <span class="text-wheat-dark">جريدة الدولة · العدد {completedTurn}</span>
            </div>
            <h3 class="mt-2 max-w-[52ch] font-heading text-[clamp(19px,2.4vw,28px)] font-semibold leading-snug text-wheat-light">
              {card.title}
            </h3>
            <p class="mt-1.5 max-w-[62ch] text-[11px] leading-relaxed text-wheat-light/85">
              {card.body}
            </p>
            <div class="mt-3 inline-flex items-baseline gap-2 border px-2.5 py-1.5 shell-round-item {toneClass(card.tone)}">
              <b dir="ltr" class="font-heading text-[24px] leading-none">{card.delta}</b>
              {#if card.note}
                <span dir="ltr" class="font-mono text-[10px] opacity-80">{card.note}</span>
              {/if}
            </div>
            <div class="mt-2 flex items-center gap-1.5 text-[8.5px] text-wheat-dark">
              <GameIcon name="castle" cls="h-3 w-3 shrink-0 opacity-70" />
              {card.source}
            </div>
            <div
              class="pointer-events-none absolute bottom-3 end-4 hidden h-[62px] w-[62px] flex-col items-center justify-center border border-wheat-gold/30 text-center font-heading text-[7.5px] leading-tight text-wheat-gold/70 sm:flex shell-round-seal"
              aria-hidden="true"
            >
              <span>الديوان</span>
              <span>الرئاسي</span>
              <span class="font-mono" dir="ltr">{$gameStore.calendarYear}</span>
            </div>
          </article>
        {/if}
      </div>
    </div>

    <!-- Footer action -->
    <footer class="flex shrink-0 flex-wrap items-center gap-2 border-t border-wheat-mid/10 bg-charcoal-deep/30 px-4 py-2.5 phone-p:flex-col phone-p:items-stretch">
      <div class="min-w-0 flex-1 text-[8.5px] leading-relaxed text-wheat-dark">
        {#if isLedger}
          الإيرادات والمصروفات وكل فروق المؤشرات من دفتر الدولة لهذا الدور.
        {:else}
          بطاقة {stage + 1} من {headlines.length} · تنقّل بالأسهم أو من التسلسل الجانبي.
        {/if}
      </div>
      <button
        type="button"
        onclick={primaryAction}
        class="flex min-h-11 items-center justify-center gap-1.5 border border-wheat-gold bg-wheat-gold px-4 py-2 text-[11px] font-bold text-forest-deep shadow-md transition-colors hover:bg-wheat-light phone-p:w-full shell-round-item"
      >
        {#if isLast}
          متابعة المهام الرئاسية للدور الجديد
        {:else}
          البطاقة التالية
          <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        {/if}
      </button>
    </footer>
  {:else}
    <div class="flex flex-1 items-center justify-center p-6 text-center text-[12px] text-wheat-dark">
      لا يوجد تقرير إغلاق متاح لهذا الدور.
    </div>
  {/if}
</div>
