<script lang="ts">
  import { uiStore } from '../stores/ui-store';
  import { versionStore } from '../stores/version-store';
  import { theme } from '../stores/theme-store';
  import { THEMES, THEME_IDS, type ThemeId } from '../themes';
  import { startGuideTour } from './guide-tour';
  import GameIcon from './GameIcon.svelte';

  let isLeftOpen = $derived($uiStore.isProvincialDrawerOpen);
  let settingsOpen = $state(false);
  let themesOpen = $state(false);

  function closeSettings(): void {
    settingsOpen = false;
    themesOpen = false;
  }

  function openSettings(): void {
    settingsOpen = true;
    themesOpen = false;
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') closeSettings();
  }

  function startNewGame(): void {
    closeSettings();
    uiStore.setRestartModal(true);
  }

  function updateGame(): void {
    // Same action as the old update button: wipe caches, hard-reload newest build.
    void versionStore.forceHardReload();
  }

  function pickTheme(id: ThemeId): void {
    // Applies instantly; the modal stays open so themes can be previewed.
    theme.setTheme(id);
  }
</script>

<svelte:window onkeydown={onKey} />

<!-- System Controls: guide + settings - top left under the top bar -->
<div
  class="fixed top-[88px] z-30 flex items-center gap-2 transition-all duration-300 ease-in-out select-none font-arabic {isLeftOpen ? 'left-[396px]' : 'left-3'}"
>
  <!-- Presidential Guide Tour (icon only, stays outside the settings menu) -->
  <button
    data-tour="guide-btn"
    onclick={() => startGuideTour()}
    class="h-7 w-7 flex items-center justify-center bg-forest-deep/90 hover:bg-forest-mid text-wheat-mid hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/60 shadow-lg cursor-pointer transition-all active:scale-95 rounded-none"
    title="دليل البروتوكول الرئاسي وإرشادات إدارة الدولة وطريقة اللعب"
    aria-label="دليل البروتوكول الرئاسي"
  >
    <GameIcon name="help" cls="w-4 h-4 shrink-0 text-wheat-gold" />
  </button>

  <!-- Settings -->
  <button
    onclick={openSettings}
    aria-haspopup="dialog"
    aria-expanded={settingsOpen}
    aria-label="الإعدادات"
    title="الإعدادات — لعبة جديدة، تحديث، المظهر"
    class="relative h-7 w-7 flex items-center justify-center bg-forest-deep/90 hover:bg-forest-mid text-wheat-mid hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/60 shadow-lg cursor-pointer transition-all active:scale-95 rounded-none group"
  >
    {#if $versionStore.hasUpdate}
      <span class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
    {/if}
    <GameIcon name="gear" cls="w-4 h-4 shrink-0 text-wheat-dark group-hover:text-wheat-gold transition-colors" />
  </button>
</div>

{#if settingsOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 select-none font-arabic">
    <button
      class="absolute inset-0 bg-black/25 cursor-default"
      onclick={closeSettings}
      aria-label="إغلاق الإعدادات"
    ></button>
    <div
      role="dialog"
      aria-modal="true"
      aria-label="الإعدادات"
      class="relative w-[min(72vw,230px)] bg-forest-deep/95 border border-charcoal-mid shadow-2xl text-wheat-light rounded-none flex flex-col overflow-y-auto"
    >
      {#if !themesOpen}
        <div class="flex flex-col gap-2 p-3">
          <button
            onclick={startNewGame}
            class="h-14 flex items-center justify-start gap-2 px-3 bg-charcoal-surface hover:bg-forest-mid border border-charcoal-mid hover:border-wheat-mid/60 text-right transition-colors cursor-pointer"
          >
            <GameIcon name="power-button" cls="w-4 h-4 shrink-0 text-amber-300" />
            <span class="text-xs font-bold text-wheat-light font-heading">بدء لعبة جديدة</span>
          </button>

          <button
            onclick={updateGame}
            class="h-14 flex items-center justify-start gap-2 px-3 bg-charcoal-surface hover:bg-forest-mid border border-charcoal-mid hover:border-wheat-mid/60 text-right transition-colors cursor-pointer"
          >
            <GameIcon
              name="cycle"
              cls="w-4 h-4 shrink-0 text-wheat-dark {$versionStore.isChecking ? 'animate-spin' : ''}"
            />
            <span class="text-right">
              <span class="flex items-center justify-start gap-1.5 text-xs font-bold text-wheat-light font-heading">
                تحديث اللعبة
                {#if $versionStore.hasUpdate}
                  <span class="px-1.5 py-px bg-amber-400 text-forest-deep text-[9px] font-bold">
                    جديد{$versionStore.latestVersion ? `: ${$versionStore.latestVersion}` : ''}
                  </span>
                {/if}
              </span>
              <span class="block font-mono text-[10px] text-wheat-dark" dir="ltr">{$versionStore.currentVersion}</span>
            </span>
          </button>

          <button
            onclick={() => (themesOpen = true)}
            class="h-14 flex items-center justify-start gap-2 px-3 bg-charcoal-surface hover:bg-forest-mid border border-charcoal-mid hover:border-wheat-mid/60 text-right transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden="true" class="w-4 h-4 shrink-0 text-wheat-dark">
              <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6" />
              <path d="M7 1.5 A5.5 5.5 0 0 1 7 12.5 Z" fill="currentColor" />
            </svg>
            <span class="text-right">
              <span class="block text-xs font-bold text-wheat-light font-heading">المظهر</span>
              <span class="block text-[10px] text-wheat-dark">الحالي: {THEMES[$theme].labelAr}</span>
            </span>
          </button>
        </div>
      {:else}
        <!-- Themes panel (back returns to the main settings menu) -->
        <div class="shrink-0 px-2 py-2 border-b border-charcoal-mid flex items-center gap-2">
          <button
            onclick={() => (themesOpen = false)}
            aria-label="رجوع إلى الإعدادات"
            class="h-6 w-6 flex items-center justify-center text-wheat-dark hover:text-wheat-gold hover:bg-forest-mid transition-colors cursor-pointer"
          >
            <GameIcon name="return-arrow" cls="w-4 h-4 shrink-0" />
          </button>
          <span class="flex-1 text-center text-xs font-bold text-wheat-light font-heading">المظهر</span>
          <span class="w-6 shrink-0" aria-hidden="true"></span>
        </div>

        <div class="flex flex-col gap-2 p-3">
          {#each THEME_IDS as id (id)}
            <button
              role="menuitemradio"
              aria-checked={id === $theme}
              onclick={() => pickTheme(id)}
              class="h-14 flex items-center justify-start gap-2 px-3 border text-right transition-colors cursor-pointer {id ===
              $theme
                ? 'bg-forest-mid border-wheat-mid/60'
                : 'bg-charcoal-surface border-charcoal-mid hover:bg-forest-mid hover:border-wheat-mid/60'}"
            >
              <span class="flex-1 text-right">
                <span
                  class="block text-xs font-bold font-heading {id === $theme ? 'text-wheat-gold' : 'text-wheat-light'}"
                >
                  {THEMES[id].labelAr}
                </span>
                <span class="flex items-center justify-start gap-1" aria-hidden="true">
                  {#each THEMES[id].swatches as hex (hex)}
                    <span
                      class="w-4 h-4 shrink-0 border border-charcoal-light"
                      style="background-color:{hex}"
                      title={hex}
                    ></span>
                  {/each}
                </span>
              </span>
              <span class="w-4 h-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                {#if id === $theme}
                  <GameIcon name="check-mark" cls="w-4 h-4 shrink-0 text-forest-accent" />
                {/if}
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
