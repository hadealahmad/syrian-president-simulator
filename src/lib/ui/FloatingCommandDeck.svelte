<script lang="ts">
  import { uiStore } from '../stores/ui-store';
  import { versionStore } from '../stores/version-store';
  import { theme } from '../stores/theme-store';
  import { THEMES, THEME_IDS, type ThemeId } from '../themes';
  import { startGuideTour } from './guide-tour';
  import GameIcon from './GameIcon.svelte';

  let isLeftOpen = $derived($uiStore.isProvincialDrawerOpen);
  let themesOpen = $state(false);

  function closeSettings(): void {
    uiStore.setSettingsOpen(false);
    themesOpen = false;
  }

  function openSettings(): void {
    uiStore.setSettingsOpen(true);
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
    class="h-7 w-7 flex items-center justify-center bg-forest-deep/90 hover:bg-forest-mid text-wheat-mid hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/60 shadow-lg cursor-pointer gloss-hover transition-all active:scale-95 rounded-none"
    title="دليل البروتوكول الرئاسي وإرشادات إدارة الدولة وطريقة اللعب"
    aria-label="دليل البروتوكول الرئاسي"
  >
    <GameIcon name="help" cls="w-4 h-4 shrink-0 text-wheat-gold" />
  </button>

  <!-- Settings -->
  <button
    onclick={openSettings}
    aria-haspopup="dialog"
    aria-expanded={$uiStore.isSettingsOpen}
    aria-label="الإعدادات"
    title="الإعدادات — لعبة جديدة، تحديث، المظهر"
    class="relative h-7 w-7 flex items-center justify-center bg-forest-deep/90 hover:bg-forest-mid text-wheat-mid hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/60 shadow-lg cursor-pointer gloss-hover transition-all active:scale-95 rounded-none group"
  >
    {#if $versionStore.hasUpdate}
      <span class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
    {/if}
    <GameIcon name="gear" cls="w-4 h-4 shrink-0 text-wheat-dark group-hover:text-wheat-gold transition-colors" />
  </button>

  <!-- Migration arrows overlay toggle -->
  <button
    onclick={() => uiStore.setMigrationArrows(!$uiStore.showMigrationArrows)}
    aria-pressed={$uiStore.showMigrationArrows}
    aria-label="تبديل أسهم النزوح"
    title="تبديل أسهم النزوح"
    class="h-7 w-7 flex items-center justify-center bg-forest-deep/90 hover:bg-forest-mid border hover:border-wheat-mid/60 shadow-lg cursor-pointer gloss-hover transition-all active:scale-95 rounded-none {$uiStore.showMigrationArrows ? 'border-wheat-mid/60 text-wheat-gold' : 'border-charcoal-mid text-wheat-dark hover:text-wheat-gold'}"
  >
    <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden="true" class="w-4 h-4 shrink-0">
      <circle cx="4.5" cy="4" r="2.3" fill="currentColor" />
      <path d="M0.8 13.4c0-3.1 1.7-5 3.7-5s3.7 1.9 3.7 5" fill="currentColor" />
      <path d="M7.8 9.6 L12.4 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      <path d="M9.7 5 H12.4 V7.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>

  <!-- CRT tube glass toggle (map canvas only; off = raw map, cheaper on weak GPUs) -->
  <button
    onclick={() => uiStore.setCrtTube(!$uiStore.crtTube)}
    aria-pressed={$uiStore.crtTube}
    aria-label="تبديل تأثير الشاشة"
    title="تبديل تأثير شاشة CRT"
    class="h-7 w-7 flex items-center justify-center bg-forest-deep/90 hover:bg-forest-mid border hover:border-wheat-mid/60 shadow-lg cursor-pointer gloss-hover transition-all active:scale-95 rounded-none {$uiStore.crtTube ? 'border-wheat-mid/60 text-wheat-gold' : 'border-charcoal-mid text-wheat-dark hover:text-wheat-gold'}"
  >
    <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden="true" class="w-4 h-4 shrink-0">
      <rect x="1" y="2.5" width="12" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.4" />
      <path d="M5 12.5h4M7 10.5v2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
    </svg>
  </button>
</div>

{#if $uiStore.isSettingsOpen}
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
      class="relative w-[min(80vw,280px)] min-w-[200px] min-h-[280px] aspect-[3/4] bg-forest-deep/95 modal-frame-stripes modal-frame-gold shadow-2xl text-wheat-light rounded-none flex flex-col scroll-area overflow-y-auto modal-card"
    >
      {#if !themesOpen}
        <!-- Menu title -->
        <div class="shrink-0 px-6 pt-6">
          <div class="flex items-center gap-2 pb-3 border-b border-charcoal-mid">
            <GameIcon name="gear" cls="w-5 h-5 shrink-0 text-wheat-gold" />
            <span class="text-base font-bold text-wheat-light font-heading">الإعدادات</span>
          </div>
        </div>
        <div class="flex flex-col gap-1.5 px-6 pb-6 pt-5">
          <button
            onclick={startNewGame}
            class="h-14 flex items-center justify-center gap-2 px-3 bg-charcoal-surface hover:bg-forest-mid border border-charcoal-mid hover:border-wheat-mid/60 text-center transition-colors cursor-pointer gloss-hover"
          >
            <span class="text-xs font-bold text-wheat-light font-heading">بدء لعبة جديدة</span>
          </button>

          <button
            onclick={() => (themesOpen = true)}
            class="h-14 flex items-center justify-center gap-2 px-3 bg-charcoal-surface hover:bg-forest-mid border border-charcoal-mid hover:border-wheat-mid/60 text-center transition-colors cursor-pointer gloss-hover"
          >
            <span class="text-center">
              <span class="block text-xs font-bold text-wheat-light font-heading">المظهر</span>
              <span class="block text-[10px] text-wheat-dark">الحالي: {THEMES[$theme].labelAr}</span>
            </span>
          </button>

          <a
            href="https://www.youtube.com/channel/UCQkqyo2DYRee_1qlHZ1M6Dg/join"
            target="_blank"
            rel="noreferrer"
            class="h-12 flex items-center justify-center gap-2 px-3 bg-charcoal-surface hover:bg-forest-mid border border-charcoal-mid hover:border-wheat-mid/60 text-center transition-colors cursor-pointer gloss-hover"
          >
            <GameIcon name="brand-youtube" cls="w-4 h-4 shrink-0 text-umber-crimson" />
            <span class="text-xs font-bold text-wheat-light font-heading">ادعمني مالياً</span>
          </a>

          <button
            onclick={updateGame}
            aria-label="تحديث اللعبة — فرض إعادة التحميل"
            title="تحديث اللعبة — فرض إعادة التحميل"
            class="mt-1 w-full cursor-pointer text-center font-mono text-[10px] transition-colors {$versionStore.isChecking ? 'animate-pulse text-wheat-gold' : 'text-wheat-dark hover:text-wheat-gold'}"
          >
            <span dir="ltr">{$versionStore.currentVersion}</span>
            {#if $versionStore.hasUpdate}
              <span class="px-1.5 py-px bg-amber-400 text-forest-deep text-[9px] font-bold">
                جديد{$versionStore.latestVersion ? `: ${$versionStore.latestVersion}` : ''}
              </span>
            {/if}
          </button>

          <div class="flex items-center justify-center gap-2">
            <a
              href="https://github.com/hadealahmad"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub: hadealahmad"
              class="h-9 w-9 flex items-center justify-center bg-charcoal-surface hover:bg-forest-mid border border-charcoal-mid hover:border-wheat-mid/60 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer gloss-hover"
            >
              <GameIcon name="brand-github" cls="w-4 h-4 shrink-0" />
            </a>
            <a
              href="https://x.com/hadealahmad"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter: @hadealahmad"
              class="h-9 w-9 flex items-center justify-center bg-charcoal-surface hover:bg-forest-mid border border-charcoal-mid hover:border-wheat-mid/60 text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer gloss-hover"
            >
              <GameIcon name="brand-x" cls="w-4 h-4 shrink-0" />
            </a>
          </div>
        </div>
      {:else}
        <!-- Themes panel (back returns to the main settings menu) -->
        <div class="shrink-0 px-6 pt-6">
          <div class="flex items-center gap-2 pb-3 border-b border-charcoal-mid">
            <button
              onclick={() => (themesOpen = false)}
              aria-label="رجوع إلى الإعدادات"
              class="h-6 w-6 flex items-center justify-center text-wheat-dark hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/60 gloss-hover transition-colors cursor-pointer"
            >
              <GameIcon name="arrow-right" cls="w-4 h-4 shrink-0" />
            </button>
            <span class="text-base font-bold text-wheat-light font-heading">المظهر</span>
          </div>
        </div>

        <div class="flex flex-col gap-1.5 px-6 pt-5 pb-6">
          {#each THEME_IDS as id (id)}
            <button
              role="menuitemradio"
              aria-checked={id === $theme}
              onclick={() => pickTheme(id)}
              class="h-14 flex items-center justify-center gap-2 px-3 border text-center transition-colors cursor-pointer gloss-hover {id ===
              $theme
                ? 'bg-forest-mid border-wheat-mid/60'
                : 'bg-charcoal-surface border-charcoal-mid hover:bg-forest-mid hover:border-wheat-mid/60'}"
            >
              <span class="text-center">
                <span
                  class="block text-xs font-bold font-heading {id === $theme ? 'text-wheat-gold' : 'text-wheat-light'}"
                >
                  {THEMES[id].labelAr}
                </span>
                <span class="mt-1.5 flex items-center justify-center gap-1" aria-hidden="true">
                  {#each THEMES[id].swatches as hex (hex)}
                    <span
                      class="w-4 h-4 shrink-0 border border-charcoal-light"
                      style="background-color:{hex}"
                      title={hex}
                    ></span>
                  {/each}
                </span>
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
