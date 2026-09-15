<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import { BASELINE_GOVERNORATES } from '../../engine/constants';
  import { isProvincialActionRelated as isProvincialActionRelatedShared } from './shared';

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

  // Default to the capital when nothing is selected so the panel always
  // shows a governorate dossier instead of an empty placeholder.
  let selectedId = $derived($uiStore.selectedGovernorateId ?? 'damascus');
  let node = $derived(selectedId ? $gameStore.governorates[selectedId] : null);
  // Governorates that never needed demining (baseline contamination at or
  // below the deployable threshold) get no demining card at all.
  let neededDeminingFromStart = $derived(
    Number((selectedId && BASELINE_GOVERNORATES[selectedId]?.mineSaturationPct) ?? 0) > 8
  );

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
    return isProvincialActionRelatedShared(selectedStat, actionKey);
  }

  let canAffordProject = $derived(
    isProjectAffordablePC && isProjectAffordable
  );
</script>

<div class="space-y-3">
  <div class="flex items-center gap-2 border-b border-charcoal-mid pb-2">
    <GameIcon name="castle" cls="w-5 h-5 text-wheat-gold shrink-0" />
    <h3 class="text-sm font-bold text-wheat-light font-heading">{node?.nameAr ?? 'القيادة الإقليمية'}</h3>
  </div>

  {#if node}
    <!-- Sovereign Strategic Project Card -->
    <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2.5 transition-all duration-300 {selectedStat ? (isProvincialActionRelated('project') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
      <!-- Title & Field Challenge (content moved outside card under title) -->
      <div class="space-y-1">
        <h3 class="text-xs font-bold text-wheat-gold font-heading leading-tight">
          {node.strategicProject.titleAr}
        </h3>
        <p class="text-wheat-dark leading-relaxed text-[11px]">
          {node.strategicProject.issueDescriptionAr}
        </p>
      </div>

      <!-- Presidential Solution Card (Empty challenge card removed) -->
      <div class="py-1.5 border-b border-charcoal-mid/50 space-y-0.5">
        <span class="text-xs font-bold text-wheat-gold font-heading block">القرار الرئاسي المقترح:</span>
        <p class="text-wheat-light leading-relaxed text-[11px]">
          {node.strategicProject.solutionDescriptionAr}
        </p>
      </div>

      <!-- Cost & Impact Breakdown with Red/Green Pills -->
      <div class="py-1.5 border-b border-charcoal-mid/50 text-[11px] space-y-2">
        <div class="flex justify-between items-center flex-wrap gap-1">
          <span class="text-xs font-bold text-wheat-gold font-heading">الكلفة المطلوبة:</span>
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
          <span class="text-xs font-bold text-wheat-gold font-heading block">الأثر المباشر:</span>
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

    <!-- Mine Clearance Directive (hidden where never needed; resolved notice once cleared) -->
    {#if neededDeminingFromStart}
    <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isProvincialActionRelated('demining') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-1.5">
            <h3 class="text-xs font-bold text-wheat-gold font-heading block">توجيه فرق نزع الألغام</h3>
            {#if isSelectedForDemining}
              <span class="text-[9px] px-1.5 py-0.2 bg-forest-surface text-wheat-gold border border-wheat-gold font-mono font-bold">-8% تلوث</span>
            {/if}
          </div>
          <span class="text-[11px] text-wheat-dark">
            {canDeployDemining ? 'تطهير الحقول الزراعية ومحاور الطرق من المخلفات المتفجرة' : 'الأراضي مؤمنة، المساحة الملغومة منخفضة (أقل من 8% من المساحة)'}
          </span>
        </div>
        {#if canDeployDemining}
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
          {:else if !canAffordDemining}
            ميزانية غير كافية ($20M / 0.8T)
          {:else if isDeminingCoveredByFX}
            تطهير (بتغطية النقد الأجنبي)
          {:else}
            تعيين كأولوية تطهير
          {/if}
        </button>
        {/if}
      </div>
      {#if canDeployDemining}
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
      {:else}
      <div class="border-t border-charcoal-mid/80 pt-2 text-[11px] font-bold text-forest-accent leading-relaxed">
        تم نزع النسبة الأكبر من الألغام واعتبار مشكلة الألغام محلولة في المحافظة
      </div>
      {/if}
    </div>
    {/if}

    <!-- Power Supply Boost Priority Directive -->
    <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isProvincialActionRelated('power') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-1.5">
            <h3 class="text-xs font-bold text-wheat-gold font-heading block">أولوية تعزيز التغذية والكهرباء</h3>
            {#if isSelectedForPowerBoost}
              <span class="text-[9px] px-1.5 py-0.2 bg-forest-surface text-wheat-gold border border-wheat-gold font-mono font-bold">+4 س كهرباء</span>
            {/if}
          </div>
          <span class="text-[11px] text-wheat-dark">
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

    {#if node.id === 'as_suwayda'}
      <!-- Southern Policy Command Selector -->
      <div class="space-y-1.5 pt-2 border-t border-charcoal-mid">
        <span class="text-xs font-bold text-wheat-gold font-heading block">توجيه سياسة الجبهة الجنوبية:</span>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'HISTORIC_ACCORD')}
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.southernPolicy === 'HISTORIC_ACCORD' ? 'bg-forest-surface border-forest-accent text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-forest-accent">الوفاق التاريخي</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">وفاق السهل والجبل (+18 اندماج)</div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'LOCAL_VOUCHERS')}
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.southernPolicy === 'LOCAL_VOUCHERS' ? 'bg-forest-surface border-wheat-gold text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-wheat-gold">قسائم الإغاثة</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">دعم مقنن وهدنة هادئة (+4 اندماج)</div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'UNCONDITIONAL_AID')}
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.southernPolicy === 'UNCONDITIONAL_AID' ? 'bg-forest-surface border-amber-500 text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-amber-300">مساعدات مفتوحة</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">تهدئة عاجلة واستفزاز البدو</div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'BLOCKADE')}
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.southernPolicy === 'BLOCKADE' ? 'bg-umber-deep border-umber-border text-umber-crimson shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-umber-crimson">الحصار الأمني</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">عزل وتصعيد (+30 انفصال)</div>
          </button>
        </div>
      </div>
    {/if}

    {#if node.id === 'daraa'}
      <div class="space-y-1.5 pt-2 border-t border-charcoal-mid">
        <span class="text-xs font-bold text-wheat-gold font-heading block">توجيه موقف حدود الجولان:</span>
        <div class="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onclick={() => draftStore.setField('golanBorderStance', 'RESTRAINT')}
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.golanBorderStance === 'RESTRAINT' ? 'bg-forest-surface border-forest-accent text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-forest-accent">ضبط النفس</div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('golanBorderStance', 'LOCAL_GENDARMERIE')}
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.golanBorderStance === 'LOCAL_GENDARMERIE' ? 'bg-forest-surface border-wheat-gold text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-wheat-gold">درك محلي</div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('golanBorderStance', 'DEPLOY_ARMOR')}
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.golanBorderStance === 'DEPLOY_ARMOR' ? 'bg-umber-deep border-umber-border text-umber-crimson shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-umber-crimson">نشر الدروع</div>
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>
