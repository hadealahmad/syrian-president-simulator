<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { uiStore } from '../../stores/ui-store';
  import { SYRIA_2D_GOVERNORATES } from '../../spatial3d/syria-2d-paths';
  import DossierCard from './DossierCard.svelte';
  import ProvinceCard from './ProvinceCard.svelte';

  // Crop each governorate path to its own bounding box for the card silhouette
  // (ported unchanged from the retired table's mini-map shapes).
  function bboxOf(path: string): [number, number, number, number] {
    const nums = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [0, 0, 0, 0];
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }

  const GOV_SHAPE: Record<string, { d: string; vb: string }> = Object.fromEntries(
    SYRIA_2D_GOVERNORATES.map((g) => {
      const [x0, y0, x1, y1] = bboxOf(g.path);
      const pad = 14;
      return [
        g.id,
        { d: g.path, vb: `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}` },
      ];
    })
  );

  type SortDir = 'desc' | 'asc';
  let sortDir = $state<SortDir>('desc');

  let quneitraNode = $derived($gameStore.governorates['quneitra']);
  let daraaNode = $derived($gameStore.governorates['daraa']);
  let suwaydaNode = $derived($gameStore.governorates['as_suwayda']);
  let golanTensionQ = $derived(quneitraNode?.golanTensionIndex ?? 45);
  let golanTensionD = $derived(daraaNode?.golanTensionIndex ?? quneitraNode?.golanTensionIndex ?? 45);
  let secessionProb = $derived(suwaydaNode?.suwaydaSecessionProb ?? 24);
  let integrationIndex = $derived(suwaydaNode?.suwaydaIntegrationIndex ?? 8);
  let tribalRage = $derived(suwaydaNode?.tribalRageIndex ?? 74);

  let governorates = $derived(
    Object.values($gameStore.governorates).sort((a, b) =>
      sortDir === 'desc' ? b.prri - a.prri : a.prri - b.prri
    )
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
</script>

<div class="space-y-3">
  <!-- Special dossiers: Golan (Quneitra & Daraa) + Suwayda. -->
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

  <!-- All 14 governorates: compact cards, sorted by unrest. -->
  <section class="space-y-2">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="flex items-center gap-2 text-[9px] font-bold tracking-[1.2px] text-forest-accent/90">
        <span class="h-px w-3 bg-forest-accent/50" aria-hidden="true"></span>
        المحافظات الـ14
        <span class="font-mono text-[8.5px] font-normal text-wheat-dark">اضغط البطاقة لفتح الملف</span>
      </h3>

      <div
        class="flex overflow-hidden border border-wheat-mid/20 shell-round-chip"
        role="group"
        aria-label="ترتيب المحافظات حسب الاحتقان"
      >
        <button
          type="button"
          onclick={() => (sortDir = 'desc')}
          aria-pressed={sortDir === 'desc'}
          class="flex min-h-9 items-center gap-1 px-2 text-[9px] font-bold transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-wheat-gold phone-p:min-h-11 phone-l:min-h-10 {sortDir ===
          'desc'
            ? 'bg-wheat-gold/15 text-wheat-gold'
            : 'text-wheat-dark hover:text-wheat-light'}"
        >
          الأعلى احتقاناً
        </button>
        <button
          type="button"
          onclick={() => (sortDir = 'asc')}
          aria-pressed={sortDir === 'asc'}
          class="flex min-h-9 items-center gap-1 border-s border-wheat-mid/20 px-2 text-[9px] font-bold transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-wheat-gold phone-p:min-h-11 phone-l:min-h-10 {sortDir ===
          'asc'
            ? 'bg-wheat-gold/15 text-wheat-gold'
            : 'text-wheat-dark hover:text-wheat-light'}"
        >
          الأدنى
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-2 md:grid-cols-2 phone-l:grid-cols-1">
      {#each governorates as node (node.id)}
        <ProvinceCard node={node} shape={GOV_SHAPE[node.id]} onselect={selectProvince} />
      {/each}
    </div>
  </section>
</div>
