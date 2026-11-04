<script lang="ts">
  import { onMount } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { uiStore } from '../stores/ui-store';
  import { startNewGame as startNewGameSession } from '../stores/new-game';
  import { versionStore } from '../stores/version-store';
  import { theme } from '../stores/theme-store';
  import { pwaStore } from '../stores/pwa-store';
  import { THEMES, THEME_IDS, type ThemeId } from '../themes';
  import { startGuideTour, hasSeenTour } from './guide-tour';
  import { focusTrap } from './actions/focus-trap';
  import GameIcon from './GameIcon.svelte';
  import ToggleSwitch from './ToggleSwitch.svelte';
  import { PROJECT_LINKS } from '../project-links';
  import { SYRIA_2D_GOVERNORATES } from '../spatial3d/syria-2d-paths';

  /**
   * Full-screen settings curtain (Concept D). The three floating controls that
   * used to sit over the map are retired: the top-bar gear opens this menu,
   * and the guide tour, migration-arrow toggle, theme, CRT effect, about page,
   * new game/continue and restart all live here.
   *
   * The first child stays an empty, hidden element on purpose: the shell's
   * legacy `.shell-deck-host > div:first-child` rules must not reach the
   * curtain's own buttons (they would force 44px sizes on the title menu).
   */
  let menuView = $state<'main' | 'themes' | 'restart'>('main');
  let iosInstallHintOpen = $state(false);
  let canInstallApp = $derived(!$pwaStore.isInstalled && ($pwaStore.canInstall || $pwaStore.isIos));

  let idleGovIndex = $state(0);
  let activeGovId = $derived(
    SYRIA_2D_GOVERNORATES[idleGovIndex % SYRIA_2D_GOVERNORATES.length]?.id ?? 'damascus'
  );

  const NETWORK_EDGES: { id: string; x1: number; y1: number; x2: number; y2: number; from: string; to: string }[] = (() => {
    const centerMap = new Map(SYRIA_2D_GOVERNORATES.map((g) => [g.id, g.center]));
    const seen = new Set<string>();
    const edges: { id: string; x1: number; y1: number; x2: number; y2: number; from: string; to: string }[] = [];
    const pairs: [string, string][] = [
      ['damascus', 'rif_dimashq'],
      ['rif_dimashq', 'homs'],
      ['rif_dimashq', 'daraa'],
      ['rif_dimashq', 'as_suwayda'],
      ['daraa', 'quneitra'],
      ['daraa', 'as_suwayda'],
      ['homs', 'hama'],
      ['homs', 'tartus'],
      ['homs', 'deir_ez_zor'],
      ['hama', 'idlib'],
      ['hama', 'latakia'],
      ['hama', 'aleppo'],
      ['tartus', 'latakia'],
      ['idlib', 'aleppo'],
      ['aleppo', 'raqqa'],
      ['raqqa', 'deir_ez_zor'],
      ['raqqa', 'hasakeh'],
      ['deir_ez_zor', 'hasakeh'],
    ];
    for (const [a, b] of pairs) {
      const key = [a, b].sort().join('--');
      if (seen.has(key)) continue;
      seen.add(key);
      const c1 = centerMap.get(a);
      const c2 = centerMap.get(b);
      if (c1 && c2) {
        edges.push({ id: key, x1: c1[0], y1: c1[1], x2: c2[0], y2: c2[1], from: a, to: b });
      }
    }
    return edges;
  })();

  onMount(() => {
    const interval = setInterval(() => {
      if ($uiStore.isSettingsOpen) {
        idleGovIndex = (idleGovIndex + 1) % SYRIA_2D_GOVERNORATES.length;
      }
    }, 2600);
    return () => clearInterval(interval);
  });

  function curtainSlide(_node: Element, { duration = 520 }: { duration?: number } = {}) {
    return {
      duration,
      easing: cubicInOut,
      css: (t: number) => `transform: translateY(${(t - 1) * 100}%);`,
    };
  }

  // Every fresh open starts at the main menu (the gear can open it from any
  // sheet, and a previous session's restart/theme view must not linger).
  let wasSettingsOpen = false;
  $effect(() => {
    if ($uiStore.isSettingsOpen && !wasSettingsOpen) {
      menuView = 'main';
      iosInstallHintOpen = false;
      uiStore.setRestartModal(false);
    }
    wasSettingsOpen = $uiStore.isSettingsOpen;
  });

  function closeSettings(): void {
    menuView = 'main';
    iosInstallHintOpen = false;
    uiStore.setRestartModal(false);
    uiStore.markGameStarted();
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' && $uiStore.isSettingsOpen) {
      if (menuView !== 'main') {
        menuView = 'main';
      } else if ($uiStore.hasStartedGame) {
        closeSettings();
      }
    }
  }

  function startTourFromMenu(): void {
    closeSettings();
    startGuideTour();
  }

  function confirmNewGame(): void {
    startNewGameSession();
    closeSettings();
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
    iosInstallHintOpen = false;
    menuView = 'restart';
  }

  function openAbout(): void {
    if ($uiStore.hasStartedGame) {
      closeSettings();
    }
    uiStore.setAboutOpen(true);
  }

  function updateGame(): void {
    void versionStore.applyUpdate();
  }

  function pickTheme(id: ThemeId): void {
    theme.setTheme(id);
  }

  async function installApp(): Promise<void> {
    if ($pwaStore.canInstall) {
      await pwaStore.promptInstall();
      return;
    }
    iosInstallHintOpen = !iosInstallHintOpen;
  }
</script>

<svelte:window onkeydown={onKey} />

<!-- Hidden placeholder: keeps the legacy deck CSS selectors away from the
     curtain (see the comment in the script block). -->
<div class="hidden" aria-hidden="true"></div>

{#if $uiStore.isSettingsOpen}
  <div
    transition:curtainSlide={{ duration: 520 }}
    use:focusTrap
    role="dialog"
    aria-modal="true"
    aria-label="الإعدادات"
    dir="rtl"
    class="pointer-events-auto fixed inset-0 z-[150] overflow-hidden bg-charcoal-deep text-wheat-light select-none font-arabic"
    style="visibility: visible;"
  >
    <!-- Fullscreen background: animated idle map anchored toward the left -->
    <div
      class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden md:justify-end md:pl-14 lg:pl-24"
      aria-hidden="true"
    >
      <svg
        class="idle-map-float max-h-[82vh] w-[88vw] max-w-[780px] opacity-30 md:w-[64vw] md:opacity-100"
        viewBox="0 0 1000 880"
      >
        <!-- Map drop shadow -->
        <g transform="translate(8, 12)" opacity="0.5">
          {#each SYRIA_2D_GOVERNORATES as gov (gov.id)}
            <path d={gov.path} fill="var(--map-shadow)" />
          {/each}
        </g>

        <!-- Governorate polygons -->
        {#each SYRIA_2D_GOVERNORATES as gov (gov.id)}
          {@const isActive = activeGovId === gov.id}
          <path
            d={gov.path}
            fill={isActive ? 'var(--color-forest-surface)' : 'var(--color-forest-mid)'}
            stroke={isActive ? 'var(--color-wheat-gold)' : 'var(--color-charcoal-mid)'}
            stroke-width={isActive ? '2.5' : '1.2'}
            class="transition-all duration-700"
          />
        {/each}

        <!-- Animated connection lines -->
        <g>
          {#each NETWORK_EDGES as edge (edge.id)}
            {@const isLinked = edge.from === activeGovId || edge.to === activeGovId}
            <line
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke={isLinked ? 'var(--color-wheat-gold)' : 'var(--color-wheat-dark)'}
              stroke-width={isLinked ? '1.8' : '1'}
              stroke-opacity={isLinked ? '0.75' : '0.22'}
              stroke-dasharray="5 7"
              class="idle-edge-flow transition-all duration-700"
            />
          {/each}
        </g>

        <!-- Governorate center nodes -->
        {#each SYRIA_2D_GOVERNORATES as gov (gov.id)}
          {@const isActive = activeGovId === gov.id}
          <g transform="translate({gov.center[0]}, {gov.center[1]})">
            {#if isActive}
              <circle
                r="22"
                fill="none"
                stroke="var(--color-wheat-gold)"
                stroke-width="1.5"
                class="idle-node-pulse"
              />
              <circle r="4.5" fill="var(--color-wheat-gold)" />
            {:else}
              <circle r="2.8" fill="var(--color-wheat-mid)" fill-opacity="0.55" />
            {/if}
          </g>
        {/each}
      </svg>
    </div>

    <!-- Seamless gradient fade from the right menu side into the map on the left (no hard border) -->
    <div
      class="pointer-events-none absolute inset-0"
      style="background: linear-gradient(to left, var(--color-forest-deep) 0%, rgb(from var(--color-forest-deep) r g b / 0.92) 26%, rgb(from var(--color-charcoal-deep) r g b / 0.55) 54%, transparent 82%);"
      aria-hidden="true"
    ></div>

    {#if $uiStore.hasStartedGame}
      <button
        type="button"
        onclick={closeSettings}
        aria-label="إغلاق القائمة"
        title="إغلاق القائمة"
        class="absolute top-3 end-3 z-20 flex h-11 w-11 items-center justify-center border border-wheat-mid/20 bg-forest-deep/70 text-wheat-mid transition-colors hover:border-wheat-gold/60 hover:text-wheat-gold shell-round-item"
      >
        <GameIcon name="cross-mark" cls="h-4 w-4 shrink-0" />
      </button>
    {/if}

    <!-- Right-aligned frameless classic game menu text -->
    <aside
      class="scroll-area relative z-10 flex h-full w-full flex-col justify-between overflow-y-auto px-8 py-8 sm:px-12 sm:py-10 md:w-[470px] md:px-16 md:py-12"
    >
      {#if menuView === 'main'}
        <div class="text-right">
          <span class="text-[8.5px] tracking-[2.4px] text-forest-accent/80">القائمة الرئاسية</span>
          <h1 class="mt-1 font-heading text-3xl font-bold tracking-tight text-wheat-light sm:text-4xl">
            رئيس الجمهورية
          </h1>
        </div>

        <nav class="my-auto flex flex-col items-start gap-1 py-6 text-right" aria-label="الإعدادات">
          {#if $uiStore.hasStartedGame}
            <button
              type="button"
              onclick={closeSettings}
              data-autofocus
              class="group flex min-h-11 cursor-pointer items-center gap-3 border-0 bg-transparent py-1.5 text-right"
            >
              <span class="h-5 w-1 bg-wheat-gold transition-all duration-200 group-hover:h-7"></span>
              <span class="font-heading text-2xl font-bold text-wheat-gold transition-all duration-200 group-hover:-translate-x-1.5 group-hover:text-wheat-light sm:text-3xl">
                متابعة اللعبة
              </span>
            </button>
          {/if}

          <button
            type="button"
            onclick={startNewGame}
            class="group flex min-h-11 cursor-pointer items-center gap-3 border-0 bg-transparent py-1.5 text-right"
          >
            <span
              class="w-1 transition-all duration-200 {!$uiStore.hasStartedGame
                ? 'h-6 bg-wheat-gold group-hover:h-7'
                : 'h-0 bg-wheat-gold/0 group-hover:h-6 group-hover:bg-wheat-gold'}"
            ></span>
            <span
              class="font-heading text-2xl font-bold transition-all duration-200 group-hover:-translate-x-1.5 sm:text-3xl {!$uiStore.hasStartedGame
                ? 'text-wheat-gold group-hover:text-wheat-light'
                : 'text-wheat-mid group-hover:text-wheat-gold'}"
            >
              بدء لعبة جديدة
            </span>
          </button>

          <button
            type="button"
            onclick={startTourFromMenu}
            class="group flex min-h-11 cursor-pointer items-center gap-3 border-0 bg-transparent py-1.5 text-right"
            aria-label="دليل البروتوكول الرئاسي وإرشادات طريقة اللعب"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="flex items-center gap-2 font-heading text-xl font-bold text-wheat-mid transition-all duration-200 group-hover:-translate-x-1.5 group-hover:text-wheat-gold sm:text-2xl">
              دليل البروتوكول الرئاسي
              <GameIcon name="help" cls="h-4 w-4 shrink-0 text-wheat-gold/70" />
            </span>
          </button>

          <button
            type="button"
            onclick={() => (menuView = 'themes')}
            class="group flex min-h-11 cursor-pointer items-center gap-3 border-0 bg-transparent py-1.5 text-right"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="font-heading text-xl font-bold text-wheat-mid transition-all duration-200 group-hover:-translate-x-1.5 group-hover:text-wheat-gold sm:text-2xl">
              المظهر
            </span>
          </button>

          <div class="flex min-h-11 items-center gap-3 py-1.5 text-right">
            <span class="h-0 w-1 bg-wheat-gold/0"></span>
            <span class="font-heading text-xl font-bold text-wheat-mid sm:text-2xl">أسهم النزوح</span>
            <ToggleSwitch
              checked={$uiStore.showMigrationArrows}
              label="تبديل أسهم النزوح على الخريطة"
              onchange={(v) => uiStore.setMigrationArrows(v)}
            />
          </div>

          {#if canInstallApp}
            <button
              type="button"
              onclick={installApp}
              class="group flex min-h-11 cursor-pointer items-center gap-3 border-0 bg-transparent py-1.5 text-right"
            >
              <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
              <span class="font-heading text-xl font-bold text-wheat-mid transition-all duration-200 group-hover:-translate-x-1.5 group-hover:text-wheat-gold sm:text-2xl">
                تثبيت اللعبة كتطبيق
              </span>
            </button>
          {/if}
          {#if iosInstallHintOpen}
            <p class="pe-4 text-[11px] leading-relaxed text-wheat-dark" dir="rtl">
              اضغط زر المشاركة في متصفح سفاري، ثم اختر «إضافة إلى الشاشة الرئيسية».
            </p>
          {/if}

          <button
            type="button"
            onclick={openAbout}
            class="group flex min-h-11 cursor-pointer items-center gap-3 border-0 bg-transparent py-1.5 text-right"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="font-heading text-xl font-bold text-wheat-mid transition-all duration-200 group-hover:-translate-x-1.5 group-hover:text-wheat-gold sm:text-2xl">
              عن اللعبة
            </span>
          </button>

          <a
            href="https://www.youtube.com/channel/UCQkqyo2DYRee_1qlHZ1M6Dg/join"
            target="_blank"
            rel="noreferrer"
            class="group flex min-h-11 cursor-pointer items-center gap-3 py-1.5 text-right"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="font-heading text-xl font-bold text-wheat-mid transition-all duration-200 group-hover:-translate-x-1.5 group-hover:text-wheat-gold sm:text-2xl">
              ادعمني مالياً
            </span>
          </a>

          <a
            href={PROJECT_LINKS.repo}
            target="_blank"
            rel="noreferrer"
            class="group flex min-h-11 cursor-pointer items-center gap-3 py-1.5 text-right"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="font-heading text-xl font-bold text-wheat-mid transition-all duration-200 group-hover:-translate-x-1.5 group-hover:text-wheat-gold sm:text-2xl">
              الشيفرة على GitHub
            </span>
          </a>
        </nav>

        <div class="flex items-center gap-5 text-right">
          <a
            href={PROJECT_LINKS.authorGithub}
            target="_blank"
            rel="noreferrer"
            aria-label="حساب المطوّر على GitHub"
            title="حساب المطوّر على GitHub"
            class="flex h-11 w-11 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold"
          >
            <GameIcon name="brand-github" cls="h-4 w-4 shrink-0" />
          </a>
          <a
            href="https://x.com/hadealahmad"
            target="_blank"
            rel="noreferrer"
            aria-label="Twitter: @hadealahmad"
            class="flex h-11 w-11 items-center justify-center text-wheat-dark transition-colors hover:text-wheat-gold"
          >
            <GameIcon name="brand-x" cls="h-4 w-4 shrink-0" />
          </a>
          <button
            type="button"
            onclick={updateGame}
            aria-label="تحديث اللعبة — فرض إعادة التحميل"
            title="تحديث اللعبة — فرض إعادة التحميل"
            class="min-h-11 cursor-pointer border-0 bg-transparent font-mono text-[11px] transition-colors {$versionStore.isChecking ? 'animate-pulse text-wheat-gold' : 'text-wheat-dark hover:text-wheat-gold'}"
          >
            <span dir="ltr">{$versionStore.currentVersion}</span>
            {#if $versionStore.hasUpdate}
              <span class="bg-amber-400 px-1.5 py-px text-[9px] font-bold text-forest-deep">
                جديد{$versionStore.latestVersion ? `: ${$versionStore.latestVersion}` : ''}
              </span>
            {/if}
          </button>
        </div>
      {:else if menuView === 'themes'}
        <div class="text-right">
          <span class="text-[8.5px] tracking-[2.4px] text-forest-accent/80">تفضيلات العرض</span>
          <h1 class="mt-1 font-heading text-3xl font-bold tracking-tight text-wheat-light sm:text-4xl">
            المظهر
          </h1>
        </div>

        <div class="my-auto flex flex-col items-start gap-2 py-8 text-right">
          {#each THEME_IDS as id (id)}
            <button
              type="button"
              role="menuitemradio"
              aria-checked={id === $theme}
              onclick={() => pickTheme(id)}
              class="group flex min-h-11 cursor-pointer items-center gap-4 border-0 bg-transparent py-1 text-right"
            >
              <span
                class="w-1 transition-all duration-200 {id === $theme
                  ? 'h-6 bg-wheat-gold'
                  : 'h-0 bg-wheat-gold/0 group-hover:h-6 group-hover:bg-wheat-gold'}"
              ></span>
              <span
                class="font-heading text-xl font-bold transition-all duration-200 group-hover:-translate-x-1.5 sm:text-2xl {id === $theme
                  ? 'text-wheat-gold'
                  : 'text-wheat-mid group-hover:text-wheat-gold'}"
              >
                {THEMES[id].labelAr}
              </span>
              <span class="me-2 flex items-center gap-1" aria-hidden="true">
                {#each THEMES[id].swatches as hex (hex)}
                  <span class="h-3 w-3 shrink-0 border border-charcoal-light" style="background-color:{hex}"></span>
                {/each}
              </span>
            </button>
          {/each}

          <div class="flex min-h-11 items-center gap-5 py-1 pe-4">
            <span class="font-heading text-xl font-bold text-wheat-mid sm:text-2xl">مؤثر شاشة CRT</span>
            <ToggleSwitch
              checked={$uiStore.crtTube}
              label="تبديل مؤثر شاشة CRT"
              onchange={(v) => uiStore.setCrtTube(v)}
            />
          </div>

          <button
            type="button"
            onclick={() => (menuView = 'main')}
            aria-label="رجوع إلى الإعدادات"
            class="group mt-3 flex min-h-11 cursor-pointer items-center gap-3 border-0 bg-transparent py-1 text-right"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="font-heading text-lg font-bold text-wheat-dark transition-all duration-200 group-hover:-translate-x-1.5 group-hover:text-wheat-light sm:text-xl">
              رجوع
            </span>
          </button>
        </div>

        <div></div>
      {:else if menuView === 'restart'}
        <div class="text-right">
          <span class="text-[8.5px] tracking-[2.4px] text-umber-crimson/80">إجراء لا رجعة فيه</span>
          <h1 class="mt-1 font-heading text-3xl font-bold tracking-tight text-wheat-light sm:text-4xl">
            تأكيد إعادة التشغيل
          </h1>
        </div>

        <div class="my-auto flex flex-col items-start gap-3 py-8 text-right">
          <p class="pe-4 font-heading text-base leading-relaxed text-wheat-mid sm:text-lg">
            ستفقد كلّ التقدم الذي أجريته في اللعبة.
          </p>

          <button
            type="button"
            onclick={confirmNewGame}
            class="group mt-2 flex min-h-11 cursor-pointer items-center gap-3 border-0 bg-transparent py-1 text-right"
          >
            <span class="h-6 w-1 bg-umber-crimson transition-all duration-200 group-hover:h-7"></span>
            <span class="font-heading text-2xl font-bold text-umber-crimson transition-all duration-200 group-hover:-translate-x-1.5 group-hover:text-wheat-light sm:text-3xl">
              تأكيد إعادة البدء
            </span>
          </button>

          <button
            type="button"
            onclick={closeSettings}
            class="group flex min-h-11 cursor-pointer items-center gap-3 border-0 bg-transparent py-1 text-right"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="font-heading text-xl font-bold text-wheat-mid transition-all duration-200 group-hover:-translate-x-1.5 group-hover:text-wheat-gold sm:text-2xl">
              إلغاء ومتابعة اللعبة
            </span>
          </button>

          <button
            type="button"
            onclick={() => (menuView = 'main')}
            class="group flex min-h-11 cursor-pointer items-center gap-3 border-0 bg-transparent py-1 text-right"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="font-heading text-lg font-bold text-wheat-dark transition-all duration-200 group-hover:-translate-x-1.5 group-hover:text-wheat-light sm:text-xl">
              عودة إلى الإعدادات
            </span>
          </button>
        </div>

        <div></div>
      {/if}
    </aside>
  </div>
{/if}

<style>
  @keyframes idle-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes idle-dash {
    to { stroke-dashoffset: -48; }
  }
  @keyframes idle-pulse {
    0% { transform: scale(0.35); opacity: 0.9; }
    100% { transform: scale(1.6); opacity: 0; }
  }

  .idle-map-float {
    animation: idle-float 7s ease-in-out infinite;
  }
  .idle-edge-flow {
    animation: idle-dash 4s linear infinite;
  }
  .idle-node-pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: idle-pulse 2.2s ease-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .idle-map-float,
    .idle-edge-flow,
    .idle-node-pulse {
      animation: none !important;
    }
  }
</style>
