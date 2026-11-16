<script lang="ts">
  import GameIcon from '../../ui/GameIcon.svelte';
  import { formatRunTimelineParts } from '../format';
  import type { RunRecord } from '../types';

  interface Props {
    runs: readonly RunRecord[];
  }

  let { runs }: Props = $props();

  function segmentBdi(text: string): { text: string; ltr: boolean }[] {
    const regex = /([0-9][0-9.,:%/$−+-]*)/g;
    const out: { text: string; ltr: boolean }[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) out.push({ text: text.slice(last, m.index), ltr: false });
      out.push({ text: m[0], ltr: true });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last), ltr: false });
    return out;
  }
</script>

{#if runs.length === 0}
  <div class="flex flex-col items-center justify-center gap-2 border border-[var(--c-line)] bg-[var(--c-panel)] px-4 py-12 text-center">
    <GameIcon name="podium" cls="w-7 h-7 text-[var(--c-muted)]" />
    <p class="font-heading text-sm text-[var(--c-muted)]">
      لا توجد جولات مسجلة بعد، أكمل جولة لتظهر في قائمة الصدارة
    </p>
  </div>
{:else}
  <ol class="space-y-2.5">
    {#each runs as run, idx (run.id)}
      {@const tl = formatRunTimelineParts(run.startedAt, run.endedAt)}
      {@const isComplete = run.outcome === 'complete'}
      <li
        class="border border-[var(--c-line)] border-s-4 bg-[var(--c-panel)] p-3.5 sm:p-4 {isComplete
          ? 'border-s-[var(--c-pos)]'
          : 'border-s-[var(--c-neg)]'}"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex min-w-0 flex-1 items-start gap-3">
            <div class="num flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--c-line-strong)] bg-[var(--c-strip)] font-heading text-sm font-bold text-[var(--c-accent)]">
              <bdi dir="ltr">#{idx + 1}</bdi>
            </div>
            <div class="min-w-0 flex-1 space-y-1.5">
              <h3 class="font-heading text-sm font-bold leading-snug text-[var(--c-text)] sm:text-base">
                {run.resultTitle}
              </h3>
              <span
                class="inline-flex items-center gap-1 border px-1.5 py-0.5 text-[11px] font-bold {isComplete
                  ? 'border-[var(--c-pos)] bg-[var(--c-chip-bg)] text-[var(--c-pos)]'
                  : 'border-[var(--c-neg)] bg-[var(--c-chip-bg)] text-[var(--c-neg)]'}"
              >
                <GameIcon name={isComplete ? 'check-mark' : 'siren'} cls="w-3 h-3 shrink-0" />
                <span>{isComplete ? 'اكتملت الولاية' : 'انهيار'}</span>
              </span>
            </div>
          </div>

          <div class="ms-auto flex shrink-0 items-center gap-3 border border-[var(--c-line)] bg-[var(--c-strip)] px-3 py-1.5">
            <div class="text-center">
              <span class="block text-[10px] text-[var(--c-muted)]">الأدوار</span>
              <span class="num font-heading text-sm font-bold text-[var(--c-text)]">
                <bdi dir="ltr">{run.turns}/{run.maxTurns}</bdi>
              </span>
            </div>
            <div class="h-6 w-px bg-[var(--c-line)]" aria-hidden="true"></div>
            <div class="text-center">
              <span class="block text-[10px] text-[var(--c-muted)]">النقاط</span>
              <span class="num font-heading text-lg font-bold text-[var(--c-accent)]">
                <bdi dir="ltr">{Math.round(run.score)}</bdi>
              </span>
            </div>
          </div>
        </div>

        <p class="mt-2.5 border-t border-[var(--c-line)] pt-2 text-xs leading-relaxed text-[var(--c-muted)]">
          بدأت
          <bdi dir="ltr" class="num">{tl.startDate.day}</bdi>
          {tl.startDate.month}
          <bdi dir="ltr" class="num">{tl.startDate.year}</bdi>
          ·
          <bdi dir="ltr" class="num">{tl.startTime}</bdi>
          — انتهت{#if !tl.sameDay}&nbsp;<bdi dir="ltr" class="num">{tl.endDate.day}</bdi>
            {tl.endDate.month}
            <bdi dir="ltr" class="num">{tl.endDate.year}</bdi>
            ·{/if}&nbsp;<bdi dir="ltr" class="num">{tl.endTime}</bdi>
          ({#each segmentBdi(tl.duration) as seg, i (i)}{#if seg.ltr}<bdi dir="ltr" class="num">{seg.text}</bdi>{:else}{seg.text}{/if}{/each})
        </p>
      </li>
    {/each}
  </ol>
{/if}
