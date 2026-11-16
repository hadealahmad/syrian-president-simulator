/**
 * Captures Play Store / manifest screenshots from a running preview server.
 *   npm run build && npx vite preview --port 4317
 *   npx tsx scripts/store/capture-store-shots.mts [baseUrl] [outDir]
 * narrow: 412x732 @2.625 (≈1080x1920), wide: 1280x720 @1.5 (1920x1080)
 */
import * as fs from 'fs';
import { launch } from './cdp.ts';

const base = process.argv[2] ?? 'http://localhost:4317';
const out = process.argv[3] ?? 'store-assets/raw';
fs.mkdirSync(out, { recursive: true });

const p = await launch();
async function fresh() {
  await p.goto(`${base}/`, 1200);
  await p.eval(`localStorage.clear(); localStorage.setItem('president_analytics_consent_v1','denied')`);
  await p.goto(`${base}/`, 3500);
}

for (const [form, w, h, s, mobile] of [
  ['narrow', 412, 732, 2.625, true],
  ['wide', 1280, 720, 1.5, false],
] as const) {
  await p.size(w, h, s, mobile);
  await fresh();
  await p.shot(`${out}/${form}-01-title.png`);
  await p.tapText('لعبة جديدة', 2500);
  await p.tapText('تخطي', 1500);
  await p.shot(`${out}/${form}-02-map.png`);
  for (const [i, tab] of ['الخزينة', 'الدَّين', 'الحكم', 'التقارير'].entries()) {
    await p.tapText(tab, 1500);
    await p.shot(`${out}/${form}-0${i + 3}-${i}.png`);
  }
  await p.goto(`${base}/extras/dossier/index.html`, 3000);
  await p.shot(`${out}/${form}-07-dossier-title.png`);
  const b = await p.eval(`[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0).map(b=>b.textContent.trim().replace(/\\s+/g,' ')).join(' | ')`);
  console.log('dossier buttons:', b);
}
p.close();
