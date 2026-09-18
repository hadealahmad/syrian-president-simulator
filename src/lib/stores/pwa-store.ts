import { writable } from 'svelte/store';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PwaState {
  canInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  isFullscreen: boolean;
}

const STANDALONE_QUERY = '(display-mode: standalone)';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia(STANDALONE_QUERY).matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function createPwaStore() {
  const { subscribe, update } = writable<PwaState>({
    canInstall: false,
    isInstalled: isStandalone(),
    isIos: isIosDevice(),
    isFullscreen: typeof document !== 'undefined' && !!document.fullscreenElement,
  });

  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!deferredPrompt) return 'unavailable';
    const event = deferredPrompt;
    deferredPrompt = null;
    update((s) => ({ ...s, canInstall: false }));
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome;
  }

  async function enterFullscreenLandscape(): Promise<boolean> {
    const root = document.documentElement;
    if (!root.requestFullscreen) return false;
    try {
      await root.requestFullscreen({ navigationUI: 'hide' });
    } catch {
      return false;
    }
    try {
      await (
        screen.orientation as unknown as { lock?: (orientation: string) => Promise<void> }
      ).lock?.('landscape');
    } catch {
      // Orientation lock unsupported (iOS, desktop) — fullscreen still applies.
    }
    return true;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event as BeforeInstallPromptEvent;
      update((s) => ({ ...s, canInstall: true }));
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      update((s) => ({ ...s, canInstall: false, isInstalled: true }));
    });

    window.matchMedia(STANDALONE_QUERY).addEventListener('change', (event) => {
      update((s) => ({ ...s, isInstalled: event.matches }));
    });

    document.addEventListener('fullscreenchange', () => {
      update((s) => ({ ...s, isFullscreen: !!document.fullscreenElement }));
    });
  }

  return { subscribe, promptInstall, enterFullscreenLandscape };
}

export const pwaStore = createPwaStore();
