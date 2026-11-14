import { get, writable } from 'svelte/store';
import type { EventCard, GameState, TurnDirectives } from '../engine/types';
import { MAX_TURNS } from '../engine/constants';

export const GTM_CONTAINER_ID = 'GTM-MP8775QZ';
export const ANALYTICS_CONSENT_STORAGE_KEY = 'president_analytics_consent_v1';

export type AnalyticsConsent = 'unset' | 'granted' | 'denied';

export type NewGameTrackSource =
  | 'title_menu'
  | 'settings_menu'
  | 'restart_modal'
  | 'fail_screen'
  | 'century_report'
  | 'direct';

export interface AnalyticsState {
  consent: AnalyticsConsent;
  enabled: boolean;
}

type AnalyticsParamValue = string | number | boolean | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let gtmBootstrapped = false;

function loadStoredConsent(): AnalyticsConsent {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
      if (raw === 'granted' || raw === 'denied') {
        return raw;
      }
    }
  } catch {
    /* sandboxed or private storage */
  }
  return 'unset';
}

function persistConsent(consent: AnalyticsConsent): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (consent === 'unset') {
        window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
      } else {
        window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);
      }
    }
  } catch {
    /* ignore storage quota / privacy errors */
  }
}

function ensureGtagHelper(): ((...args: unknown[]) => void) | null {
  if (typeof window === 'undefined') return null;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // Push `arguments` verbatim to match Google Tag / GTM expectations:
      // `function gtag(){dataLayer.push(arguments);}`
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  return window.gtag;
}

function bootstrapGtm(): void {
  if (typeof window === 'undefined') return;
  try {
    const gtag = ensureGtagHelper();
    if (!gtag) return;

    if (!gtmBootstrapped) {
      gtmBootstrapped = true;
      gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      gtag('js', new Date());

      if (
        typeof document !== 'undefined' &&
        document.head &&
        !document.querySelector(`script[data-gtm-id="${GTM_CONTAINER_ID}"]`)
      ) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
        script.dataset.gtmId = GTM_CONTAINER_ID;
        document.head.appendChild(script);
      }
    } else {
      gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
  } catch {
    /* Never let blocker/extension tampering disrupt game execution */
  }
}

function createAnalyticsStore() {
  const initialConsent = loadStoredConsent();
  const store = writable<AnalyticsState>({
    consent: initialConsent,
    enabled: initialConsent === 'granted',
  });

  if (typeof window !== 'undefined' && initialConsent === 'granted') {
    bootstrapGtm();
  }

  return {
    subscribe: store.subscribe,

    setConsent(granted: boolean): void {
      const nextConsent: AnalyticsConsent = granted ? 'granted' : 'denied';
      persistConsent(nextConsent);
      store.set({
        consent: nextConsent,
        enabled: granted,
      });

      if (granted) {
        bootstrapGtm();
        trackAnalyticsEvent('analytics_consent_updated', {
          consent_state: 'granted',
        });
      } else if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        try {
          window.gtag('consent', 'update', {
            analytics_storage: 'denied',
          });
        } catch {
          /* ignore */
        }
      }
    },

    /** Test-only helper for resetting internal bootstrap state in Node tests. */
    resetForTests(): void {
      gtmBootstrapped = false;
      const stored = loadStoredConsent();
      store.set({
        consent: stored,
        enabled: stored === 'granted',
      });
      if (typeof window !== 'undefined' && stored === 'granted') {
        bootstrapGtm();
      }
    },
  };
}

export const analyticsStore = createAnalyticsStore();

export function trackAnalyticsEvent(
  eventName: string,
  params: Record<string, AnalyticsParamValue> = {}
): void {
  if (typeof window === 'undefined') return;
  if (!get(analyticsStore).enabled) return;

  try {
    bootstrapGtm();
    const gtag = window.gtag;
    if (typeof gtag !== 'function') return;

    const cleanParams: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        cleanParams[key] = value;
      }
    }

    gtag('event', eventName, cleanParams);
  } catch {
    /* ignore */
  }
}

function deriveSouthernEndingId(state: GameState): string {
  const suwayda = state.governorates?.['as_suwayda'];
  if ((suwayda?.suwaydaIntegrationIndex ?? 0) >= 80) return 'historic_accord';
  if ((suwayda?.suwaydaSecessionProb ?? 0) >= 60) return 'cantons_smuggling';
  return 'frozen_buffer';
}

function derivePreviousEndingId(state: GameState): string {
  if (!state.isGameOver) return 'none';
  if (state.centuryEnding?.id) return state.centuryEnding.id;
  if (state.failState?.type) return state.failState.type;
  return 'unknown';
}

export function trackGameSessionStart(options: {
  isRestart: boolean;
  source: NewGameTrackSource;
  previousState: GameState;
  nextState: GameState;
}): void {
  const { isRestart, source, previousState, nextState } = options;

  if (!isRestart) {
    trackAnalyticsEvent('game_start', {
      source,
      seed: nextState.seed,
      turn_number: nextState.turnNumber,
      calendar_year: nextState.calendarYear,
    });
    return;
  }

  trackAnalyticsEvent('game_restart', {
    source,
    previous_turn: Math.min(previousState.turnNumber, MAX_TURNS),
    was_game_over: previousState.isGameOver,
    previous_ending_id: derivePreviousEndingId(previousState),
    seed: nextState.seed,
  });
}

export function trackGameOutcome(
  state: GameState,
  triggerSource: 'turn_commit' | 'event_option' | 'unresolved_crisis'
): void {
  if (!state.isGameOver) return;

  const playedTurn = Math.min(state.turnNumber, MAX_TURNS);
  const reservesUsdM = Math.round(state.macro.reservesUSD / 1_000_000);
  const civicTrust = Math.round(state.macro.civicTrust);

  if (state.centuryEnding) {
    const ending = state.centuryEnding;
    const southernEndingId = deriveSouthernEndingId(state);
    const sovereignDebtUsdB =
      Math.round(((state.macro.sovereignDebtUSD ?? 0) / 1_000_000_000) * 10) / 10;

    trackAnalyticsEvent('game_win', {
      ending_id: ending.id,
      ending_title: ending.titleAr,
      southern_ending_id: southernEndingId,
      southern_ending_title: ending.southernTitleAr,
      final_score: ending.finalScore,
      turn_number: MAX_TURNS,
      calendar_year: state.calendarYear,
      reserves_usd_m: reservesUsdM,
      civic_trust: civicTrust,
      sovereign_debt_usd_b: sovereignDebtUsdB,
    });

    trackAnalyticsEvent('game_ending', {
      outcome: 'win',
      ending_category: 'century',
      ending_id: ending.id,
      ending_title: ending.titleAr,
      southern_ending_id: southernEndingId,
      final_score: ending.finalScore,
      turn_number: MAX_TURNS,
      calendar_year: state.calendarYear,
      trigger_source: triggerSource,
    });
    return;
  }

  if (state.failState?.isFailed) {
    const endingId = state.failState.type ?? 'UNKNOWN_FAIL_STATE';
    trackAnalyticsEvent('game_ending', {
      outcome: 'loss',
      ending_category: 'fail_state',
      ending_id: endingId,
      ending_title: state.failState.titleAr ?? endingId,
      turn_number: playedTurn,
      calendar_year: state.calendarYear,
      reserves_usd_m: reservesUsdM,
      civic_trust: civicTrust,
      trigger_source: triggerSource,
    });
  }
}

export function trackTurnCommitted(
  prevState: GameState,
  directives: TurnDirectives,
  nextState: GameState
): void {
  const reservesUsdM = Math.round(nextState.macro.reservesUSD / 1_000_000);
  const treasurySypB = Math.round((nextState.macro.treasurySYP / 1_000_000_000) * 10) / 10;

  trackAnalyticsEvent('game_turn', {
    turn_number: prevState.turnNumber,
    next_turn: Math.min(nextState.turnNumber, MAX_TURNS),
    calendar_year: prevState.calendarYear,
    season: prevState.season,
    decrees_count: directives.activePoliticalActions?.length ?? 0,
    projects_count: directives.provincialProjects?.length ?? 0,
    reserves_usd_m: reservesUsdM,
    treasury_syp_b: treasurySypB,
    civic_trust: Math.round(nextState.macro.civicTrust),
    national_rri: Math.round(nextState.macro.nationalRRI),
    political_capital: Math.round(nextState.macro.politicalCapital),
    events_drawn: nextState.activeEvents?.length ?? 0,
    is_game_over: nextState.isGameOver,
  });

  if (!prevState.isGameOver && nextState.isGameOver) {
    trackGameOutcome(nextState, 'turn_commit');
  }
}

export function trackGameEventResolved(options: {
  prevState: GameState;
  nextState: GameState;
  eventId: string;
  optionId?: string;
  resolution: 'option_selected' | 'unresolved_penalty';
}): void {
  const { prevState, nextState, eventId, optionId, resolution } = options;
  const card: EventCard | undefined = prevState.activeEvents?.find((e) => e.id === eventId);
  const chosenOption = optionId ? card?.options?.find((o) => o.id === optionId) : undefined;
  const triggeredGameOver = !prevState.isGameOver && nextState.isGameOver;

  trackAnalyticsEvent('game_event', {
    event_id: eventId,
    event_category: card?.category ?? 'UNKNOWN',
    event_title: card?.titleAr ?? eventId,
    target_governorate_id: card?.targetGovernorateId ?? 'national',
    option_id: optionId ?? 'unresolved_crisis_penalty',
    option_label: chosenOption?.labelAr ?? 'عجز عن الاستجابة',
    resolution_type: resolution,
    turn_number: prevState.turnNumber,
    calendar_year: prevState.calendarYear,
    triggered_game_over: triggeredGameOver,
  });

  if (triggeredGameOver) {
    trackGameOutcome(
      nextState,
      resolution === 'option_selected' ? 'event_option' : 'unresolved_crisis'
    );
  }
}
