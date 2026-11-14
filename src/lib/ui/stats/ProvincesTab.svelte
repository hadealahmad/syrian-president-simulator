<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { uiStore } from '../../stores/ui-store';
  import FilterStrip from '../kit/FilterStrip.svelte';
  import DossierCard from './DossierCard.svelte';
  import ProvinceCard from './ProvinceCard.svelte';
  import { fx } from './fx-bridge';

  type SortBy = 'prri' | 'blackout' | 'damage' | 'mines';
  type SortDir = 'desc' | 'asc';

  let sortBy = $state<SortBy>('prri');
  let sortDir = $state<SortDir>('desc');
  let dossiersOpen = $state(false);

  let quneitraNode = $derived($gameStore.governorates['quneitra']);
  let daraaNode = $derived($gameStore.governorates['daraa']);
  let suwaydaNode = $derived($gameStore.governorates['as_suwayda']);
  let golanTensionQ = $derived(quneitraNode?.golanTensionIndex ?? 45);
  let golanTensionD = $derived(daraaNode?.golanTensionIndex ?? quneitraNode?.golanTensionIndex ?? 45);
  let secessionProb = $derived(suwaydaNode?.suwaydaSecessionProb ?? 24);
  let integrationIndex = $derived(suwaydaNode?.suwaydaIntegrationIndex ?? 8);
  let tribalRage = $derived(suwaydaNode?.tribalRageIndex ?? 74);

  function metricVal(g: (typeof $gameStore.governorates)[string], key: SortBy): number {
    switch (key) {
      case 'blackout':
        return g.dailyBlackoutHours;
      case 'damage':
        return g.unrepairedDamageUSD;
      case 'mines':
        return g.mineSaturationPct;
      default:
        return g.prri;
    }
  }

  let governorates = $derived(
    Object.values($gameStore.governorates).sort((a, b) => {
      const va = metricVal(a, sortBy);
      const vb = metricVal(b, sortBy);
      return sortDir === 'desc' ? vb - va : va - vb;
    })
  );

  function selectProvince(id: string): void {
    uiStore.selectGovernorate(id);
  }

  function golanStatus(v: number): { text: string; tone: 'ok' | 'warn' | 'crit' } {
    if (v > 60) return { text: 'توغل واحتكاك حرج', tone: 'crit' };
    if (v > 30) return { text: 'توتر وتجريف أمني', tone: 'warn' };
    return { text: 'هدوء رقابي نسبي', tone: 'ok' };
  }

  let quneitraStatus = $derived(golanStatus(golanTensionQ));
  let daraaStatus = $derived(golanStatus(golanTensionD));

  let suwaydaStatus = $derived(
    secessionProb >= 85
      ? { text: 'سقوط وانفصال وشيك', tone: 'crit' as const }
      : secessionProb >= 60
        ? { text: 'خطر انفصال حرج', tone: 'crit' as const }
        : secessionProb >= 25
          ? { text: 'قلق وتوتر محلي', tone: 'warn' as const }
          : { text: 'اندماج وطني مستقر', tone: 'ok' as const }
  );

  const SORT_METRICS: { id: SortBy; label: string }[] = [
    { id: 'prri', label: 'الاحتقان' },
    { id: 'blackout', label: 'الظلام' },
    { id: 'damage', label: 'الخسائر' },
    { id: 'mines', label: 'الألغام' },
  ];
</script>

<div class="space-y-2">
  <!-- Collapsible Special Dossiers: Golan (Quneitra & Daraa) + Suwayda (collapsed by default) -->
  {#if quneitraNode || daraaNode || suwaydaNode}
    <section class="space-y-2">
      <button
        type="button"
        onclick={() => {
          dossiersOpen = !dossiersOpen;
          fx('tap');
        }}
        aria-expanded={dossiersOpen}
        class="pressable flex min-h-11 w-full items-center justify-between gap-2 border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-2 text-start hover:border-[var(--c-line-strong)]"
      >
        <span class="text-[12px] font-bold text-[var(--c-text)]">
          الملفات الحدودية والجنوبية الخاصة
        </span>
        <span class="flex items-center gap-2 text-[11px] text-[var(--c-muted)]">
          <span>الجولان · السويداء</span>
          <span aria-hidden="true" class="oc-kit-num text-[14px] font-bold leading-none">
            {dossiersOpen ? '−' : '+'}
          </span>
        </span>
      </button>

      {#if dossiersOpen}
        <div class="space-y-2">
          {#if quneitraNode}
            <DossierCard
              title="ملف الجولان والتدخل الخارجي على خط الهدنة — {quneitraNode.nameAr}"
              description="مراقبة شريط فك الاشتباك وقوات الأندوف (UNDOF) وتفادي الاستنزاف الإقليمي"
              statusAr={quneitraStatus.text}
              tone={quneitraStatus.tone}
              metricLabel="مؤشر التوغل والتدخل الخارجي"
              metricValue="{golanTensionQ} / 100"
              metricPct={golanTensionQ}
            />
          {/if}

          {#if daraaNode}
            <DossierCard
              title="ملف الجولان والتدخل الخارجي على خط الهدنة — {daraaNode.nameAr}"
              description="مراقبة شريط فك الاشتباك وقوات الأندوف (UNDOF) وتفادي الاستنزاف الإقليمي"
              statusAr={daraaStatus.text}
              tone={daraaStatus.tone}
              metricLabel="مؤشر التوغل والتدخل الخارجي"
              metricValue="{golanTensionD} / 100"
              metricPct={golanTensionD}
            />
          {/if}

          {#if suwaydaNode}
            <DossierCard
              title="ملف السويداء: مخاطر الانفصال والاندماج الوطني"
              description="احتمال انفصال جبل العرب وقطع شريان الجنوب، والوفاق مع عشائر اللجاة"
              statusAr={suwaydaStatus.text}
              tone={suwaydaStatus.tone}
              metricLabel="احتمال الانفصال عن الجمهورية"
              metricValue="{secessionProb}%"
              metricNote={secessionProb >= 85 ? '(عتبة السقوط الحتمي: 85%)' : ''}
              metricPct={secessionProb}
              subMetrics={[
                {
                  label: 'مؤشر الاندماج',
                  value: `${integrationIndex}%`,
                  pct: integrationIndex,
                  tone: integrationIndex >= 80 ? 'ok' : 'warn',
                  note: 'مستهدف النهاية الكبرى: 80%+',
                },
                {
                  label: 'احتقان اللجاة',
                  value: `${tribalRage}%`,
                  pct: tribalRage,
                  tone: tribalRage > 60 ? 'crit' : 'warn',
                  note: 'توتر خطوط الإمداد والطرق',
                },
              ]}
            />
          {/if}
        </div>
      {/if}
    </section>
  {/if}

  <!-- All 14 governorates: sortable ruled list -->
  <section class="space-y-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-[12px] font-bold text-[var(--c-text)]">
        المحافظات الـ14
        <span class="ms-1 text-[11px] font-normal text-[var(--c-muted)]">اضغط لفتح الملف</span>
      </h3>

      <div
        class="flex border border-[var(--c-line-strong)] bg-[var(--c-panel)]"
        role="group"
        aria-label="ترتيب المحافظات"
      >
        <button
          type="button"
          onclick={() => {
            sortDir = 'desc';
            fx('tap');
          }}
          aria-pressed={sortDir === 'desc'}
          class="pressable flex min-h-11 items-center px-2.5 text-[11.5px] font-bold {sortDir ===
          'desc'
            ? 'bg-[var(--c-text)] text-[var(--c-ink)]'
            : 'text-[var(--c-muted)] hover:text-[var(--c-text)]'}"
        >
          الأعلى
        </button>
        <button
          type="button"
          onclick={() => {
            sortDir = 'asc';
            fx('tap');
          }}
          aria-pressed={sortDir === 'asc'}
          class="pressable flex min-h-11 items-center border-s border-[var(--c-line-strong)] px-2.5 text-[11.5px] font-bold {sortDir ===
          'asc'
            ? 'bg-[var(--c-text)] text-[var(--c-ink)]'
            : 'text-[var(--c-muted)] hover:text-[var(--c-text)]'}"
        >
          الأدنى
        </button>
      </div>
    </div>

    <!-- Metric sort segmented strip -->
    <FilterStrip
      flush
      topBorder
      items={SORT_METRICS}
      value={sortBy}
      onchange={(id) => (sortBy = id as SortBy)}
      ariaLabel="معيار الترتيب"
    />

    <!-- Ruled table list -->
    <div class="border border-[var(--c-line)] bg-[var(--c-panel)]">
      <div class="grid grid-cols-[minmax(0,1.4fr)_52px_46px_54px_46px] items-center gap-1.5 bg-[var(--c-strip)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--c-muted)]">
        <span>المحافظة</span>
        <span class="text-end">الاحتقان</span>
        <span class="text-end">الظلام</span>
        <span class="text-end">الخسائر</span>
        <span class="text-end">الألغام</span>
      </div>
      {#each governorates as node (node.id)}
        <ProvinceCard {node} onselect={selectProvince} />
      {/each}
    </div>
  </section>
</div>
