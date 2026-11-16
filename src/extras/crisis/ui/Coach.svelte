<script lang="ts">
  import { TUTORIAL_STEPS } from '../engine';
  import { coachStepStore, dismissCoachStep } from '../stores';
  import BdiText from './BdiText.svelte';
  import Glyph from './Glyph.svelte';

  let stepIdx = $derived($coachStepStore);
  let step = $derived(stepIdx !== null ? TUTORIAL_STEPS[stepIdx] ?? null : null);

  const posClass = $derived.by(() => {
    if (!step) return '';
    return 'top-[90px] inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2';
  });
</script>

{#if step}
  <div class="pointer-events-none fixed z-50 {posClass} max-w-[420px]">
    <div
      role="status"
      aria-live="polite"
      class="pointer-events-auto flex items-center justify-between gap-2.5 border border-[var(--c-line-strong)] border-s-4 border-s-[var(--c-accent)] bg-[var(--c-bg)] px-3 py-2"
    >
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <Glyph name={step.glyph} cls="h-4 w-4 shrink-0 text-[var(--c-accent)]" />
        <p class="text-[12px] font-medium leading-[1.45] text-[var(--c-text)] sm:text-[13px]">
          <BdiText text={step.text} />
        </p>
      </div>
      <button
        type="button"
        onclick={dismissCoachStep}
        class="kit-btn pri min-h-[44px] shrink-0 px-3 text-[12px] font-bold"
      >
        فهمت
      </button>
    </div>
  </div>
{/if}
