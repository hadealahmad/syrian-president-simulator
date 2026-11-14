<script lang="ts">
  import { cubicInOut } from 'svelte/easing';
  import { onMount } from 'svelte';
  import { gameStore } from '../stores/game-store';
  import { uiStore } from '../stores/ui-store';
  import { startNewGame as startNewGameSession } from '../stores/new-game';
  import { versionStore } from '../stores/version-store';
  import { theme } from '../stores/theme-store';
  import { pwaStore } from '../stores/pwa-store';
  import { THEMES, THEME_IDS, type ThemeId } from '../themes';
  import { startGuideTour, hasSeenTour, tourActive } from './guide-tour';
  import { focusTrap } from './actions/focus-trap';
  import GameIcon from './GameIcon.svelte';
  import GroupDivider from './kit/GroupDivider.svelte';
  import SettingsToggle from './flow/SettingsToggle.svelte';
  import KbdHint from './flow/KbdHint.svelte';
  import { hasModifierKey, isTypingTarget } from './flow/kbd';
  import './flow/flow-desktop.css';
  import { shellLayout } from './shell/viewport';
  import { PROJECT_LINKS } from '../project-links';
  import { SYRIA_2D_GOVERNORATES } from '../spatial3d/syria-2d-paths';
  import { fx, fxSettings } from './fx/feedback';
  import { clearSettingsEntrySource, settingsOpenedInGame } from './flow/settings-menu';
  import { formatBillionSYP } from './flow/review-items';

  /**
   * Full-screen Operations Console title & settings curtain.
   * No floating in-game system buttons exist over the map: the top-bar
   * gear opens this menu.
   *
   * The first child stays an empty, hidden element on purpose: the shell's
   * `.shell-deck-host > div:first-child` rule must not reach the curtain.
   */
  let layout = $derived($shellLayout);
  let isDesktop = $derived(layout === 'desktop');

  let menuView = $state<'main' | 'settings' | 'themes' | 'restart'>('main');
  let iosInstallHintOpen = $state(false);
  let canInstallApp = $derived(!$pwaStore.isInstalled && ($pwaStore.canInstall || $pwaStore.isIos));
  let hasSave = $derived($uiStore.hasStartedGame);
  let openedFromGear = $derived($settingsOpenedInGame);

  let saveTurnText = $derived(String($gameStore.turnNumber).padStart(2, '0'));
  let saveSeasonText = $derived($gameStore.season === 'H1_HARVEST' ? 'الحصاد' : 'الشتاء');
  let saveTreasuryText = $derived(`${formatBillionSYP($gameStore.macro.treasurySYP)}B`);
  let saveTrustText = $derived(`${Math.round($gameStore.macro.civicTrust)}%`);

  function themePreviewSwatches(id: ThemeId): string[] {
    const s = THEMES[id].swatches;
    return [s[0], s[2], s[3], s[4]].filter(Boolean);
  }

  function curtainSlide(_node: Element, { duration = 150 }: { duration?: number } = {}) {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return { duration: 0, css: () => '' };
    }
    return {
      duration,
      easing: cubicInOut,
      css: (t: number) => `opacity: ${t}; transform: translateY(${(1 - t) * 16}px);`,
    };
  }

  let wasSettingsOpen = false;
  $effect(() => {
    if ($uiStore.isSettingsOpen && !wasSettingsOpen) {
      menuView = 'main';
      iosInstallHintOpen = false;
      uiStore.setRestartModal(false);
    }
    wasSettingsOpen = $uiStore.isSettingsOpen;
  });

  function closeSettings(playFx = true): void {
    if (playFx) fx('cancel');
    menuView = 'main';
    iosInstallHintOpen = false;
    clearSettingsEntrySource();
    uiStore.setRestartModal(false);
    uiStore.markGameStarted();
  }

  function handleSettingsBack(): void {
    if (openedFromGear) {
      closeSettings(true);
      return;
    }
    fx('tap');
    menuView = 'main';
  }

  function continueGame(): void {
    fx('confirm');
    closeSettings(false);
  }

  function handleCurtainKeydown(e: KeyboardEvent): void {
    if (!$uiStore.isSettingsOpen) return;
    if (e.key !== 'Tab') {
      e.stopPropagation();
    }
    if (hasModifierKey(e) || isTypingTarget(e.target)) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      if ((menuView === 'settings' || menuView === 'themes') && openedFromGear) {
        closeSettings(true);
      } else if (menuView !== 'main') {
        fx('cancel');
        menuView = 'main';
      } else if ($uiStore.hasStartedGame) {
        closeSettings(true);
      }
    }
  }

  onMount(() => {
    const onCaptureKey = (e: KeyboardEvent): void => {
      if (!$uiStore.isSettingsOpen) return;
      if ($uiStore.isAboutOpen || $uiStore.isRestartModalOpen || $tourActive) return;
      if (e.key === 'Escape') {
        handleCurtainKeydown(e);
      } else if (e.key !== 'Tab') {
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', onCaptureKey, true);
    return () => window.removeEventListener('keydown', onCaptureKey, true);
  });

  function startTourFromMenu(): void {
    fx('tap');
    closeSettings(false);
    startGuideTour();
  }

  function confirmNewGame(): void {
    fx('confirm');
    startNewGameSession();
    closeSettings(false);
    if (!hasSeenTour()) {
      setTimeout(() => {
        if (!$uiStore.isSettingsOpen) startGuideTour();
      }, 540);
    }
  }

  function startNewGame(): void {
    if (!$uiStore.hasStartedGame) {
      confirmNewGame();
      return;
    }
    fx('tap');
    iosInstallHintOpen = false;
    menuView = 'restart';
  }

  function openAbout(): void {
    fx('tap');
    if ($uiStore.hasStartedGame) {
      closeSettings(false);
    }
    uiStore.setAboutOpen(true);
  }

  function updateGame(): void {
    fx('tap');
    void versionStore.applyUpdate();
  }

  function pickTheme(id: ThemeId): void {
    fx('select');
    theme.setTheme(id);
  }

  function toggleSound(next: boolean): void {
    fxSettings.update((s) => ({ ...s, sound: next }));
    fx('select');
  }

  function toggleHaptics(next: boolean): void {
    fxSettings.update((s) => ({ ...s, haptics: next }));
    fx('select');
  }

  function toggleMigration(next: boolean): void {
    fx('select');
    uiStore.setMigrationArrows(next);
  }

  function toggleCrt(next: boolean): void {
    fx('select');
    uiStore.setCrtTube(next);
  }

  async function installApp(): Promise<void> {
    fx('tap');
    if ($pwaStore.canInstall) {
      await pwaStore.promptInstall();
      return;
    }
    iosInstallHintOpen = !iosInstallHintOpen;
  }
</script>

<!-- Hidden placeholder: keeps the legacy deck CSS selectors away from the curtain. -->
<div class="hidden" aria-hidden="true"></div>

{#if $uiStore.isSettingsOpen}
  <div
    transition:curtainSlide={{ duration: 150 }}
    use:focusTrap
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-label="الإعدادات"
    dir="rtl"
    onkeydown={handleCurtainKeydown}
    class="pointer-events-auto fixed inset-0 z-[150] flex overflow-clip bg-[var(--c-bg)] text-[var(--c-text)] select-none font-arabic {isDesktop
      ? 'flow-desktop flex-row'
      : 'flex-col'}"
    style="visibility: visible;"
  >
    {#if isDesktop}
      <!-- Desktop Start-side composed column (clamp(380px, 26vw, 520px)) -->
      <div
        class="relative z-10 flex h-full w-[var(--flow-title-col-w)] shrink-0 flex-col justify-between overflow-hidden border-e border-[var(--c-line-strong)] border-t-2 {menuView === 'restart'
          ? 'border-t-[var(--c-neg)]'
          : 'border-t-[var(--c-accent)]'} bg-[var(--c-bg)] px-[clamp(22px,2.2vw,40px)] py-[clamp(18px,2.2vh,36px)]"
      >
        {#if menuView === 'main'}
          <div class="my-auto flex min-h-0 flex-col justify-center py-2">
            <header class="flex flex-col gap-2 text-start">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <span class="block text-[var(--flow-fs-sm)] font-bold leading-[1.4] text-[var(--c-accent)]">
                    محاكي إدارة المرحلة الانتقالية
                  </span>
                  <h1
                    class="mt-1 font-display font-bold leading-[1.22] text-[var(--c-text)]"
                    style="font-size: var(--flow-title-h1);"
                  >
                    رئيس الجمهورية
                  </h1>
                </div>
                {#if $uiStore.hasStartedGame}
                  <button
                    type="button"
                    onclick={() => closeSettings(true)}
                    aria-label="إغلاق القائمة"
                    title="إغلاق القائمة (Esc)"
                    class="pressable flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-text-2)] hover:border-[var(--c-text)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                  >
                    <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
                  </button>
                {/if}
              </div>

              {#if hasSave}
                <div
                  class="mt-2 grid grid-cols-[0.82fr_1.28fr_1.1fr_0.8fr] divide-x divide-x-reverse divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-strip)]"
                  aria-label="ملخص الحفظ الحالي"
                >
                  <div class="flex min-w-0 flex-col items-start px-2.5 py-2">
                    <span class="block text-[var(--flow-fs-xs)] leading-tight text-[var(--c-muted)]">الدور</span>
                    <b class="num mt-0.5 block w-full whitespace-nowrap text-right text-[var(--flow-fs-base)] font-bold leading-snug text-[var(--c-accent)]" dir="ltr">{saveTurnText}/40</b>
                  </div>
                  <div class="flex min-w-0 flex-col items-start px-2.5 py-2">
                    <span class="block text-[var(--flow-fs-xs)] leading-tight text-[var(--c-muted)]">الفصل</span>
                    <b class="mt-0.5 block w-full whitespace-nowrap text-start text-[var(--flow-fs-sm)] font-bold leading-snug text-[var(--c-text)]">{saveSeasonText} <span class="num">{$gameStore.calendarYear}</span></b>
                  </div>
                  <div class="flex min-w-0 flex-col items-start px-2.5 py-2">
                    <span class="block text-[var(--flow-fs-xs)] leading-tight text-[var(--c-muted)]">الخزينة</span>
                    <b class="num mt-0.5 block w-full whitespace-nowrap text-right text-[var(--flow-fs-base)] font-bold leading-snug {$gameStore.macro.treasurySYP < 0 ? 'text-[var(--c-neg)]' : 'text-[var(--c-text)]'}" dir="ltr">{saveTreasuryText}</b>
                  </div>
                  <div class="flex min-w-0 flex-col items-start px-2.5 py-2">
                    <span class="block text-[var(--flow-fs-xs)] leading-tight text-[var(--c-muted)]">الثقة</span>
                    <b class="num mt-0.5 block w-full whitespace-nowrap text-right text-[var(--flow-fs-base)] font-bold leading-snug text-[var(--c-text)]" dir="ltr">{saveTrustText}</b>
                  </div>
                </div>
              {:else}
                <p class="mt-1 text-[var(--flow-fs-base)] leading-[1.5] text-[var(--c-muted)]">
                  أربعون دوراً نصف سنوي · الجمهورية السورية
                </p>
              {/if}
            </header>

            <nav class="mt-6 flex w-full flex-col gap-2.5" aria-label="القائمة الرئيسية">
              {#if hasSave}
                <button
                  type="button"
                  onclick={continueGame}
                  data-autofocus
                  style="min-height: var(--flow-title-cta-h);"
                  class="btn-primary-chamfer pressable flex w-full items-center justify-between gap-3 px-5 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)]"
                >
                  <span class="font-heading text-[var(--flow-fs-lg)] font-bold">متابعة</span>
                  <span class="flex items-center gap-2">
                    <span class="num text-[var(--flow-fs-sm)] font-bold">الدور <bdi dir="ltr">{saveTurnText}</bdi> · {saveSeasonText}</span>
                    <KbdHint keys="Enter" tone="accent" />
                  </span>
                </button>

                <button
                  type="button"
                  onclick={startNewGame}
                  style="min-height: var(--flow-btn-pri-h);"
                  class="kit-btn sec w-full bg-[var(--c-panel)] px-4 text-[var(--flow-fs-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                >
                  لعبة جديدة
                </button>
              {:else}
                <button
                  type="button"
                  onclick={startNewGame}
                  data-autofocus
                  style="min-height: var(--flow-title-cta-h);"
                  class="btn-primary-chamfer pressable flex w-full items-center justify-between gap-3 px-5 font-heading text-[var(--flow-fs-lg)] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)]"
                >
                  <span>لعبة جديدة</span>
                  <KbdHint keys="Enter" tone="accent" />
                </button>
              {/if}

              <button
                type="button"
                onclick={startTourFromMenu}
                aria-label="دليل البروتوكول الرئاسي وإرشادات طريقة اللعب"
                style="min-height: var(--flow-btn-pri-h);"
                class="kit-btn sec w-full bg-[var(--c-panel)] px-4 text-[var(--flow-fs-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
              >
                دليل البروتوكول
              </button>

              <button
                type="button"
                onclick={() => {
                  fx('tap');
                  menuView = 'settings';
                }}
                style="min-height: var(--flow-btn-pri-h);"
                class="kit-btn sec w-full bg-[var(--c-panel)] px-4 text-[var(--flow-fs-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
              >
                الإعدادات
              </button>
            </nav>
          </div>

          <footer class="mt-4 shrink-0 flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-[var(--c-line)] pt-2.5 text-[var(--flow-fs-xs)] text-[var(--c-muted)]">
            <button
              type="button"
              onclick={openAbout}
              class="pressable flex min-h-10 items-center justify-center px-2 text-[var(--flow-fs-xs)] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              عن اللعبة
            </button>
            <a
              href="https://www.youtube.com/channel/UCQkqyo2DYRee_1qlHZ1M6Dg/join"
              target="_blank"
              rel="noreferrer"
              onclick={() => fx('tap')}
              class="pressable flex min-h-10 items-center justify-center px-2 text-[var(--flow-fs-xs)] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              دعم
            </a>
            <a
              href={PROJECT_LINKS.repo}
              target="_blank"
              rel="noreferrer"
              onclick={() => fx('tap')}
              aria-label="الشيفرة على GitHub"
              title="الشيفرة على GitHub"
              class="pressable flex min-h-10 items-center justify-center px-2 text-[var(--flow-fs-xs)] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              <bdi dir="ltr">GitHub</bdi>
            </a>
            <a
              href="https://x.com/hadealahmad"
              target="_blank"
              rel="noreferrer"
              onclick={() => fx('tap')}
              aria-label="Twitter: @hadealahmad"
              title="X: @hadealahmad"
              class="pressable flex min-h-10 items-center justify-center px-2 text-[var(--flow-fs-xs)] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              <bdi dir="ltr">X</bdi>
            </a>
            <button
              type="button"
              onclick={updateGame}
              aria-label="تحديث اللعبة — فرض إعادة التحميل"
              title="تحديث اللعبة — فرض إعادة التحميل"
              class="pressable num ms-auto flex min-h-10 items-center justify-center gap-1.5 px-2 text-[var(--flow-fs-xs)] font-medium {$versionStore.isChecking ? 'text-[var(--c-accent)]' : 'text-[var(--c-muted)] hover:text-[var(--c-text)]'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              <span dir="ltr">{$versionStore.currentVersion}</span>
              {#if $versionStore.hasUpdate}
                <span class="bg-[var(--c-accent)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--c-ink)]">
                  جديد{$versionStore.latestVersion ? `: ${$versionStore.latestVersion}` : ''}
                </span>
              {/if}
            </button>
          </footer>
        {:else if menuView === 'settings' || menuView === 'themes'}
          <header class="shrink-0 flex items-start justify-between gap-3 border-b border-[var(--c-line)] pb-3 text-start">
            <div class="min-w-0 flex-1">
              <span class="block text-[var(--flow-fs-xs)] font-bold text-[var(--c-accent)]">تفضيلات النظام</span>
              <h1 class="mt-0.5 font-display text-[clamp(26px,2.2vw,36px)] font-bold leading-[1.28] text-[var(--c-text)]">
                الإعدادات
              </h1>
            </div>
            {#if $uiStore.hasStartedGame}
              <button
                type="button"
                onclick={() => closeSettings(true)}
                aria-label="إغلاق الإعدادات"
                title="إغلاق الإعدادات (Esc)"
                class="pressable flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-text-2)] hover:border-[var(--c-text)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
              >
                <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
              </button>
            {/if}
          </header>

          <div class="scroll-area my-3 min-h-0 flex-1 space-y-3.5 overflow-y-auto pe-1">
            <!-- Group 1: العرض -->
            <section class="space-y-1.5" aria-label="إعدادات العرض">
              <GroupDivider label="العرض" tone="accent" />

              <div class="grid grid-cols-2 divide-x divide-x-reverse divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-panel)]">
                {#each THEME_IDS as id (id)}
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={id === $theme}
                    onclick={() => pickTheme(id)}
                    class="pressable flex min-h-11 items-center justify-between gap-2 px-3 py-2 text-start text-[var(--flow-fs-sm)] font-bold {id === $theme
                      ? 'bg-[var(--c-text)] text-[var(--c-ink)]'
                      : 'bg-[var(--c-panel)] text-[var(--c-text-2)] hover:text-[var(--c-text)]'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                  >
                    <span class="whitespace-nowrap">{THEMES[id].labelAr}</span>
                    <span class="flex shrink-0 items-center gap-1" aria-hidden="true">
                      {#each themePreviewSwatches(id) as hex (hex)}
                        <span
                          class="h-3 w-3 border {id === $theme ? 'border-[var(--c-ink)]/50' : 'border-[var(--c-line-strong)]'}"
                          style="background-color:{hex}"
                        ></span>
                      {/each}
                    </span>
                  </button>
                {/each}
              </div>

              <div class="divide-y divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-panel)]">
                <div class="grid min-h-[56px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2">
                  <div class="min-w-0">
                    <div class="text-[var(--flow-fs-base)] font-bold leading-snug text-[var(--c-text)]">مؤثر شاشة CRT</div>
                    <div class="truncate text-[var(--flow-fs-xs)] leading-[1.4] text-[var(--c-muted)]">طبقة زجاج الشاشة الكلاسيكية</div>
                  </div>
                  <SettingsToggle
                    checked={$uiStore.crtTube}
                    label="تبديل مؤثر شاشة CRT"
                    onchange={toggleCrt}
                  />
                </div>

                <div class="grid min-h-[56px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2">
                  <div class="min-w-0">
                    <div class="text-[var(--flow-fs-base)] font-bold leading-snug text-[var(--c-text)]">أسهم النزوح</div>
                    <div class="truncate text-[var(--flow-fs-xs)] leading-[1.4] text-[var(--c-muted)]">إظهار حركة النزوح والعودة على الخريطة</div>
                  </div>
                  <SettingsToggle
                    checked={$uiStore.showMigrationArrows}
                    label="تبديل أسهم النزوح على الخريطة"
                    onchange={toggleMigration}
                  />
                </div>
              </div>
            </section>

            <!-- Group 2: الصوت واللمس -->
            <section class="space-y-1.5" aria-label="الصوت واللمس">
              <GroupDivider label="الصوت واللمس" tone="accent" />
              <div class="divide-y divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-panel)]">
                <div class="grid min-h-[56px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2">
                  <div class="min-w-0">
                    <div class="text-[var(--flow-fs-base)] font-bold leading-snug text-[var(--c-text)]">الصوت</div>
                    <div class="truncate text-[var(--flow-fs-xs)] leading-[1.4] text-[var(--c-muted)]">مؤثرات صوتية خفيفة للأزرار والأحداث</div>
                  </div>
                  <SettingsToggle
                    checked={$fxSettings.sound}
                    label="تبديل الصوت"
                    onchange={toggleSound}
                  />
                </div>

                <div class="grid min-h-[56px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2">
                  <div class="min-w-0">
                    <div class="text-[var(--flow-fs-base)] font-bold leading-snug text-[var(--c-text)]">الاهتزاز</div>
                    <div class="truncate text-[var(--flow-fs-xs)] leading-[1.4] text-[var(--c-muted)]">نبض لمسي عند المصادقة والتنبيهات</div>
                  </div>
                  <SettingsToggle
                    checked={$fxSettings.haptics}
                    label="تبديل الاهتزاز"
                    onchange={toggleHaptics}
                  />
                </div>
              </div>
            </section>

            <!-- Group 3: اللعبة -->
            <section class="space-y-1.5" aria-label="اللعبة">
              <GroupDivider label="اللعبة" tone="accent" />
              <div class="divide-y divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-panel)]">
                {#if canInstallApp}
                  <div class="grid min-h-[56px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2">
                    <div class="min-w-0">
                      <div class="text-[var(--flow-fs-base)] font-bold leading-snug text-[var(--c-text)]">تثبيت اللعبة كتطبيق</div>
                      <div class="truncate text-[var(--flow-fs-xs)] leading-[1.4] text-[var(--c-muted)]">وصول سريع من الشاشة الرئيسية</div>
                    </div>
                    <button
                      type="button"
                      onclick={installApp}
                      class="kit-btn sec min-h-10 min-w-[96px] px-3 text-[var(--flow-fs-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                    >
                      تثبيت
                    </button>
                  </div>
                  {#if iosInstallHintOpen}
                    <p class="bg-[var(--c-strip)] px-3.5 py-2 text-[var(--flow-fs-sm)] leading-[1.5] text-[var(--c-text-2)]">
                      اضغط زر المشاركة في متصفح سفاري، ثم اختر «إضافة إلى الشاشة الرئيسية».
                    </p>
                  {/if}
                {/if}

                <div class="grid min-h-[56px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2">
                  <div class="min-w-0">
                    <div class="text-[var(--flow-fs-base)] font-bold leading-snug text-[var(--c-text)]">إصدار اللعبة والتحديث</div>
                    <div class="num flex items-center gap-1.5 truncate text-[var(--flow-fs-xs)] text-[var(--c-muted)]" dir="ltr">
                      <span>{$versionStore.currentVersion}</span>
                      {#if $versionStore.hasUpdate}
                        <span class="bg-[var(--c-accent)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--c-ink)]">
                          جديد{$versionStore.latestVersion ? `: ${$versionStore.latestVersion}` : ''}
                        </span>
                      {/if}
                    </div>
                  </div>
                  <button
                    type="button"
                    onclick={updateGame}
                    class="kit-btn sec min-h-10 min-w-[96px] px-3 text-[var(--flow-fs-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                  >
                    {$versionStore.isChecking ? 'جارٍ الفحص…' : 'تحديث'}
                  </button>
                </div>
              </div>
            </section>
          </div>

          <footer class="shrink-0 border-t border-[var(--c-line)] pt-3">
            <button
              type="button"
              data-autofocus
              onclick={handleSettingsBack}
              style="min-height: var(--flow-btn-pri-h);"
              aria-label={openedFromGear ? 'العودة إلى اللعبة' : 'رجوع إلى القائمة الرئيسية'}
              class="kit-btn sec flex w-full items-center justify-between bg-[var(--c-panel)] px-4 text-[var(--flow-fs-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              <span>رجوع</span>
              <KbdHint keys="Esc" />
            </button>
          </footer>
        {:else if menuView === 'restart'}
          <header class="shrink-0 flex items-start justify-between gap-3 border-b border-[var(--c-line)] pb-3 text-start">
            <div class="min-w-0 flex-1">
              <span class="block text-[var(--flow-fs-xs)] font-bold text-[var(--c-neg)]">إجراء لا رجعة فيه</span>
              <h1 class="mt-1 font-display text-[clamp(26px,2.2vw,36px)] font-bold leading-[1.3] text-[var(--c-text)]">
                تأكيد إعادة التشغيل
              </h1>
            </div>
            {#if $uiStore.hasStartedGame}
              <button
                type="button"
                onclick={() => closeSettings(true)}
                aria-label="إغلاق"
                title="إغلاق (Esc)"
                class="pressable flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-text-2)] hover:border-[var(--c-text)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
              >
                <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
              </button>
            {/if}
          </header>

          <div class="scroll-area my-auto flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-y-auto py-4">
            <div class="border border-[var(--c-line)] bg-[var(--c-panel)] p-5 text-start">
              <p class="text-[var(--flow-fs-md)] font-bold leading-[1.65] text-[var(--c-text)]">
                ستفقد كلّ التقدم الذي أجريته في اللعبة، وستعود الدولة إلى الدور الأول.
              </p>
            </div>
          </div>

          <footer class="shrink-0 flex flex-col gap-2.5 border-t border-[var(--c-line)] pt-3">
            <button
              type="button"
              onclick={confirmNewGame}
              style="min-height: var(--flow-btn-pri-h);"
              class="btn-primary-chamfer pressable flex w-full items-center justify-center bg-[var(--c-neg)] px-5 font-heading text-[var(--flow-fs-md)] font-bold text-[var(--c-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)]"
            >
              تأكيد إعادة البدء
            </button>

            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-autofocus
                onclick={() => {
                  fx('tap');
                  menuView = 'main';
                }}
                style="min-height: var(--flow-btn-h);"
                class="kit-btn sec flex w-full items-center justify-center gap-2 bg-[var(--c-panel)] px-3 text-[var(--flow-fs-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
              >
                <span>عودة إلى القائمة</span>
                <KbdHint keys="Esc" />
              </button>
              <button
                type="button"
                onclick={() => closeSettings(true)}
                style="min-height: var(--flow-btn-h);"
                class="kit-btn sec w-full bg-[var(--c-panel)] px-3 text-[var(--flow-fs-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
              >
                متابعة اللعبة
              </button>
            </div>
          </footer>
        {/if}
      </div>

      <!-- Desktop End-side Stage: large flat Syria map backdrop filling the stage -->
      <div
        class="pointer-events-none relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-[var(--c-strip)] p-[clamp(24px,3.2vw,56px)]"
        aria-hidden="true"
      >
        <div class="pointer-events-none absolute inset-[clamp(14px,1.8vw,28px)] border border-[var(--c-line)]"></div>
        <svg
          class="relative h-full w-full max-h-full max-w-full {menuView === 'main' ? 'opacity-100' : 'opacity-65'}"
          viewBox="0 0 1000 880"
          preserveAspectRatio="xMidYMid meet"
        >
          {#each SYRIA_2D_GOVERNORATES as gov (gov.id)}
            <path
              d={gov.path}
              fill="var(--c-panel)"
              stroke="var(--c-line-strong)"
              stroke-width="1.35"
            />
          {/each}
        </svg>
      </div>
    {:else}
      <!-- Phone Portrait & Landscape (approved layouts — untouched) -->
      <div
        class="pointer-events-none fixed inset-x-2 flex items-center justify-center phone-l:inset-4 {menuView === 'main'
          ? hasSave
            ? 'top-[176px] bottom-[292px] phone-l:top-3 phone-l:bottom-12'
            : 'top-[140px] bottom-[240px] phone-l:top-3 phone-l:bottom-12'
          : 'inset-y-12 opacity-35'}"
        aria-hidden="true"
      >
        <svg
          class="h-full w-full max-w-[520px] max-h-[440px] phone-l:max-w-[600px] phone-l:max-h-[340px]"
          viewBox="0 0 1000 880"
          preserveAspectRatio="xMidYMid meet"
        >
          {#each SYRIA_2D_GOVERNORATES as gov (gov.id)}
            <path
              d={gov.path}
              fill="var(--c-panel)"
              stroke="var(--c-line-strong)"
              stroke-width="1.35"
            />
          {/each}
        </svg>
      </div>

      {#if menuView === 'main'}
        <div class="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(0.75rem+env(safe-area-inset-bottom))] phone-l:mx-auto phone-l:w-full phone-l:max-w-[780px] phone-l:grid phone-l:grid-cols-[minmax(0,1fr)_320px] phone-l:grid-rows-[1fr_auto] phone-l:items-center phone-l:gap-x-8 phone-l:gap-y-2 phone-l:px-6 phone-l:py-3">
          <header class="shrink-0 flex flex-col gap-1.5 pt-1 text-start phone-l:col-start-1 phone-l:row-start-1 phone-l:pt-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <span class="block text-[12px] font-bold leading-[1.4] text-[var(--c-accent)]">
                  محاكي إدارة المرحلة الانتقالية
                </span>
                <h1 class="mt-0.5 font-display text-[38px] font-bold leading-[1.24] text-[var(--c-text)] sm:text-[42px] phone-l:text-[28px]">
                  رئيس الجمهورية
                </h1>
              </div>
              {#if $uiStore.hasStartedGame}
                <button
                  type="button"
                  onclick={() => closeSettings(true)}
                  aria-label="إغلاق القائمة"
                  title="إغلاق القائمة"
                  class="pressable flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-text-2)] hover:border-[var(--c-text)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                >
                  <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
                </button>
              {/if}
            </div>
            {#if hasSave}
              <div
                class="mt-1 grid grid-cols-[0.82fr_1.28fr_1.1fr_0.8fr] divide-x divide-x-reverse divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-strip)]"
                aria-label="ملخص الحفظ الحالي"
              >
                <div class="flex min-w-0 flex-col items-start px-2 py-1.5">
                  <span class="block text-[10.5px] leading-tight text-[var(--c-muted)]">الدور</span>
                  <b class="num mt-0.5 block w-full whitespace-nowrap text-right text-[13px] font-bold leading-snug text-[var(--c-accent)]" dir="ltr">{saveTurnText}/40</b>
                </div>
                <div class="flex min-w-0 flex-col items-start px-2 py-1.5">
                  <span class="block text-[10.5px] leading-tight text-[var(--c-muted)]">الفصل</span>
                  <b class="mt-0.5 block w-full whitespace-nowrap text-start text-[12px] font-bold leading-snug text-[var(--c-text)] sm:text-[12.5px]">{saveSeasonText} <span class="num">{$gameStore.calendarYear}</span></b>
                </div>
                <div class="flex min-w-0 flex-col items-start px-2 py-1.5">
                  <span class="block text-[10.5px] leading-tight text-[var(--c-muted)]">الخزينة</span>
                  <b class="num mt-0.5 block w-full whitespace-nowrap text-right text-[13px] font-bold leading-snug {$gameStore.macro.treasurySYP < 0 ? 'text-[var(--c-neg)]' : 'text-[var(--c-text)]'}" dir="ltr">{saveTreasuryText}</b>
                </div>
                <div class="flex min-w-0 flex-col items-start px-2 py-1.5">
                  <span class="block text-[10.5px] leading-tight text-[var(--c-muted)]">الثقة</span>
                  <b class="num mt-0.5 block w-full whitespace-nowrap text-right text-[13px] font-bold leading-snug text-[var(--c-text)]" dir="ltr">{saveTrustText}</b>
                </div>
              </div>
            {:else}
              <p class="text-[12.5px] leading-[1.45] text-[var(--c-muted)]">
                أربعون دوراً نصف سنوي · الجمهورية السورية
              </p>
            {/if}
          </header>

          <div class="min-h-4 flex-1 phone-l:hidden" aria-hidden="true"></div>

          <nav class="shrink-0 flex w-full flex-col gap-2 phone-l:col-start-2 phone-l:row-start-1 phone-l:gap-1.5" aria-label="القائمة الرئيسية">
            {#if hasSave}
              <button
                type="button"
                onclick={continueGame}
                data-autofocus
                class="btn-primary-chamfer pressable flex min-h-[54px] w-full items-center justify-between px-4 text-[17px] font-bold phone-l:min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)]"
              >
                <span class="font-heading text-[17px] font-bold phone-l:text-[15px]">متابعة</span>
                <span class="num text-[12px] font-bold">الدور <bdi dir="ltr">{saveTurnText}</bdi> · {saveSeasonText}</span>
              </button>

              <button
                type="button"
                onclick={startNewGame}
                class="kit-btn sec min-h-[46px] w-full bg-[var(--c-bg)] px-4 text-[14px] phone-l:min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
              >
                لعبة جديدة
              </button>
            {:else}
              <button
                type="button"
                onclick={startNewGame}
                data-autofocus
                class="btn-primary-chamfer pressable flex min-h-[54px] w-full items-center justify-center px-4 font-heading text-[17px] font-bold phone-l:min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)]"
              >
                لعبة جديدة
              </button>
            {/if}

            <button
              type="button"
              onclick={startTourFromMenu}
              aria-label="دليل البروتوكول الرئاسي وإرشادات طريقة اللعب"
              class="kit-btn sec min-h-[46px] w-full bg-[var(--c-bg)] px-4 text-[14px] phone-l:min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              دليل البروتوكول
            </button>

            <button
              type="button"
              onclick={() => {
                fx('tap');
                menuView = 'settings';
              }}
              class="kit-btn sec min-h-[46px] w-full bg-[var(--c-bg)] px-4 text-[14px] phone-l:min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              الإعدادات
            </button>
          </nav>

          <footer class="mt-2.5 shrink-0 flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-[var(--c-line)] pt-1.5 text-[11.5px] text-[var(--c-muted)] phone-l:col-span-2 phone-l:row-start-2 phone-l:mt-0 phone-l:pt-1">
            <button
              type="button"
              onclick={openAbout}
              class="pressable flex min-h-11 min-w-11 items-center justify-center px-2 text-[11.5px] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              عن اللعبة
            </button>
            <a
              href="https://www.youtube.com/channel/UCQkqyo2DYRee_1qlHZ1M6Dg/join"
              target="_blank"
              rel="noreferrer"
              onclick={() => fx('tap')}
              class="pressable flex min-h-11 min-w-11 items-center justify-center px-2 text-[11.5px] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              دعم
            </a>
            <a
              href={PROJECT_LINKS.repo}
              target="_blank"
              rel="noreferrer"
              onclick={() => fx('tap')}
              aria-label="الشيفرة على GitHub"
              title="الشيفرة على GitHub"
              class="pressable flex min-h-11 min-w-11 items-center justify-center px-2 text-[11.5px] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              <bdi dir="ltr">GitHub</bdi>
            </a>
            <a
              href="https://x.com/hadealahmad"
              target="_blank"
              rel="noreferrer"
              onclick={() => fx('tap')}
              aria-label="Twitter: @hadealahmad"
              title="X: @hadealahmad"
              class="pressable flex min-h-11 min-w-11 items-center justify-center px-2 text-[11.5px] font-medium text-[var(--c-muted)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              <bdi dir="ltr">X</bdi>
            </a>
            <button
              type="button"
              onclick={updateGame}
              aria-label="تحديث اللعبة — فرض إعادة التحميل"
              title="تحديث اللعبة — فرض إعادة التحميل"
              class="pressable num ms-auto flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-2 text-[11.5px] font-medium {$versionStore.isChecking ? 'text-[var(--c-accent)]' : 'text-[var(--c-muted)] hover:text-[var(--c-text)]'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              <span dir="ltr">{$versionStore.currentVersion}</span>
              {#if $versionStore.hasUpdate}
                <span class="bg-[var(--c-accent)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--c-ink)]">
                  جديد{$versionStore.latestVersion ? `: ${$versionStore.latestVersion}` : ''}
                </span>
              {/if}
            </button>
          </footer>
        </div>
      {:else}
        <div class="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 phone-l:mx-auto phone-l:w-full phone-l:max-w-[660px] phone-l:py-2.5">
          {#if menuView === 'settings' || menuView === 'themes'}
            <header class="shrink-0 flex items-start justify-between gap-3 border-b border-[var(--c-line)] pb-2.5 text-start phone-l:pb-2">
              <div class="min-w-0 flex-1">
                <span class="block text-[11.5px] font-bold text-[var(--c-accent)]">تفضيلات النظام</span>
                <h1 class="mt-0.5 font-display text-[28px] font-bold leading-[1.28] text-[var(--c-text)] sm:text-[30px] phone-l:text-[22px]">
                  الإعدادات
                </h1>
              </div>
              {#if $uiStore.hasStartedGame}
                <button
                  type="button"
                  onclick={() => closeSettings(true)}
                  aria-label="إغلاق الإعدادات"
                  title="إغلاق الإعدادات"
                  class="pressable flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-text-2)] hover:border-[var(--c-text)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                >
                  <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
                </button>
              {/if}
            </header>

            <div class="scroll-area my-2.5 min-h-0 flex-1 space-y-3 overflow-y-auto pe-0.5 phone-l:my-2 phone-l:space-y-2">
              <section class="space-y-1.5" aria-label="إعدادات العرض">
                <GroupDivider label="العرض" tone="accent" />
                <div class="grid grid-cols-2 divide-x divide-x-reverse divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-panel)]">
                  {#each THEME_IDS as id (id)}
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={id === $theme}
                      onclick={() => pickTheme(id)}
                      class="pressable flex min-h-11 items-center justify-between gap-1.5 px-2.5 py-2 text-start text-[12px] font-bold sm:gap-2 sm:px-3 sm:text-[12.5px] {id === $theme
                        ? 'bg-[var(--c-text)] text-[var(--c-ink)]'
                        : 'bg-[var(--c-panel)] text-[var(--c-text-2)] hover:text-[var(--c-text)]'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                    >
                      <span class="whitespace-nowrap">{THEMES[id].labelAr}</span>
                      <span class="flex shrink-0 items-center gap-0.5 sm:gap-1" aria-hidden="true">
                        {#each themePreviewSwatches(id) as hex (hex)}
                          <span
                            class="h-2.5 w-2.5 border sm:h-3 sm:w-3 {id === $theme ? 'border-[var(--c-ink)]/50' : 'border-[var(--c-line-strong)]'}"
                            style="background-color:{hex}"
                          ></span>
                        {/each}
                      </span>
                    </button>
                  {/each}
                </div>

                <div class="divide-y divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-panel)]">
                  <div class="grid min-h-[54px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 phone-l:min-h-[48px] phone-l:py-1.5">
                    <div class="min-w-0">
                      <div class="text-[13px] font-bold leading-snug text-[var(--c-text)]">مؤثر شاشة CRT</div>
                      <div class="truncate text-[11.5px] leading-[1.4] text-[var(--c-muted)]">طبقة زجاج الشاشة الكلاسيكية</div>
                    </div>
                    <SettingsToggle
                      checked={$uiStore.crtTube}
                      label="تبديل مؤثر شاشة CRT"
                      onchange={toggleCrt}
                    />
                  </div>

                  <div class="grid min-h-[54px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 phone-l:min-h-[48px] phone-l:py-1.5">
                    <div class="min-w-0">
                      <div class="text-[13px] font-bold leading-snug text-[var(--c-text)]">أسهم النزوح</div>
                      <div class="truncate text-[11.5px] leading-[1.4] text-[var(--c-muted)]">إظهار حركة النزوح والعودة على الخريطة</div>
                    </div>
                    <SettingsToggle
                      checked={$uiStore.showMigrationArrows}
                      label="تبديل أسهم النزوح على الخريطة"
                      onchange={toggleMigration}
                    />
                  </div>
                </div>
              </section>

              <section class="space-y-1.5" aria-label="الصوت واللمس">
                <GroupDivider label="الصوت واللمس" tone="accent" />
                <div class="divide-y divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-panel)]">
                  <div class="grid min-h-[54px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 phone-l:min-h-[48px] phone-l:py-1.5">
                    <div class="min-w-0">
                      <div class="text-[13px] font-bold leading-snug text-[var(--c-text)]">الصوت</div>
                      <div class="truncate text-[11.5px] leading-[1.4] text-[var(--c-muted)]">مؤثرات صوتية خفيفة للأزرار والأحداث</div>
                    </div>
                    <SettingsToggle
                      checked={$fxSettings.sound}
                      label="تبديل الصوت"
                      onchange={toggleSound}
                    />
                  </div>

                  <div class="grid min-h-[54px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 phone-l:min-h-[48px] phone-l:py-1.5">
                    <div class="min-w-0">
                      <div class="text-[13px] font-bold leading-snug text-[var(--c-text)]">الاهتزاز</div>
                      <div class="truncate text-[11.5px] leading-[1.4] text-[var(--c-muted)]">نبض لمسي عند المصادقة والتنبيهات</div>
                    </div>
                    <SettingsToggle
                      checked={$fxSettings.haptics}
                      label="تبديل الاهتزاز"
                      onchange={toggleHaptics}
                    />
                  </div>
                </div>
              </section>

              <section class="space-y-1.5" aria-label="اللعبة">
                <GroupDivider label="اللعبة" tone="accent" />
                <div class="divide-y divide-[var(--c-line)] border border-[var(--c-line)] bg-[var(--c-panel)]">
                  {#if canInstallApp}
                    <div class="grid min-h-[54px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 phone-l:min-h-[48px] phone-l:py-1.5">
                      <div class="min-w-0">
                        <div class="text-[13px] font-bold leading-snug text-[var(--c-text)]">تثبيت اللعبة كتطبيق</div>
                        <div class="truncate text-[11.5px] leading-[1.4] text-[var(--c-muted)]">وصول سريع من الشاشة الرئيسية</div>
                      </div>
                      <button
                        type="button"
                        onclick={installApp}
                        class="kit-btn sec min-h-11 min-w-[96px] px-3 text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                      >
                        تثبيت
                      </button>
                    </div>
                    {#if iosInstallHintOpen}
                      <p class="bg-[var(--c-strip)] px-3 py-2 text-[12px] leading-[1.5] text-[var(--c-text-2)]">
                        اضغط زر المشاركة في متصفح سفاري، ثم اختر «إضافة إلى الشاشة الرئيسية».
                      </p>
                    {/if}
                  {/if}

                  <div class="grid min-h-[54px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 phone-l:min-h-[48px] phone-l:py-1.5">
                    <div class="min-w-0">
                      <div class="text-[13px] font-bold leading-snug text-[var(--c-text)]">إصدار اللعبة والتحديث</div>
                      <div class="num flex items-center gap-1.5 truncate text-[11.5px] text-[var(--c-muted)]" dir="ltr">
                        <span>{$versionStore.currentVersion}</span>
                        {#if $versionStore.hasUpdate}
                          <span class="bg-[var(--c-accent)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--c-ink)]">
                            جديد{$versionStore.latestVersion ? `: ${$versionStore.latestVersion}` : ''}
                          </span>
                        {/if}
                      </div>
                    </div>
                    <button
                      type="button"
                      onclick={updateGame}
                      class="kit-btn sec min-h-11 min-w-[96px] px-3 text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                    >
                      {$versionStore.isChecking ? 'جارٍ الفحص…' : 'تحديث'}
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <footer class="shrink-0 border-t border-[var(--c-line)] pt-2.5 phone-l:pt-2">
              <button
                type="button"
                onclick={handleSettingsBack}
                aria-label={openedFromGear ? 'العودة إلى اللعبة' : 'رجوع إلى القائمة الرئيسية'}
                class="kit-btn sec min-h-[46px] w-full bg-[var(--c-panel)] px-4 text-[14px] phone-l:min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
              >
                رجوع
              </button>
            </footer>
          {:else if menuView === 'restart'}
            <header class="shrink-0 flex items-start justify-between gap-3 border-b border-[var(--c-line)] border-t-2 border-t-[var(--c-neg)] pt-3 pb-3 text-start phone-l:pt-2 phone-l:pb-2">
              <div class="min-w-0 flex-1">
                <span class="block text-[11.5px] font-bold text-[var(--c-neg)]">إجراء لا رجعة فيه</span>
                <h1 class="mt-1 font-display text-[28px] font-bold leading-[1.3] text-[var(--c-text)] sm:text-[30px] phone-l:text-[22px]">
                  تأكيد إعادة التشغيل
                </h1>
              </div>
              {#if $uiStore.hasStartedGame}
                <button
                  type="button"
                  onclick={() => closeSettings(true)}
                  aria-label="إغلاق"
                  title="إغلاق"
                  class="pressable flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-text-2)] hover:border-[var(--c-text)] hover:text-[var(--c-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                >
                  <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
                </button>
              {/if}
            </header>

            <div class="scroll-area min-h-0 flex-1 overflow-y-auto flex flex-col justify-center gap-2.5 py-4">
              <div class="border border-[var(--c-line)] bg-[var(--c-panel)] p-4 text-start">
                <p class="text-[13.5px] font-bold leading-[1.6] text-[var(--c-text)]">
                  ستفقد كلّ التقدم الذي أجريته في اللعبة، وستعود الدولة إلى الدور الأول.
                </p>
              </div>
            </div>

            <footer class="shrink-0 flex flex-col gap-2 border-t border-[var(--c-line)] pt-2.5">
              <button
                type="button"
                onclick={confirmNewGame}
                class="btn-primary-chamfer pressable flex min-h-[48px] w-full items-center justify-center bg-[var(--c-neg)] px-5 font-heading text-[14.5px] font-bold text-[var(--c-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-text)]"
              >
                تأكيد إعادة البدء
              </button>

              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onclick={() => {
                    fx('tap');
                    menuView = 'main';
                  }}
                  class="kit-btn sec min-h-11 w-full bg-[var(--c-panel)] px-3 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                >
                  عودة إلى القائمة
                </button>
                <button
                  type="button"
                  onclick={() => closeSettings(true)}
                  class="kit-btn sec min-h-11 w-full bg-[var(--c-panel)] px-3 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
                >
                  متابعة اللعبة
                </button>
              </div>
            </footer>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
{/if}
