<script lang="ts">
  import GameIcon from '../../lib/ui/GameIcon.svelte';

  const games = [
    {
      href: './dossier/index.html',
      icon: 'scroll-quill',
      kicker: 'قرارات سريعة',
      title: 'قرارات عاجلة',
      pitch: 'ملف بعد ملف على مكتب الرئيس، ولكل ملف جوابان. حافظ على أربعة موازين عشرين عامًا.',
      time: 'نحو 10 دقائق',
      soon: false,
    },
    {
      href: './crisis/index.html',
      icon: 'siren',
      kicker: 'لعبة بطاقات',
      title: 'غرفة الأزمات',
      pitch: 'وزّع فرقك على أربع جبهات، واقرأ الأزمة قبل وصولها، واكسب الميزان.',
      time: '20–30 دقيقة',
      soon: true,
    },
  ];
</script>

<div class="x-frame overflow-y-auto">
  <main class="mx-auto flex w-full max-w-[880px] flex-1 flex-col px-5 pb-8 pt-6 sm:px-8 sm:pt-10">
    <a
      href="../"
      class="pressable inline-flex min-h-11 items-center gap-1.5 self-start text-[14px] font-medium text-[var(--c-muted)] no-underline hover:text-[var(--c-text)]"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      رئيس الجمهورية
    </a>

    <header class="mt-4">
      <p class="text-[14px] font-bold text-[var(--c-accent)]">من عالم رئيس الجمهورية</p>
      <h1 class="font-display mt-1 text-[40px] font-bold leading-[1.15] sm:text-[56px]">ألعاب جانبية</h1>
      <p class="mt-2 max-w-[34rem] text-[16px] leading-[1.6] text-[var(--c-muted)]">
        جولات أقصر من اللعبة الرئيسية، بالأزمات نفسها وبطرق لعب مختلفة.
      </p>
    </header>

    <ul class="mt-8 grid gap-3 sm:grid-cols-2">
      {#each games as g (g.href)}
        <li>
          {#if g.soon}
            <div
              class="flex h-full flex-col border border-dashed border-[var(--c-line-strong)] bg-[var(--c-strip)] p-4 sm:p-5"
              aria-disabled="true"
            >
              <div class="flex items-start gap-3">
                <span class="flex h-14 w-14 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-bg)] text-[var(--c-muted)]">
                  <GameIcon name={g.icon} cls="h-8 w-8" />
                </span>
                <span class="min-w-0">
                  <span class="block text-[12px] font-bold text-[var(--c-muted)]">{g.kicker}</span>
                  <span class="font-heading block text-[22px] font-bold leading-tight text-[var(--c-text-2)]">{g.title}</span>
                </span>
              </div>
              <p class="mt-3 flex-1 text-[15px] leading-[1.6] text-[var(--c-muted)]">{g.pitch}</p>
              <div class="mt-4 flex items-center justify-end">
                <span class="flex min-h-[44px] items-center gap-2 border border-[var(--c-line-strong)] px-4 text-[14px] font-bold text-[var(--c-muted)]">
                  <GameIcon name="hourglass" cls="h-4 w-4" />
                  قريبًا
                </span>
              </div>
            </div>
          {:else}
          <a
            href={g.href}
            class="group flex h-full flex-col border border-[var(--c-line)] bg-[var(--c-panel)] p-4 no-underline transition-colors hover:border-[var(--c-line-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)] sm:p-5"
          >
            <div class="flex items-start gap-3">
              <span class="flex h-14 w-14 shrink-0 items-center justify-center border border-[var(--c-line)] bg-[var(--c-strip)] text-[var(--c-accent)]">
                <GameIcon name={g.icon} cls="h-8 w-8" />
              </span>
              <span class="min-w-0">
                <span class="block text-[12px] font-bold text-[var(--c-muted)]">{g.kicker}</span>
                <span class="font-heading block text-[22px] font-bold leading-tight text-[var(--c-text)]">{g.title}</span>
              </span>
            </div>
            <p class="mt-3 flex-1 text-[15px] leading-[1.6] text-[var(--c-text-2,var(--c-muted))]">{g.pitch}</p>
            <div class="mt-4 flex items-center justify-between gap-3">
              <span class="num text-[13px] text-[var(--c-muted)]">{g.time}</span>
              <span class="btn-primary-chamfer flex min-h-[44px] items-center px-6 text-[15px] font-bold">العب</span>
            </div>
          </a>
          {/if}
        </li>
      {/each}
    </ul>

    <p class="mt-auto pt-10 text-[12px] text-[var(--c-muted)]">
      الأيقونات من game-icons.net بترخيص CC BY 3.0.
    </p>
  </main>
</div>
