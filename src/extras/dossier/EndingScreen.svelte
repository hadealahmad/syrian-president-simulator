<script lang="ts">
  import ExtrasBar from '../shared/ExtrasBar.svelte';
  import { sortTopRuns } from '../../lib/records';
  import GameIcon from '../../lib/ui/GameIcon.svelte';
  import { fx } from '../../lib/ui/fx/feedback';
  import { STANDING_DECREES } from './content/decrees';
  import { ENDINGS } from './content/endings';
  import { INITIAL_YEAR } from './engine/engine';
  import {
    METER_IDS,
    type DossierState,
    type EndingDef,
    type MeterId,
    type MeterSnapshot,
  } from './engine/types';
  import { dossierRecords } from './records/store';
  import { METER_META, formatSigned, pad2 } from './ui-helpers';

  let {
    state: game,
    onRestart,
    onOpenRuns,
  }: {
    state: DossierState;
    onRestart: () => void;
    onOpenRuns: () => void;
  } = $props();

  let ending = $derived<EndingDef>(
    (game.endingId && ENDINGS[game.endingId]) || ENDINGS.term_hollow,
  );
  let isCollapse = $derived(ending.kind === 'collapse');

  const runsListStore = dossierRecords.runs;
  let currentRunRank = $derived.by(() => {
    const runId = game.runMeta?.runId;
    if (!runId) return null;
    const idx = sortTopRuns($runsListStore, 10).findIndex((r) => r.id === runId);
    return idx >= 0 ? idx + 1 : null;
  });

  // Plot coordinates in SVG space (LTR time axis left -> right: turn 0 -> final turn)
  const SVG_W = 480;
  const SVG_H = 122;
  const PAD_L = 32;
  const PAD_R = 14;
  const PAD_T = 10;
  const PAD_B = 20;
  const PLOT_W = SVG_W - PAD_L - PAD_R;
  const PLOT_H = SVG_H - PAD_T - PAD_B;

  let series = $derived.by<MeterSnapshot[]>(() => {
    const start: MeterSnapshot = {
      turn: 0,
      year: INITIAL_YEAR,
      treasury: 50,
      trust: 50,
      security: 50,
      sovereignty: 50,
    };
    if (game.history.length === 0) {
      return [start, { turn: game.turn, year: game.year, ...game.meters }];
    }
    return [start, ...game.history];
  });

  function xAt(idx: number, total: number): number {
    return total <= 1 ? PAD_L : PAD_L + (idx / (total - 1)) * PLOT_W;
  }

  function yAt(val: number): number {
    return PAD_T + (1 - Math.max(0, Math.min(100, val)) / 100) * PLOT_H;
  }

  function buildPolyline(id: MeterId, pts: MeterSnapshot[]): string {
    return pts.map((p, i) => `${xAt(i, pts.length).toFixed(1)},${yAt(p[id]).toFixed(1)}`).join(' ');
  }
</script>

<ExtrasBar title="قرارات عاجلة" backHref="../index.html" backLabel="الألعاب" />

<main class="flex min-h-0 flex-1 flex-col overflow-hidden px-2.5 py-2 sm:px-6 sm:py-4">
  <div
    class="mx-auto flex min-h-0 w-full max-w-[580px] flex-1 flex-col overflow-hidden border border-[var(--c-line-strong)] border-t-2 {isCollapse
      ? 'border-t-[var(--c-neg)]'
      : 'border-t-[var(--c-accent)]'} bg-[var(--c-panel)]"
  >
    <div class="dos-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
      <!-- Kicker header band -->
      <header
        class="border-b border-[var(--c-line)] px-3.5 py-2.5 sm:px-6 sm:py-4 {isCollapse
          ? 'bg-[var(--c-ev-bg)]'
          : 'bg-[var(--c-strip)]'}"
      >
        <div class="flex items-center justify-between gap-2">
          <span
            class="inline-flex items-center gap-1.5 text-[12px] font-bold sm:text-[13px] {isCollapse
              ? 'text-[var(--c-neg)]'
              : 'text-[var(--c-accent)]'}"
          >
            <GameIcon name={isCollapse ? 'siren' : 'stone-throne'} cls="h-4 w-4 shrink-0" />
            <span>نهاية الولاية · <bdi dir="ltr" class="num">{game.year}</bdi></span>
          </span>
          <span class="num text-[12px] font-bold text-[var(--c-muted)]">
            الدور <bdi dir="ltr">{pad2(game.turn)}/{game.maxTurns}</bdi>
          </span>
        </div>

        <h1 class="mt-1 font-display text-[22px] font-bold leading-[1.35] text-[var(--c-text)] sm:mt-1.5 sm:text-[28px]">
          {ending.title}
        </h1>
        <div class="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <p class="text-[12.5px] font-bold leading-[1.45] text-[var(--c-muted)] sm:text-[14px]">
            {ending.subtitle}
          </p>
          {#if currentRunRank !== null}
            <span class="inline-flex items-center gap-1.5 border border-[var(--c-accent)] bg-[var(--c-chip-bg)] px-2 py-0.5 font-heading text-xs font-bold text-[var(--c-accent)]">
              <GameIcon name="podium" cls="w-3.5 h-3.5 shrink-0" />
              <span>ولاية رقم <bdi dir="ltr" class="num">{currentRunRank}</bdi> في أفضل ولاياتك</span>
            </span>
          {/if}
        </div>
      </header>

      <div class="flex flex-col gap-2.5 p-3 sm:gap-3.5 sm:p-5">
        {#if game.lastOutcome}
          <div class="flex items-start gap-2 border border-[var(--c-line)] bg-[var(--c-strip)] px-2.5 py-1.5 sm:px-3 sm:py-2">
            <span
              class="mt-0.5 shrink-0 px-1.5 py-0.5 text-[10.5px] font-bold {isCollapse
                ? 'bg-[var(--c-neg)] text-[var(--c-ink)]'
                : 'bg-[var(--c-accent)] text-[var(--c-ink)]'}"
            >
              آخر قرار
            </span>
            <p class="text-[12px] leading-[1.45] text-[var(--c-text-2)] sm:text-[13px]">
              {game.lastOutcome.headline}
            </p>
          </div>
        {/if}

        <p class="text-[13px] leading-[1.6] text-[var(--c-text)] sm:text-[15px] sm:leading-[1.68]">
          {ending.narrative}
        </p>

        <!-- Four final meter tiles -->
        <section aria-label="الموازين الختامية" class="grid grid-cols-4 border border-[var(--c-line)] bg-[var(--c-strip)]">
          {#each METER_IDS as id (id)}
            {@const val = game.meters[id]}
            {@const meta = METER_META[id]}
            <div class="relative flex flex-col justify-between gap-0.5 border-s border-[var(--c-line)] first:border-s-0 px-2.5 py-1.5 sm:px-3 sm:py-2">
              <span class="text-[11px] font-medium text-[var(--c-muted)] sm:text-[12px]">{meta.label}</span>
              <bdi
                dir="ltr"
                class="num pb-0.5 text-[17px] font-bold sm:pb-1 sm:text-[21px] {val <= 0
                  ? 'text-[var(--c-neg)]'
                  : val >= 65
                    ? 'text-[var(--c-pos)]'
                    : 'text-[var(--c-text)]'}"
              >
                {val}
              </bdi>
              <div class="h-[3px] w-full bg-[var(--c-track)]" aria-hidden="true">
                <div
                  class="h-full"
                  style="width: {Math.max(0, Math.min(100, val))}%; background: {val <= 0
                    ? 'var(--c-neg)'
                    : meta.strokeColor};"
                ></div>
              </div>
            </div>
          {/each}
        </section>

        <!-- SVG History Line Chart -->
        <section aria-label="مسار الموازين عبر الولاية" class="border border-[var(--c-line)] bg-[var(--c-strip)] p-2 sm:p-3">
          <div class="mb-1 flex items-center justify-between text-[11.5px] sm:mb-1.5 sm:text-[12px]">
            <span class="font-bold text-[var(--c-text-2)]">مسار الموازين عبر الأدوار</span>
            <span class="num text-[11px] text-[var(--c-muted)]"><bdi dir="ltr">0 → {game.turn}</bdi></span>
          </div>

          <svg
            viewBox="0 0 {SVG_W} {SVG_H}"
            style="direction: ltr;"
            role="img"
            aria-label="مخطط خطي لموازين الدولة الأربعة خلال الولاية"
            class="block h-auto w-full select-none"
          >
            {#each [100, 50, 0] as tick (tick)}
              {@const y = yAt(tick)}
              <line x1={PAD_L} y1={y} x2={SVG_W - PAD_R} y2={y} stroke="var(--c-line)" stroke-width="1" stroke-dasharray={tick === 50 ? '3 3' : undefined} />
              <text x={PAD_L - 6} y={y + 3.5} text-anchor="end" fill="var(--c-muted)" font-size="10" font-weight="700">{tick}</text>
            {/each}

            <text x={PAD_L} y={SVG_H - 5} text-anchor="start" fill="var(--c-muted)" font-size="10">0</text>
            <text x={SVG_W - PAD_R} y={SVG_H - 5} text-anchor="end" fill="var(--c-muted)" font-size="10">{game.turn}</text>

            {#each METER_IDS as id, idx (id)}
              {@const meta = METER_META[id]}
              {@const lastPt = series[series.length - 1]}
              {@const endX = xAt(series.length - 1, series.length)}
              {@const endY = yAt(lastPt[id])}
              <polyline
                fill="none"
                stroke={meta.strokeColor}
                stroke-width="2.2"
                stroke-dasharray={meta.dashArray === 'none' ? undefined : meta.dashArray}
                points={buildPolyline(id, series)}
              />
              {#if idx === 0}
                <circle cx={endX} cy={endY} r="3.5" fill={meta.strokeColor} />
              {:else if idx === 1}
                <rect x={endX - 3.2} y={endY - 3.2} width="6.4" height="6.4" fill={meta.strokeColor} />
              {:else if idx === 2}
                <polygon points="{endX},{endY - 4.2} {endX + 4.2},{endY} {endX},{endY + 4.2} {endX - 4.2},{endY}" fill={meta.strokeColor} />
              {:else}
                <polygon points="{endX},{endY - 4.2} {endX + 4},{endY + 3.4} {endX - 4},{endY + 3.4}" fill={meta.strokeColor} />
              {/if}
            {/each}
          </svg>

          <div class="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-[var(--c-line)] pt-1.5 sm:grid-cols-4">
            {#each METER_IDS as id (id)}
              {@const meta = METER_META[id]}
              <div class="flex items-center justify-between gap-1.5 text-[11px]">
                <span class="inline-flex items-center gap-1.5 text-[var(--c-text-2)]">
                  <svg width="18" height="8" viewBox="0 0 18 8" aria-hidden="true">
                    <line x1="0" y1="4" x2="18" y2="4" stroke={meta.strokeColor} stroke-width="2.4" stroke-dasharray={meta.dashArray === 'none' ? undefined : meta.dashArray} />
                  </svg>
                  <span>{meta.label}</span>
                </span>
                <bdi dir="ltr" class="num font-bold text-[var(--c-text)]">{game.meters[id]}</bdi>
              </div>
            {/each}
          </div>
        </section>

        <!-- Standing decrees in force -->
        <section aria-label="المراسيم النافذة" class="border border-[var(--c-line)] bg-[var(--c-strip)] px-3 py-2">
          <div class="text-[11.5px] font-bold text-[var(--c-text-2)] sm:text-[12px]">المراسيم النافذة عند الختام</div>
          {#if game.decrees.length > 0}
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              {#each game.decrees as decId (decId)}
                {@const dec = STANDING_DECREES[decId]}
                {#if dec}
                  <span class="inline-flex items-center gap-1.5 border border-[var(--c-line)] bg-[var(--c-panel)] px-2 py-0.5 text-[11px] font-bold text-[var(--c-text)]">
                    <span>{dec.name}</span>
                    {#each METER_IDS as mId (mId)}
                      {@const dVal = dec.drift[mId] ?? 0}
                      {#if dVal !== 0}
                        <span class="inline-flex items-center gap-0.5 text-[10.5px] {dVal > 0 ? 'text-[var(--c-pos)]' : 'text-[var(--c-neg)]'}">
                          <span>{METER_META[mId].label}</span>
                          <bdi dir="ltr" class="num">{formatSigned(dVal)}</bdi>
                        </span>
                      {/if}
                    {/each}
                  </span>
                {/if}
              {/each}
            </div>
          {:else}
            <p class="mt-0.5 text-[11.5px] text-[var(--c-muted)]">لم يبقَ أي مرسوم استثنائي نافذًا.</p>
          {/if}
        </section>
      </div>
    </div>

    <!-- Pinned footer actions -->
    <footer class="grid shrink-0 grid-cols-2 gap-2 border-t border-[var(--c-line)] bg-[var(--c-strip)] p-2.5 sm:grid-cols-[1.35fr_1fr_0.85fr] sm:px-5 sm:py-3">
      <button
        type="button"
        onclick={onRestart}
        class="btn-primary-chamfer pressable col-span-2 min-h-[48px] w-full px-4 font-heading text-[15px] font-bold sm:col-span-1 sm:text-[16px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)]"
      >
        ابدأ ولاية جديدة
      </button>

      <button
        type="button"
        onclick={() => {
          fx('tap');
          onOpenRuns();
        }}
        class="kit-btn sec pressable flex min-h-[46px] w-full items-center justify-center gap-2 bg-[var(--c-panel)] px-3 text-[13.5px] font-bold sm:min-h-[48px] sm:text-[14.5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
      >
        <GameIcon name="podium" cls="h-4 w-4 shrink-0 text-[var(--c-accent)]" />
        <span>سجل الولايات</span>
      </button>

      <a
        href="../index.html"
        class="kit-btn sec pressable flex min-h-[46px] w-full items-center justify-center bg-[var(--c-panel)] px-3 text-[13.5px] font-bold no-underline sm:min-h-[48px] sm:text-[14.5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
      >
        الألعاب
      </a>
    </footer>
  </div>
</main>

