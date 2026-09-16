<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { draftStore, budgetStore } from '../../stores/draft-store';
  import { uiStore } from '../../stores/ui-store';
  import GameIcon from '../GameIcon.svelte';
  import ToggleSwitch from '../ToggleSwitch.svelte';
  import { BASELINE_GOVERNORATES } from '../../engine/constants';
  import { governorateShape } from '../../spatial3d/syria-2d-paths';
  import { isProvincialActionRelated as isProvincialActionRelatedShared, SUSPENDED_CARD_CLASS, SUSPENDED_CONTENT_CLASS, SUSPENDED_ICON } from './shared';

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
  // Heading shows the selected governorate's map shape (Damascus fallback),
  // like the stats sidebar cards — not the generic castle glyph.
  let provShape = $derived(governorateShape(selectedId));
  let node = $derived(selectedId ? $gameStore.governorates[selectedId] : null);
  // Governorates that never needed demining (baseline contamination at or
  // below the deployable threshold) get no demining card at all.
  let neededDeminingFromStart = $derived(
    Number((selectedId && BASELINE_GOVERNORATES[selectedId]?.mineSaturationPct) ?? 0) > 8
  );

  let isSelectedForDemining = $derived($draftStore.deminingPriorityId === selectedId);
  let canDeployDemining = $derived(node ? node.mineSaturationPct > 8 : false);  let canAffordDemining = $derived(
    $budgetStore.canAffordWithFxCoverage(20_000_000, 8_000_000_000)
  );
  let isDeminingCoveredByFX = $derived(
    $budgetStore.isCoveredByFX(20_000_000, 800_000_000_000)
  );

  let isSelectedForPowerBoost = $derived($draftStore.powerBoostGovId === selectedId);
  let canDeployPowerBoost = $derived(node ? node.dailyBlackoutHours > 2 : false);
  let canAffordPowerBoost = $derived(
    $budgetStore.canAffordWithFxCoverage(10_000_000, 3_000_000_000)
  );
  let isPowerBoostCoveredByFX = $derived(
    $budgetStore.isCoveredByFX(10_000_000, 300_000_000_000)
  );

  // Barrier-blocker states (mirrors the decrees/emergency/assets treatment)
  let demBlocked = $derived(canDeployDemining && !isSelectedForDemining && !canAffordDemining);
  let powerBlocked = $derived(canDeployPowerBoost && !isSelectedForPowerBoost && !canAffordPowerBoost);

  // Positive-metric projections (cleared land / power hours), previewing the
  // post-turn value live while the toggle is on (mirrors engine clamps)
  let projMine = $derived(
    node ? (isSelectedForDemining ? Math.max(0, node.mineSaturationPct - 8) : node.mineSaturationPct) : 0
  );
  let clearedPct = $derived(Math.round(100 - projMine));
  let demCurrent = $derived(node ? Math.round(100 - node.mineSaturationPct) : 0);
  let projBlackout = $derived(
    node ? (isSelectedForPowerBoost ? Math.max(2, node.dailyBlackoutHours - 4) : node.dailyBlackoutHours) : 0
  );
  let powerHrs = $derived(Number((24 - projBlackout).toFixed(1)));
  let powerCurrent = $derived(node ? Number((24 - node.dailyBlackoutHours).toFixed(1)) : 0);

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
    <svg viewBox={provShape.vb} class="w-5 h-5 shrink-0 text-wheat-gold" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d={provShape.d} fill="currentColor" /></svg>
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
              -{(node.strategicProject.costSYP / 1_000_000_000).toFixed(2)}B SP
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
      {#if canDeployDemining}
      <div
        title={demBlocked ? 'موقوف مؤقتاً: ميزانية غير كافية ($20M / 8.0B SP)' : 'توجيه فرق نزع الألغام'}
        class="flex flex-row items-stretch text-start border bg-forest-deep/60 transition-all {isSelectedForDemining ? 'border-charcoal-mid ring-2 ring-wheat-gold/80' : canAffordDemining ? 'border-charcoal-mid' : SUSPENDED_CARD_CLASS}"
      >
        <div class="flex-1 min-w-0 px-2 py-2 space-y-1.5 {demBlocked ? SUSPENDED_CONTENT_CLASS : ''}">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span title="قابل لإعادة التفعيل كل دور"><GameIcon name="cycle" cls="w-4 h-4 text-forest-accent shrink-0" /></span>
            <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight">توجيه فرق نزع الألغام</span>
          </div>
          <span class="text-[10px] text-wheat-dark block">تطهير الحقول الزراعية ومحاور الطرق من المخلفات المتفجرة</span>
          <div class="flex items-center gap-1 flex-wrap">
            <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">-$20M</span>
            <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">-8.0B SP</span>
            <span class="px-1.5 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">-8% تلوث</span>
            {#if isDeminingCoveredByFX && !isSelectedForDemining}
              <span class="px-1.5 py-px rounded-full bg-forest-surface border border-forest-accent text-forest-accent font-bold text-[8px]">
                مغطى بالنقد الأجنبي
              </span>
            {/if}
          </div>
          <div class="space-y-0.5">
            <div class="flex justify-between items-center text-[8.5px] font-mono">
              <span class="text-wheat-dark">الأراضي المطهّرة</span>
              <span class="text-forest-accent font-bold">
                {clearedPct}%{#if isSelectedForDemining} <span class="text-wheat-gold">(+8 متوقع)</span>{/if}
              </span>
            </div>
            <div class="relative h-1.5 bg-charcoal-surface border border-charcoal-mid">
              <div class="absolute inset-y-0 right-0 h-full bg-forest-accent transition-all" style="width: {Math.max(0, Math.min(100, demCurrent))}%"></div>
              {#if isSelectedForDemining && clearedPct > demCurrent}
                <div
                  class="absolute inset-y-0 h-full text-wheat-gold transition-all"
                  style="right: {Math.max(0, Math.min(100, demCurrent))}%; width: {Math.max(0, Math.min(100, clearedPct - demCurrent))}%; background: repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                  title="تحسن متوقع +{clearedPct - demCurrent}%"
                ></div>
              {/if}
            </div>
          </div>
        </div>
        <div class="flex items-center px-2">
          <ToggleSwitch
            checked={isSelectedForDemining}
            disabled={!isSelectedForDemining && !canAffordDemining}
            label="توجيه فرق نزع الألغام"
            onchange={(next) => {
              if (selectedId && (next ? canAffordDemining : true)) {
                draftStore.setField('deminingPriorityId', next ? selectedId : null);
              }
            }}
          />
        </div>
        {#if demBlocked}
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <GameIcon name={SUSPENDED_ICON} cls="w-10 h-10 text-umber-glow opacity-90 drop-shadow-lg" />
          </div>
        {/if}
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
      <div
        title={powerBlocked ? 'موقوف مؤقتاً: ميزانية غير كافية ($10M / 3.0B SP)' : 'أولوية تعزيز التغذية والكهرباء'}
        class="flex flex-row items-stretch text-start border bg-forest-deep/60 transition-all {isSelectedForPowerBoost ? 'border-charcoal-mid ring-2 ring-wheat-gold/80' : canAffordPowerBoost ? 'border-charcoal-mid' : SUSPENDED_CARD_CLASS}"
      >
        <div class="flex-1 min-w-0 px-2 py-2 space-y-1.5 {powerBlocked ? SUSPENDED_CONTENT_CLASS : ''}">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span title="قابل لإعادة التفعيل كل دور"><GameIcon name="cycle" cls="w-4 h-4 text-forest-accent shrink-0" /></span>
            <span class="text-[10.5px] font-bold text-wheat-light font-heading leading-tight">أولوية تعزيز التغذية والكهرباء</span>
          </div>
          <span class="text-[10px] text-wheat-dark block">محولات طوارئ وصيانة خطوط التوتر وتهدئة (-6)</span>
          <div class="flex items-center gap-1 flex-wrap">
            <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">-$10M</span>
            <span class="px-1.5 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">-3.0B SP</span>
            <span class="px-1.5 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">-4 س ظلام</span>
            {#if isPowerBoostCoveredByFX && !isSelectedForPowerBoost}
              <span class="px-1.5 py-px rounded-full bg-forest-surface border border-forest-accent text-forest-accent font-bold text-[8px]">
                مغطى بالنقد الأجنبي
              </span>
            {/if}
          </div>
          <div class="space-y-0.5">
            <div class="flex justify-between items-center text-[8.5px] font-mono">
              <span class="text-wheat-dark">ساعات التغذية</span>
              <span class="text-forest-accent font-bold">
                {powerHrs} س/يوم{#if isSelectedForPowerBoost} <span class="text-wheat-gold">(+4 متوقع)</span>{/if}
              </span>
            </div>
            <div class="relative h-1.5 bg-charcoal-surface border border-charcoal-mid">
              <div class="absolute inset-y-0 right-0 h-full bg-forest-accent transition-all" style="width: {Math.max(0, Math.min(100, (powerCurrent / 24) * 100))}%"></div>
              {#if isSelectedForPowerBoost && powerHrs > powerCurrent}
                <div
                  class="absolute inset-y-0 h-full text-wheat-gold transition-all"
                  style="right: {Math.max(0, Math.min(100, (powerCurrent / 24) * 100))}%; width: {Math.max(0, Math.min(100, ((powerHrs - powerCurrent) / 24) * 100))}%; background: repeating-linear-gradient(-45deg, currentColor 0 3px, transparent 3px 6px);"
                  title="تحسن متوقع +{Number((powerHrs - powerCurrent).toFixed(1))} س/يوم"
                ></div>
              {/if}
            </div>
          </div>
        </div>
        <div class="flex items-center px-2">
          <ToggleSwitch
            checked={isSelectedForPowerBoost}
            disabled={!isSelectedForPowerBoost && (!canDeployPowerBoost || !canAffordPowerBoost)}
            label="أولوية تعزيز التغذية والكهرباء"
            onchange={(next) => {
              if (selectedId && (next ? canDeployPowerBoost && canAffordPowerBoost : true)) {
                draftStore.setField('powerBoostGovId', next ? selectedId : null);
              }
            }}
          />
        </div>
        {#if powerBlocked}
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <GameIcon name={SUSPENDED_ICON} cls="w-10 h-10 text-umber-glow opacity-90 drop-shadow-lg" />
          </div>
        {/if}
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
            title="وفاق السهل والجبل: +18 اندماج، −15 انفصال، −25 غضب عشائري، تهدئة السويداء ودرعا، +6 ثقة شعبية"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.southernPolicy === 'HISTORIC_ACCORD' ? 'bg-forest-surface border-forest-accent text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-forest-accent">الوفاق التاريخي</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">وفاق السهل والجبل وتهدئة المحافظتين</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">+18 اندماج</span>
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">−15 انفصال</span>
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">+6 ثقة</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'LOCAL_VOUCHERS')}
            title="دعم مقنن وهدنة هادئة: +4 اندماج، −5 انفصال (الوضع الافتراضي، دون كلفة)"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.southernPolicy === 'LOCAL_VOUCHERS' ? 'bg-forest-surface border-wheat-gold text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-wheat-gold">قسائم الإغاثة</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">دعم مقنن وهدنة هادئة (افتراضي)</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[8px]">+4 اندماج</span>
              <span class="px-1 py-px rounded-full bg-forest-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[8px]">دون كلفة</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'UNCONDITIONAL_AID')}
            title="مساعدات مفتوحة: −10 انفصال لكن +20 غضب عشائري في اللجاة (مكاسب محدودة بسقف +55 اندماج)"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.southernPolicy === 'UNCONDITIONAL_AID' ? 'bg-forest-surface border-amber-500 text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-amber-300">مساعدات مفتوحة</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">تهدئة عاجلة بثمن عشائري</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">−10 انفصال</span>
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">+20 غضب البدو</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('southernPolicy', 'BLOCKADE')}
            title="الحصار الأمني: +30 انفصال، تمرد مسلح في السويداء ودرعا، −10 ثقة شعبية"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.southernPolicy === 'BLOCKADE' ? 'bg-umber-deep border-umber-border text-umber-crimson shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-umber-crimson">الحصار الأمني</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">عزل وتصعيد خطير</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-crimson text-umber-glow font-mono font-bold text-[8px]">+30 انفصال</span>
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">تمرد −10 ثقة</span>
            </div>
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
            title="ضبط النفس (مجاني): −15 توتر الجولان، لكن +18 تحدٍّ درعاوي و+10 احتقان في درعا"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.golanBorderStance === 'RESTRAINT' ? 'bg-forest-surface border-forest-accent text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-forest-accent">ضبط النفس</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">تهدئة الجولان مجاناً</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">−15 توتر</span>
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">+18 تحدٍّ</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('golanBorderStance', 'LOCAL_GENDARMERIE')}
            title="درك محلي: −8 تحدٍّ درعاوي، +5% تحصيل نصيب، +5 توتر الجولان (توازن آمن)"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.golanBorderStance === 'LOCAL_GENDARMERIE' ? 'bg-forest-surface border-wheat-gold text-wheat-gold shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-wheat-gold">درك محلي</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">أمن محلي وإيراد معابر</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">−8 تحدٍّ</span>
              <span class="px-1 py-px rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[8px]">+5% نصيب</span>
            </div>
          </button>

          <button
            type="button"
            onclick={() => draftStore.setField('golanBorderStance', 'DEPLOY_ARMOR')}
            title="نشر الدروع: −20 تحدٍّ و−8 احتقان درعا والقنيطرة، لكن +25 توتر الجولان وكلفة 9.0B SP"
            class="p-2 text-right border transition-all rounded-none cursor-pointer {$draftStore.golanBorderStance === 'DEPLOY_ARMOR' ? 'bg-umber-deep border-umber-border text-umber-crimson shadow' : 'bg-charcoal-surface border-charcoal-mid text-wheat-mid hover:text-wheat-light hover:border-wheat-mid/40'}"
          >
            <div class="font-bold text-[10px] leading-tight text-umber-crimson">نشر الدروع</div>
            <div class="text-[8.5px] text-wheat-dark leading-snug">قوة نارية بثمن سيادي</div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
              <span class="px-1 py-px rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8px]">−20 تحدٍّ</span>
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-crimson text-umber-glow font-mono font-bold text-[8px]">+25 توتر!</span>
              <span class="px-1 py-px rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8px]">−9.0B SP</span>
            </div>
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>
