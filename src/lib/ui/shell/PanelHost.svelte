<script lang="ts">
  import { gameStore } from '../../stores/game-store';
  import { uiStore } from '../../stores/ui-store';
  import { STAT_EXPLAINERS_AR, STAT_NAMES_AR } from '../panels/shared';
  import EmergencyPanel from '../panels/EmergencyPanel.svelte';
  import DecreesPanel from '../panels/DecreesPanel.svelte';
  import TaxFinancePanel from '../panels/TaxFinancePanel.svelte';
  import AssetsPanel from '../panels/AssetsPanel.svelte';
  import PoliciesPanel from '../panels/PoliciesPanel.svelte';
  import ProvincialPanel from '../panels/ProvincialPanel.svelte';
  import StatsPanel from '../panels/StatsPanel.svelte';
  import Sheet from './Sheet.svelte';
  import { shellLayout } from './viewport';

  interface PanelMeta {
    title: string;
    icon: string;
    width: number;
  }

  const META: Record<string, PanelMeta> = {
    provincial: { title: 'ملف المحافظة', icon: 'castle', width: 470 },
    policies: { title: 'السياسات الكبرى', icon: 'vote', width: 470 },
    assets: { title: 'الأصول المصادرة', icon: 'open-treasure-chest', width: 500 },
    tax: { title: 'الضرائب والمالية', icon: 'abacus', width: 500 },
    decrees: { title: 'المراسيم الرئاسية', icon: 'scroll-quill', width: 540 },
    emergency: { title: 'الطوارئ والتمويل', icon: 'siren', width: 500 },
    stats: { title: 'الإحصائيات', icon: 'chart', width: 560 },
  };

  let activeId = $derived(
    $uiStore.activeCommandPanel ?? ($uiStore.isStatsSidebarOpen ? 'stats' : null)
  );
  let open = $derived(activeId !== null);
  let meta = $derived((activeId && META[activeId]) || META.provincial);

  let selectedGov = $derived(
    $uiStore.selectedGovernorateId
      ? $gameStore.governorates[$uiStore.selectedGovernorateId]
      : null
  );

  let subtitle = $derived.by(() => {
    if (activeId === 'provincial') {
      if (!selectedGov) return 'اختر محافظة من الخريطة أو من قائمة المحافظات';
      return [selectedGov.nameEn, `${(selectedGov.population / 1_000_000).toFixed(2)}M نسمة`]
        .filter(Boolean)
        .join(' · ');
    }
    if (activeId === 'decrees') return 'دفتر التوقيع · سحب القرارات إلى الحصيلة';
    if (activeId === 'tax') return 'الموازنة، الضرائب، الطاقة والمزاد الدولاري';
    if (activeId === 'emergency') return 'القروض، الدين، الرهون والتسهيلات';
    if (activeId === 'assets') return 'ثروات الحرب والمساءلة بعد الدور الثاني';
    if (activeId === 'policies') return 'التوجهات الوطنية الكبرى والجبهة الجنوبية';
    if (activeId === 'stats') return 'لوحة المؤشرات الكاملة والحقائب التنفيذية';
    return '';
  });

  let selectedStat = $derived($uiStore.selectedStatForOptions);

  // Desktop only: tell the map how much of the inline-END edge the open Sheet
  // occupies so it can shrink beside the drawer (phones keep a modal sheet).
  let layout = $derived($shellLayout);
  $effect(() => {
    const root = document.documentElement;
    const active = open && layout === 'desktop';
    // +12px keeps a breathing gap between the drawer edge and the map.
    root.style.setProperty('--shell-map-end', active ? `${meta.width + 12}px` : '0px');
    return () => root.style.setProperty('--shell-map-end', '0px');
  });

  function close(): void {
    uiStore.closeActivePanel();
  }

  function clearFilter(): void {
    uiStore.closeStatRelatedOptions();
  }
</script>

<Sheet
  {open}
  title={meta.title}
  {subtitle}
  icon={meta.icon}
  width={meta.width}
  defaultSnap={activeId === 'provincial' ? 1 : 2}
  mapInteractive={activeId === 'provincial'}
  onclose={close}
  tourId={activeId === 'stats' ? 'stats-panel' : ''}
>
  {#if selectedStat && STAT_EXPLAINERS_AR[selectedStat]}
    <div class="mb-3 flex items-start justify-between gap-2 border border-wheat-gold/40 bg-forest-surface/80 p-2 text-[10px] leading-relaxed text-wheat-light">
      <div>
        <span class="font-bold text-wheat-gold font-heading">{STAT_NAMES_AR[selectedStat] ?? selectedStat}:</span>
        <span class="text-wheat-light/90"> {STAT_EXPLAINERS_AR[selectedStat]}</span>
      </div>
      <button
        type="button"
        onclick={clearFilter}
        class="shrink-0 border border-wheat-gold/50 px-1.5 py-0.5 text-[9px] font-bold text-wheat-gold hover:bg-forest-mid"
      >
        إلغاء التصفية
      </button>
    </div>
  {/if}

  {#if activeId === 'emergency'}
    <EmergencyPanel />
  {:else if activeId === 'decrees'}
    <DecreesPanel />
  {:else if activeId === 'tax'}
    <TaxFinancePanel />
  {:else if activeId === 'assets'}
    <AssetsPanel />
  {:else if activeId === 'policies'}
    <PoliciesPanel />
  {:else if activeId === 'provincial'}
    <ProvincialPanel />
  {:else if activeId === 'stats'}
    <StatsPanel />
  {/if}
</Sheet>
