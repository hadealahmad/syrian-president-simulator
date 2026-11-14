<script lang="ts">
  import { versionStore } from '../stores/version-store';
  import { fx } from './fx/feedback';
  import GameIcon from './GameIcon.svelte';
  import { shellLayout } from './shell/viewport';
  import './flow/flow-desktop.css';

  let hasUpdate = $derived($versionStore.hasUpdate);
  let latestVersion = $derived($versionStore.latestVersion);
  let layout = $derived($shellLayout);
  let isDesktop = $derived(layout === 'desktop');

  let positionStyle = $derived.by(() => {
    if (isDesktop) {
      return 'bottom: 16px; inset-inline-start: calc(var(--shell-rail-w, 92px) + 12px); inset-inline-end: calc(var(--shell-map-end, 0px) + 12px); max-width: calc(100vw - var(--shell-rail-w, 92px) - var(--shell-map-end, 0px) - 24px);';
    }
    return layout === 'phone-p'
      ? 'bottom: calc(var(--shell-bottom-h, 58px) + 12px); inset-inline: 0;'
      : 'bottom: 12px; inset-inline: 0;';
  });

  function applyUpdate(): void {
    fx('confirm');
    void versionStore.applyUpdate();
  }
</script>

{#if hasUpdate}
  <aside
    aria-label="تنبيه تحديث النسخة"
    data-flow-toast="version"
    class="pointer-events-auto fixed z-[55] mx-auto flex w-max items-center gap-3 border border-[var(--c-accent)] bg-[var(--c-panel)] px-3.5 py-2.5 font-arabic text-[var(--c-text)] shell-toast-in {isDesktop
      ? 'flow-desktop'
      : 'max-w-[calc(100vw-24px)] phone-p:w-[calc(100vw-24px)] phone-p:flex-col phone-p:items-stretch phone-p:gap-2'}"
    style={positionStyle}
  >
    <div class="flex items-center gap-2">
      <span class="h-2 w-2 shrink-0 bg-[var(--c-accent)]" aria-hidden="true"></span>
      <span class="font-heading font-bold text-[var(--c-accent)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}">
        يتوفر تحديث جديد للمحاكاة ({latestVersion || 'نسخة أحدث'})
      </span>
    </div>

    <button
      type="button"
      onclick={applyUpdate}
      class="kit-btn pri min-h-11 md:min-h-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)] {isDesktop ? 'text-[var(--flow-fs-xs)]' : 'text-[12px]'}"
    >
      <GameIcon name="cycle" cls="h-4 w-4 shrink-0" />
      <span>تحديث فوري وإعادة التشغيل</span>
    </button>
  </aside>
{/if}

