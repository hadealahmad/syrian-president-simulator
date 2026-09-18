import { writable } from 'svelte/store';

export interface VersionInfo {
  currentVersion: string;
  commitHash: string;
  buildTime: string;
  latestVersion: string | null;
  hasUpdate: boolean;
  isChecking: boolean;
  lastChecked: number | null;
}

const initialVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0-dev';
const initialCommit = typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev';
const initialBuildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();

function createVersionStore() {
  const { subscribe, set, update } = writable<VersionInfo>({
    currentVersion: initialVersion,
    commitHash: initialCommit,
    buildTime: initialBuildTime,
    latestVersion: null,
    hasUpdate: false,
    isChecking: false,
    lastChecked: null,
  });

  let serviceWorkerUpdater: ((reloadPage?: boolean) => Promise<void>) | null = null;
  let serviceWorkerUpdateReady = false;

  function setServiceWorkerUpdater(fn: (reloadPage?: boolean) => Promise<void>): void {
    serviceWorkerUpdater = fn;
  }

  function notifyServiceWorkerUpdateReady(latestVersion: string | null = null): void {
    serviceWorkerUpdateReady = true;
    update((s) => ({
      ...s,
      hasUpdate: true,
      latestVersion: latestVersion ?? s.latestVersion,
    }));
  }

  function requestServiceWorkerUpdate(): void {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .getRegistration()
      .then((registration) => registration?.update())
      .catch(() => {});
  }

  async function checkForUpdates(): Promise<boolean> {
    update((s) => ({ ...s, isChecking: true }));
    try {
      // Bust cache using timestamp query param and no-store headers
      const baseUrl = import.meta.env.BASE_URL || './';
      const versionUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}version.json?_t=${Date.now()}`;
      const res = await fetch(versionUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (!res.ok) {
        update((s) => ({ ...s, isChecking: false, lastChecked: Date.now() }));
        return false;
      }

      const data = await res.json();
      const remoteVersion = data.version;

      if (remoteVersion && remoteVersion !== initialVersion) {
        requestServiceWorkerUpdate();
        update((s) => ({
          ...s,
          isChecking: false,
          hasUpdate: true,
          latestVersion: remoteVersion,
          lastChecked: Date.now(),
        }));
        return true;
      } else {
        update((s) => ({
          ...s,
          isChecking: false,
          hasUpdate: serviceWorkerUpdateReady,
          lastChecked: Date.now(),
        }));
        return serviceWorkerUpdateReady;
      }
    } catch {
      update((s) => ({ ...s, isChecking: false, lastChecked: Date.now() }));
      return false;
    }
  }

  async function clearAllCachesAndReload(): Promise<void> {
    try {
      if ('caches' in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
    } catch {
      // Ignore cache clearing errors
    }

    // Force hard reload with timestamp query string
    const url = new URL(window.location.href);
    url.searchParams.set('_v', Date.now().toString());
    window.location.href = url.toString();
  }

  async function applyUpdate(): Promise<void> {
    if (serviceWorkerUpdateReady && serviceWorkerUpdater) {
      serviceWorkerUpdateReady = false;
      const activated = await activateServiceWorkerUpdate();
      if (activated) {
        window.location.reload();
        return;
      }
    }
    await clearAllCachesAndReload();
  }

  async function activateServiceWorkerUpdate(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;

    const controllerChanged = new Promise<boolean>((resolve) => {
      const timer = window.setTimeout(() => resolve(false), 5000);
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => {
          window.clearTimeout(timer);
          resolve(true);
        },
        { once: true }
      );
    });

    await serviceWorkerUpdater?.(false);
    return controllerChanged;
  }

  return {
    subscribe,
    checkForUpdates,
    applyUpdate,
    forceHardReload: clearAllCachesAndReload,
    setServiceWorkerUpdater,
    notifyServiceWorkerUpdateReady,
  };
}

export const versionStore = createVersionStore();

// Setup lifecycle listeners in browser environment
if (typeof window !== 'undefined') {
  // Check shortly after load
  setTimeout(() => {
    versionStore.checkForUpdates();
  }, 3000);

  // Periodic background check every 60 seconds
  setInterval(() => {
    versionStore.checkForUpdates();
  }, 60_000);

  // Check when user returns to tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      versionStore.checkForUpdates();
    }
  });
}
