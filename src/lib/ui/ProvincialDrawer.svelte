<script lang="ts">
  import { gameStore } from '../stores/game-store';
  import { draftStore, budgetStore } from '../stores/draft-store';
  import { uiStore } from '../stores/ui-store';

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  }

  function parseEffectPills(effectStr: string): { text: string; isNegative: boolean }[] {
    if (!effectStr) return [];
    return effectStr
      .split(/[،,]/)
      .map((s) => s.trim().replace(/\.$/, ''))
      .filter(Boolean)
      .map((text) => {
        const isNegative =
          text.startsWith('-') ||
          text.includes('زيادة التوتر') ||
          text.includes('زيادة الاحتقان') ||
          text.includes('زيادة الشغب') ||
          text.includes('ارتفاع الفساد') ||
          text.includes('خسارة') ||
          text.includes('كلفة') ||
          text.includes('عجز') ||
          text.includes('استنزاف');
        return { text, isNegative };
      });
  }

  const TIER_NAMES_AR: Record<string, string> = {
    CALM: 'مستقرة',
    TENSE: 'متوترة',
    RIOT: 'اضطرابات',
    REVOLT: 'تمرد مسلح',
  };

  const ARCHETYPE_NAMES_AR: Record<string, string> = {
    revolution_hub: 'حاضرة ثورية / مركز مدني',
    coastal_enclave: 'جيب ساحلي',
    metropolitan_regime: 'عاصمة ومركز إداري',
    agricultural_hinterland: 'عمق زراعي وريفي',
    energy_corridor: 'ممر طاقة ونفط',
    autonomous_frontier: 'بادية وأطراف حدودية',
  };

  let isLeftOpen = $derived($uiStore.isProvincialDrawerOpen);
  let selectedId = $derived($uiStore.selectedGovernorateId);
  let node = $derived(selectedId ? $gameStore.governorates[selectedId] : null);

  let activeProvincialTab = $state<'directives' | 'field'>('directives');

  let isSelectedForDemining = $derived($draftStore.deminingPriorityId === selectedId);
  let canDeployDemining = $derived(node ? node.mineSaturationPct > 8 : false);
  let canAffordDemining = $derived(
    $budgetStore.canAffordWithFxCoverage(20_000_000, 800_000_000_000)
  );
  let isDeminingCoveredByFX = $derived(
    $budgetStore.isCoveredByFX(20_000_000, 800_000_000_000)
  );

  let isSelectedForPowerBoost = $derived($draftStore.powerBoostGovId === selectedId);
  let canDeployPowerBoost = $derived(node ? node.dailyBlackoutHours > 2 : false);
  let canAffordPowerBoost = $derived(
    $budgetStore.canAffordWithFxCoverage(10_000_000, 300_000_000_000)
  );
  let isPowerBoostCoveredByFX = $derived(
    $budgetStore.isCoveredByFX(10_000_000, 300_000_000_000)
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
  let isProjectAffordable = $derived(
    Boolean(node?.strategicProject && $budgetStore.canAffordWithFxCoverage(node.strategicProject.costUSD, node.strategicProject.costSYP))
  );
  let isProjectCoveredByFX = $derived(
    Boolean(node?.strategicProject && $budgetStore.isCoveredByFX(node.strategicProject.costUSD, node.strategicProject.costSYP))
  );

  let selectedStat = $derived($uiStore.selectedStatForOptions);

  function isProvincialActionRelated(actionKey: 'project' | 'demining' | 'power'): boolean {
    if (!selectedStat) return true;
    switch (actionKey) {
      case 'project':
        return ['reservesUSD', 'treasurySYP', 'politicalCapital', 'unrestIndex', 'civicTrust'].includes(selectedStat);
      case 'demining':
        return ['reservesUSD', 'treasurySYP', 'unrestIndex', 'civicTrust'].includes(selectedStat);
      case 'power':
        return ['reservesUSD', 'treasurySYP', 'dailyPowerHours', 'unrestIndex', 'civicTrust'].includes(selectedStat);
      default:
        return false;
    }
  }

  let canAffordProject = $derived(
    isProjectAffordablePC && isProjectAffordable
  );

  $effect(() => {
    if (selectedId) {
      activeProvincialTab = 'directives';
    }
  });
</script>

<aside
  class="fixed top-0 left-0 bottom-0 w-[390px] h-screen z-30 bg-forest-deep border-r border-charcoal-mid shadow-2xl p-4 flex flex-col justify-between overflow-y-auto select-none rounded-none font-arabic text-wheat-light transition-transform duration-300 ease-in-out {isLeftOpen ? 'translate-x-0' : '-translate-x-full'}"
>
  {#if node}
    <div class="space-y-4">
      <!-- Dossier Header & Navigation Tabs -->
      <div class="border-b border-charcoal-mid pb-3 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h2 class="text-base font-bold text-wheat-light font-heading">{node.nameAr}</h2>
            <span
              class="px-2 py-0.5 text-[10px] font-bold border font-mono {node.tier === 'CALM' ? 'bg-forest-mid border-forest-accent text-forest-accent' : node.tier === 'TENSE' ? 'bg-charcoal-surface border-wheat-mid text-wheat-gold' : 'bg-umber-deep border-umber-crimson text-umber-crimson animate-pulse'}"
            >
              {TIER_NAMES_AR[node.tier] ?? node.tier}
            </span>
          </div>
          <span class="text-xs text-wheat-dark font-mono">
            {ARCHETYPE_NAMES_AR[node.archetype] ?? node.archetype}
          </span>
        </div>

        <!-- 2 Clean Dossier Tabs -->
        <div class="grid grid-cols-2 gap-1 bg-charcoal-surface p-1 border border-charcoal-mid rounded-none">
          <button
            onclick={() => (activeProvincialTab = 'directives')}
            class="py-1.5 px-3 text-xs font-semibold transition-colors rounded-none text-center cursor-pointer {activeProvincialTab === 'directives' ? 'bg-forest-surface text-wheat-gold border border-wheat-mid shadow-sm' : 'text-wheat-dark hover:text-wheat-light hover:bg-forest-mid'}"
          >
            القرارات والمشاريع
          </button>
          <button
            onclick={() => (activeProvincialTab = 'field')}
            class="py-1.5 px-3 text-xs font-semibold transition-colors rounded-none text-center cursor-pointer {activeProvincialTab === 'field' ? 'bg-forest-surface text-wheat-gold border border-wheat-mid shadow-sm' : 'text-wheat-dark hover:text-wheat-light hover:bg-forest-mid'}"
          >
            نظرة عامة والموقف الميداني
          </button>
        </div>
      </div>

      <!-- SUB-TAB 1: DIRECTIVES & STRATEGIC INVESTMENTS -->
      {#if activeProvincialTab === 'directives'}
        <div class="space-y-4">
          <!-- Sovereign Strategic Project Card -->
          <div class="p-3 bg-charcoal-surface border border-charcoal-mid space-y-2.5 rounded-none transition-all duration-300 {selectedStat ? (isProvincialActionRelated('project') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
            <!-- Title & Field Challenge (content moved outside card under title) -->
            <div class="space-y-1">
              <h3 class="text-xs font-bold text-wheat-light font-heading leading-tight">
                {node.strategicProject.titleAr}
              </h3>
              <p class="text-wheat-dark leading-relaxed text-[10.5px]">
                {node.strategicProject.issueDescriptionAr}
              </p>
            </div>

            <!-- Presidential Solution Card (Empty challenge card removed) -->
            <div class="p-2 bg-forest-deep border border-charcoal-mid space-y-0.5">
              <span class="text-wheat-dark font-semibold block font-heading text-[10px]">القرار الرئاسي المقترح:</span>
              <p class="text-wheat-light leading-relaxed text-[10px]">
                {node.strategicProject.solutionDescriptionAr}
              </p>
            </div>

            <!-- Cost & Impact Breakdown with Red/Green Pills -->
            <div class="p-2 bg-forest-mid border border-charcoal-mid text-[11px] space-y-2">
              <div class="flex justify-between items-center flex-wrap gap-1">
                <span class="text-wheat-dark font-heading text-[10px]">الكلفة المطلوبة:</span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">
                    -${node.strategicProject.costUSD / 1_000_000}M
                  </span>
                  <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">
                    -{(node.strategicProject.costSYP / 1_000_000_000_000).toFixed(2)}T ل.س
                  </span>
                  {#if isProjectCoveredByFX && !isProjectCommitted}
                    <span class="px-1.5 py-0.5 rounded-full bg-forest-surface border border-forest-accent text-forest-accent font-bold text-[9px]">
                      مغطى بالنقد الأجنبي
                    </span>
                  {/if}
                  {#if node.strategicProject.costPoliticalCapital > 0}
                    <span class="px-2 py-0.5 rounded-full bg-forest-surface border border-charcoal-mid text-wheat-gold font-mono font-bold text-[10px]">
                      -{node.strategicProject.costPoliticalCapital} رصيد سياسي
                    </span>
                  {/if}
                </div>
              </div>

              <!-- Direct Effects as color-coded Pills -->
              <div class="space-y-1 pt-1.5 border-t border-charcoal-mid/60">
                <span class="text-wheat-dark font-heading text-[10px] block">الأثر المباشر:</span>
                <div class="flex flex-wrap gap-1">
                  {#each parseEffectPills(node.strategicProject.effectDescriptionAr) as effect}
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-medium border {effect.isNegative ? 'bg-umber-deep border-umber-border text-umber-crimson' : 'bg-forest-surface border-forest-accent/60 text-forest-accent'}">
                      {effect.text}
                    </span>
                  {/each}
                </div>
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
                class="w-full py-2 px-3 text-xs font-bold border transition-colors rounded-none flex items-center justify-center gap-2 {isProjectCommitted ? 'bg-wheat-gold text-forest-deep border-wheat-gold hover:bg-wheat-mid cursor-pointer' : canAffordProject ? 'bg-forest-mid hover:bg-forest-surface text-wheat-light border-charcoal-light hover:border-wheat-mid cursor-pointer' : 'bg-charcoal-surface text-wheat-dark border-charcoal-mid cursor-not-allowed opacity-60'}"
              >
                {#if isProjectCommitted}
                  <span>إلغاء اعتماد تمويل المشروع</span>
                {:else if !canAffordProject}
                  <span>
                    {#if !isProjectAffordablePC}
                      تعذر الاعتماد: رصيد سياسي غير كافٍ ({node.strategicProject.costPoliticalCapital})
                    {:else if !isProjectAffordableUSD}
                      تعذر الاعتماد: ميزانية دولارية غير كافية
                    {:else}
                      تعذر الاعتماد: سيولة الخزينة غير كافية وتتجاوز تغطية النقد الأجنبي
                    {/if}
                  </span>
                {:else if isProjectCoveredByFX}
                  <span>اعتماد المشروع (بتغطية النقد الأجنبي)</span>
                {:else}
                  <span>اعتماد وإطلاق المشروع الاستراتيجي</span>
                {/if}
              </button>
            {/if}
          </div>

          <!-- Mine Clearance Directive -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-2 rounded-none transition-all duration-300 {selectedStat ? (isProvincialActionRelated('demining') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5">
                  <h3 class="text-xs text-wheat-light font-semibold block font-heading">توجيه فرق نزع الألغام</h3>
                  {#if isSelectedForDemining}
                    <span class="text-[9px] px-1.5 py-0.2 bg-forest-surface text-wheat-gold border border-wheat-gold font-mono font-bold">-8% تلوث</span>
                  {/if}
                </div>
                <span class="text-[10px] text-wheat-dark">
                  {canDeployDemining ? 'تطهير الحقول الزراعية ومحاور الطرق من المخلفات المتفجرة' : 'الأراضي مؤمنة، المساحة الملغومة منخفضة (أقل من 8% من المساحة)'}
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
                  أولوية معتمدة (إلغاء)
                {:else if !canDeployDemining}
                  مطهّرة (≤ 8% من المساحة)
                {:else if !canAffordDemining}
                  ميزانية غير كافية ($20M / 0.8T)
                {:else if isDeminingCoveredByFX}
                  تطهير (بتغطية النقد الأجنبي)
                {:else}
                  تعيين كأولوية تطهير
                {/if}
              </button>
            </div>
            <div class="flex justify-between items-center text-[10px] text-wheat-mid border-t border-charcoal-mid/80 pt-1 flex-wrap gap-1">
              <div class="flex items-center gap-1.5">
                <span class="text-wheat-dark">الكلفة:</span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">
                  -$20M
                </span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">
                  -0.8T ل.س
                </span>
                {#if isDeminingCoveredByFX && !isSelectedForDemining}
                  <span class="px-1.5 py-0.5 rounded-full bg-forest-surface border border-forest-accent text-forest-accent font-bold text-[9px]">
                    مغطى بالنقد الأجنبي
                  </span>
                {/if}
              </div>
              <span class="font-mono {node.mineSaturationPct > 8 ? 'text-wheat-gold' : 'text-forest-accent'}">
                المساحة الملغومة: {node.mineSaturationPct}% من المساحة
              </span>
            </div>
          </div>

          <!-- Power Supply Boost Priority Directive -->
          <div class="p-3 bg-forest-mid border border-charcoal-mid space-y-2 rounded-none transition-all duration-300 {selectedStat ? (isProvincialActionRelated('power') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
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
                {:else if isPowerBoostCoveredByFX}
                  تعزيز الكهرباء (بتغطية النقد الأجنبي)
                {:else}
                  تعزيز جهود الكهرباء
                {/if}
              </button>
            </div>
            <div class="flex justify-between items-center text-[10px] text-wheat-mid border-t border-charcoal-mid/80 pt-1 flex-wrap gap-1">
              <div class="flex items-center gap-1.5">
                <span class="text-wheat-dark">الكلفة:</span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">
                  -$10M
                </span>
                <span class="px-2 py-0.5 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[10px]">
                  -0.3T ل.س
                </span>
                {#if isPowerBoostCoveredByFX && !isSelectedForPowerBoost}
                  <span class="px-1.5 py-0.5 rounded-full bg-forest-surface border border-forest-accent text-forest-accent font-bold text-[9px]">
                    مغطى بالنقد الأجنبي
                  </span>
                {/if}
              </div>
              <span class="font-mono {node.dailyBlackoutHours > 12 ? 'text-umber-crimson' : 'text-wheat-light'}">
                الظلام الحالي: {node.dailyBlackoutHours} س/يوم
              </span>
            </div>
          </div>
        </div>

      <!-- SUB-TAB 2: FIELD SITUATION & DEMOGRAPHICS DOSSIER -->
      {:else if activeProvincialTab === 'field'}
        <div class="space-y-3 text-xs">
          <!-- Special Dossier: Golan Foreign Interference (Golan / Quneitra) -->
          {#if node.id === 'quneitra'}
            {@const golanTension = node.golanTensionIndex ?? $gameStore.governorates['quneitra']?.golanTensionIndex ?? $gameStore.governorates['daraa']?.golanTensionIndex ?? 45}
            <div class="p-3 bg-charcoal-surface border-2 border-amber-600/60 rounded-none space-y-2.5">
              <div class="flex justify-between items-start gap-2">
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full {golanTension > 60 ? 'bg-umber-crimson animate-ping' : golanTension > 30 ? 'bg-amber-400' : 'bg-forest-accent'}"></span>
                    <h4 class="text-xs font-bold text-wheat-light font-heading">
                      ملف الجولان والتدخل الخارجي على خط الهدنة
                    </h4>
                  </div>
                  <span class="text-[10px] text-wheat-dark block mt-0.5">
                    مراقبة شريط فك الاشتباك وقوات الأندوف (UNDOF) وتفادي الاستنزاف الإقليمي
                  </span>
                </div>
                <span class="px-2 py-0.5 text-[10px] font-mono font-bold shrink-0 {golanTension > 60 ? 'bg-umber-deep border border-umber-border text-umber-crimson' : golanTension > 30 ? 'bg-forest-surface border border-amber-500/50 text-amber-300' : 'bg-forest-mid border border-forest-accent text-forest-accent'}">
                  {golanTension > 60 ? 'توغل واحتكاك حرج' : golanTension > 30 ? 'توتر وتجريف أمني' : 'هدوء رقابي نسبي'}
                </span>
              </div>

              <!-- Tension Gauge / Meter -->
              <div class="space-y-1">
                <div class="flex justify-between text-[10px] font-mono">
                  <span class="text-wheat-dark">مؤشر التوغل والتدخل الخارجي:</span>
                  <span class="font-bold {golanTension > 60 ? 'text-umber-crimson' : golanTension > 30 ? 'text-amber-300' : 'text-forest-accent'}">
                    {golanTension} / 100
                  </span>
                </div>
                <div class="w-full bg-forest-mid h-2 border border-charcoal-mid overflow-hidden">
                  <div
                    class="h-full transition-all duration-500 {golanTension > 60 ? 'bg-umber-crimson' : golanTension > 30 ? 'bg-amber-400' : 'bg-forest-accent'}"
                    style="width: {Math.min(100, Math.max(5, golanTension))}%"
                  ></div>
                </div>
              </div>

              <!-- Ending Impact & Relations -->
              <div class="p-2 bg-forest-mid border border-charcoal-mid space-y-1.5 text-[10px] text-wheat-dark leading-relaxed">
                <div class="flex items-start gap-1">
                  <span class="text-wheat-gold font-bold shrink-0 font-heading">الأثر على نهاية اللعبة:</span>
                  <span class="text-wheat-light">
                    تثبيت شريط الهدنة وخفض التوغل يمنع انزلاق سوريا إلى حرب استنزاف دفاعية ويشكل ركيزة حاسمة لنهاية <strong class="text-wheat-gold">"العنقاء السيادية"</strong> بدلاً من التفكك أو عسكرة الاقتصاد الدائمة.
                  </span>
                </div>
                <div class="flex items-start gap-1 pt-1 border-t border-charcoal-mid/60">
                  <span class="text-forest-accent font-bold shrink-0 font-heading">القرارات المؤثرة:</span>
                  <span class="text-wheat-light">
                    مشروع تطهير حزام الجولان الرئاسي (-20 توتر)، مع الموازنة بين خياري ضبط النفس ونشر الوحدات في التوجيهات السيادية.
                  </span>
                </div>
              </div>
            </div>
          {/if}

          <!-- Special Dossier: As-Suwayda Secession Risk & National Accord -->
          {#if node.id === 'as_suwayda'}
            {@const secessionProb = node.suwaydaSecessionProb ?? 24}
            {@const integrationIndex = node.suwaydaIntegrationIndex ?? 8}
            {@const tribalRage = node.tribalRageIndex ?? 74}
            <div class="p-3 bg-charcoal-surface border-2 border-amber-600/60 rounded-none space-y-2.5">
              <div class="flex justify-between items-start gap-2">
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full {secessionProb >= 60 ? 'bg-umber-crimson animate-ping' : secessionProb >= 25 ? 'bg-amber-400' : 'bg-forest-accent'}"></span>
                    <h4 class="text-xs font-bold text-wheat-light font-heading">
                      ملف السويداء: مخاطر الانفصال والاندماج الوطني
                    </h4>
                  </div>
                  <span class="text-[10px] text-wheat-dark block mt-0.5">
                    احتمال انفصال جبل العرب وقطع شريان الجنوب، والوفاق مع عشائر اللجاة
                  </span>
                </div>
                <span class="px-2 py-0.5 text-[10px] font-mono font-bold shrink-0 {secessionProb >= 60 ? 'bg-umber-deep border border-umber-border text-umber-crimson' : secessionProb >= 25 ? 'bg-forest-surface border border-amber-500/50 text-amber-300' : 'bg-forest-mid border border-forest-accent text-forest-accent'}">
                  {secessionProb >= 85 ? 'سقوط وانفصال وشيك' : secessionProb >= 60 ? 'خطر انفصال حرج' : secessionProb >= 25 ? 'قلق وتوتر محلي' : 'اندماج وطني مستقر'}
                </span>
              </div>

              <!-- Secession Prob Meter -->
              <div class="space-y-1">
                <div class="flex justify-between text-[10px] font-mono">
                  <span class="text-wheat-dark">احتمال الانفصال عن الجمهورية:</span>
                  <span class="font-bold {secessionProb >= 60 ? 'text-umber-crimson' : secessionProb >= 25 ? 'text-amber-300' : 'text-forest-accent'}">
                    {secessionProb}% {secessionProb >= 85 ? '(عتبة السقوط الحتمي: 85%)' : ''}
                  </span>
                </div>
                <div class="w-full bg-forest-mid h-2 border border-charcoal-mid overflow-hidden">
                  <div
                    class="h-full transition-all duration-500 {secessionProb >= 60 ? 'bg-umber-crimson' : secessionProb >= 25 ? 'bg-amber-400' : 'bg-forest-accent'}"
                    style="width: {Math.min(100, Math.max(4, secessionProb))}%"
                  ></div>
                </div>
              </div>

              <!-- Integration vs Tribal Rage Subgrid -->
              <div class="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div class="p-1.5 bg-forest-mid border border-charcoal-mid space-y-0.5">
                  <div class="flex justify-between text-wheat-dark">
                    <span>مؤشر الاندماج:</span>
                    <span class="font-bold {integrationIndex >= 80 ? 'text-forest-accent' : 'text-wheat-gold'}">{integrationIndex}%</span>
                  </div>
                  <div class="w-full bg-charcoal-surface h-1.5 overflow-hidden">
                    <div class="h-full bg-forest-accent" style="width: {Math.min(100, integrationIndex)}%"></div>
                  </div>
                  <span class="text-[8.5px] text-wheat-dark block">مستهدف النهاية الكبرى: 80%+</span>
                </div>

                <div class="p-1.5 bg-forest-mid border border-charcoal-mid space-y-0.5">
                  <div class="flex justify-between text-wheat-dark">
                    <span>احتقان اللجاة:</span>
                    <span class="font-bold {tribalRage > 60 ? 'text-umber-crimson' : 'text-amber-300'}">{tribalRage}%</span>
                  </div>
                  <div class="w-full bg-charcoal-surface h-1.5 overflow-hidden">
                    <div class="h-full {tribalRage > 60 ? 'bg-umber-crimson' : 'bg-amber-400'}" style="width: {Math.min(100, tribalRage)}%"></div>
                  </div>
                  <span class="text-[8.5px] text-wheat-dark block">توتر خطوط الإمداد والطرق</span>
                </div>
              </div>

              <!-- Ending Impact & Relations -->
              <div class="p-2 bg-forest-mid border border-charcoal-mid space-y-1.5 text-[10px] text-wheat-dark leading-relaxed">
                <div class="flex items-start gap-1">
                  <span class="text-wheat-gold font-bold shrink-0 font-heading">الأثر على نهاية اللعبة:</span>
                  <span class="text-wheat-light">
                    رفع الاندماج الوطني إلى <strong>80%+</strong> يحقق النهاية الإقليمية الكبرى <strong class="text-wheat-gold">"وفاق السهل والجبل"</strong>. في المقابل، بلوغ الانفصال <strong>85%</strong> بالتزامن مع ثورات الأطراف يطلق الانهيار الفوري للدولة <strong class="text-umber-crimson">(التفكك المناطقي الشامل)</strong>.
                  </span>
                </div>
                <div class="flex items-start gap-1 pt-1 border-t border-charcoal-mid/60">
                  <span class="text-forest-accent font-bold shrink-0 font-heading">القرارات المؤثرة:</span>
                  <span class="text-wheat-light">
                    مشروع محطة كهرباء الجبل (+40% اندماج، وخفض الانفصال لـ 4%)، وسياسة الجبهة الجنوبية "الوفاق التاريخي" في التوجيهات السيادية.
                  </span>
                </div>
              </div>
            </div>
          {/if}

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


</aside>
