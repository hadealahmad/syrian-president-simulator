import { derived } from 'svelte/store';
import { CONCESSIONAL_FACILITIES } from '../../engine/constants';
import {
  getOligarchLiquidationPCCost,
  getOligarchNationalizePCEarned,
  getOligarchSettlementPCCost,
  getOligarchTerms,
} from '../../engine/oligarch-helpers';
import type { GameState, TurnDirectives } from '../../engine/types';
import { draftStore } from '../../stores/draft-store';
import { gameStore } from '../../stores/game-store';
import { uiStore } from '../../stores/ui-store';
import { locateOption, openSection, type SectionId } from '../shell/section-nav';

export type ReviewSectionId = 'tax' | 'emergency' | 'decrees' | 'provincial';
export type ReviewValueTone = 'neg' | 'pos' | 'accent' | 'muted';

export interface ReviewTrayItem {
  id: string;
  section: ReviewSectionId;
  title: string;
  costText?: string;
  costTone?: ReviewValueTone;
  note?: string;
  cancelLabel?: string;
  onJump: () => void;
  onCancel: () => void;
}

export interface ReviewTrayGroup {
  id: ReviewSectionId;
  labelAr: string;
  items: ReviewTrayItem[];
}

export const REVIEW_GROUP_ORDER: { id: ReviewSectionId; labelAr: string }[] = [
  { id: 'tax', labelAr: 'الخزينة' },
  { id: 'emergency', labelAr: 'الدَّين' },
  { id: 'decrees', labelAr: 'الحكم' },
  { id: 'provincial', labelAr: 'الخريطة' },
];

export const SOUTHERN_POLICY_NAMES_AR: Record<string, string> = {
  HISTORIC_ACCORD: 'الوفاق التاريخي الشامل (وفاق السهل والجبل)',
  LOCAL_VOUCHERS: 'قسائم الإغاثة المحلية المشروطة',
  UNCONDITIONAL_AID: 'المساعدات الإنسانية المفتوحة',
  BLOCKADE: 'الحصار الأمني المشدد وإغلاق المعابر',
};

export const GOLAN_STANCE_NAMES_AR: Record<string, string> = {
  RESTRAINT: 'ضبط النفس',
  LOCAL_GENDARMERIE: 'درك محلي',
  DEPLOY_ARMOR: 'نشر الدروع (9.0B SP)',
  UN_LIAISON: 'ارتباط أندوف ($8M)',
};

export const DECREE_TITLES_AR: Record<string, string> = {
  ANTI_CORRUPTION_COMMISSION: 'مرسوم إطلاق هيئة النزاهة وتدقيق الأصول',
  PROPERTY_RESTITUTION_PORTAL: 'المنصة الرقمية لرد الملكيات العقارية للاجئين',
  SMUGGLING_BORDER_SWEEP: 'الحملة الوطنية المشتركة لضبط الحدود ومكافحة التهريب',
  TRIBAL_CUSTOMS_COUNCIL: 'ميثاق التفاهم العشائري وتأمين الترانزيت الشرقي',
  CABINET_HEARING: 'جلسة مساءلة حكومية علنية ونشر الذمة المالية',
  UNITY_SPEECH: 'خطاب المصالحة الوطنية والعهد المدني الشامل',
  OPPOSITION_SEATS: 'توسيع التشكيل الحكومي واستيعاب معارضة التكنوقراط',
  MARTIAL_LAW: 'إعلان حالة الطوارئ والأحكام العرفية',
  REPUDIATE_IRAN_INFORMAL: 'إعلان بطلان المطالب الإيرانية غير الموثقة ($30B)',
  REPUDIATE_IRAN_FORMAL: 'التنصل من خطوط الائتمان النفطية الإيرانية ($7B)',
  REPUDIATE_RUSSIA: 'التنصل من الديون الروسية الرسمية ($1.5B)',
  REPUDIATE_PARIS: 'التنصل من الديون الثنائية الباريسية ($4.6B)',
};

const REPUDIATION_ACTIONS = new Set([
  'REPUDIATE_IRAN_INFORMAL',
  'REPUDIATE_IRAN_FORMAL',
  'REPUDIATE_RUSSIA',
  'REPUDIATE_PARIS',
]);

const POLITICAL_ACTION_COST_LABELS: Record<string, { text: string; tone: ReviewValueTone }> = {
  ANTI_CORRUPTION_COMMISSION: { text: '-15 رصيد', tone: 'accent' },
  PROPERTY_RESTITUTION_PORTAL: { text: '-10 رصيد', tone: 'accent' },
  SMUGGLING_BORDER_SWEEP: { text: '-12 رصيد', tone: 'accent' },
  TRIBAL_CUSTOMS_COUNCIL: { text: '-8 رصيد', tone: 'accent' },
  CABINET_HEARING: { text: '+8 رصيد', tone: 'pos' },
  UNITY_SPEECH: { text: '+4 رصيد', tone: 'pos' },
  OPPOSITION_SEATS: { text: '+18 رصيد', tone: 'pos' },
  MARTIAL_LAW: { text: '-4% ثقة/دور', tone: 'neg' },
  REPUDIATE_IRAN_INFORMAL: { text: '+6 رصيد', tone: 'pos' },
  REPUDIATE_IRAN_FORMAL: { text: '+12 رصيد', tone: 'pos' },
  REPUDIATE_RUSSIA: { text: '+10 رصيد', tone: 'pos' },
  REPUDIATE_PARIS: { text: '+8 رصيد', tone: 'pos' },
};

export function formatMillionUSD(usd: number): string {
  return (usd / 1_000_000).toFixed(1);
}

export function formatBillionSYP(syp: number): string {
  const val = Number((syp / 1_000_000_000).toFixed(2));
  if (Object.is(val, -0) || val === 0) return '0.00';
  return val.toFixed(2);
}

function jumpToOption(optionKey: string, fallbackSection: SectionId): void {
  uiStore.setTurnFlowStage('closed');
  if (!locateOption(optionKey)) {
    openSection(fallbackSection);
  }
}

function jumpToProvince(govId: string | null): void {
  uiStore.setTurnFlowStage('closed');
  if (govId) {
    uiStore.selectGovernorate(govId);
  }
  openSection('provincial');
}

export function buildReviewGroups(game: GameState, draft: TurnDirectives): ReviewTrayGroup[] {
  const taxItems: ReviewTrayItem[] = [];
  const debtItems: ReviewTrayItem[] = [];
  const governanceItems: ReviewTrayItem[] = [];
  const mapItems: ReviewTrayItem[] = [];

  // ── 1. الخزينة (tax) ────────────────────────────────────────────────────────
  if (draft.corporateTaxRate !== 22) {
    taxItems.push({
      id: 'corporateTaxRate',
      section: 'tax',
      title: `ضريبة أرباح الشركات: 22% ← ${draft.corporateTaxRate}%`,
      costText: draft.corporateTaxRate > 22 ? 'رفع الجباية' : 'تخفيف ضريبي',
      costTone: 'muted',
      onJump: () => jumpToOption('corporateTaxRate', 'tax'),
      onCancel: () => draftStore.setField('corporateTaxRate', 22),
    });
  }

  if (draft.telecomExciseRate !== 15) {
    taxItems.push({
      id: 'telecomExciseRate',
      section: 'tax',
      title: `رسم الإنفاق على الاتصالات: 15% ← ${draft.telecomExciseRate}%`,
      costText: draft.telecomExciseRate > 15 ? 'رفع الرسم' : 'تخفيف الرسم',
      costTone: 'muted',
      onJump: () => jumpToOption('telecomExciseRate', 'tax'),
      onCancel: () => draftStore.setField('telecomExciseRate', 15),
    });
  }

  if (draft.nassibTransitFeeUSD !== 450) {
    taxItems.push({
      id: 'nassibTransitFeeUSD',
      section: 'tax',
      title: `رسوم الترانزيت البري بالمعابر: $${draft.nassibTransitFeeUSD}/شاحنة`,
      costText: `$${draft.nassibTransitFeeUSD}`,
      costTone: draft.nassibTransitFeeUSD > 450 ? 'pos' : 'muted',
      onJump: () => jumpToOption('nassibTransitFeeUSD', 'tax'),
      onCancel: () => draftStore.setField('nassibTransitFeeUSD', 450),
    });
  }

  if (draft.remittanceCaptureSpread !== 10) {
    taxItems.push({
      id: 'remittanceCaptureSpread',
      section: 'tax',
      title: `هامش اقتطاع الحوالات الخارجية: ${draft.remittanceCaptureSpread}%`,
      costText: `${draft.remittanceCaptureSpread}%`,
      costTone: draft.remittanceCaptureSpread > 15 ? 'neg' : draft.remittanceCaptureSpread <= 8 ? 'pos' : 'muted',
      onJump: () => jumpToOption('remittanceCaptureSpread', 'tax'),
      onCancel: () => draftStore.setField('remittanceCaptureSpread', 10),
    });
  }

  if (draft.wageBumpPercent > 0) {
    taxItems.push({
      id: 'wageBumpPercent',
      section: 'tax',
      title: `زيادة رواتب العاملين في الدولة: +${draft.wageBumpPercent}%`,
      costText: `+${draft.wageBumpPercent}%`,
      costTone: 'neg',
      onJump: () => jumpToOption('wageBumpPercent', 'tax'),
      onCancel: () => draftStore.setField('wageBumpPercent', 0),
    });
  }

  if (draft.foodSubsidyLevel !== 'STANDARD') {
    const label = draft.foodSubsidyLevel === 'GENEROUS' ? 'دعم موسع وشامل' : 'ترشيد تقشفي صارم';
    taxItems.push({
      id: 'foodSubsidyLevel',
      section: 'tax',
      title: `الدعم التمويني والخبز: ${label}`,
      costText: draft.foodSubsidyLevel === 'GENEROUS' ? 'توسيع' : 'تقشف',
      costTone: draft.foodSubsidyLevel === 'GENEROUS' ? 'neg' : 'pos',
      onJump: () => jumpToOption('foodSubsidyLevel', 'tax'),
      onCancel: () => draftStore.setField('foodSubsidyLevel', 'STANDARD'),
    });
  }

  if (draft.wheatProcurement !== 'MARKET_PARITY') {
    const label =
      draft.wheatProcurement === 'PREMIUM_INCENTIVE'
        ? 'سعر تشجيعي للمزارعين'
        : 'شراء إلزامي بأسعار مدعومة منخفضة';
    taxItems.push({
      id: 'wheatProcurement',
      section: 'tax',
      title: `تسعير شراء القمح المحلي: ${label}`,
      costText: draft.wheatProcurement === 'PREMIUM_INCENTIVE' ? 'حافز' : 'مدعوم',
      costTone: 'muted',
      onJump: () => jumpToOption('wheatProcurement', 'tax'),
      onCancel: () => draftStore.setField('wheatProcurement', 'MARKET_PARITY'),
    });
  }

  if (draft.gridCapExUSD !== 35_000_000) {
    taxItems.push({
      id: 'gridCapExUSD',
      section: 'tax',
      title: `الاستثمار الرأسمالي لشبكة الكهرباء: $${draft.gridCapExUSD / 1_000_000}M`,
      costText: `-$${draft.gridCapExUSD / 1_000_000}M`,
      costTone: draft.gridCapExUSD === 0 ? 'pos' : 'neg',
      onJump: () => jumpToOption('gridCapExUSD', 'tax'),
      onCancel: () => draftStore.setField('gridCapExUSD', 35_000_000),
    });
  }

  if (draft.expatriateBrainGainIncentive) {
    taxItems.push({
      id: 'expatriateBrainGainIncentive',
      section: 'tax',
      title: 'حوافز استقطاب الكفاءات والمهاجرين',
      costText: '-$20M · -3.5B',
      costTone: 'neg',
      onJump: () => jumpToOption('brainGain', 'tax'),
      onCancel: () => draftStore.setField('expatriateBrainGainIncentive', false),
    });
  }

  if (draft.charityFundActive) {
    taxItems.push({
      id: 'charityFundActive',
      section: 'tax',
      title: 'صندوق الكرامة السيادي (مستمر دورياً)',
      costText: '-2.50B / +3 رصيد',
      costTone: 'neg',
      onJump: () => jumpToOption('charityFund', 'tax'),
      onCancel: () => draftStore.setField('charityFundActive', false),
    });
  }

  if (draft.populistGrant) {
    taxItems.push({
      id: 'populistGrant',
      section: 'tax',
      title: 'منحة شعبية استثنائية (مكافأة نصف سنوية)',
      costText: '-7.50B / +8 رصيد',
      costTone: 'neg',
      onJump: () => jumpToOption('populistGrant', 'tax'),
      onCancel: () => draftStore.setField('populistGrant', false),
    });
  }

  if (draft.importSurge) {
    taxItems.push({
      id: 'importSurge',
      section: 'tax',
      title: 'دفعة استيراد إغاثية طارئة (غذاء ووقود)',
      costText: '-$40.0M',
      costTone: 'neg',
      onJump: () => jumpToOption('importSurge', 'tax'),
      onCancel: () => draftStore.setField('importSurge', false),
    });
  }

  if ((draft.moneyPrintingSYP ?? 0) > 0) {
    taxItems.push({
      id: 'moneyPrintingSYP',
      section: 'tax',
      title: 'إصدار نقدي (تمويل بالعجز)',
      costText: `+${formatBillionSYP(draft.moneyPrintingSYP)}B SP`,
      costTone: 'accent',
      onJump: () => jumpToOption('moneyPrintingSYP', 'tax'),
      onCancel: () => draftStore.setField('moneyPrintingSYP', 0),
    });
  }

  if (draft.dollarAuctionUSD > 0) {
    taxItems.push({
      id: 'dollarAuctionUSD',
      section: 'tax',
      title: 'مزاد التدخل الدولاري للمصرف المركزي',
      costText: `-$${formatMillionUSD(draft.dollarAuctionUSD)}M`,
      costTone: 'neg',
      onJump: () => jumpToOption('dollarAuctionUSD', 'tax'),
      onCancel: () => draftStore.setField('dollarAuctionUSD', 0),
    });
  }

  // ── 2. الدَّين (emergency) ──────────────────────────────────────────────────
  for (const loanId of draft.terminatedLoanIds ?? []) {
    const tloan = game.foreignLoans.find((l) => l.id === loanId);
    if (tloan && tloan.isSigned) {
      const remaining = tloan.remainingPrincipalUSD ?? tloan.disbursementUSD;
      debtItems.push({
        id: `terminate_${loanId}`,
        section: 'emergency',
        title: `فسخ سيادي: ${tloan.titleAr}`,
        costText: `-$${formatMillionUSD(remaining)}M`,
        costTone: 'neg',
        onJump: () => jumpToOption('loanTermination', 'emergency'),
        onCancel: () => draftStore.toggleLoanTermination(loanId),
      });
    }
  }

  const parisRepudiated =
    game.flags?.Debt_Repudiated_Paris === 1 ||
    (draft.activePoliticalActions ?? []).includes('REPUDIATE_PARIS');

  for (const loanId of draft.signedLoanIds ?? []) {
    if (parisRepudiated && (loanId === 'loan_imf_wb' || loanId === 'loan_gulf_swf')) {
      continue;
    }
    const sloan = game.foreignLoans.find((l) => l.id === loanId);
    if (sloan && !sloan.isSigned) {
      debtItems.push({
        id: `loan_${loanId}`,
        section: 'emergency',
        title: `توقيع قرض خارجي: ${sloan.titleAr}`,
        costText: `+$${formatMillionUSD(sloan.disbursementUSD)}M`,
        costTone: 'pos',
        note: sloan.politicalCapitalCost > 0 ? `-${sloan.politicalCapitalCost} رصيد · يبدأ السداد الدور التالي` : 'يبدأ سداد الفائدة من الدور التالي',
        onJump: () => jumpToOption('loans', 'emergency'),
        onCancel: () => draftStore.toggleLoan(loanId),
      });
    }
  }

  for (const mortgageId of draft.executedMortgageIds ?? []) {
    const smort = game.sovereignMortgages?.find((m) => m.id === mortgageId);
    if (smort && !smort.isMortgaged) {
      debtItems.push({
        id: `mortgage_${mortgageId}`,
        section: 'emergency',
        title: `رهن سيادي: ${smort.titleAr}`,
        costText: `+$${formatMillionUSD(smort.immediateCashUSD)}M`,
        costTone: 'pos',
        note: smort.sovereigntyPenaltyAr,
        onJump: () => jumpToOption('mortgages', 'emergency'),
        onCancel: () => draftStore.toggleMortgage(mortgageId),
      });
    }
  }

  for (const facilityId of draft.signedFacilityIds ?? []) {
    const sdef = CONCESSIONAL_FACILITIES.find((f) => f.id === facilityId);
    if (sdef) {
      const firstAmt = sdef.tranches.length > 0 ? `+$${formatMillionUSD(sdef.tranches[0].amountUSD)}M` : `-${sdef.politicalCapitalCost} رصيد`;
      debtItems.push({
        id: `facility_${facilityId}`,
        section: 'emergency',
        title: `توقيع تسهيل مشروط: ${sdef.titleAr}`,
        costText: firstAmt,
        costTone: sdef.tranches.length > 0 ? 'pos' : 'accent',
        note: `شرط: ${sdef.conditionAr}`,
        onJump: () => jumpToOption('facilities', 'emergency'),
        onCancel: () => draftStore.toggleFacility(facilityId),
      });
    }
  }

  if ((draft.extraDebtRepaymentUSD ?? 0) > 0) {
    debtItems.push({
      id: 'extraDebtRepaymentUSD',
      section: 'emergency',
      title: 'سداد مبكر لأصل الدين',
      costText: `-$${formatMillionUSD(draft.extraDebtRepaymentUSD)}M`,
      costTone: 'neg',
      onJump: () => jumpToOption('extraDebtRepaymentUSD', 'emergency'),
      onCancel: () => draftStore.setField('extraDebtRepaymentUSD', 0),
    });
  }

  for (const actId of draft.activePoliticalActions ?? []) {
    if (!REPUDIATION_ACTIONS.has(actId)) continue;
    const costInfo = POLITICAL_ACTION_COST_LABELS[actId];
    debtItems.push({
      id: `repudiate_${actId}`,
      section: 'emergency',
      title: DECREE_TITLES_AR[actId] ?? actId,
      costText: costInfo?.text,
      costTone: costInfo?.tone ?? 'pos',
      onJump: () => jumpToOption(actId, 'emergency'),
      onCancel: () => draftStore.togglePoliticalAction(actId),
    });
  }

  // ── 3. الحكم (decrees) ─────────────────────────────────────────────────────
  for (const actId of draft.activePoliticalActions ?? []) {
    if (REPUDIATION_ACTIONS.has(actId)) continue;
    const costInfo = POLITICAL_ACTION_COST_LABELS[actId];
    governanceItems.push({
      id: `decree_${actId}`,
      section: 'decrees',
      title: DECREE_TITLES_AR[actId] ?? actId,
      costText: costInfo?.text,
      costTone: costInfo?.tone ?? 'muted',
      cancelLabel: actId === 'MARTIAL_LAW' ? 'إنهاء' : 'إلغاء',
      onJump: () => jumpToOption(actId, 'decrees'),
      onCancel: () => draftStore.togglePoliticalAction(actId),
    });
  }

  if (draft.workforceStrategy !== 'MAINTAIN') {
    const label =
      draft.workforceStrategy === 'ABSORB_MILITIAS'
        ? 'استيعاب الفصائل في الجهاز المدني'
        : 'شطب التوظيف الوهمي وترشيد الملاك';
    governanceItems.push({
      id: 'workforceStrategy',
      section: 'decrees',
      title: `هيكلة الوظيفة العامة: ${label}`,
      costText: draft.workforceStrategy === 'ABSORB_MILITIAS' ? 'استيعاب' : '-25% رواتب',
      costTone: draft.workforceStrategy === 'ABSORB_MILITIAS' ? 'neg' : 'pos',
      onJump: () => jumpToOption('workforceStrategy', 'decrees'),
      onCancel: () => draftStore.setField('workforceStrategy', 'MAINTAIN'),
    });
  }

  if (draft.dieselSmuggling !== 'STANDARD') {
    const label =
      draft.dieselSmuggling === 'CRACKDOWN'
        ? 'حملة أمنية صارمة ومصادرة الصهاريج'
        : 'غض الطرف وتفادي الاحتكاك العشائري';
    governanceItems.push({
      id: 'dieselSmuggling',
      section: 'decrees',
      title: `مكافحة تهريب المحروقات: ${label}`,
      costText: draft.dieselSmuggling === 'CRACKDOWN' ? 'حملة' : 'تساهل',
      costTone: 'muted',
      onJump: () => jumpToOption('dieselSmuggling', 'decrees'),
      onCancel: () => draftStore.setField('dieselSmuggling', 'STANDARD'),
    });
  }

  if (draft.golanBorderStance !== 'RESTRAINT') {
    governanceItems.push({
      id: 'golanBorderStance',
      section: 'decrees',
      title: `موقف حدود الجولان: ${GOLAN_STANCE_NAMES_AR[draft.golanBorderStance] ?? draft.golanBorderStance}`,
      costText:
        draft.golanBorderStance === 'DEPLOY_ARMOR'
          ? '-9.00B SP'
          : draft.golanBorderStance === 'UN_LIAISON'
            ? '-$8.0M'
            : 'درك محلي',
      costTone: draft.golanBorderStance === 'LOCAL_GENDARMERIE' ? 'muted' : 'neg',
      onJump: () => jumpToOption('golanBorderStance', 'decrees'),
      onCancel: () => draftStore.setField('golanBorderStance', 'RESTRAINT'),
    });
  }

  for (const [assetId, action] of Object.entries(draft.oligarchDecisions || {})) {
    const asset = game.confiscatedAssets.find((a) => a.id === assetId);
    if (asset && asset.status === 'PENDING') {
      const terms = getOligarchTerms(asset);
      const actionLabel =
        action === 'SETTLEMENT_80_20'
          ? 'تسوية 80/20'
          : action === 'NATIONALIZE_SOE'
            ? 'تأميم حكومي'
            : 'تصفية خارجية';
      const costText =
        action === 'SETTLEMENT_80_20'
          ? `+$${formatMillionUSD(terms.settlementUSD)}M`
          : action === 'NATIONALIZE_SOE'
            ? `+${getOligarchNationalizePCEarned(asset.valuationUSD)} رصيد`
            : `+$${formatMillionUSD(terms.liquidationUSD)}M`;
      const pcNote =
        action === 'SETTLEMENT_80_20'
          ? `-${getOligarchSettlementPCCost(asset.valuationUSD)} رصيد`
          : action === 'FOREIGN_LIQUIDATION'
            ? `-${getOligarchLiquidationPCCost(asset.valuationUSD)} رصيد`
            : `+${formatBillionSYP(terms.nationalizedSYPPerTurn)}B/دور`;
      governanceItems.push({
        id: `oligarch_${asset.id}`,
        section: 'decrees',
        title: `${asset.titleAr} — ${actionLabel}`,
        costText,
        costTone: 'pos',
        note: pcNote,
        onJump: () => jumpToOption('oligarchs', 'decrees'),
        onCancel: () => draftStore.removeOligarchDecision(asset.id),
      });
    }
  }

  if (draft.propertyRestitution !== 'RESTITUTE_TO_REFUGEES') {
    governanceItems.push({
      id: 'propertyRestitution',
      section: 'decrees',
      title: 'ملف رد الملكيات العقارية: استثمارها كأملاك دولة',
      costText: '+$120M · +8.00B',
      costTone: 'pos',
      note: '−8 ثقة · +5 احتقان',
      onJump: () => jumpToOption('propertyRestitution', 'decrees'),
      onCancel: () => draftStore.setField('propertyRestitution', 'RESTITUTE_TO_REFUGEES'),
    });
  }

  // ── 4. الخريطة (provincial) ────────────────────────────────────────────────
  if (draft.deminingPriorityId) {
    const deminingGov = game.governorates[draft.deminingPriorityId];
    if (deminingGov) {
      const govId = deminingGov.id;
      mapItems.push({
        id: `demining_${govId}`,
        section: 'provincial',
        title: `${deminingGov.nameAr} · أولوية نزع الألغام الهندسية`,
        costText: '-$20.0M',
        costTone: 'neg',
        note: '-8.00B SP · خفض الألغام 8%',
        onJump: () => jumpToProvince(govId),
        onCancel: () => draftStore.setField('deminingPriorityId', null),
      });
    }
  }

  if (draft.powerBoostGovId) {
    const powerGov = game.governorates[draft.powerBoostGovId];
    if (powerGov) {
      const govId = powerGov.id;
      mapItems.push({
        id: `power_${govId}`,
        section: 'provincial',
        title: `${powerGov.nameAr} · أولوية تعزيز الكهرباء`,
        costText: '-$10.0M',
        costTone: 'neg',
        note: '-3.00B SP · -4 ساعات تقنين',
        onJump: () => jumpToProvince(govId),
        onCancel: () => draftStore.setField('powerBoostGovId', null),
      });
    }
  }

  for (const projId of draft.provincialProjects ?? []) {
    for (const gov of Object.values(game.governorates)) {
      if (gov.strategicProject?.id === projId) {
        const proj = gov.strategicProject;
        mapItems.push({
          id: `proj_${proj.id}`,
          section: 'provincial',
          title: `${gov.nameAr} · ${proj.titleAr}`,
          costText: `-$${(proj.costUSD / 1_000_000).toFixed(0)}M`,
          costTone: 'neg',
          note:
            proj.costPoliticalCapital > 0
              ? `-${(proj.costSYP / 1_000_000_000).toFixed(2)}B SP · -${proj.costPoliticalCapital} رصيد`
              : `-${(proj.costSYP / 1_000_000_000).toFixed(2)}B SP`,
          onJump: () => jumpToProvince(gov.id),
          onCancel: () => draftStore.toggleProvincialProject(proj.id),
        });
        break;
      }
    }
  }

  if (draft.southernPolicy && draft.southernPolicy !== 'LOCAL_VOUCHERS') {
    mapItems.push({
      id: 'southernPolicy',
      section: 'provincial',
      title: `السويداء · ${SOUTHERN_POLICY_NAMES_AR[draft.southernPolicy] ?? draft.southernPolicy}`,
      costText: draft.southernPolicy === 'HISTORIC_ACCORD' ? '-4 رصيد' : draft.southernPolicy === 'BLOCKADE' ? 'حصار' : 'مساعدات',
      costTone: draft.southernPolicy === 'BLOCKADE' ? 'neg' : draft.southernPolicy === 'HISTORIC_ACCORD' ? 'accent' : 'muted',
      cancelLabel: 'إلغاء',
      onJump: () => jumpToProvince('as_suwayda'),
      onCancel: () => draftStore.setField('southernPolicy', 'LOCAL_VOUCHERS'),
    });
  }

  const bySection: Record<ReviewSectionId, ReviewTrayItem[]> = {
    tax: taxItems,
    emergency: debtItems,
    decrees: governanceItems,
    provincial: mapItems,
  };

  return REVIEW_GROUP_ORDER.map((g) => ({
    id: g.id,
    labelAr: g.labelAr,
    items: bySection[g.id],
  })).filter((g) => g.items.length > 0);
}

/**
 * Single source of truth for the count of queued review decisions shown in
 * both the Turn Review Tray title and the End Turn slab.
 */
export function countReviewItems(game: GameState, draft: TurnDirectives): number {
  return buildReviewGroups(game, draft).reduce((total, group) => total + group.items.length, 0);
}

export const reviewItemCount = derived(
  [gameStore, draftStore],
  ([$game, $draft]) => countReviewItems($game, $draft),
);
