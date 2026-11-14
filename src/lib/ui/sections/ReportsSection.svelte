<script lang="ts">
  import SubTabs, { type SubTabItem } from '../kit/SubTabs.svelte';
  import StatsPanel from '../panels/StatsPanel.svelte';
  import { sectionNav, type ReportsTab } from '../shell/section-nav';

  let tab = $derived($sectionNav.reportsTab);

  const tabs: SubTabItem[] = [
    { id: 'general', label: 'المؤشرات' },
    { id: 'ministries', label: 'الحقائب' },
    { id: 'commissions', label: 'اللجان' },
    { id: 'governorates', label: 'المحافظات' },
  ];

  function handleTabChange(id: string): void {
    sectionNav.setReportsTab(id as ReportsTab);
  }
</script>

<div class="flex flex-col">
  <div class="sticky top-0 z-20 -mx-[var(--sheet-px,16px)] phone-p:-mx-3 phone-l:-mx-3 bg-[var(--c-bg)]">
    <SubTabs {tabs} value={tab} onchange={handleTabChange} ariaLabel="أقسام التقارير" />
  </div>

  <div class="pt-2">
    <StatsPanel />
  </div>
</div>
