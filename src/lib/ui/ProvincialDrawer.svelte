<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { draftStore, budgetStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  }

  const TIER_NAMES_AR: Record<string, string> = {
    CALM: 'مستقرة',
    TENSE: 'متوترة',
    RIOT: 'اضطرابات',
    REVOLT: 'تمرد مسلح',
  };

  let selectedId = $derived($uiStore.selectedGovernorateId);
  let node = $derived(selectedId ? $gameStore.governorates[selectedId] : null);

  let activeProvincialTab = $state<'directives' | 'field'>('directives');

  let isSelectedForDemining = $derived($draftStore.deminingPriorityId === selectedId);
  let canDeployDemining = $derived(node ? node.mineSaturationPct > 8 : false);
  let canAffordDemining = $derived(
    $budgetStore.remainingUSD >= 20_000_000 && $budgetStore.remainingSYP >= 800_000_000_000
  );

  let isSelectedForPowerBoost = $derived($draftStore.powerBoostGovId === selectedId);
  let canDeployPowerBoost = $derived(node ? node.dailyBlackoutHours > 2 : false);
  let canAffordPowerBoost = $derived(
    $budgetStore.remainingUSD >= 10_000_000 && $budgetStore.remainingSYP >= 300_000_000_000
  );

  let isProjectCommitted = $derived(
    Boolean(node?.strategicProject && $draftStore.provincialProjects.includes(node.strategicProject.id))
  );
  let isProjectAffordablePC = $derived(
    Boolean(node?.strategicProject && node.strategicProject.costPoliticalCapital <= $budgetStore.remainingPC)
  );
  let isProjectAffordableUSD = $derived(
    Boolean(node?.strategicProject && node.strategicProject.costUSD <= $budgetStore.remainingUSD)
  );
  let isProjectAffordableSYP = $derived(
    Boolean(node?.strategicProject && node.strategicProject.costSYP <= $budgetStore.remainingSYP)
  );
  let canAffordProject = $derived(
    isProjectAffordablePC && isProjectAffordableUSD && isProjectAffordableSYP
  );

  $effect(() => {
    if (selectedId && $draftStore.deminingPriorityId === selectedId && node && node.mineSaturationPct <= 8) {
      draftStore.setField('deminingPriorityId', null);
    }
  });
</script>

<aside
  class="fixed top-0 left-0 bottom-0 w-[390px] h-screen z-30 bg-forest-deep border-r border-charcoal-mid shadow-2xl p-4 flex flex-col justify-between overflow-y-auto select-none rounded-none font-arabic text-wheat-light"
>
  {#if node}
    <!-- Detail View for Selected Governorate -->
    <div class="space-y-3.5">
      <!-- Header & Action Status -->
      <div class="border-b border-charcoal-mid pb-3 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h2 class="text-base font-bold text-wheat-light font-heading">{node.nameAr}</h2>
            <span
              class="text-[10px] px-2 py-0.5 font-bold rounded-none border {node.tier === 'CALM' ? 'bg-forest-surface border-forest-accent text-forest-accent' : node.tier === 'TENSE' ? 'bg-forest-mid border-wheat-mid text-wheat-gold' : node.tier === 'RIOT' ? 'bg-umber-mid border-umber-border text-wheat-light' : 'bg-umber-deep border-umber-crimson text-umber-crimson animate-pulse'}"
            >
              {TIER_NAMES_AR[node.tier] ?? node.tier}
            </span>
          </div>
          <button
            onclick={() => uiStore.selectGovernorate(null)}
            class="text-wheat-dark hover:text-wheat-light text-xs px-2.5 py-1 bg-charcoal-surface hover:bg-forest-surface border border-charcoal-mid rounded-none transition-colors cursor-pointer"
          >
            إلغاء التحديد
          </button>
        </div>

        <!-- High-level Vital Signs Ticker -->
        <div class="grid grid-cols-3 gap-1 text-center text-[11px] pt-1">
          <div class="p-1.5 bg-forest-mid border border-charcoal-mid rounded-none">
            <span class="text-[10px] text-wheat-dark block">الاحتقان</span>
            <span class="font-bold font-mono {node.prri < 40 ? 'text-forest-accent' : node.prri < 65 ? 'text-wheat-gold' : 'text-umber-crimson'}">{node.prri}/100</span>
          </div>
          <div class="p-1.5 bg-forest-mid border border-charcoal-mid rounded-none">
            <span class="text-[10px] text-wheat-dark block">التغذية</span>
            <span class="font-bold font-mono text-wheat-light">{24 - node.dailyBlackoutHours} س</span>
          </div>
          <div class="p-1.5 bg-forest-mid border border-charcoal-mid rounded-none">
            <span class="text-[10px] text-wheat-dark block">تلوث الألغام</span>
            <span class="font-bold font-mono {node.mineSaturationPct > 8 ? 'text-wheat-gold' : 'text-forest-accent'}">{node.mineSaturationPct}%</span>
          </div>
        </div>

        <!-- Two Sub-Tabs Navigation -->
        <div class="grid grid-cols-2 gap-1 bg-charcoal-surface p-1 border border-charcoal-mid rounded-none mt-1">
          <button
            onclick={() => (activeProvincialTab = 'directives')}
            class="py-1.5 px-2 text-[11px] font-semibold transition-colors rounded-none text-center cursor-pointer {activeProvincialTab === 'directives' ? 'bg-forest-surface text-wheat-gold border border-wheat-mid shadow-sm' : 'text-wheat-dark hover:text-wheat-light hover:bg-forest-mid'}"
          >
            أوامر التدخل الميداني
          </button>
          <button
            onclick={() => (activeProvincialTab = 'field')}
            class="py-1.5 px-2 text-[11px] font-semibold transition-colors rounded-none text-center cursor-pointer {activeProvincialTab === 'field' ? 'bg-forest-surface text-wheat-gold border border-wheat-mid shadow-sm' : 'text-wheat-dark hover:text-wheat-light hover:bg-forest-mid'}"
          >
            البيانات والديموغرافيا
          </button>
        </div>
      </div>

      <!-- SUB-TAB 1: ACTIONABLE DIRECTIVES & INTERVENTIONS -->
      {#if activeProvincialTab === 'directives'}
        <div class="space-y-3">
          <!-- Strategic Project Dossier & Presidential Directive Card -->
          {#if node.strategicProject}
            <div class="p-3 bg-charcoal-surface border {node.strategicProject.isExecuted ? 'border-forest-accent/50' : isProjectCommitted ? 'border-wheat-gold' : 'border-charcoal-mid'} space-y-2 rounded-none">
              <div class="flex items-start justify-between gap-2 border-b border-charcoal-mid pb-1.5">
                <div>
                  <span class="text-[10px] text-wheat-gold uppercase tracking-wider font-bold block font-heading">
                    مشروع التدخل الاستراتيجي الرئاسي
                  </span>
                  <h3 class="text-xs font-bold text-wheat-light font-heading">
                    {node.strategicProject.titleAr}
                  </h3>
                </div>
                {#if node.strategicProject.isExecuted}
                  <span class="text-[10px] px-2 py-0.5 bg-forest-surface text-forest-accent border border-forest-accent font-bold">
                    [تم الإنجاز]
                  </span>
                {:else if isProjectCommitted}
                  <span class="text-[10px] px-2 py-0.5 bg-forest-surface text-wheat-gold border border-wheat-gold font-bold">
                    [معتمد للدور]
                  </span>
                {/if}
              </div>

              <!-- Problem & Solution Dossier -->
              <div class="space-y-1.5 text-[11px]">
                <div class="p-2 bg-forest-deep border border-charcoal-mid space-y-0.5">
                  <span class="text-wheat-dark font-semibold block font-heading">المعضلة الميدانية:</span>
                  <p class="text-wheat-light leading-relaxed text-[10px]">
                    {node.strategicProject.issueDescriptionAr}
                  </p>
                </div>

                <div class="p-2 bg-forest-deep border border-charcoal-mid space-y-0.5">
                  <span class="text-wheat-dark font-semibold block font-heading">القرار الرئاسي المقترح:</span>
                  <p class="text-wheat-light leading-relaxed text-[10px]">
                    {node.strategicProject.solutionDescriptionAr}
                  </p>
                </div>
              </div>

              <!-- Cost & Impact Breakdown -->
              <div class="p-2 bg-forest-mid border border-charcoal-mid text-[11px] space-y-1">
                <div class="flex justify-between items-center">
                  <span class="text-wheat-dark font-heading">الكلفة المطلوبة:</span>
                  <span class="font-bold text-wheat-light font-mono text-[10px]">
                    {node.strategicProject.costUSD / 1_000_000} مليون دولار + {node.strategicProject.costSYP / 1_000_000_000_000} تريليون ل.س
                    {#if node.strategicProject.costPoliticalCapital > 0}
                      <span class="text-wheat-gold"> | {node.strategicProject.costPoliticalCapital} رصيد سياسي</span>
                    {/if}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-wheat-dark font-heading">الأثر المباشر:</span>
                  <span class="text-forest-accent font-semibold text-[10px]">
                    {node.strategicProject.effectDescriptionAr}
                  </span>
                </div>
              </div>

              <!-- Decision Execution Button -->
              {#if !node.strategicProject.isExecuted}
                <button
                  onclick={() => {
                    if (node?.strategicProject) {
                      draftStore.toggleProvincialProject(node.strategicProject.id);
                    }
                  }}
                  disabled={!isProjectCommitted && !canAffordProject}
                  class="w-full py-2 px-3 text-xs font-bold border transition-colors rounded-none {isProjectCommitted ? 'bg-wheat-gold text-forest-deep border-wheat-gold hover:bg-wheat-light cursor-pointer' : canAffordProject ? 'bg-forest-surface hover:bg-wheat-gold hover:text-forest-deep text-wheat-light border-charcoal-light cursor-pointer' : 'bg-charcoal-surface text-wheat-dark border-charcoal-mid cursor-not-allowed opacity-60'}"
                >
                  {#if isProjectCommitted}
                    إلغاء اعتماد المشروع لهذا الدور
                  {:else if !isProjectAffordablePC}
                    تعذر الاعتماد: رصيد سياسي غير كافٍ (المتاح: {$budgetStore.remainingPC})
                  {:else if !isProjectAffordableUSD}
                    تعذر الاعتماد: ميزانية دولارية غير كافية
                  {:else if !isProjectAffordableSYP}
                    تعذر الاعتماد: سيولة ليرة غير كافية
                  {:else}
                    إصدار القرار الرئاسي واعتماد المشروع
                  {/if}
                </button>
              {/if}
            </div>
          {/if}

          <!-- Demining Priority Directive -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-2 rounded-none">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5">
                  <h3 class="text-xs text-wheat-light font-semibold block font-heading">فرق نزع الألغام الهندسية</h3>
                  {#if isSelectedForDemining}
                    <span class="text-[9px] px-1.5 py-0.2 bg-forest-surface text-forest-accent border border-forest-accent font-mono font-bold">-8% ألغام</span>
                  {/if}
                </div>
                <span class="text-[10px] text-wheat-dark">
                  {canDeployDemining ? 'تطهير 8% من الأراضي الملغومة بالمخلفات الحربية' : 'تطهير منجز أو نسبة الألغام أقل من الحد الأدنى (8%)'}
                </span>
              </div>
              <button
                onclick={() => {
                  if (selectedId && (isSelectedForDemining || (canDeployDemining && canAffordDemining))) {
                    draftStore.setField('deminingPriorityId', isSelectedForDemining ? null : selectedId);
                  }
                }}
                disabled={!isSelectedForDemining && (!canDeployDemining || !canAffordDemining)}
                class="px-3 py-1.5 text-xs font-bold border transition-colors rounded-none {isSelectedForDemining ? 'bg-wheat-gold text-forest-deep border-wheat-gold cursor-pointer' : (canDeployDemining && canAffordDemining) ? 'bg-charcoal-surface hover:bg-forest-surface text-wheat-light border-charcoal-light cursor-pointer' : 'bg-charcoal-surface text-wheat-dark border-charcoal-mid cursor-not-allowed opacity-60'}"
              >
                {#if isSelectedForDemining}
                  أولوية تطهير معتمدة (إلغاء)
                {:else if !canDeployDemining}
                  مطهرة (≤ 8%)
                {:else if !canAffordDemining}
                  ميزانية غير كافية ($20M / 0.8T)
                {:else}
                  تعيين كأولوية تطهير
                {/if}
              </button>
            </div>
            <div class="flex justify-between items-center text-[10px] text-wheat-mid border-t border-charcoal-mid/80 pt-1">
              <span>الكلفة: 20 مليون دولار + 0.8 تريليون ل.س</span>
              <span class="font-mono {node.mineSaturationPct > 8 ? 'text-wheat-gold' : 'text-forest-accent'}">
                التلوث الحالي: {node.mineSaturationPct}%
              </span>
            </div>
          </div>

          <!-- Power Supply Boost Priority Directive -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-2 rounded-none">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5">
                  <h3 class="text-xs text-wheat-light font-semibold block font-heading">أولوية تعزيز التغذية والكهرباء</h3>
                  {#if isSelectedForPowerBoost}
                    <span class="text-[9px] px-1.5 py-0.2 bg-forest-surface text-wheat-gold border border-wheat-gold font-mono font-bold">+4 س كهرباء</span>
                  {/if}
                </div>
                <span class="text-[10px] text-wheat-dark">
                  {canDeployPowerBoost ? 'محولات طوارئ وصيانة خطوط التوتر، خفض 4 ساعات ظلام، وتهدئة (-6)' : 'ساعات التغذية مستقرة بالحد الأقصى (ساعتان ظلام فقط)'}
                </span>
              </div>
              <button
                onclick={() => {
                  if (selectedId && (isSelectedForPowerBoost || (canDeployPowerBoost && canAffordPowerBoost))) {
                    draftStore.setField('powerBoostGovId', isSelectedForPowerBoost ? null : selectedId);
                  }
                }}
                disabled={!isSelectedForPowerBoost && (!canDeployPowerBoost || !canAffordPowerBoost)}
                class="px-3 py-1.5 text-xs font-bold border transition-colors rounded-none {isSelectedForPowerBoost ? 'bg-wheat-gold text-forest-deep border-wheat-gold cursor-pointer' : (canDeployPowerBoost && canAffordPowerBoost) ? 'bg-charcoal-surface hover:bg-forest-surface text-wheat-light border-charcoal-light cursor-pointer' : 'bg-charcoal-surface text-wheat-dark border-charcoal-mid cursor-not-allowed opacity-60'}"
              >
                {#if isSelectedForPowerBoost}
                  أولوية كهرباء معتمدة (إلغاء)
                {:else if !canDeployPowerBoost}
                  الشبكة مستقرة
                {:else if !canAffordPowerBoost}
                  ميزانية غير كافية ($10M / 0.3T)
                {:else}
                  تعزيز جهود الكهرباء
                {/if}
              </button>
            </div>
            <div class="flex justify-between items-center text-[10px] text-wheat-mid border-t border-charcoal-mid/80 pt-1">
              <span>الكلفة: 10 مليون دولار + 0.3 تريليون ل.س</span>
              <span class="font-mono {node.dailyBlackoutHours > 12 ? 'text-umber-crimson' : 'text-wheat-light'}">
                الظلام الحالي: {node.dailyBlackoutHours} س/يوم
              </span>
            </div>
          </div>
        </div>

      <!-- SUB-TAB 2: FIELD SITUATION & DEMOGRAPHICS DOSSIER -->
      {:else if activeProvincialTab === 'field'}
        <div class="space-y-3 text-xs">
          <!-- Demographic Census Ledger -->
          <div class="p-3 bg-charcoal-surface border border-charcoal-mid space-y-2 rounded-none">
            <div class="flex justify-between items-center">
              <span class="text-wheat-dark font-heading">إجمالي السكان المقيمين والنازحين:</span>
              <span class="font-bold text-wheat-light font-mono">{formatNumber(node.population)} نسمة</span>
            </div>
            {#if node.hostPopulation}
              <div class="grid grid-cols-3 gap-2 pt-2 border-t border-charcoal-mid/80 text-[11px] text-wheat-dark">
                <div class="p-1.5 bg-forest-mid border border-charcoal-mid">
                  <span class="text-[10px] block">سكان أصليون:</span>
                  <span class="font-bold text-wheat-mid font-mono">{formatNumber(node.hostPopulation)}</span>
                </div>
                <div class="p-1.5 bg-forest-mid border border-charcoal-mid">
                  <span class="text-[10px] block">نازحون داخلياً:</span>
                  <span class="font-bold text-forest-accent font-mono">{formatNumber(node.idpPopulation || 0)}</span>
                </div>
                <div class="p-1.5 bg-forest-mid border border-charcoal-mid">
                  <span class="text-[10px] block">عائدون حديثاً:</span>
                  <span class="font-bold text-wheat-light font-mono">{formatNumber(node.returneePopulation || 0)}</span>
                </div>
              </div>
            {/if}
          </div>

          <!-- Physical Damage Assessment -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid rounded-none space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-wheat-dark font-heading">تقدير الخسائر والأضرار المادية:</span>
              <span class="font-bold text-umber-crimson font-mono">
                {(node.unrepairedDamageUSD / 1_000_000_000).toFixed(2)} مليار دولار
              </span>
            </div>
            <div class="flex justify-between items-center text-[11px] text-wheat-dark border-t border-charcoal-mid/80 pt-1.5">
              <span>إجمالي الأصول الرأسمالية قبل الحرب:</span>
              <span class="font-bold text-wheat-light font-mono">
                {(node.totalCapitalUSD / 1_000_000_000).toFixed(2)} مليار دولار
              </span>
            </div>
            <div class="flex justify-between items-center text-[11px] text-wheat-dark border-t border-charcoal-mid/80 pt-1.5">
              <span>معدل التعافي وإعادة الإعمار:</span>
              <span class="font-bold text-wheat-gold font-mono">
                {Math.round(node.reconstructionScore * 100)}%
              </span>
            </div>
          </div>

          <!-- Spatial Contagion & Highway Connectivity -->
          <div class="p-3 bg-charcoal-surface border border-charcoal-mid rounded-none space-y-1.5">
            <span class="text-wheat-dark font-heading block">محاور الربط السريع ونقل العدوى (شبكة الطرق الدولية M5):</span>
            <div class="flex flex-wrap gap-1 pt-1">
              {#each node.connectedGovernorateIds as connId}
                {@const target = $gameStore.governorates[connId]}
                {#if target}
                  <span class="text-[10px] px-2 py-0.5 bg-forest-mid border border-charcoal-mid text-wheat-mid">
                    {target.nameAr} ({TIER_NAMES_AR[target.tier] ?? target.tier})
                  </span>
                {/if}
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Empty State: Clear Instructions to Player -->
    <div class="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div class="w-12 h-12 bg-charcoal-surface border border-charcoal-light flex items-center justify-center text-wheat-gold font-bold text-lg rounded-none font-heading">
        !
      </div>
      <div class="space-y-1">
        <h3 class="text-sm font-bold text-wheat-light font-heading">لوحة القيادة الإقليمية للمحافظات</h3>
        <p class="text-xs text-wheat-dark leading-relaxed font-arabic max-w-[280px]">
          يرجى النقر على أي محافظة على الخريطة التفاعلية لعرض تقرير التقييم الميداني وإصدار المراسيم والمشاريع الاستراتيجية الخاصة بها.
        </p>
      </div>
      <span class="text-[10px] text-wheat-mid bg-forest-mid px-3 py-1 border border-charcoal-mid font-mono">
        14 محافظة سورية متاحة للرقابة
      </span>
    </div>
  {/if}

  <!-- Footer Indicator -->
  <div class="border-t border-charcoal-mid pt-2.5 flex items-center justify-between text-[10px] text-wheat-dark">
    <span>غرفة المتابعة الإقليمية</span>
    <span class="font-mono text-wheat-mid">14 / 14 محافظة</span>
  </div>
</aside>
