import { writable, type Writable } from 'svelte/store';

export type FxKind =
  | 'tap'
  | 'select'
  | 'confirm'
  | 'cancel'
  | 'error'
  | 'endTurn'
  | 'event'
  | 'good'
  | 'bad';

export interface FxSettings {
  sound: boolean;
  haptics: boolean;
}

const STORAGE_KEY = 'fx-settings';
const DEFAULT_SETTINGS: FxSettings = { sound: true, haptics: true };

function loadSettings(): FxSettings {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return { ...DEFAULT_SETTINGS };
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<FxSettings> | null;
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS };
    return {
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : DEFAULT_SETTINGS.sound,
      haptics: typeof parsed.haptics === 'boolean' ? parsed.haptics : DEFAULT_SETTINGS.haptics,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings: FxSettings): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota or private-context SecurityError
  }
}

function createFxSettingsStore(): Writable<FxSettings> {
  const initial = loadSettings();
  const store = writable<FxSettings>(initial);
  let currentSettings: FxSettings = initial;

  store.subscribe((value) => {
    currentSettings = value;
    saveSettings(value);
  });

  // Expose synchronous snapshot reader via module-local closure below
  getCurrentSettings = () => currentSettings;
  return store;
}

let getCurrentSettings: () => FxSettings = () => DEFAULT_SETTINGS;

export const fxSettings: Writable<FxSettings> = createFxSettingsStore();

// ── First user gesture gate (prevents SSR / pre-gesture autoplay errors) ──
let hasUserGesture = false;
let audioCtx: AudioContext | null = null;

if (typeof window !== 'undefined') {
  const markGesture = (): void => {
    hasUserGesture = true;
    if (audioCtx && audioCtx.state === 'suspended') {
      void audioCtx.resume().catch(() => {});
    }
  };
  for (const evt of ['pointerdown', 'keydown', 'touchstart', 'click'] as const) {
    window.addEventListener(evt, markGesture, { capture: true, passive: true });
  }
}

function canPlayGestureFx(): boolean {
  if (typeof window === 'undefined') return false;
  if (hasUserGesture) return true;
  try {
    const nav = navigator as Navigator & {
      userActivation?: { hasBeenActive?: boolean; isActive?: boolean };
    };
    return Boolean(nav?.userActivation?.hasBeenActive || nav?.userActivation?.isActive);
  } catch {
    return false;
  }
}

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

const HAPTIC_PATTERNS: Record<FxKind, number | number[]> = {
  tap: 8,
  select: 12,
  confirm: [12, 24, 16],
  cancel: 10,
  error: [28, 32, 28],
  endTurn: [20, 32, 36],
  event: [16, 36, 22],
  good: [10, 22, 14],
  bad: [26, 28, 18],
};

function triggerHaptic(kind: FxKind): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    navigator.vibrate(HAPTIC_PATTERNS[kind]);
  } catch {
    // Ignore unsupported or blocked vibration calls
  }
}

function playTone(
  ctx: AudioContext,
  opts: {
    type: OscillatorType;
    freqStart: number;
    freqEnd?: number;
    durationMs: number;
    delayMs?: number;
    gainPeak: number;
    attackMs?: number;
  }
): void {
  const now = ctx.currentTime + (opts.delayMs ?? 0) / 1000;
  const dur = Math.max(0.025, opts.durationMs / 1000);
  const attack = Math.min(dur * 0.45, (opts.attackMs ?? 6) / 1000);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.freqStart, now);
  if (opts.freqEnd !== undefined && opts.freqEnd !== opts.freqStart) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.freqEnd), now + dur);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(opts.gainPeak, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.01);
}

function triggerSound(kind: FxKind): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  switch (kind) {
    case 'tap':
      playTone(ctx, { type: 'sine', freqStart: 660, freqEnd: 410, durationMs: 34, gainPeak: 0.04 });
      break;
    case 'select':
      playTone(ctx, { type: 'triangle', freqStart: 500, freqEnd: 760, durationMs: 48, gainPeak: 0.045 });
      break;
    case 'confirm':
      playTone(ctx, { type: 'sine', freqStart: 523.25, durationMs: 55, gainPeak: 0.05 });
      playTone(ctx, { type: 'sine', freqStart: 659.25, durationMs: 90, delayMs: 52, gainPeak: 0.055 });
      break;
    case 'cancel':
      playTone(ctx, { type: 'sine', freqStart: 440, freqEnd: 310, durationMs: 75, gainPeak: 0.04 });
      break;
    case 'error':
      playTone(ctx, { type: 'triangle', freqStart: 155, freqEnd: 82, durationMs: 120, gainPeak: 0.075 });
      break;
    case 'endTurn':
      // Stamp thump + ceremonial fifth chime
      playTone(ctx, { type: 'triangle', freqStart: 145, freqEnd: 68, durationMs: 110, gainPeak: 0.075 });
      playTone(ctx, { type: 'sine', freqStart: 392, durationMs: 165, delayMs: 22, gainPeak: 0.045, attackMs: 10 });
      playTone(ctx, { type: 'sine', freqStart: 587.33, durationMs: 175, delayMs: 36, gainPeak: 0.04, attackMs: 12 });
      break;
    case 'event':
      // Tense minor swell
      playTone(ctx, { type: 'triangle', freqStart: 220, freqEnd: 248, durationMs: 175, gainPeak: 0.055, attackMs: 55 });
      playTone(ctx, { type: 'sine', freqStart: 311.13, freqEnd: 293.66, durationMs: 175, delayMs: 15, gainPeak: 0.035, attackMs: 55 });
      break;
    case 'good':
      playTone(ctx, { type: 'sine', freqStart: 587.33, durationMs: 55, gainPeak: 0.045 });
      playTone(ctx, { type: 'sine', freqStart: 880, durationMs: 110, delayMs: 48, gainPeak: 0.05 });
      break;
    case 'bad':
      playTone(ctx, { type: 'triangle', freqStart: 250, freqEnd: 138, durationMs: 145, gainPeak: 0.06, attackMs: 10 });
      break;
  }
}

export function fx(kind: FxKind): void {
  try {
    if (!canPlayGestureFx()) return;
    const settings = getCurrentSettings();
    if (settings.haptics) {
      triggerHaptic(kind);
    }
    if (settings.sound) {
      triggerSound(kind);
    }
  } catch {
    // Must never throw
  }
}
