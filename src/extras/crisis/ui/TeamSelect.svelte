<script lang="ts">
  import GameIcon from '../../../lib/ui/GameIcon.svelte';
  import { fx } from '../../../lib/ui/fx/feedback';
  import ExtrasBar from '../../shared/ExtrasBar.svelte';
  import {
    TEAMS,
    createDeckCard,
    isTeamUnlocked,
    type DeckCard,
    type TeamId,
  } from '../engine';
  import {
    cardDetailTarget,
    metaStore,
    openTitleScreen,
    runStore,
    startNewRun,
  } from '../stores';
  import Card from './Card.svelte';
  import Glyph from './Glyph.svelte';

  const TEAM_IDS: TeamId[] = ['rescue', 'development', 'resolve'];

  let selectedTeam = $state<TeamId>('rescue');
  const meta = $derived($metaStore);
  const hasSavedRun = $derived(Boolean($runStore && $runStore.screen !== 'ended'));

  const selectedTeamDef = $derived(TEAMS[selectedTeam]);
  const selectedUnlocked = $derived(isTeamUnlocked(meta, selectedTeam));

  const starterCards = $derived<DeckCard[]>(
    selectedTeamDef.starterCardIds.map((defId, idx) =>
      createDeckCard(defId, `preview-${selectedTeam}-${idx}`),
    ),
  );

  function selectTeam(id: TeamId): void {
    fx('select');
    selectedTeam = id;
  }
</script>

<div class="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--c-bg)] select-none">
  <ExtrasBar
    title="اختر التشكيلة"
    backLabel="ارجع"
    onBack={() => {
      fx('tap');
      openTitleScreen();
    }}
  />

  <div class="scroll-area min-h-0 flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 lg:px-10 lg:py-6">
    <div class="mx-auto max-w-[1040px] space-y-5">
      <!-- 3 Team Selector Cards -->
      <div class="grid grid-cols-1 gap-2.5 md:grid-cols-3 lg:gap-4">
        {#each TEAM_IDS as id (id)}
          {@const team = TEAMS[id]}
          {@const unlocked = isTeamUnlocked(meta, id)}
          {@const active = selectedTeam === id}
          <button
            type="button"
            onclick={() => selectTeam(id)}
            class="pressable flex min-h-[76px] flex-col justify-between border p-3.5 text-start transition-colors {active
              ? 'border-[var(--c-accent)] bg-[var(--c-panel)] outline outline-1 outline-[var(--c-accent)]'
              : 'border-[var(--c-line-strong)] bg-[var(--c-strip)]/60 hover:bg-[var(--c-panel)]'} {!unlocked
              ? 'opacity-80'
              : ''}"
          >
            <div class="flex w-full items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--c-line-strong)] bg-[var(--c-bg)] {unlocked
                    ? 'text-[var(--c-accent)]'
                    : 'text-[var(--c-muted)]'}"
                >
                  {#if unlocked}
                    <Glyph name={team.glyph} cls="h-5 w-5" />
                  {:else}
                    <GameIcon name="lock" cls="h-4 w-4" />
                  {/if}
                </div>
                <div>
                  <div class="text-[15px] font-bold text-[var(--c-text)]">{team.name}</div>
                  {#if !unlocked}
                    <div class="text-[11px] font-medium text-[var(--c-accent)]">
                      {team.unlockRule}
                    </div>
                  {:else}
                    <div class="text-[11px] text-[var(--c-muted)]">
                      <span class="num"><bdi dir="ltr">{team.starterCardIds.length}</bdi></span> بطاقات ابتدائية
                    </div>
                  {/if}
                </div>
              </div>
              {#if active && unlocked}
                <span class="border border-[var(--c-accent)] bg-[var(--c-accent)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--c-accent)]">
                  مختار
                </span>
              {/if}
            </div>

            <p class="mt-2.5 text-[12px] leading-[1.55] text-[var(--c-text-2)]">
              {team.description}
            </p>
          </button>
        {/each}
      </div>

      <!-- Starter Deck Preview -->
      <section class="border border-[var(--c-line-strong)] bg-[var(--c-panel)] p-3.5 sm:p-5">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--c-line)] pb-2.5">
          <div class="flex items-center gap-2">
            <Glyph name="deck" cls="h-4 w-4 text-[var(--c-accent)]" />
            <h2 class="text-[14px] font-bold text-[var(--c-text)]">
              بطاقات البداية — {selectedTeamDef.name}
            </h2>
          </div>
          <span class="text-[11px] text-[var(--c-muted)]">انقر بطاقة لمعاينة تفاصيلها</span>
        </div>

        <div
          class="mt-3.5 flex flex-wrap justify-center gap-2.5 sm:justify-start lg:gap-3"
        >
          {#each starterCards as card (card.uid)}
            <button
              type="button"
              onclick={() => {
                fx('tap');
                cardDetailTarget.set({ kind: 'deckCard', card });
              }}
              aria-label="اعرض تفاصيل البطاقة"
              class="pressable p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--c-accent)]"
            >
              <Card deckCard={card} size="md" />
            </button>
          {/each}
        </div>
      </section>
    </div>
  </div>

  <!-- Footer CTA -->
  <footer class="shrink-0 border-t border-[var(--c-line-strong)] bg-[var(--c-strip)] px-4 py-3 sm:px-6">
    <div class="mx-auto flex max-w-[1040px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="text-[12px] text-[var(--c-muted)]">
        {#if !selectedUnlocked}
          <span class="inline-flex items-center gap-1.5 font-bold text-[var(--c-accent)]">
            <GameIcon name="lock" cls="h-3.5 w-3.5" />
            <span>{selectedTeamDef.unlockRule}</span>
          </span>
        {:else if hasSavedRun}
          <span class="text-[var(--c-neg)]">بدء جولة جديدة يستبدل الجولة المحفوظة الحالية.</span>
        {:else}
          <span>تبدأ الجولة في الفصل الأول برصيد <bdi dir="ltr">3</bdi> نقاط ثقة.</span>
        {/if}
      </div>

      <button
        type="button"
        disabled={!selectedUnlocked}
        onclick={() => startNewRun(selectedTeam)}
        class="btn-primary-chamfer pressable flex min-h-[48px] w-full items-center justify-center px-6 py-2.5 text-[15px] font-bold disabled:pointer-events-none disabled:opacity-40 sm:w-auto sm:min-w-[220px]"
      >
        ابدأ الجولة
      </button>
    </div>
  </footer>
</div>
