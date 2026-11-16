import '../../lib/ui/kit/kit.css';
import './crisis.css';
import { bootExtras } from '../shared/boot';
import ComingSoon from './ComingSoon.svelte';

// «غرفة الأزمات» is not released yet: production builds show a "coming soon"
// page. The full game stays in the code and is playable on the local dev
// server only (`npm run dev` → /extras/crisis/index.html); the dynamic import
// is dropped from production bundles.
if (import.meta.env.DEV) {
  import('./App.svelte').then((m) => bootExtras(m.default));
} else {
  bootExtras(ComingSoon);
}
