<script lang="ts">
  import ExtrasBar from '../shared/ExtrasBar.svelte';
  import GameIcon from '../../lib/ui/GameIcon.svelte';
</script>

<div class="x-frame">
  <ExtrasBar title="غرفة الأزمات" />
  <main class="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center px-6 pb-10">
    <span class="flex h-16 w-16 items-center justify-center border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-accent)]">
      <GameIcon name="hourglass" cls="h-9 w-9" />
    </span>
    <p class="mt-6 text-[14px] font-bold text-[var(--c-accent)]">قريبًا</p>
    <h2 class="font-display mt-1 text-[38px] font-bold leading-[1.15]">غرفة الأزمات</h2>
    <p class="mt-3 text-[16px] leading-[1.7] text-[var(--c-text-2)]">
      لعبة بطاقات تقرأ فيها الأزمة قبل وصولها وتوزّع فرقك على أربع جبهات. نعمل على إكمالها.
    </p>
    <a
      href="../index.html"
      class="kit-btn sec mt-8 flex min-h-[48px] items-center justify-center self-start px-6 text-[15px] no-underline"
    >
      عد إلى الألعاب
    </a>
  </main>
</div>
