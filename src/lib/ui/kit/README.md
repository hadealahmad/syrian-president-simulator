# Operations Console UI Kit (`src/lib/ui/kit/`)

Shared flat, square, hairline-ruled Svelte 5 components matching `concepts/style-a-reference.css`.
All components use CSS tokens (`--c-bg`, `--c-panel`, `--c-strip`, `--c-line`, `--c-line-strong`, `--c-text`, `--c-text-2`, `--c-muted`, `--c-disabled`, `--c-accent`, `--c-pos`, `--c-neg`, `--c-track`, `--c-chip-bg`, `--c-ink`), RTL logical properties, `fx()` feedback, and ≥44px touch targets on phones.

---

## Four Muted / De-emphasised States (Defined Once in `kit.css`)
Every interactive option supports up to four visually distinct muted states without relying on colour alone:
1. **FILTERED-OUT** (`.is-filtered-out` / `.is-dimmed` / `dimmed={true}`): unrelated to the active top-bar stat filter (`selectedStatForOptions`). Rendered full greyscale (`filter: grayscale(1) contrast(0.85); opacity: 0.58`), normal solid hairline border, **no** extra icon, layout unchanged, still clickable/interactive; hover/focus restores full contrast. Related items move to the top of their list/group via `reorder.ts` (`buildFilteredDisplayRows`), separated from unrelated items by `<GroupDivider label="غير مرتبط بهذا المؤشر" count={row.count} />`.
2. **LOCKED / UNUSABLE NOW** (`.is-locked` / `.locked` / `locked={true}`): resource, budget, or condition gate not met. Dashed hairline border (`--c-line-strong`), muted normal-weight title, `<LockIcon />` on the button, 1–2 line reason text, tap gives `fx('error')` feedback.
3. **ALREADY USED / QUEUED / ACTIVE** (`DoneRow` / `.done`): single compact row with `✓`, dashed `--c-line` border, muted `--c-disabled` text, sunk under a counted `GroupDivider` at the bottom (`في الحصيلة هذا الدور · N` / `مفعّل هذا الدور · N`), with `إزالة` button when removable. Supports `dimmed` when a stat filter is active.
4. **NOT YET AVAILABLE** (`.is-not-yet-available` / `notYetAvailable={true}`): turn-gated or prerequisite-over-time gate (e.g. Confiscated Assets before turn 3). Dotted hairline border (`--c-line-strong`), muted normal-weight title, `<HourglassIcon />` line icon (never a padlock), and explicit availability note (`availableNote`, e.g. `"يُفتح في الدور 3"`).

Composite states stack cleanly: e.g. `locked + dimmed` or `notYetAvailable + dimmed` keeps its dashed/dotted border and padlock/hourglass icon while receiving the greyscale filter.

---

## `Lever.svelte`
Any slider number (taxes, wages, printing, auction, CapEx, early repayment).

Props:
- `title: string`
- `value: number`
- `min: number`
- `max: number`
- `step?: number` (default `1`)
- `default?: number` (neutral marker tick on track)
- `display?: string` (overrides formatted value)
- `format?: (value: number) => string`
- `minLabel?: string`
- `maxLabel?: string`
- `disabled?: boolean`
- `locked?: boolean`
- `notYetAvailable?: boolean`
- `ariaLabel?: string`
- `hint?: string`
- `explainerOpen?: boolean`
- `onToggleExplainer?: () => void`
- `highlighted?: boolean` (deprecated no-op; stat filtering reorders instead of accenting)
- `dimmed?: boolean` (applies `.is-filtered-out` greyscale)
- `onchange: (value: number) => void`
- `chips?: Snippet`
- `footer?: Snippet`
- `explainer?: Snippet`
- `class?: string`

```svelte
<Lever
  title="ضريبة أرباح الشركات"
  value={$draftStore.corporateTaxRate}
  min={5}
  max={40}
  step={1}
  default={22}
  display={`${$draftStore.corporateTaxRate}%`}
  onchange={(v) => draftStore.setField('corporateTaxRate', v)}
>
  {#snippet chips()}
    <FxChip text={`+${corporateTaxB.toFixed(2)}B / دور`} tone="good" />
    <FxChip text={`امتثال ${Math.round(complianceRate * 100)}%`} />
  {/snippet}
</Lever>
```

---

## `Stance.svelte`
Pick one of N (food subsidy, wheat procurement, workforce, diesel smuggling, Golan stance, southern policy). Uses neutral light fill (`--c-text` / `--c-ink`) for the selected option.

Exports: `StanceChip`, `StanceOption`.

Props:
- `title: string`
- `value: string | null`
- `options: StanceOption[]` (`{ value, label, chips?, disabled?, title? }`)
- `onchange: (value: string) => void`
- `columns?: number` (defaults to `options.length`)
- `disabled?: boolean`
- `notYetAvailable?: boolean`
- `lockNote?: string`
- `hint?: string`
- `explainerOpen?: boolean`
- `onToggleExplainer?: () => void`
- `highlighted?: boolean` (deprecated no-op)
- `dimmed?: boolean`
- `chips?: Snippet` (optional override; defaults to `activeOption.chips`)
- `footer?: Snippet`
- `explainer?: Snippet`
- `class?: string`

```svelte
<Stance
  title="دعم الخبز والمواد الأساسية"
  value={$draftStore.foodSubsidyLevel}
  options={foodOptions}
  onchange={(v) => draftStore.setField('foodSubsidyLevel', v)}
/>
```

---

## `ActionRow.svelte`
Compact action/toggle row (loans, mortgages, province actions, grants, repayments).

Props:
- `title: string`
- `description?: string`
- `cost?: string`
- `costTone?: 'neg' | 'pos' | 'accent' | 'muted'` (default `'neg'`)
- `buttonLabel: string`
- `buttonVariant?: 'default' | 'sec' | 'danger'` (default `'default'`)
- `active?: boolean`
- `disabled?: boolean`
- `locked?: boolean`
- `lockReason?: string`
- `notYetAvailable?: boolean`
- `availableNote?: string`
- `highlighted?: boolean` (deprecated no-op)
- `dimmed?: boolean`
- `onclick?: () => void`
- `chips?: Snippet`
- `meta?: Snippet`
- `class?: string`

```svelte
<ActionRow
  title="أولوية إزالة الألغام"
  description="إزالة 8% من التلوث في المحافظة"
  cost="-$4M"
  buttonLabel="تفعيل"
  onclick={() => draftStore.setField('deminingPriorityId', gov.id)}
/>
```

---

## `ActionCard.svelte`
Decision card with right/top cost box, effect chips, and bottom/end CTA or dashed lock / dotted future-availability bar (decrees, big loans, oligarch dossiers, strategic projects).

Props:
- `title: string`
- `tag?: string`
- `description?: string`
- `cost?: string`
- `costUnit?: string`
- `costTone?: 'accent' | 'pos' | 'neg' | 'muted'`
- `buttonLabel?: string`
- `buttonVariant?: 'neutral' | 'primary' | 'active' | 'danger'` (default `'neutral'`)
- `disabled?: boolean`
- `locked?: boolean`
- `lockReason?: string`
- `notYetAvailable?: boolean`
- `availableNote?: string`
- `selected?: boolean` (deprecated no-op)
- `highlighted?: boolean` (deprecated no-op)
- `dimmed?: boolean`
- `onclick?: () => void`
- `onCardClick?: () => void`
- `chips?: Snippet`
- `actions?: Snippet` (custom multi-button footer)
- `badge?: Snippet` (replaces CostTag)
- `class?: string`
- `...rest` (forwards `data-*` attributes like `data-decree-id`)

```svelte
<ActionCard
  tag="دوري · الأمن والحدود"
  title={dec.titleAr}
  cost="12"
  costUnit="رصيد"
  buttonLabel="أضف إلى الحصيلة"
  onclick={() => toggleDecree(dec.id)}
>
  {#snippet chips()}
    <FxChip text="فساد -4" tone="good" />
    <FxChip text="+$15M" tone="good" />
  {/snippet}
</ActionCard>
```

---

## `DoneRow.svelte`
Collapsed greyed row for queued / activated / already enacted options, placed at the bottom of a list under `GroupDivider`. Never uses amber or coloured borders.

Props:
- `title: string`
- `cost?: string`
- `statusLabel?: string`
- `removable?: boolean` (default `true` when `onremove` is provided)
- `removeLabel?: string` (default `'إزالة'`)
- `dimmed?: boolean` (applies `.is-filtered-out` greyscale)
- `onremove?: () => void`
- `onclick?: () => void`
- `class?: string`

```svelte
<DoneRow
  title="مرسوم إطلاق هيئة النزاهة"
  cost="15 رصيد"
  onremove={() => toggleDecree('ANTI_CORRUPTION_COMMISSION')}
/>
```

---

## `GroupDivider.svelte`
Ruled divider with optional count or group heading.

Props:
- `label: string`
- `count?: number`
- `tone?: 'muted' | 'accent'` (default `'muted'`)
- `class?: string`

```svelte
<GroupDivider label="في الحصيلة هذا الدور" count={2} />
<GroupDivider label="غير مرتبط بهذا المؤشر" count={4} />
<GroupDivider label="اقتراض" tone="accent" />
```

---

## `SubTabs.svelte`
Full-bleed segmented sub-tab switcher (`#e8ebec` fill for active tab), flush to panel edges with 1px cell separators and 1px bottom hairline.

Exports: `SubTabItem`.

Props:
- `tabs: SubTabItem[]` (`{ id, label, badge?, locked?, notYetAvailable?, hasRelated?, tour?, title? }`)
- `value: string`
- `onchange: (id: string) => void`
- `ariaLabel?: string`
- `class?: string`

```svelte
<SubTabs {tabs} value={activeTab} onchange={(id) => (activeTab = id)} />
```

---

## `FilterStrip.svelte`
Full-bleed ruled filter strip pinned directly below `SubTabs` / `ResultStrip` (used for decree categories and province sort metrics). Horizontally scrollable edge-to-edge when overflowing, with equal-height cells, 1px vertical lines, 1px bottom hairline, and inverted active cell (`--c-text` / `--c-ink`).

Exports: `FilterStripItem`.

Props:
- `items: FilterStripItem[]` (`{ id, label, count?, title? }`)
- `value: string`
- `onchange: (id: string) => void`
- `ariaLabel?: string`
- `flush?: boolean` (default `false`; adds negative inline sheet margins when placed inside padded content)
- `topBorder?: boolean` (default `false`; adds 1px top hairline when not immediately below another hairline strip)
- `class?: string`

```svelte
<FilterStrip items={categoryFilters} value={activeCategory} onchange={(id) => (activeCategory = id)} ariaLabel="تصفية المراسيم" />
```

---

## `HourglassIcon.svelte`
Crisp 24×24 SVG hourglass line icon used exclusively for **NOT YET AVAILABLE** (turn-gated) items and sub-tabs. Never use a padlock for turn-gated items.

Props:
- `cls?: string` (default `'h-3.5 w-3.5 shrink-0'`)

---

## `reorder.ts`
Shared helpers for stat-filter sorting (`buildFilteredDisplayRows`), `AvailabilityTier` (`0 = available | 1 = locked | 2 = notYetAvailable`), `UNRELATED_DIVIDER_KEY`, and `flipDuration()` (`160ms`, `0ms` under `prefers-reduced-motion: reduce`).

---

## `ResultStrip.svelte`
Pinned "X after this turn" ruled strip (or political-capital bar strip when `barPct` is provided).

Props:
- `label: string`
- `value: string`
- `valueTone?: 'default' | 'pos' | 'neg' | 'accent'`
- `delta?: string`
- `deltaTone?: 'pos' | 'neg' | 'muted' | 'accent'`
- `fromValue?: string`
- `barPct?: number`
- `markerPct?: number`
- `trailing?: Snippet`
- `class?: string`

```svelte
<ResultStrip
  label="الخزينة بعد الدور"
  value="-11.96B"
  valueTone="neg"
  delta="-53.96B"
  deltaTone="neg"
/>
```

---

## `StatTile.svelte`
Ruled KPI tile for Reports and summary grids.

Props:
- `label: string`
- `value: string`
- `unit?: string`
- `valueTone?: 'default' | 'pos' | 'neg' | 'accent'`
- `delta?: string`
- `deltaTone?: 'pos' | 'neg' | 'muted'`
- `onclick?: () => void`
- `class?: string`

```svelte
<StatTile label="الاحتياطي الأجنبي" value="$320.0M" delta="+$29.8M" deltaTone="pos" />
```

---

## `Meters.svelte`
Ruled strip of 3 or 4 key figures with optional bottom indicator bar.

Exports: `MeterItem`.

Props:
- `items: MeterItem[]` (`{ label, value, unit?, tone?, barPct?, barTone? }`)
- `columns?: 3 | 4`
- `flush?: boolean` (default `false`; removes side/top outer border and stretches edge-to-edge)
- `class?: string`

```svelte
<Meters
  items={[
    { label: 'الاحتقان', value: '40', barPct: 40 },
    { label: 'الكهرباء', value: '11', unit: 'س', barPct: 46 },
    { label: 'الأضرار', value: '12%', barPct: 12 },
    { label: 'الألغام', value: '5%', barPct: 5 },
  ]}
/>
```

---

## `CostTag.svelte`
Square framed cost tag (`variant="box"`, 46×46) or inline cost (`variant="inline"`).

Props:
- `amount: string`
- `unit?: string`
- `tone?: 'accent' | 'pos' | 'neg' | 'muted'`
- `variant?: 'box' | 'inline'`
- `class?: string`

---

## `FxChip.svelte`
Flat solid-background effect chip with bidi isolation.

Exports: `FxTone`.

Props:
- `text?: string`
- `label?: string`
- `value?: number`
- `tone?: 'good' | 'bad' | 'neutral' | 'warn'`
- `icon?: string`
- `class?: string`

---

## `SectionLink.svelte`
One-line navigation row for options whose second home was removed ("this option now lives in X").

Props:
- `label: string`
- `destination: string`
- `onclick: () => void`
- `tone?: 'default' | 'accent'`
- `class?: string`

```svelte
<SectionLink
  label="صندوق الكرامة والتعويضات"
  destination="الخزينة › الإنفاق"
  onclick={() => locateOption('charityFund')}
/>
```
