<script lang="ts">
  import { uiStore, type MinistryTab } from '../stores/ui-store';
  import { draftStore, projectedTurnStore } from '../stores/draft-store';
  import { gameStore } from '../stores/game-store';

  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let p = $derived($projectedTurnStore);
  let g = $derived($gameStore);

  function closeModal() {
    uiStore.closeStatRelatedOptions();
  }

  function goToMinistryTab(tab: MinistryTab) {
    uiStore.setMinistryTab(tab);
    closeModal();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }

  function formatTrillion(syp: number): string {
    const val = Number((syp / 1_000_000_000_000).toFixed(2));
    if (Object.is(val, -0) || val === 0) return '0.00';
    return val.toFixed(2);
  }

  function formatBillionUSD(usd: number): string {
    return (usd / 1_000_000_000).toFixed(2);
  }

  function formatMillionUSD(usd: number): string {
    return (usd / 1_000_000).toFixed(1);
  }

  function formatMillionPeople(count: number): string {
    return (count / 1_000_000).toFixed(2);
  }

  function formatNumber(val: number): string {
    return Math.round(val).toLocaleString('en-US');
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if selectedStat}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-deep/80 backdrop-blur-sm font-arabic select-none animate-in fade-in duration-150"
    role="dialog"
    aria-modal="true"
  >
    <!-- Modal Container -->
    <div
      class="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-forest-surface border border-charcoal-mid shadow-2xl overflow-hidden rounded-none"
    >
      <!-- Header Bar -->
      <div class="px-5 py-3.5 bg-forest-mid border-b border-charcoal-mid flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 bg-charcoal-surface border border-wheat-mid/40 flex items-center justify-center text-wheat-gold font-mono font-bold text-xs">
            📊
          </div>
          <div>
            <h2 class="text-sm font-bold text-wheat-light font-heading">
              {#if selectedStat === 'treasurySYP'}
                الخزينة العامة للجمهورية (ليرة سورية)
              {:else if selectedStat === 'reservesUSD'}
                احتياطي النقد الأجنبي المتاح ($)
              {:else if selectedStat === 'sovereignDebtUSD'}
                الدين السيادي الخارجي ($)
              {:else if selectedStat === 'm2MoneySupplySYP'}
                الكتلة النقدية المتداولة (M2)
              {:else if selectedStat === 'parallelRate'}
                سعر صرف السوق الموازي (ل.س / $)
              {:else if selectedStat === 'politicalCapital'}
                الرصيد السياسي والشرعية القيادية
              {:else if selectedStat === 'civilServiceHeadcount'}
                قوام الموظفين في الملاك الحكومي
              {:else if selectedStat === 'civilPayrollSYP'}
                فاتورة الرواتب الحكومية (لكل دور)
              {:else if selectedStat === 'civilServiceWageUSD'}
                متوسط الأجر الشهري الحقيقي للموظف ($)
              {:else if selectedStat === 'taxCompliancePct'}
                معدل الامتثال والجباية الضريبية
              {:else if selectedStat === 'systemicCorruption'}
                مؤشر الفساد الإداري والمؤسسي
              {:else if selectedStat === 'civicTrust'}
                مؤشر الثقة الشعبية بالسلطة الانتقالية
              {:else if selectedStat === 'sovereignLeverage'}
                هامش المناورة والسيادة الوطنية
              {:else if selectedStat === 'unrestIndex'}
                مؤشر الاحتقان والتوتر الشعبي العام
              {:else}
                تفاصيل المؤشر الرئاسي
              {/if}
            </h2>
            <span class="text-[10px] text-wheat-dark">
              الخيارات الرئاسية، المراسيم، والسياسات المباشرة المؤثرة على هذا المؤشر
            </span>
          </div>
        </div>

        <button
          onclick={closeModal}
          class="w-7 h-7 flex items-center justify-center bg-forest-mid hover:bg-forest-surface text-wheat-dark hover:text-wheat-light border border-charcoal-mid transition-colors cursor-pointer text-xs"
          title="إغلاق"
        >
          ✕
        </button>
      </div>

      <!-- Current vs Projected Status Banner -->
      <div class="px-5 py-2.5 bg-charcoal-surface/90 border-b border-charcoal-mid flex items-center justify-between text-xs">
        <div class="flex items-center gap-3">
          <span class="text-wheat-dark">الحالة الراهنة:</span>
          {#if selectedStat === 'treasurySYP'}
            <span class="font-mono font-bold {p.treasurySYP.current < 0 ? 'text-umber-crimson' : 'text-wheat-light'}">{formatTrillion(p.treasurySYP.current)}T ل.س</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold {p.treasurySYP.projected < 0 ? 'text-umber-crimson' : 'text-wheat-gold'}">{formatTrillion(p.treasurySYP.projected)}T ل.س</span>
          {:else if selectedStat === 'reservesUSD'}
            <span class="font-mono font-bold text-wheat-light">${formatMillionUSD(p.reservesUSD.current)}M</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold {p.reservesUSD.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">${formatMillionUSD(p.reservesUSD.projected)}M</span>
          {:else if selectedStat === 'sovereignDebtUSD'}
            <span class="font-mono font-bold text-wheat-light">${formatBillionUSD(p.sovereignDebtUSD.current)}B</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold {p.sovereignDebtUSD.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">${formatBillionUSD(p.sovereignDebtUSD.projected)}B</span>
          {:else if selectedStat === 'm2MoneySupplySYP'}
            <span class="font-mono font-bold text-wheat-light">{formatTrillion(p.m2MoneySupplySYP.current)}T ل.س</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold {p.m2MoneySupplySYP.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">{formatTrillion(p.m2MoneySupplySYP.projected)}T ل.س</span>
          {:else if selectedStat === 'parallelRate'}
            <span class="font-mono font-bold text-wheat-light">{formatNumber(p.parallelRateSYP.current)} ل.س</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold {p.parallelRateSYP.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">{formatNumber(p.parallelRateSYP.projected)} ل.س</span>
          {:else if selectedStat === 'politicalCapital'}
            <span class="font-mono font-bold text-wheat-light">{p.politicalCapital.current}%</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold {p.politicalCapital.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">{p.politicalCapital.projected}%</span>
          {:else if selectedStat === 'civilServiceHeadcount'}
            <span class="font-mono font-bold text-wheat-light">{formatMillionPeople(p.civilServiceHeadcount.current)}M</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold text-wheat-gold">{formatMillionPeople(p.civilServiceHeadcount.projected)}M موظف</span>
          {:else if selectedStat === 'civilPayrollSYP'}
            <span class="font-mono font-bold text-wheat-light">{formatTrillion(p.civilPayrollSYP.current)}T ل.س</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold {p.civilPayrollSYP.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">{formatTrillion(p.civilPayrollSYP.projected)}T ل.س</span>
          {:else if selectedStat === 'civilServiceWageUSD'}
            <span class="font-mono font-bold text-wheat-light">${p.realWageUSD.current}</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold {p.realWageUSD.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">${p.realWageUSD.projected}</span>
          {:else if selectedStat === 'taxCompliancePct'}
            <span class="font-mono font-bold text-wheat-light">{p.taxCompliancePct.current}%</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold {p.taxCompliancePct.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">{p.taxCompliancePct.projected}%</span>
          {:else if selectedStat === 'systemicCorruption'}
            <span class="font-mono font-bold text-wheat-light">{p.systemicCorruption.current}/100</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold {p.systemicCorruption.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">{p.systemicCorruption.projected}/100</span>
          {:else if selectedStat === 'civicTrust'}
            <span class="font-mono font-bold text-wheat-light">{p.civicTrust.current}%</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold {p.civicTrust.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">{p.civicTrust.projected}%</span>
          {:else if selectedStat === 'sovereignLeverage'}
            <span class="font-mono font-bold text-wheat-light">{p.sovereignLeverage.current}%</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold {p.sovereignLeverage.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">{p.sovereignLeverage.projected}%</span>
          {:else if selectedStat === 'unrestIndex'}
            <span class="font-mono font-bold text-wheat-light">{p.nationalRRI.current}/100</span>
            <span class="text-wheat-dark">➔ المتوقع:</span>
            <span class="font-mono font-bold {p.nationalRRI.isBeneficial ? 'text-forest-accent' : 'text-umber-crimson'}">{p.nationalRRI.projected}/100</span>
          {/if}
        </div>

        <button
          onclick={() => {
            if (['treasurySYP', 'civilPayrollSYP', 'civilServiceWageUSD', 'civilServiceHeadcount'].includes(selectedStat || '')) {
              goToMinistryTab('macro');
            } else if (['reservesUSD', 'sovereignDebtUSD', 'taxCompliancePct'].includes(selectedStat || '')) {
              goToMinistryTab('finance');
            } else {
              goToMinistryTab('governance');
            }
          }}
          class="px-2.5 py-1 text-[11px] bg-forest-mid hover:bg-forest-surface text-wheat-gold border border-charcoal-mid hover:border-wheat-mid transition-colors cursor-pointer"
        >
          الانتقال إلى الوزارة المختصة ➔
        </button>
      </div>

      <!-- Content Area: List of Related Presidential Options -->
      <div class="p-5 space-y-3 overflow-y-auto max-h-[60vh] scrollbar-thin">
        <!-- ========================================================== -->
        <!-- STAT: UNREST INDEX (مؤشر الاحتقان)                         -->
        <!-- ========================================================== -->
        {#if selectedStat === 'unrestIndex'}
          <div class="text-[11px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid">
            يقيس مؤشر الاحتقان (0 إلى 100) مستوى الغضب والتوتر الشعبي في الشارع السوري. تجاوزه عتبة 75 يؤدي إلى اندلاع انتفاضات شعبية وإعلان سقوط السلطة.
          </div>

          <!-- Option 1: Food Subsidy Level -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-2">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-bold text-wheat-light font-heading block">مستوى الدعم التمويني والخبز</span>
                <span class="text-[10px] text-wheat-dark">التحكم في أسعار وتوفر الخبز والمواد الأساسية</span>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-forest-surface text-wheat-gold text-[10px] font-mono font-bold">
                {$draftStore.foodSubsidyLevel || 'STANDARD'}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                onclick={() => draftStore.setField('foodSubsidyLevel', $draftStore.foodSubsidyLevel === 'AUSTERE' ? null : 'AUSTERE')}
                class="py-1.5 px-2 border text-center transition-colors {$draftStore.foodSubsidyLevel === 'AUSTERE' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
              >
                تقشف (+15 احتقان)
              </button>
              <button
                onclick={() => draftStore.setField('foodSubsidyLevel', $draftStore.foodSubsidyLevel === 'STANDARD' ? null : 'STANDARD')}
                class="py-1.5 px-2 border text-center transition-colors {$draftStore.foodSubsidyLevel === 'STANDARD' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
              >
                اعتيادي (0 احتقان)
              </button>
              <button
                onclick={() => draftStore.setField('foodSubsidyLevel', $draftStore.foodSubsidyLevel === 'GENEROUS' ? null : 'GENEROUS')}
                class="py-1.5 px-2 border text-center transition-colors {$draftStore.foodSubsidyLevel === 'GENEROUS' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
              >
                موسع (-12 احتقان)
              </button>
            </div>
          </div>

          <!-- Option 2: Wage Bump -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-wheat-light font-heading">زيادة أجور العاملين في الدولة (+{$draftStore.wageBumpPercent}%)</span>
              <span class="text-[10px] text-forest-accent">يمتص الاحتقان المعيشي</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={$draftStore.wageBumpPercent}
              oninput={(e) => draftStore.setField('wageBumpPercent', Number(e.currentTarget.value))}
              class="w-full accent-wheat-gold cursor-pointer bg-charcoal-surface h-1.5 border border-charcoal-mid"
            />
          </div>

          <!-- Option 3: Martial Law Decree -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-wheat-light font-heading block">مرسوم الأحكام العرفية والطوارئ</span>
              <span class="text-[10px] text-forest-accent font-mono font-bold">-15 احتقان فوري | كلفة: 15 رصيد سياسي، -12 ثقة</span>
            </div>
            <button
              onclick={() => draftStore.togglePoliticalAction('MARTIAL_LAW')}
              class="px-3 py-1.5 text-xs font-bold border transition-colors {$draftStore.activePoliticalActions.includes('MARTIAL_LAW') ? 'bg-wheat-gold text-forest-deep border-wheat-gold' : 'bg-charcoal-surface text-wheat-mid hover:text-wheat-light border-charcoal-mid'}"
            >
              {$draftStore.activePoliticalActions.includes('MARTIAL_LAW') ? 'مُفعّل' : 'تفعيل'}
            </button>
          </div>

          <!-- Option 4: Tribal Customs Decree -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-wheat-light font-heading block">ميثاق التفاهم العشائري وتأمين الترانزيت</span>
              <span class="text-[10px] text-forest-accent font-mono font-bold">-10 احتقان بالشرق | كلفة: 8 رصيد سياسي</span>
            </div>
            <button
              onclick={() => draftStore.togglePoliticalAction('TRIBAL_CUSTOMS_COUNCIL')}
              class="px-3 py-1.5 text-xs font-bold border transition-colors {$draftStore.activePoliticalActions.includes('TRIBAL_CUSTOMS_COUNCIL') ? 'bg-wheat-gold text-forest-deep border-wheat-gold' : 'bg-charcoal-surface text-wheat-mid hover:text-wheat-light border-charcoal-mid'}"
            >
              {$draftStore.activePoliticalActions.includes('TRIBAL_CUSTOMS_COUNCIL') ? 'مُفعّل' : 'تفعيل'}
            </button>
          </div>

        <!-- ========================================================== -->
        <!-- STAT: FX RESERVES (احتياطي الدولار)                        -->
        <!-- ========================================================== -->
        {:else if selectedStat === 'reservesUSD'}
          <div class="text-[11px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid">
            الاحتياطي النقدي الأجنبي يمثل خط الدفاع المالي الأول لتمويل استيراد القمح والوقود وصيانة محطات الطاقة. نفاده يدخل البلاد في حالة شلل وإفلاس سيادي.
          </div>

          <!-- Option 1: Dollar Intervention Auction -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-wheat-light font-heading">مزاد التدخل الدولاري للمركزي</span>
              <span class="font-mono text-wheat-gold font-bold">${$draftStore.dollarAuctionUSD / 1_000_000}M</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(10, Math.floor(g.macro.reservesUSD / 1_000_000))}
              step="5"
              value={$draftStore.dollarAuctionUSD / 1_000_000}
              oninput={(e) => draftStore.setField('dollarAuctionUSD', Number(e.currentTarget.value) * 1_000_000)}
              class="w-full accent-wheat-gold cursor-pointer bg-charcoal-surface h-1.5 border border-charcoal-mid"
            />
            <span class="text-[10px] text-amber-300 block">ضخ الدولار يدافع عن الليرة، لكن يستنزف الاحتياطي المتاح مباشرة.</span>
          </div>

          <!-- Option 2: National Grid CapEx -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-wheat-light font-heading">الاستثمار القومي في شبكة الكهرباء</span>
              <span class="font-mono text-wheat-gold font-bold">${$draftStore.gridCapExUSD / 1_000_000}M</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(10, Math.floor(g.macro.reservesUSD / 1_000_000))}
              step="5"
              value={$draftStore.gridCapExUSD / 1_000_000}
              oninput={(e) => draftStore.setField('gridCapExUSD', Number(e.currentTarget.value) * 1_000_000)}
              class="w-full accent-wheat-gold cursor-pointer bg-charcoal-surface h-1.5 border border-charcoal-mid"
            />
            <span class="text-[10px] text-wheat-dark block">يرفع ساعات الكهرباء والإنتاج، لكن يقتطع دولارات كاش من الاحتياطي.</span>
          </div>

          <!-- Quick Navigation to Loans and Asset Liquidations -->
          <div class="p-3 bg-charcoal-surface border border-charcoal-mid flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-wheat-light font-heading block">خطوط الائتمان وتصفية الأصول</span>
              <span class="text-[10px] text-forest-accent">طلب قروض دولية وتصفية أصول الفساد يجلب سيولة دولارية جديدة كاش.</span>
            </div>
            <button
              onclick={() => goToMinistryTab('finance')}
              class="px-3 py-1.5 text-xs font-bold bg-forest-mid hover:bg-forest-surface text-wheat-gold border border-charcoal-mid"
            >
              غرفة التمويل والأصول ➔
            </button>
          </div>

        <!-- ========================================================== -->
        <!-- STAT: CIVIC TRUST (الثقة الشعبية)                           -->
        <!-- ========================================================== -->
        {:else if selectedStat === 'civicTrust'}
          <div class="text-[11px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid">
            الثقة الشعبية (0 إلى 100%) تعكس تصديق المواطنين لجدية المرحلة الانتقالية والعدالة المؤسسية. ارتفاعها يرفع الجباية الضريبية ويخفض فرص التمرد.
          </div>

          <div class="p-3 bg-forest-mid border border-charcoal-mid flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-wheat-light font-heading block">المنصة الرقمية لرد الملكيات العقارية</span>
              <span class="text-[10px] text-forest-accent font-mono font-bold">+4 ثقة شعبية | كلفة: 10 رصيد سياسي</span>
            </div>
            <button
              onclick={() => draftStore.togglePoliticalAction('PROPERTY_RESTITUTION_PORTAL')}
              class="px-3 py-1.5 text-xs font-bold border transition-colors {$draftStore.activePoliticalActions.includes('PROPERTY_RESTITUTION_PORTAL') ? 'bg-wheat-gold text-forest-deep border-wheat-gold' : 'bg-charcoal-surface text-wheat-mid hover:text-wheat-light border-charcoal-mid'}"
            >
              {$draftStore.activePoliticalActions.includes('PROPERTY_RESTITUTION_PORTAL') ? 'مُفعّل' : 'تفعيل'}
            </button>
          </div>

          <div class="p-3 bg-forest-mid border border-charcoal-mid flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-wheat-light font-heading block">جلسة المساءلة الحكومية العلنية</span>
              <span class="text-[10px] text-forest-accent font-mono font-bold">+3 ثقة | +8 رصيد سياسي مجاناً</span>
            </div>
            <button
              onclick={() => draftStore.togglePoliticalAction('CABINET_HEARING')}
              class="px-3 py-1.5 text-xs font-bold border transition-colors {$draftStore.activePoliticalActions.includes('CABINET_HEARING') ? 'bg-wheat-gold text-forest-deep border-wheat-gold' : 'bg-charcoal-surface text-wheat-mid hover:text-wheat-light border-charcoal-mid'}"
            >
              {$draftStore.activePoliticalActions.includes('CABINET_HEARING') ? 'مُفعّل' : 'تفعيل'}
            </button>
          </div>

          <div class="p-3 bg-forest-mid border border-charcoal-mid flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-wheat-light font-heading block">خطاب المصالحة الوطنية والعهد المدني</span>
              <span class="text-[10px] text-forest-accent font-mono font-bold">+2 ثقة | -3 احتقان | +4 رصيد سياسي</span>
            </div>
            <button
              onclick={() => draftStore.togglePoliticalAction('UNITY_SPEECH')}
              class="px-3 py-1.5 text-xs font-bold border transition-colors {$draftStore.activePoliticalActions.includes('UNITY_SPEECH') ? 'bg-wheat-gold text-forest-deep border-wheat-gold' : 'bg-charcoal-surface text-wheat-mid hover:text-wheat-light border-charcoal-mid'}"
            >
              {$draftStore.activePoliticalActions.includes('UNITY_SPEECH') ? 'مُفعّل' : 'تفعيل'}
            </button>
          </div>

        <!-- ========================================================== -->
        <!-- STAT: SYSTEMIC CORRUPTION (الفساد المؤسسي)                  -->
        <!-- ========================================================== -->
        {:else if selectedStat === 'systemicCorruption'}
          <div class="text-[11px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid">
            الفساد المؤسسي ينهب موارد الجباية ويهدر دعم المحروقات ويقوض عدالة القضاء. خفضه يتطلب قرارات حازمة قد تستفز أمراء الحرب.
          </div>

          <div class="p-3 bg-forest-mid border border-charcoal-mid flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-wheat-light font-heading block">مرسوم إطلاق هيئة النزاهة وتدقيق الأصول</span>
              <span class="text-[10px] text-forest-accent font-mono font-bold">-8 فساد وطني | +5% امتثال ضريبي | كلفة: 15 رصيد سياسي</span>
            </div>
            <button
              onclick={() => draftStore.togglePoliticalAction('ANTI_CORRUPTION_COMMISSION')}
              class="px-3 py-1.5 text-xs font-bold border transition-colors {$draftStore.activePoliticalActions.includes('ANTI_CORRUPTION_COMMISSION') ? 'bg-wheat-gold text-forest-deep border-wheat-gold' : 'bg-charcoal-surface text-wheat-mid hover:text-wheat-light border-charcoal-mid'}"
            >
              {$draftStore.activePoliticalActions.includes('ANTI_CORRUPTION_COMMISSION') ? 'مُفعّل' : 'تفعيل'}
            </button>
          </div>

          <div class="p-3 bg-forest-mid border border-charcoal-mid flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-wheat-light font-heading block">الحملة الوطنية لضبط الحدود ومكافحة التهريب</span>
              <span class="text-[10px] text-forest-accent font-mono font-bold">-4 فساد | +3% امتثال | كلفة: 12 رصيد سياسي</span>
            </div>
            <button
              onclick={() => draftStore.togglePoliticalAction('SMUGGLING_BORDER_SWEEP')}
              class="px-3 py-1.5 text-xs font-bold border transition-colors {$draftStore.activePoliticalActions.includes('SMUGGLING_BORDER_SWEEP') ? 'bg-wheat-gold text-forest-deep border-wheat-gold' : 'bg-charcoal-surface text-wheat-mid hover:text-wheat-light border-charcoal-mid'}"
            >
              {$draftStore.activePoliticalActions.includes('SMUGGLING_BORDER_SWEEP') ? 'مُفعّل' : 'تفعيل'}
            </button>
          </div>

          <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-wheat-light font-heading">شطب البطالة المقنعة والرواتب الوهمية</span>
              <span class="text-[10px] text-forest-accent">يقلص شبكات الفساد الإداري ويوفر 25% من الرواتب</span>
            </div>
            <div class="flex gap-2">
              <button
                onclick={() => draftStore.setField('workforceStrategy', $draftStore.workforceStrategy === 'PRUNE_CIVIL_SERVICE' ? null : 'PRUNE_CIVIL_SERVICE')}
                class="px-3 py-1.5 text-xs font-bold border transition-colors {$draftStore.workforceStrategy === 'PRUNE_CIVIL_SERVICE' ? 'bg-forest-surface border-wheat-mid text-wheat-gold' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
              >
                {$draftStore.workforceStrategy === 'PRUNE_CIVIL_SERVICE' ? 'شطب الوهمي [مُفعّل]' : 'اعتماد شطب الوهمي'}
              </button>
            </div>
          </div>

        <!-- ========================================================== -->
        <!-- GENERIC / FALLBACK FOR OTHER STATS                         -->
        <!-- ========================================================== -->
        {:else}
          <div class="text-[11px] text-wheat-dark leading-relaxed p-2 bg-charcoal-surface/60 border border-charcoal-mid">
            هذا المؤشر يرتبط بصورة مباشرة بالسياسات والقرارات المدرجة في غرف العمليات الوزارية. يمكنك التحكم بالسياسات المعنية مباشرة:
          </div>

          <!-- Section: Quick Sliders and Controls -->
          <div class="space-y-2.5">
            {#if ['treasurySYP', 'civilPayrollSYP', 'civilServiceWageUSD', 'civilServiceHeadcount', 'm2MoneySupplySYP'].includes(selectedStat)}
              <!-- Wage Policy -->
              <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-1.5">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-wheat-light font-heading">زيادة أجور العاملين (+{$draftStore.wageBumpPercent}%)</span>
                  <span class="font-mono text-wheat-gold">${p.realWageUSD.projected} / شهر</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={$draftStore.wageBumpPercent}
                  oninput={(e) => draftStore.setField('wageBumpPercent', Number(e.currentTarget.value))}
                  class="w-full accent-wheat-gold cursor-pointer bg-charcoal-surface h-1.5 border border-charcoal-mid"
                />
              </div>

              <!-- Workforce Strategy -->
              <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-2">
                <span class="text-xs font-bold text-wheat-light font-heading block">هيكلة ملاك الدولة</span>
                <div class="grid grid-cols-3 gap-1 text-[11px]">
                  {#each [
                    { id: 'MAINTAIN', label: 'تثبيت الملاك' },
                    { id: 'PRUNE_CIVIL_SERVICE', label: 'شطب الوهمي (-25%)' },
                    { id: 'ABSORB_MILITIAS', label: 'استيعاب المسلحين (+15%)' }
                  ] as opt}
                    <button
                      onclick={() => draftStore.setField('workforceStrategy', $draftStore.workforceStrategy === opt.id ? null : (opt.id as any))}
                      class="py-1 px-1 text-center border transition-colors {$draftStore.workforceStrategy === opt.id ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
                    >
                      {opt.label}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            {#if ['taxCompliancePct', 'parallelRate', 'treasurySYP', 'sovereignLeverage', 'sovereignDebtUSD'].includes(selectedStat)}
              <!-- Taxes and Customs -->
              <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-1.5">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-wheat-light font-heading">ضريبة أرباح الشركات ({$draftStore.corporateTaxRate}%)</span>
                  <span class="text-[10px] text-wheat-dark">معايرة الجباية</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="35"
                  step="1"
                  value={$draftStore.corporateTaxRate}
                  oninput={(e) => draftStore.setField('corporateTaxRate', Number(e.currentTarget.value))}
                  class="w-full accent-wheat-gold cursor-pointer bg-charcoal-surface h-1.5 border border-charcoal-mid"
                />
              </div>

              <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-1.5">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-bold text-wheat-light font-heading">رسوم الترانزيت البري بكافة المعابر (${$draftStore.nassibTransitFeeUSD}/شاحنة)</span>
                  <span class="text-[10px] text-forest-accent">عوائد دولار مباشرة</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="800"
                  step="50"
                  value={$draftStore.nassibTransitFeeUSD}
                  oninput={(e) => draftStore.setField('nassibTransitFeeUSD', Number(e.currentTarget.value))}
                  class="w-full accent-wheat-gold cursor-pointer bg-charcoal-surface h-1.5 border border-charcoal-mid"
                />
              </div>
            {/if}

            {#if selectedStat === 'politicalCapital'}
              <div class="p-3 bg-forest-mid border border-charcoal-mid flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-wheat-light font-heading block">توسيع التشكيل الحكومي واستيعاب التكنوقراط</span>
                  <span class="text-[10px] text-forest-accent font-mono font-bold">+18 رصيد سياسي | +4 ثقة</span>
                </div>
                <button
                  onclick={() => draftStore.togglePoliticalAction('OPPOSITION_SEATS')}
                  class="px-3 py-1.5 text-xs font-bold border transition-colors {$draftStore.activePoliticalActions.includes('OPPOSITION_SEATS') ? 'bg-wheat-gold text-forest-deep border-wheat-gold' : 'bg-charcoal-surface text-wheat-mid hover:text-wheat-light border-charcoal-mid'}"
                >
                  {$draftStore.activePoliticalActions.includes('OPPOSITION_SEATS') ? 'مُفعّل' : 'تفعيل'}
                </button>
              </div>

              <div class="p-3 bg-forest-mid border border-charcoal-mid flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-wheat-light font-heading block">جلسة المساءلة الحكومية العلنية</span>
                  <span class="text-[10px] text-forest-accent font-mono font-bold">+8 رصيد سياسي مجاناً | +3 ثقة</span>
                </div>
                <button
                  onclick={() => draftStore.togglePoliticalAction('CABINET_HEARING')}
                  class="px-3 py-1.5 text-xs font-bold border transition-colors {$draftStore.activePoliticalActions.includes('CABINET_HEARING') ? 'bg-wheat-gold text-forest-deep border-wheat-gold' : 'bg-charcoal-surface text-wheat-mid hover:text-wheat-light border-charcoal-mid'}"
                >
                  {$draftStore.activePoliticalActions.includes('CABINET_HEARING') ? 'مُفعّل' : 'تفعيل'}
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="px-5 py-3 bg-forest-mid border-t border-charcoal-mid flex items-center justify-between">
        <span class="text-[10px] text-wheat-dark">
          جميع التغييرات تُسجّل فورياً في مسودة الدور وتظهر آثارها المتوقعة في الشريط العلوي.
        </span>
        <button
          onclick={closeModal}
          class="px-4 py-1.5 bg-wheat-gold hover:bg-wheat-light text-forest-deep font-bold text-xs transition-colors cursor-pointer rounded-none font-heading"
        >
          تم والعودة للخريطة
        </button>
      </div>
    </div>
  </div>
{/if}
