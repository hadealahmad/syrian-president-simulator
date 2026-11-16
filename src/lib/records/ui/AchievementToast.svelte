<script lang="ts">
  import { onDestroy } from 'svelte';
  import GameIcon from '../../ui/GameIcon.svelte';
  import { fx } from '../../ui/fx/feedback';
  import type { AchievementDef, RecordsStore } from '../types';

  interface Props {
    defs: readonly AchievementDef[];
    store: RecordsStore;
    durationMs?: number;
    maxVisible?: number;
  }

  let {
    defs,
    store,
    durationMs = 3500,
    maxVisible = 3,
  }: Props = $props();

  const queueStore = $derived(store.toastQueue);
  const queue = $derived($queueStore);

  const defMap = $derived(new Map(defs.map((d) => [d.id, d])));
  const visibleDefs = $derived(
    queue
      .map((id) => defMap.get(id))
      .filter((d): d is AchievementDef => Boolean(d))
      .slice(0, maxVisible)
  );

  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const announced = new Set<string>();

  $effect(() => {
    const activeIds = new Set(queue);

    // Clear timers for dismissed items
    for (const [id, timer] of timers.entries()) {
      if (!activeIds.has(id)) {
        clearTimeout(timer);
        timers.delete(id);
      }
    }
    for (const id of Array.from(announced)) {
      if (!activeIds.has(id)) announced.delete(id);
    }

    // Play sound and start auto-dismiss timer for newly visible items
    for (const def of visibleDefs) {
      if (!announced.has(def.id)) {
        announced.add(def.id);
        fx('good');
      }
      if (!timers.has(def.id)) {
        const id = def.id;
        const timer = setTimeout(() => {
          timers.delete(id);
          store.dismissToast(id);
        }, durationMs);
        timers.set(id, timer);
      }
    }
  });

  onDestroy(() => {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }
    timers.clear();
  });

  function dismiss(id: string) {
    fx('tap');
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    store.dismissToast(id);
  }
</script>

{#if visibleDefs.length > 0}
  <div
    dir="rtl"
    aria-live="polite"
    class="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[260] flex flex-col items-center gap-2 px-3"
  >
    {#each visibleDefs as def (def.id)}
      <button
        type="button"
        onclick={() => dismiss(def.id)}
        aria-label="إنجاز جديد: {def.title} — اضغط للإغلاق"
        class="ach-toast pressable pointer-events-auto flex min-h-[48px] w-full max-w-[380px] items-center gap-3 border border-[var(--c-accent)] border-s-4 border-s-[var(--c-accent)] bg-[var(--c-panel)] px-3.5 py-2 text-start text-[var(--c-text)]"
      >
        <div class="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--c-accent)] bg-[var(--c-chip-bg)] text-[var(--c-accent)]">
          <GameIcon name={def.glyph} cls="w-5 h-5" />
        </div>
        <div class="min-w-0 flex-1">
          <span class="block font-heading text-[11px] font-bold text-[var(--c-accent)]">
            إنجاز جديد
          </span>
          <span class="block truncate font-heading text-sm font-bold text-[var(--c-text)]">
            {def.title}
          </span>
        </div>
        <GameIcon name="cross-mark" cls="w-3.5 h-3.5 shrink-0 text-[var(--c-muted)]" />
      </button>
    {/each}
  </div>
{/if}

<style>
  @media (prefers-reduced-motion: no-preference) {
    .ach-toast {
      animation: ach-toast-in 180ms cubic-bezier(0.16, 1, 0.3, 1);
    }
  }

  @keyframes ach-toast-in {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
