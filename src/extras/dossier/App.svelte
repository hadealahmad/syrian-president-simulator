<script lang="ts">
  import type { RecordsTab } from '../../lib/records';
  import AchievementToast from '../../lib/records/ui/AchievementToast.svelte';
  import RecordsScreen from '../../lib/records/ui/RecordsScreen.svelte';
  import { fx } from '../../lib/ui/fx/feedback';
  import { DOSSIER_DECK } from './content';
  import { ENDINGS } from './content/endings';
  import {
    chooseAnswer,
    createGame,
    getCurrentCard,
    postponeCard,
  } from './engine/engine';
  import type { DossierState } from './engine/types';
  import EndingScreen from './EndingScreen.svelte';
  import HowToModal from './HowToModal.svelte';
  import PlayScreen from './PlayScreen.svelte';
  import {
    DOSSIER_ACHIEVEMENTS,
    applyDossierRecordsTransition,
    attachFreshDossierRunMeta,
    dossierRecords,
    hydrateLoadedDossierRunMeta,
  } from './records/store';
  import TitleScreen from './TitleScreen.svelte';
  import {
    clearSavedDossier,
    loadSavedDossier,
    saveDossier,
  } from './ui-helpers';

  type ScreenMode = 'title' | 'play' | 'ending';

  let savedState = $state<DossierState | null>(loadSavedDossier());
  let game = $state<DossierState>(attachFreshDossierRunMeta(createGame(DOSSIER_DECK)));
  let screen = $state<ScreenMode>('title');
  let howToOpen = $state(false);
  let recordsOpen = $state(false);
  let recordsTab = $state<RecordsTab>('achievements');

  let currentCard = $derived(getCurrentCard(game, DOSSIER_DECK));

  function cloneState(s: DossierState): DossierState {
    return JSON.parse(JSON.stringify(s)) as DossierState;
  }

  function openRecords(tab: RecordsTab): void {
    recordsTab = tab;
    recordsOpen = true;
  }

  function handleStartNew(): void {
    fx('confirm');
    const fresh = attachFreshDossierRunMeta(createGame(DOSSIER_DECK));
    game = fresh;
    savedState = cloneState(fresh);
    saveDossier(fresh);
    screen = 'play';
  }

  function handleContinue(): void {
    if (!savedState) {
      handleStartNew();
      return;
    }
    fx('confirm');
    const resumed = cloneState(savedState);
    if (!getCurrentCard(resumed, DOSSIER_DECK)) {
      handleStartNew();
      return;
    }
    hydrateLoadedDossierRunMeta(resumed, DOSSIER_DECK);
    saveDossier(resumed);
    savedState = cloneState(resumed);
    game = resumed;
    screen = 'play';
  }

  function handleAnswer(side: 'right' | 'left'): void {
    const prevState = game;
    const prevTurn = prevState.turn;
    const answeredCard = getCurrentCard(prevState, DOSSIER_DECK);
    const next = cloneState(prevState);
    chooseAnswer(next, side, DOSSIER_DECK);
    applyDossierRecordsTransition(prevState, next, answeredCard, dossierRecords);
    game = next;

    if (next.isGameOver) {
      clearSavedDossier();
      savedState = null;
      const endDef = next.endingId ? ENDINGS[next.endingId] : null;
      fx(endDef?.kind === 'collapse' ? 'bad' : 'endTurn');
      screen = 'ending';
      return;
    }

    saveDossier(next);
    savedState = cloneState(next);
    fx(next.turn > prevTurn ? 'endTurn' : 'confirm');
  }

  function handlePostpone(): void {
    const next = cloneState(game);
    const ok = postponeCard(next, DOSSIER_DECK);
    if (!ok) {
      fx('error');
      return;
    }
    fx('cancel');
    game = next;
    saveDossier(next);
    savedState = cloneState(next);
  }
</script>

<div class="x-frame bg-[var(--c-bg)] text-[var(--c-text)]">
  {#if screen === 'title'}
    <TitleScreen
      {savedState}
      onStartNew={handleStartNew}
      onContinue={handleContinue}
      onOpenHowTo={() => (howToOpen = true)}
      onOpenRecords={() => openRecords('achievements')}
    />
  {:else if screen === 'play'}
    <PlayScreen
      state={game}
      card={currentCard}
      howToOpen={howToOpen || recordsOpen}
      onAnswer={handleAnswer}
      onPostpone={handlePostpone}
      onOpenHowTo={() => (howToOpen = true)}
    />
  {:else}
    <EndingScreen
      state={game}
      onRestart={handleStartNew}
      onOpenRuns={() => openRecords('runs')}
    />
  {/if}

  {#if howToOpen}
    <HowToModal onClose={() => (howToOpen = false)} />
  {/if}

  {#if recordsOpen}
    <RecordsScreen
      defs={DOSSIER_ACHIEVEMENTS}
      store={dossierRecords}
      title="سجل الإنجازات والولايات"
      initialTab={recordsTab}
      onClose={() => (recordsOpen = false)}
    />
  {/if}

  <AchievementToast defs={DOSSIER_ACHIEVEMENTS} store={dossierRecords} />
</div>

