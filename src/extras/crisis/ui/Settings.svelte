<script lang="ts">
  import { THEMES, THEME_IDS, applyTheme, storedTheme, type ThemeId } from '../../../lib/themes';
  import GameIcon from '../../../lib/ui/GameIcon.svelte';
  import { fx } from '../../../lib/ui/fx/feedback';
  import {
    abandonAndRestart,
    metaStore,
    runStore,
    settingsOpen,
    updateMetaSettings,
  } from '../stores';

  let open = $derived($settingsOpen);
  let meta = $derived($metaStore);
  let run = $derived($runStore);

  let activeTheme = $state<ThemeId>(storedTheme());
  let confirmRestart = $state(false);

  $effect(() => {
    if (open) {
      activeTheme = storedTheme();
      confirmRestart = false;
    }
  });

  function close(): void {
    fx('cancel');
    settingsOpen.set(false);
  }

  function selectTheme(id: ThemeId): void {
    activeTheme = id;
    applyTheme(id);
    fx('select');
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    onclick={(e) => {
      if (e.target === e.currentTarget) close();
    }}
    class="fixed inset-0 z-[130] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label="الإعدادات"
      class="shell-enter-bottom flex max-h-[calc(100dvh-24px)] w-full max-w-[460px] flex-col border-t-2 border-t-[var(--c-accent)] bg-[var(--c-panel)] sm:border sm:border-[var(--c-line-strong)] sm:border-t-2 sm:border-t-[var(--c-accent)]"
    >
      <header class="flex min-h-[50px] shrink-0 items-center justify-between border-b border-[var(--c-line)] bg-[var(--c-strip)] ps-4">
        <h2 class="font-heading text-[16px] font-bold text-[var(--c-text)]">الإعدادات</h2>
        <button
          type="button"
          onclick={close}
          aria-label="إغلاق الإعدادات"
          class="pressable flex min-h-[44px] min-w-[44px] items-center justify-center border-s border-[var(--c-line)] text-[var(--c-muted)] hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]"
        >
          <GameIcon name="cross-mark" cls="h-4 w-4" />
        </button>
      </header>

      <div class="scroll-area min-h-0 flex-1 space-y-3.5 overflow-y-auto p-4">
        <!-- Speed -->
        <div class="space-y-1.5">
          <span class="block text-[12px] font-bold text-[var(--c-muted)]">سرعة تنفيذ الجولة</span>
          <div class="seg">
            <button
              type="button"
              class="min-h-[44px] {meta.speed === 'normal' ? 'on' : ''}"
              onclick={() => updateMetaSettings({ speed: 'normal' })}
            >
              عادية (<bdi dir="ltr">1×</bdi>)
            </button>
            <button
              type="button"
              class="min-h-[44px] {meta.speed === 'fast' ? 'on' : ''}"
              onclick={() => updateMetaSettings({ speed: 'fast' })}
            >
              سريعة (<bdi dir="ltr">2×</bdi>)
            </button>
          </div>
        </div>

        <!-- Sound & Haptics -->
        <div class="space-y-1.5">
          <span class="block text-[12px] font-bold text-[var(--c-muted)]">الصوت والاهتزاز</span>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              onclick={() => updateMetaSettings({ sound: !meta.sound })}
              aria-pressed={meta.sound}
              class="kit-btn min-h-[44px] {meta.sound ? 'on' : 'sec'}"
            >
              <span>الصوت: {meta.sound ? 'مفعّل' : 'مكتوم'}</span>
            </button>
            <button
              type="button"
              onclick={() => updateMetaSettings({ haptics: !meta.haptics })}
              aria-pressed={meta.haptics}
              class="kit-btn min-h-[44px] {meta.haptics ? 'on' : 'sec'}"
            >
              <span>الاهتزاز: {meta.haptics ? 'مفعّل' : 'متوقف'}</span>
            </button>
          </div>
        </div>

        <!-- Theme -->
        <div class="space-y-1.5">
          <span class="block text-[12px] font-bold text-[var(--c-muted)]">المظهر اللوني</span>
          <div class="seg">
            {#each THEME_IDS as id (id)}
              <button
                type="button"
                class="min-h-[44px] {activeTheme === id ? 'on' : ''}"
                onclick={() => selectTheme(id)}
              >
                {THEMES[id].labelAr}
              </button>
            {/each}
          </div>
        </div>

        <!-- Abandon & Restart active run -->
        {#if run && run.screen !== 'ended'}
          <div class="border-t border-[var(--c-line)] pt-3">
            {#if !confirmRestart}
              <button
                type="button"
                onclick={() => {
                  fx('tap');
                  confirmRestart = true;
                }}
                class="kit-btn danger min-h-[44px] w-full text-[13px] font-bold"
              >
                ابدأ من جديد
              </button>
            {:else}
              <div class="space-y-2 border border-[var(--c-neg)] bg-[var(--c-ev-bg)] p-3">
                <p class="text-[12.5px] font-medium text-[var(--c-text)]">
                  سيُنهي هذا الإجراء جولتك الحالية المحفوظة.
                </p>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    onclick={abandonAndRestart}
                    class="kit-btn danger min-h-[44px] flex-1 bg-[var(--c-neg)] text-[var(--c-ink)] font-bold"
                  >
                    ابدأ جولة جديدة
                  </button>
                  <button
                    type="button"
                    onclick={() => {
                      fx('cancel');
                      confirmRestart = false;
                    }}
                    class="kit-btn sec min-h-[44px] px-4"
                  >
                    تراجع
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
