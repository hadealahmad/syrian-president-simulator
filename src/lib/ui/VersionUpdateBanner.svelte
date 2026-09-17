<script lang="ts">
  import { versionStore } from '../stores/version-store';
  import GameIcon from './GameIcon.svelte';

  let hasUpdate = $derived($versionStore.hasUpdate);
  let latestVersion = $derived($versionStore.latestVersion);
</script>

{#if hasUpdate}
  <aside
    aria-label="تنبيه تحديث النسخة"
    class="pointer-events-auto fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-forest-deep/95 border-2 border-amber-400 text-wheat-light px-4 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.85)] font-arabic backdrop-blur-md transition-all duration-300"
  >
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
      <span class="text-xs font-bold text-wheat-gold font-heading">
        يتوفر تحديث جديد للمحاكاة ({latestVersion || 'نسخة أحدث'})
      </span>
    </div>

    <button
      onclick={() => versionStore.applyUpdate()}
      class="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-forest-deep font-bold text-xs cursor-pointer shadow transition-all active:scale-95 flex items-center gap-1 font-heading"
    >
      <GameIcon name="cycle" cls="w-3.5 h-3.5 shrink-0" />
      <span>تحديث فوري وإفراغ الذاكرة</span>
    </button>
  </aside>
{/if}
