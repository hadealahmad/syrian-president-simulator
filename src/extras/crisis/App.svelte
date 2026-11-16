<script lang="ts">
  import { get } from 'svelte/store';
  import { fx } from '../../lib/ui/fx/feedback';
  import {
    cardDetailTarget,
    deckSheetMode,
    howToOpen,
    mapLegendOpen,
    runStore,
    settingsOpen,
    viewStore,
  } from './stores';
  import BattleScreen from './ui/BattleScreen.svelte';
  import CardDetailSheet from './ui/CardDetailSheet.svelte';
  import DeckSheet from './ui/DeckSheet.svelte';
  import HowTo from './ui/HowTo.svelte';
  import MapScreen from './ui/MapScreen.svelte';
  import EventScreen from './ui/NodeScreens/EventScreen.svelte';
  import MarketScreen from './ui/NodeScreens/MarketScreen.svelte';
  import RecruitScreen from './ui/NodeScreens/RecruitScreen.svelte';
  import RestScreen from './ui/NodeScreens/RestScreen.svelte';
  import TrainScreen from './ui/NodeScreens/TrainScreen.svelte';
  import RewardScreen from './ui/RewardScreen.svelte';
  import RunEnd from './ui/RunEnd.svelte';
  import Settings from './ui/Settings.svelte';
  import TeamSelect from './ui/TeamSelect.svelte';
  import TitleScreen from './ui/TitleScreen.svelte';

  const view = $derived($viewStore);
  const run = $derived($runStore);

  function handleWindowKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Escape') return;
    if (get(cardDetailTarget)) {
      e.preventDefault();
      fx('cancel');
      cardDetailTarget.set(null);
      return;
    }
    if (get(deckSheetMode)) {
      e.preventDefault();
      fx('cancel');
      deckSheetMode.set(null);
      return;
    }
    if (get(mapLegendOpen)) {
      e.preventDefault();
      fx('cancel');
      mapLegendOpen.set(false);
      return;
    }
    if (get(howToOpen)) {
      e.preventDefault();
      fx('cancel');
      howToOpen.set(false);
      return;
    }
    if (get(settingsOpen)) {
      e.preventDefault();
      fx('cancel');
      settingsOpen.set(false);
    }
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<main dir="rtl" class="x-frame font-arabic">
  {#if view === 'title'}
    <TitleScreen />
  {:else if view === 'team-select'}
    <TeamSelect />
  {:else if run}
    {#if run.screen === 'map'}
      <MapScreen {run} />
    {:else if run.screen === 'battle' && run.battle}
      <BattleScreen {run} />
    {:else if run.screen === 'reward' && run.reward}
      <RewardScreen {run} />
    {:else if run.screen === 'recruit' && run.recruit}
      <RecruitScreen {run} />
    {:else if run.screen === 'train' && run.train}
      <TrainScreen {run} />
    {:else if run.screen === 'rest'}
      <RestScreen {run} />
    {:else if run.screen === 'market' && run.market}
      <MarketScreen {run} />
    {:else if run.screen === 'event' && run.activeEvent}
      <EventScreen {run} />
    {:else if run.screen === 'ended'}
      <RunEnd {run} />
    {:else}
      <TitleScreen />
    {/if}
  {:else}
    <TitleScreen />
  {/if}

  <DeckSheet />
  <CardDetailSheet />
  <HowTo />
  <Settings />
</main>
