<script lang="ts">
  import { flip } from 'svelte/animate';
  import { gameStore } from '../../../stores/game-store';
  import { draftStore } from '../../../stores/draft-store';
  import { uiStore } from '../../../stores/ui-store';
  import FxChip from '../../kit/FxChip.svelte';
  import GroupDivider from '../../kit/GroupDivider.svelte';
  import Lever from '../../kit/Lever.svelte';
  import { buildFilteredDisplayRows, flipDuration } from '../../kit/reorder';
  import {
    REMITTANCE_POOL_USD,
    previewComplianceRate,
    previewCorporateTaxSYP,
    previewTelecomExciseSYP,
    previewTransitRevenueUSD,
  } from '../../panels/shared';
  import { isSectionOptionRelated } from '../../shell/section-nav';

  type RevenueKey =
    | 'corporateTaxRate'
    | 'telecomExciseRate'
    | 'nassibTransitFeeUSD'
    | 'remittanceCaptureSpread';

  const REVENUE_KEYS: readonly RevenueKey[] = [
    'corporateTaxRate',
    'telecomExciseRate',
    'nassibTransitFeeUSD',
    'remittanceCaptureSpread',
  ];

  let selectedStat = $derived($uiStore.selectedStatForOptions);
  let openExplainers = $state<Record<string, boolean>>({});

  function toggleExplainer(key: string): void {
    openExplainers[key] = !openExplainers[key];
  }

  let displayRows = $derived(
    buildFilteredDisplayRows(
      REVENUE_KEYS,
      selectedStat,
      (k) => k,
      (k) => isSectionOptionRelated(selectedStat, k),
      () => 0
    )
  );

  let complianceRate = $derived(previewComplianceRate($gameStore));
  let corporateTaxB = $derived(
    previewCorporateTaxSYP($draftStore.corporateTaxRate, complianceRate) / 1_000_000_000
  );
  let telecomExciseB = $derived(
    previewTelecomExciseSYP($draftStore.telecomExciseRate) / 1_000_000_000
  );
  let transitRevenueM = $derived(
    previewTransitRevenueUSD(
      $draftStore.nassibTransitFeeUSD,
      $gameStore.governorates['daraa']?.nassibRevenueCapturePct ?? 32,
      complianceRate
    ) / 1_000_000
  );
  let remittanceCapturedM = $derived(
    $draftStore.remittanceCaptureSpread <= 15
      ? Math.round((REMITTANCE_POOL_USD * ($draftStore.remittanceCaptureSpread / 100)) / 1_000_000)
      : Math.round(150 + ($draftStore.remittanceCaptureSpread - 15) * 8.5)
  );
</script>

<div class="flex flex-col gap-2" role="tabpanel" aria-label="الإيرادات">
  {#each displayRows as row (row.key)}
    <div animate:flip={{ duration: flipDuration() }}>
      {#if row.kind === 'divider'}
        <GroupDivider label="غير مرتبط بهذا المؤشر" count={row.count} />
      {:else if row.item === 'corporateTaxRate'}
        <!-- Corporate Tax Rate -->
        <Lever
          title="ضريبة أرباح الشركات والمنشآت"
          display={`${$draftStore.corporateTaxRate}%`}
          value={$draftStore.corporateTaxRate}
          min={10}
          max={35}
          step={1}
          default={22}
          ariaLabel="ضريبة أرباح الشركات"
          minLabel="10%"
          maxLabel="35%"
          onchange={(value) => draftStore.setField('corporateTaxRate', value)}
          explainerOpen={openExplainers.corp ?? false}
          onToggleExplainer={() => toggleExplainer('corp')}
          dimmed={Boolean(selectedStat) && !row.related}
        >
          {#snippet chips()}
            <FxChip text={`+${corporateTaxB.toFixed(2)}B SP/دور`} tone="good" />
            <FxChip text={`امتثال ${Math.round(complianceRate * 100)}%`} />
            <FxChip
              text={$draftStore.corporateTaxRate > 25 ? 'يقلص الاستثمار' : 'يشجع الامتثال'}
              tone={$draftStore.corporateTaxRate > 25 ? 'bad' : 'good'}
            />
          {/snippet}
          {#snippet explainer()}
            معدل الضريبة ({$draftStore.corporateTaxRate}%). رفعه يزيد إيرادات الخزينة بSP لكن يقلص الاستثمار وقد يحفز التهرب الضريبي.
          {/snippet}
        </Lever>
      {:else if row.item === 'telecomExciseRate'}
        <!-- Telecom Excise Tax -->
        <Lever
          title="رسم الإنفاق الاستهلاكي على الاتصالات"
          display={`${$draftStore.telecomExciseRate}%`}
          value={$draftStore.telecomExciseRate}
          min={5}
          max={30}
          step={1}
          default={15}
          ariaLabel="رسم الاتصالات"
          minLabel="5%"
          maxLabel="30%"
          onchange={(value) => draftStore.setField('telecomExciseRate', value)}
          explainerOpen={openExplainers.telecom ?? false}
          onToggleExplainer={() => toggleExplainer('telecom')}
          dimmed={Boolean(selectedStat) && !row.related}
        >
          {#snippet chips()}
            <FxChip text={`+${telecomExciseB.toFixed(2)}B SP/دور`} tone="good" />
            <FxChip
              text={$draftStore.telecomExciseRate > 20 ? 'ضغط معيشي متصاعد' : 'عبء معتدل'}
              tone={$draftStore.telecomExciseRate > 20 ? 'bad' : 'good'}
            />
          {/snippet}
          {#snippet explainer()}
            رسم استهلاكي ({$draftStore.telecomExciseRate}%). جباية سريعة ومباشرة بـSP للخزينة، لكن رفعه يثقل كاهل المواطنين ويزيد الاحتقان المعيشي.
          {/snippet}
        </Lever>
      {:else if row.item === 'nassibTransitFeeUSD'}
        <!-- All Crossings Transit Fee -->
        <Lever
          title="رسوم الترانزيت بكافة المعابر الحدودية"
          display={`$${$draftStore.nassibTransitFeeUSD}`}
          value={$draftStore.nassibTransitFeeUSD}
          min={200}
          max={800}
          step={50}
          default={450}
          ariaLabel="رسوم الترانزيت"
          minLabel="$200"
          maxLabel="$800"
          onchange={(value) => draftStore.setField('nassibTransitFeeUSD', value)}
          explainerOpen={openExplainers.transit ?? false}
          onToggleExplainer={() => toggleExplainer('transit')}
          dimmed={Boolean(selectedStat) && !row.related}
        >
          {#snippet chips()}
            <FxChip text={`+$${Math.round(transitRevenueM)}M دولار/دور`} tone="good" />
            <FxChip
              text={$draftStore.nassibTransitFeeUSD > 600 ? 'قد يخفض تدفق الشاحنات' : 'حركة ترانزيت نشطة'}
              tone={$draftStore.nassibTransitFeeUSD > 600 ? 'bad' : 'good'}
            />
          {/snippet}
          {#snippet explainer()}
            تعرفة ${$draftStore.nassibTransitFeeUSD} على الشاحنات الأجنبية بكافة المنافذ والمعابر الحدودية لتعظيم عوائد النقد الأجنبي المباشرة ($) للخزينة.
          {/snippet}
        </Lever>
      {:else if row.item === 'remittanceCaptureSpread'}
        <!-- Remittance Capture Spread -->
        <Lever
          title="هامش اقتطاع الحوالات للمصرف المركزي"
          display={`${$draftStore.remittanceCaptureSpread}%`}
          value={$draftStore.remittanceCaptureSpread}
          min={5}
          max={25}
          step={1}
          default={10}
          ariaLabel="هامش اقتطاع الحوالات"
          minLabel="5%"
          maxLabel="25%"
          onchange={(value) => draftStore.setField('remittanceCaptureSpread', value)}
          explainerOpen={openExplainers.remit ?? false}
          onToggleExplainer={() => toggleExplainer('remit')}
          dimmed={Boolean(selectedStat) && !row.related}
        >
          {#snippet chips()}
            <FxChip
              text={`+$${remittanceCapturedM}M دولار/دور`}
              tone={$draftStore.remittanceCaptureSpread > 15 ? 'bad' : 'good'}
            />
            <FxChip
              text={$draftStore.remittanceCaptureSpread > 15
                ? 'اقتطاع طوارئ قسري (سيولة إنقاذية قصوى)'
                : $draftStore.remittanceCaptureSpread <= 7
                  ? 'تحفيز المغتربين والقنوات الرسمية (+ثقة)'
                  : 'اقتطاع اعتيادي مستقر (الحالة المحايدة)'}
              tone={$draftStore.remittanceCaptureSpread > 15
                ? 'bad'
                : $draftStore.remittanceCaptureSpread <= 7
                  ? 'good'
                  : 'neutral'}
            />
          {/snippet}
          {#snippet explainer()}
            {$draftStore.remittanceCaptureSpread <= 15
              ? `نسبة اقتطاع اعتيادية (${$draftStore.remittanceCaptureSpread}%). تحقق جباية دولارية بقيمة +${remittanceCapturedM}M للخزينة عبر القنوات المصرفية الرسمية بأمان ودون إثارة مقاطعة المغتربين.`
              : `اقتطاع طوارئ استثنائي (${$draftStore.remittanceCaptureSpread}%): يوفر للمصرف المركزي سيولة دولارية إنقاذية ضخمة تصل إلى +${remittanceCapturedM}M كاش لإنقاذ الاحتياطي ومنع العجز عن سداد الديون واستيراد القمح والفيول، مقابل كلفة مقبولة على الثقة الشعبية ونشاط الصرافة غير النظامي.`}
          {/snippet}
        </Lever>
      {/if}
    </div>
  {/each}
</div>
