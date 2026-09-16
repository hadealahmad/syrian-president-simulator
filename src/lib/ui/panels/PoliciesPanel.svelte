<script lang="ts">
import { draftStore } from '../../stores/draft-store';
import { gameStore } from '../../stores/game-store';
import { uiStore } from '../../stores/ui-store';
import GameIcon from '../GameIcon.svelte';
import { activeFacilityLocks } from '../../engine/facilities';
  import {
    isOptionRelated,
  } from './shared';

  let selectedStat = $derived($uiStore.selectedStatForOptions);

  // IMF conditionality lock: while active, diesel policy is pinned to CRACKDOWN.
  function dieselGuard(value: 'CRACKDOWN' | 'STANDARD' | 'PERMISSIVE'): string | null {
    const res = draftStore.setFieldGuarded($gameStore, 'dieselSmuggling', value);
    return res.applied ? null : (res.blockedAr ?? 'مقفل بشرط التسهيل');
  }
  let dieselLock = $derived(activeFacilityLocks($gameStore).dieselLocked);
  let dieselLockNote = $derived.by(() => {
    const locks = activeFacilityLocks($gameStore);
    return locks.dieselLocked ? `مقفل بشرط التسهيل — ${locks.dieselTurnsLeft} دورات متبقية` : '';
  });

  // Collapsible per-section effect explainers (help icon before each title, hidden by default)
  let openExplainers = $state<Record<string, boolean>>({});
  function toggleExplainer(key: string): void {
    openExplainers[key] = !openExplainers[key];
  }
</script>

<div class="space-y-3">
  <div class="flex items-center gap-2 border-b border-charcoal-mid pb-2">
    <GameIcon name="vote" cls="w-5 h-5 text-wheat-gold shrink-0" />
    <h3 class="text-sm font-bold text-wheat-light font-heading">السياسات الكبرى</h3>
  </div>

  <!-- 2. Food Subsidies Tier -->
  <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'foodSubsidyLevel') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
    <div class="flex items-center gap-1.5">
      <button type="button" onclick={() => toggleExplainer("food")} aria-label="إظهار الأثر" class="shrink-0 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer">
        <GameIcon name="help" cls="w-4 h-4" />
      </button>
      <span class="text-xs font-bold text-wheat-gold font-heading block">التحكم في أسعار وتوفر الخبز والمواد الأساسية</span>
    </div>
    <div class="grid grid-cols-3 gap-1.5 text-[10.5px]">
      <button
        onclick={() => draftStore.setField('foodSubsidyLevel', 'AUSTERE')}
        class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.foodSubsidyLevel === 'AUSTERE' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
      >
        <span class="font-bold text-[10.5px]">تقشف</span>
        <div class="flex items-center gap-0.5 flex-wrap justify-center">
          <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">+15 احتقان</span>
          <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">+9.00B توفير</span>
        </div>
      </button>

      <button
        onclick={() => draftStore.setField('foodSubsidyLevel', 'STANDARD')}
        class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.foodSubsidyLevel === 'STANDARD' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
      >
        <span class="font-bold text-[10.5px]">اعتيادي</span>
        <div class="flex items-center gap-0.5 flex-wrap justify-center">
          <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[8.5px]">0 احتقان</span>
          <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-dark font-mono font-bold text-[8.5px]">مستقر</span>
        </div>
      </button>

      <button
        onclick={() => draftStore.setField('foodSubsidyLevel', 'GENEROUS')}
        class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.foodSubsidyLevel === 'GENEROUS' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
      >
        <span class="font-bold text-[10.5px]">موسع</span>
        <div class="flex items-center gap-0.5 flex-wrap justify-center">
          <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">-12 احتقان</span>
          <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">-8.00B كلفة</span>
        </div>
      </button>
    </div>
    <div class="text-[11px] text-wheat-dark leading-relaxed py-1.5 {openExplainers.food ? '' : 'hidden'}">
      {#if $draftStore.foodSubsidyLevel === 'AUSTERE'}
        <span class="text-amber-300 font-medium">الأثر:</span> تقليص مخصصات الدعم بنسبة 50% وتوفير سيولة SP، لكن يرفع أسعار الخبز ويزيد الاحتقان الشعبي (+15 نقطة).
      {:else if $draftStore.foodSubsidyLevel === 'GENEROUS'}
        <span class="text-forest-accent font-medium">الأثر:</span> تثبيت شامل لأسعار الخبز والسلع وتخفيض الاحتقان (-12 نقطة)، مع استنزاف إضافي لسيولة SP والدولار لاستيراد القمح.
      {:else}
        <span class="text-wheat-mid font-medium">الأثر:</span> دعم متوازن يضمن توفير الخبز والمواد التموينية المدعومة ضمن الحدود المالية المقبولة للموازنة.
      {/if}
    </div>
  </div>

  <!-- 3. State Workforce Policy -->
  <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'workforceStrategy') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
    <div class="flex items-center gap-1.5">
      <button type="button" onclick={() => toggleExplainer("workforce")} aria-label="إظهار الأثر" class="shrink-0 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer">
        <GameIcon name="help" cls="w-4 h-4" />
      </button>
      <span class="text-xs font-bold text-wheat-gold font-heading block">إدارة الوظائف الحكومية والبطالة المقنعة</span>
    </div>
    <div class="grid grid-cols-3 gap-1.5 text-[10.5px]">
      <button
        onclick={() => draftStore.setField('workforceStrategy', 'MAINTAIN')}
        class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.workforceStrategy === 'MAINTAIN' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
      >
        <span class="font-bold text-[10.5px]">تثبيت الملاك</span>
        <div class="flex items-center gap-0.5 flex-wrap justify-center">
          <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[8.5px]">استقرار</span>
          <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-dark font-mono font-bold text-[8.5px]">اعتيادي</span>
        </div>
      </button>

      <button
        onclick={() => draftStore.setField('workforceStrategy', 'PRUNE_CIVIL_SERVICE')}
        class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.workforceStrategy === 'PRUNE_CIVIL_SERVICE' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
      >
        <span class="font-bold text-[10.5px]">شطب الوهمي</span>
        <div class="flex items-center gap-0.5 flex-wrap justify-center">
          <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">+8.50B توفير</span>
          <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">-5 فساد</span>
          <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">+7 احتقان</span>
        </div>
      </button>

      <button
        onclick={() => draftStore.setField('workforceStrategy', 'ABSORB_MILITIAS')}
        class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.workforceStrategy === 'ABSORB_MILITIAS' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
      >
        <span class="font-bold text-[10.5px]">استيعاب المسلحين</span>
        <div class="flex items-center gap-0.5 flex-wrap justify-center">
          <span class="px-1 py-0.2 rounded-full bg-forest-surface border border-wheat-mid/40 text-wheat-gold font-mono font-bold text-[8.5px]">+8000 وظيفة</span>
          <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">-6 توتر</span>
          <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">+امتثال تدريجي</span>
          <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">+5 فساد</span>
        </div>
      </button>
    </div>
    <div class="text-[11px] text-wheat-dark leading-relaxed py-1.5 {openExplainers.workforce ? '' : 'hidden'}">
      {#if $draftStore.workforceStrategy === 'PRUNE_CIVIL_SERVICE'}
        <span class="text-amber-300 font-medium">الأثر:</span> شطب البطالة المقنعة والرواتب الوهمية يوفر سيولة الخزينة ويرفع كفاءة الوزارات، مع احتقان وظيفي مؤقت.
      {:else if $draftStore.workforceStrategy === 'ABSORB_MILITIAS'}
        <span class="text-amber-300 font-medium">الأثر:</span> استيعاب المقاتلين لتهدئة الجبهات واستقرار الأمن، مقابل تضخم كتلة الرواتب الحكومية وزيادة الفساد الإداري — مع اتساع القاعدة الضريبية تدريجياً (+1 امتثال/دور حتى +4).
      {:else}
        <span class="text-wheat-mid font-medium">الأثر:</span> الحفاظ على قوام الموظفين ورواتب الملاك الحكومي الراهن دون تعديل.
      {/if}
    </div>
  </div>

  <!-- 4. Wheat Pricing -->
  <div class="py-2.5 border-b border-charcoal-mid/50 space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'wheatProcurement') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
    <div class="flex items-center gap-1.5">
      <button type="button" onclick={() => toggleExplainer("wheat")} aria-label="إظهار الأثر" class="shrink-0 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer">
        <GameIcon name="help" cls="w-4 h-4" />
      </button>
      <span class="text-xs font-bold text-wheat-gold font-heading block">تسعير شراء القمح المحلي من المزارعين</span>
    </div>
    <div class="grid grid-cols-3 gap-1.5 text-[10.5px]">
      <button
        onclick={() => draftStore.setField('wheatProcurement', 'SUBSIDIZED_LOW')}
        class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.wheatProcurement === 'SUBSIDIZED_LOW' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
      >
        <span class="font-bold text-[10.5px]">سعر إلزامي</span>
        <div class="flex items-center gap-0.5 flex-wrap justify-center">
          <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">+$60M استيراد</span>
          <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">+6 احتقان</span>
        </div>
      </button>

      <button
        onclick={() => draftStore.setField('wheatProcurement', 'MARKET_PARITY')}
        class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.wheatProcurement === 'MARKET_PARITY' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
      >
        <span class="font-bold text-[10.5px]">سعر عادل</span>
        <div class="flex items-center gap-0.5 flex-wrap justify-center">
          <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[8.5px]">استقرار</span>
          <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-dark font-mono font-bold text-[8.5px]">سوق حر</span>
        </div>
      </button>

      <button
        onclick={() => draftStore.setField('wheatProcurement', 'PREMIUM_INCENTIVE')}
        class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.wheatProcurement === 'PREMIUM_INCENTIVE' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
      >
        <span class="font-bold text-[10.5px]">علاوة تحفيز</span>
        <div class="flex items-center gap-0.5 flex-wrap justify-center">
          <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">توريد 100%</span>
          <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">-4.50B كلفة</span>
        </div>
      </button>
    </div>
    <div class="text-[11px] text-wheat-dark leading-relaxed py-1.5 {openExplainers.wheat ? '' : 'hidden'}">
      {#if $draftStore.wheatProcurement === 'SUBSIDIZED_LOW'}
        <span class="text-amber-300 font-medium">الأثر:</span> لا يخفّض نفقات الخزينة بـSP، بل يرفع فاتورة استيراد القمح بالدولار (+$60M) لأن المزارعين يهرّبون المحصول ويتراجع المخزون التمويني.
      {:else if $draftStore.wheatProcurement === 'PREMIUM_INCENTIVE'}
        <span class="text-forest-accent font-medium">الأثر:</span> علاوة مجزية تضمن توريد كامل القمح السوري وتقلص استيراد الحبوب بالدولار، مقابل زيادة نفقات الخزينة بـSP.
      {:else}
        <span class="text-wheat-mid font-medium">الأثر:</span> تسعير عادل يضمن توريد القمح المحلي بالسعر الرائج واستقرار مخزون الطحين.
      {/if}
    </div>
  </div>

  <!-- 5. Diesel Smuggling Control -->
  <div class="py-2.5 space-y-2 transition-all duration-300 {selectedStat ? (isOptionRelated(selectedStat, 'dieselSmuggling') ? 'ring-2 ring-wheat-gold/80 shadow-lg pointer-events-auto opacity-100' : 'opacity-20 pointer-events-none select-none grayscale') : 'pointer-events-auto opacity-100'}">
    <div class="flex items-center gap-1.5">
      <button type="button" onclick={() => toggleExplainer("diesel")} aria-label="إظهار الأثر" class="shrink-0 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer">
        <GameIcon name="help" cls="w-4 h-4" />
      </button>
      <span class="text-xs font-bold text-wheat-gold font-heading block">مكافحة تهريب المشتقات النفطية</span>
      {#if dieselLock}
        <span class="px-1.5 py-0.2 rounded-none bg-amber-950 border border-amber-500/50 text-amber-300 text-[8.5px] font-mono">{dieselLockNote}</span>
      {/if}
    </div>
    <div class="grid grid-cols-3 gap-1.5 text-[10.5px]">
      <button
        onclick={() => draftStore.setField('dieselSmuggling', 'CRACKDOWN')}
        class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.dieselSmuggling === 'CRACKDOWN' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'}"
      >
        <span class="font-bold text-[10.5px]">حملة صارمة</span>
        <div class="flex items-center gap-0.5 flex-wrap justify-center">
          <span class="px-1 py-0.2 rounded-full bg-forest-mid border border-forest-accent/60 text-forest-accent font-mono font-bold text-[8.5px]">+كهرباء وإنتاج</span>
          <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">+6 توتر</span>
        </div>
      </button>

      <button
        onclick={() => dieselGuard('STANDARD')}
        title={dieselLock ? dieselLockNote : ''}
        class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.dieselSmuggling === 'STANDARD' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'} {dieselLock ? 'opacity-50' : ''}"
      >
        <span class="font-bold text-[10.5px]">رقابة اعتيادية</span>
        <div class="flex items-center gap-0.5 flex-wrap justify-center">
          <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[8.5px]">متوازن</span>
          <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-dark font-mono font-bold text-[8.5px]">روتيني</span>
        </div>
      </button>

      <button
        onclick={() => dieselGuard('PERMISSIVE')}
        title={dieselLock ? dieselLockNote : ''}
        class="p-2 border text-center transition-colors rounded-none flex flex-col items-center justify-between gap-1 cursor-pointer {$draftStore.dieselSmuggling === 'PERMISSIVE' ? 'bg-forest-surface border-wheat-mid text-wheat-gold font-bold shadow-sm' : 'bg-charcoal-surface border-charcoal-mid text-wheat-dark hover:text-wheat-light'} {dieselLock ? 'opacity-50' : ''}"
      >
        <span class="font-bold text-[10.5px]">غض الطرف</span>
        <div class="flex items-center gap-0.5 flex-wrap justify-center">
          <span class="px-1 py-0.2 rounded-full bg-charcoal-surface border border-charcoal-mid text-wheat-mid font-mono font-bold text-[8.5px]">تفادي الصدام</span>
          <span class="px-1 py-0.2 rounded-full bg-umber-deep border border-umber-border text-umber-crimson font-mono font-bold text-[8.5px]">-كهرباء</span>
        </div>
      </button>
    </div>
    <div class="text-[11px] text-wheat-dark leading-relaxed py-1.5 {openExplainers.diesel ? '' : 'hidden'}">
      {#if $draftStore.dieselSmuggling === 'CRACKDOWN'}
        <span class="text-forest-accent font-medium">الأثر:</span> ضبط تهريب المازوت وتوجيهه لمحطات التوليد لرفع ساعات الكهرباء، مع استنفار أمني واحتكاك مع شبكات التهريب.
      {:else if $draftStore.dieselSmuggling === 'PERMISSIVE'}
        <span class="text-amber-300 font-medium">الأثر:</span> تفادي الصدام العشائري، مقابل هدر المحروقات المدعومة وتراجع ساعات التغذية الكهربائية.
      {:else}
        <span class="text-wheat-mid font-medium">الأثر:</span> رقابة روتينية توازن بين حماية المحروقات وتجنب التصعيد الحدودي.
      {/if}
    </div>
  </div>
</div>
