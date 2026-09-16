import { mount } from 'svelte'
import './app.css'
import { initTheme } from './lib/themes'
import App from './App.svelte'

// Theming engine: re-assert the persisted theme before mount (the inline
// script in index.html already stamped it pre-paint; this covers all paths).
initTheme()

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
