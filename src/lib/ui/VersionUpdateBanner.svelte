<script lang="ts">
  import { versionStore } from '../stores/version-store';
  import GameIcon from './GameIcon.svelte';
  import { shellLayout } from './shell/viewport';

  let hasUpdate = $derived($versionStore.hasUpdate);
  let latestVersion = $derived($versionStore.latestVersion);
  let layout = $derived($shellLayout);

  // Concept D toast: centred above the command strip, never under it.
  let positionStyle = $derived(
    layout === 'phone-p'
      ? 'bottom: calc(var(--shell-tab-h) + env(safe-area-inset-bottom) + 86px);'
      : layout === 'phone-l'
        ? 'bottom: 8px;'
        : 'bottom: calc(15px + env(safe-area-inset-bottom) + 92px);'
  );
</script>

{#if hasUpdate}
  <aside
    aria-label="تنبيه تحديث النسخة"
    data-flow-toast="version"
    class="pointer-events-auto fixed inset-x-0 z-[55] mx-auto flex w-max max-w-[calc(100%-24px)] items-center gap-2 border border-amber-400/70 bg-forest-deep/98 px-3 py-2 font-arabic text-wheat-light shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-md shell-round-pop shell-fade-in phone-p:flex-col phone-p:items-stretch phone-p:gap-1.5"
    style={positionStyle}
  >
    <div class="flex items-center gap-2">
      <span class="h-2 w-2 shrink-0 animate-ping bg-amber-400 shell-round-chip" aria-hidden="true"></span>
      <span class="font-heading text-[10.5px] font-bold text-wheat-gold">
        يتوفر تحديث جديد للمحاكاة ({latestVersion || 'نسخة أحدث'})
      </span>
    </div>

    <button
      type="button"
      onclick={() => versionStore.applyUpdate()}
      class="flex min-h-11 items-center justify-center gap-1 border border-amber-400 bg-amber-400 px-3 py-1.5 text-[10.5px] font-bold text-forest-deep shadow transition-all hover:bg-amber-300 active:scale-95 shell-round-item"
    >
      <GameIcon name="cycle" cls="h-3.5 w-3.5 shrink-0" />
      <span>تحديث فوري وإعادة التشغيل</span>
    </button>
  </aside>
{/if}
