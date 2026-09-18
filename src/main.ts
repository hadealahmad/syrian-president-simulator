import { mount } from 'svelte'
import { registerSW } from 'virtual:pwa-register'
import './app.css'
import { initTheme } from './lib/themes'
import { versionStore } from './lib/stores/version-store'
import App from './App.svelte'

// Theming engine: re-assert the persisted theme before mount (the inline
// script in index.html already stamped it pre-paint; this covers all paths).
initTheme()

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    versionStore.notifyServiceWorkerUpdateReady()
  },
  onRegisterError(error) {
    console.warn('Service worker registration failed:', error)
  },
})

versionStore.setServiceWorkerUpdater(updateSW)

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
