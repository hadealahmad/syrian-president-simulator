<script lang="ts">
  import { onMount } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { uiStore } from '../stores/ui-store';
  import { gameStore } from '../stores/game-store';
  import { draftStore } from '../stores/draft-store';
  import { versionStore } from '../stores/version-store';
  import { theme } from '../stores/theme-store';
  import { pwaStore } from '../stores/pwa-store';
  import { THEMES, THEME_IDS, type ThemeId } from '../themes';
  import { startGuideTour, stopGuideTour, hasSeenTour } from './guide-tour';
  import GameIcon from './GameIcon.svelte';
  import ToggleSwitch from './ToggleSwitch.svelte';
  import { PROJECT_LINKS } from '../project-links';
  import { SYRIA_2D_GOVERNORATES } from '../spatial3d/syria-2d-paths';

  let isLeftOpen = $derived($uiStore.isProvincialDrawerOpen);
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

  function closeSettings(): void {
    menuView = 'main';
    iosInstallHintOpen = false;
    uiStore.setRestartModal(false);
    uiStore.markGameStarted();
  }

  function openSettings(): void {
    stopGuideTour();
    menuView = 'main';
    iosInstallHintOpen = false;
    uiStore.setRestartModal(false);
    uiStore.setSettingsOpen(true);
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

  function confirmNewGame(): void {
    gameStore.restart();
    draftStore.reset();
    uiStore.selectGovernorate(null);
    uiStore.setTurnFlowStage('closed');
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

<!-- System Controls: guide + settings - top left under the top bar -->
<div
  class="pointer-events-auto fixed top-[88px] z-30 flex items-center gap-2 transition-all duration-300 ease-in-out select-none font-arabic {isLeftOpen ? 'lg:left-[396px] left-3' : 'left-3'}"
>
  <!-- Presidential Guide Tour (icon only, stays outside the settings menu) -->
  <button
    data-tour="guide-btn"
    onclick={() => startGuideTour()}
    class="max-md:h-9 max-md:w-9 h-7 w-7 flex items-center justify-center bg-forest-deep/90 hover:bg-forest-mid text-wheat-mid hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/60 shadow-lg cursor-pointer gloss-hover transition-all active:scale-95 rounded-none"
    title="دليل البروتوكول الرئاسي وإرشادات إدارة الدولة وطريقة اللعب"
    aria-label="دليل البروتوكول الرئاسي"
  >
    <GameIcon name="help" cls="max-md:w-4.5 max-md:h-4.5 w-4 h-4 shrink-0 text-wheat-gold" />
  </button>

  <!-- Settings -->
  <button
    onclick={openSettings}
    aria-haspopup="dialog"
    aria-expanded={$uiStore.isSettingsOpen}
    aria-label="الإعدادات"
    title="الإعدادات — لعبة جديدة، تحديث، المظهر"
    class="relative max-md:h-9 max-md:w-9 h-7 w-7 flex items-center justify-center bg-forest-deep/90 hover:bg-forest-mid text-wheat-mid hover:text-wheat-gold border border-charcoal-mid hover:border-wheat-mid/60 shadow-lg cursor-pointer gloss-hover transition-all active:scale-95 rounded-none group"
  >
    {#if $versionStore.hasUpdate}
      <span class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
    {/if}
    <GameIcon name="gear" cls="max-md:w-4.5 max-md:h-4.5 w-4 h-4 shrink-0 text-wheat-dark group-hover:text-wheat-gold transition-colors" />
  </button>

  <!-- Migration arrows overlay toggle -->
  <button
    onclick={() => uiStore.setMigrationArrows(!$uiStore.showMigrationArrows)}
    aria-pressed={$uiStore.showMigrationArrows}
    aria-label="تبديل أسهم النزوح"
    title="تبديل أسهم النزوح"
    class="max-md:h-9 max-md:w-9 h-7 w-7 flex items-center justify-center bg-forest-deep/90 hover:bg-forest-mid border hover:border-wheat-mid/60 shadow-lg cursor-pointer gloss-hover transition-all active:scale-95 rounded-none {$uiStore.showMigrationArrows ? 'border-wheat-mid/60 text-wheat-gold' : 'border-charcoal-mid text-wheat-dark hover:text-wheat-gold'}"
  >
    <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden="true" class="max-md:w-4.5 max-md:h-4.5 w-4 h-4 shrink-0">
      <circle cx="4.5" cy="4" r="2.3" fill="currentColor" />
      <path d="M0.8 13.4c0-3.1 1.7-5 3.7-5s3.7 1.9 3.7 5" fill="currentColor" />
      <path d="M7.8 9.6 L12.4 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      <path d="M9.7 5 H12.4 V7.7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
</div>

{#if $uiStore.isSettingsOpen}
  <div
    transition:curtainSlide={{ duration: 520 }}
    role="dialog"
    aria-modal="true"
    aria-label="الإعدادات"
    dir="rtl"
    class="pointer-events-auto fixed inset-0 z-[150] bg-charcoal-deep text-wheat-light select-none font-arabic overflow-hidden"
  >
    <!-- Fullscreen background: animated idle map anchored toward the left -->
    <div
      class="pointer-events-none absolute inset-0 flex items-center justify-center md:justify-end md:pl-14 lg:pl-24 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        class="w-[88vw] md:w-[64vw] max-w-[780px] max-h-[82vh] opacity-30 md:opacity-100 idle-map-float"
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

    <!-- Right-aligned frameless classic game menu text -->
    <aside
      class="relative z-10 h-full w-full md:w-[460px] flex flex-col justify-between px-10 sm:px-14 md:px-16 py-10 sm:py-12 scroll-area overflow-y-auto"
    >
      {#if menuView === 'main'}
        <div class="text-right">
          <h1 class="text-3xl sm:text-4xl font-bold text-wheat-light font-heading tracking-tight">
            رئيس الجمهورية
          </h1>
        </div>

        <nav class="my-auto py-8 flex flex-col items-start gap-4 text-right" aria-label="الإعدادات">
          {#if $uiStore.hasStartedGame}
            <button
              onclick={closeSettings}
              class="group flex items-center gap-3 py-1 text-right cursor-pointer bg-transparent border-0"
            >
              <span class="h-5 w-1 bg-wheat-gold transition-all duration-200 group-hover:h-7"></span>
              <span class="text-2xl sm:text-3xl font-bold text-wheat-gold group-hover:text-wheat-light font-heading transition-all duration-200 group-hover:-translate-x-1.5">
                متابعة اللعبة
              </span>
            </button>
          {/if}

          <button
            onclick={startNewGame}
            class="group flex items-center gap-3 py-1 text-right cursor-pointer bg-transparent border-0"
          >
            <span
              class="w-1 transition-all duration-200 {!$uiStore.hasStartedGame
                ? 'h-6 bg-wheat-gold group-hover:h-7'
                : 'h-0 bg-wheat-gold/0 group-hover:h-6 group-hover:bg-wheat-gold'}"
            ></span>
            <span
              class="text-2xl sm:text-3xl font-bold font-heading transition-all duration-200 group-hover:-translate-x-1.5 {!$uiStore.hasStartedGame
                ? 'text-wheat-gold group-hover:text-wheat-light'
                : 'text-wheat-mid group-hover:text-wheat-gold'}"
            >
              بدء لعبة جديدة
            </span>
          </button>

          <button
            onclick={() => (menuView = 'themes')}
            class="group flex items-center gap-3 py-1 text-right cursor-pointer bg-transparent border-0"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="text-xl sm:text-2xl font-bold text-wheat-mid group-hover:text-wheat-gold font-heading transition-all duration-200 group-hover:-translate-x-1.5">
              المظهر
            </span>
          </button>

          {#if canInstallApp}
            <button
              onclick={installApp}
              class="group flex items-center gap-3 py-1 text-right cursor-pointer bg-transparent border-0"
            >
              <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
              <span class="text-xl sm:text-2xl font-bold text-wheat-mid group-hover:text-wheat-gold font-heading transition-all duration-200 group-hover:-translate-x-1.5">
                تثبيت اللعبة كتطبيق
              </span>
            </button>
          {/if}
          {#if iosInstallHintOpen}
            <p class="pr-4 text-xs text-wheat-dark leading-relaxed text-right">
              اضغط زر المشاركة في متصفح سفاري، ثم اختر «إضافة إلى الشاشة الرئيسية».
            </p>
          {/if}

          <button
            onclick={openAbout}
            class="group flex items-center gap-3 py-1 text-right cursor-pointer bg-transparent border-0"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="text-xl sm:text-2xl font-bold text-wheat-mid group-hover:text-wheat-gold font-heading transition-all duration-200 group-hover:-translate-x-1.5">
              عن اللعبة
            </span>
          </button>

          <a
            href="https://www.youtube.com/channel/UCQkqyo2DYRee_1qlHZ1M6Dg/join"
            target="_blank"
            rel="noreferrer"
            class="group flex items-center gap-3 py-1 text-right cursor-pointer"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="text-xl sm:text-2xl font-bold text-wheat-mid group-hover:text-wheat-gold font-heading transition-all duration-200 group-hover:-translate-x-1.5">
              ادعمني مالياً
            </span>
          </a>

          <a
            href={PROJECT_LINKS.repo}
            target="_blank"
            rel="noreferrer"
            class="group flex items-center gap-3 py-1 text-right cursor-pointer"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="text-xl sm:text-2xl font-bold text-wheat-mid group-hover:text-wheat-gold font-heading transition-all duration-200 group-hover:-translate-x-1.5">
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
            class="text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer"
          >
            <GameIcon name="brand-github" cls="w-4 h-4 shrink-0" />
          </a>
          <a
            href="https://x.com/hadealahmad"
            target="_blank"
            rel="noreferrer"
            aria-label="Twitter: @hadealahmad"
            class="text-wheat-dark hover:text-wheat-gold transition-colors cursor-pointer"
          >
            <GameIcon name="brand-x" cls="w-4 h-4 shrink-0" />
          </a>
          <button
            onclick={updateGame}
            aria-label="تحديث اللعبة — فرض إعادة التحميل"
            title="تحديث اللعبة — فرض إعادة التحميل"
            class="cursor-pointer font-mono text-[11px] transition-colors bg-transparent border-0 {$versionStore.isChecking ? 'animate-pulse text-wheat-gold' : 'text-wheat-dark hover:text-wheat-gold'}"
          >
            <span dir="ltr">{$versionStore.currentVersion}</span>
            {#if $versionStore.hasUpdate}
              <span class="px-1.5 py-px bg-amber-400 text-forest-deep text-[9px] font-bold">
                جديد{$versionStore.latestVersion ? `: ${$versionStore.latestVersion}` : ''}
              </span>
            {/if}
          </button>
        </div>
      {:else if menuView === 'themes'}
        <div class="text-right">
          <h1 class="text-3xl sm:text-4xl font-bold text-wheat-light font-heading tracking-tight">
            المظهر
          </h1>
        </div>

        <div class="my-auto py-8 flex flex-col items-start gap-5 text-right">
          {#each THEME_IDS as id (id)}
            <button
              role="menuitemradio"
              aria-checked={id === $theme}
              onclick={() => pickTheme(id)}
              class="group flex items-center gap-4 py-1 text-right cursor-pointer bg-transparent border-0"
            >
              <span
                class="w-1 transition-all duration-200 {id === $theme
                  ? 'h-6 bg-wheat-gold'
                  : 'h-0 bg-wheat-gold/0 group-hover:h-6 group-hover:bg-wheat-gold'}"
              ></span>
              <span
                class="text-xl sm:text-2xl font-bold font-heading transition-all duration-200 group-hover:-translate-x-1.5 {id === $theme
                  ? 'text-wheat-gold'
                  : 'text-wheat-mid group-hover:text-wheat-gold'}"
              >
                {THEMES[id].labelAr}
              </span>
              <span class="flex items-center gap-1 mr-2" aria-hidden="true">
                {#each THEMES[id].swatches as hex (hex)}
                  <span
                    class="w-3 h-3 shrink-0 border border-charcoal-light"
                    style="background-color:{hex}"
                  ></span>
                {/each}
              </span>
            </button>
          {/each}

          <div class="flex items-center gap-5 py-1 pr-4">
            <span class="text-xl sm:text-2xl font-bold text-wheat-mid font-heading">مؤثر شاشة CRT</span>
            <ToggleSwitch
              checked={$uiStore.crtTube}
              label="تبديل مؤثر شاشة CRT"
              onchange={(v) => uiStore.setCrtTube(v)}
            />
          </div>

          <button
            onclick={() => (menuView = 'main')}
            aria-label="رجوع إلى الإعدادات"
            class="group mt-4 flex items-center gap-3 py-1 text-right cursor-pointer bg-transparent border-0"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="text-lg sm:text-xl font-bold text-wheat-dark group-hover:text-wheat-light font-heading transition-all duration-200 group-hover:-translate-x-1.5">
              رجوع
            </span>
          </button>
        </div>

        <div></div>
      {:else if menuView === 'restart'}
        <div class="text-right">
          <h1 class="text-3xl sm:text-4xl font-bold text-wheat-light font-heading tracking-tight">
            تأكيد إعادة التشغيل
          </h1>
        </div>

        <div class="my-auto py-8 flex flex-col items-start gap-5 text-right">
          <p class="pr-4 text-base sm:text-lg text-wheat-mid leading-relaxed">
            ستفقد كلّ التقدم الذي أجريته في اللعبة.
          </p>

          <button
            type="button"
            onclick={confirmNewGame}
            class="group mt-2 flex items-center gap-3 py-1 text-right cursor-pointer bg-transparent border-0"
          >
            <span class="h-6 w-1 bg-umber-crimson transition-all duration-200 group-hover:h-7"></span>
            <span class="text-2xl sm:text-3xl font-bold text-umber-crimson group-hover:text-wheat-light font-heading transition-all duration-200 group-hover:-translate-x-1.5">
              تأكيد إعادة البدء
            </span>
          </button>

          <button
            type="button"
            onclick={closeSettings}
            class="group flex items-center gap-3 py-1 text-right cursor-pointer bg-transparent border-0"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="text-xl sm:text-2xl font-bold text-wheat-mid group-hover:text-wheat-gold font-heading transition-all duration-200 group-hover:-translate-x-1.5">
              إلغاء ومتابعة اللعبة
            </span>
          </button>

          <button
            type="button"
            onclick={() => (menuView = 'main')}
            class="group flex items-center gap-3 py-1 text-right cursor-pointer bg-transparent border-0"
          >
            <span class="h-0 w-1 bg-wheat-gold/0 transition-all duration-200 group-hover:h-6 group-hover:bg-wheat-gold"></span>
            <span class="text-lg sm:text-xl font-bold text-wheat-dark group-hover:text-wheat-light font-heading transition-all duration-200 group-hover:-translate-x-1.5">
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
