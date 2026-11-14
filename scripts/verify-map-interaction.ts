import { spawn } from 'child_process';
import * as fs from 'fs';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CHROMIUM = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : 'chromium';
const PORT = 9536;
const PROFILE_DIR = '/tmp/ui6/test-ui/map-interaction';
const OUT_DIR = '/tmp/ui6/test-ui';

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

async function waitForPageTab(port: number) {
  for (let i = 0; i < 40; i++) {
    try {
      const listRes = await fetch(`http://127.0.0.1:${port}/json`);
      const tabs = (await listRes.json()) as any[];
      const pageTab = tabs.find((t) => t.type === 'page' && t.url.includes('5173'));
      if (pageTab?.webSocketDebuggerUrl) return pageTab;
    } catch {}
    await sleep(150);
  }
  throw new Error('Timed out waiting for Chromium CDP page tab');
}

async function run() {
  fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const chrome = spawn(
    CHROMIUM,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE_DIR}`,
      '--window-size=1440,900',
      'http://localhost:5173/?play=1',
    ],
    {
      env: { ...process.env, TMPDIR: '/tmp', XDG_RUNTIME_DIR: '/tmp' },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  try {
    const pageTab = await waitForPageTab(PORT);
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

    let msgId = 1;
    const pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();

    const sendCommand = (method: string, params: Record<string, unknown> = {}) =>
      new Promise<any>((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('WebSocket connection failed'));
    });

    ws.onmessage = (event) => {
      const res = JSON.parse(event.data.toString());
      if (res.id && pending.has(res.id)) {
        const { resolve, reject } = pending.get(res.id)!;
        pending.delete(res.id);
        if (res.error) reject(new Error(res.error.message));
        else resolve(res.result);
      }
    };

    const evalCode = async (expr: string): Promise<any> => {
      const r = await sendCommand('Runtime.evaluate', { returnByValue: true, awaitPromise: true, expression: expr });
      if (r.exceptionDetails) throw new Error(`Eval failed: ${JSON.stringify(r.exceptionDetails)}`);
      return r.result?.value;
    };

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sleep(1200);

    // 1. Verify all 14 governorate SVG paths exist and show multiple distinct fills
    const mapStats = await evalCode(`(() => {
      const paths = Array.from(document.querySelectorAll('path[data-gov-id]'));
      const fills = new Set(paths.map(p => getComputedStyle(p).fill));
      return { count: paths.length, distinctFills: fills.size };
    })()`);
    console.log('Map SVG stats:', mapStats);
    assert(mapStats.count === 14, `Expected 14 governorate SVG paths, got ${mapStats.count}`);
    assert(mapStats.distinctFills >= 4, `Expected varied province fills across map, got ${mapStats.distinctFills}`);

    // 2. Click map modes: الكهرباء, الأضرار, الألغام, الاحتقان
    for (const label of ['الكهرباء', 'الأضرار', 'الألغام', 'الاحتقان']) {
      await evalCode(`document.querySelector('button[aria-label="طبقة ${label}"]')?.click()`);
      await sleep(150);
      const active = await evalCode(
        `document.querySelector('button[aria-label="طبقة ${label}"]')?.getAttribute('aria-pressed')`
      );
      assert(active === 'true', `Map mode ${label} did not activate`);
    }

    // 3. Click Damascus on map -> opens Damascus dossier
    const damBox = await evalCode(`(() => {
      const el = document.querySelector('.map-badge[data-gov-id="damascus"], path[data-gov-id="damascus"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    assert(damBox, 'Damascus target missing');
    await sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x: damBox.x, y: damBox.y, button: 'left', clickCount: 1 });
    await sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x: damBox.x, y: damBox.y, button: 'left', clickCount: 1 });
    await sleep(400);

    const damSelected = await evalCode(
      `document.querySelector('path[data-gov-id="damascus"]')?.getAttribute('aria-pressed') === 'true' && document.querySelector('[role="dialog"][aria-label="ملف المحافظة"]')?.textContent?.includes('دمشق')`
    );
    console.log('Damascus selected:', damSelected);
    assert(damSelected, 'Clicking Damascus should select it and open its dossier');

    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/syria_map_damascus_click.png`, Buffer.from(shot.data, 'base64'));

    // 4. Verify manual zoom/fit controls are removed and legend has 4 swatches
    const chromeState = await evalCode(`(() => ({
      zoomIn: Boolean(document.querySelector('button[aria-label="تكبير الخارطة"]')),
      zoomOut: Boolean(document.querySelector('button[aria-label="تصغير الخارطة"]')),
      resetZoom: Boolean(document.querySelector('button[aria-label="إعادة ضبط الخارطة"]')),
      legendSwatches: document.querySelectorAll('[aria-label^="مفتاح طبقة"] i').length,
    }))()`);
    assert(!chromeState.zoomIn && !chromeState.zoomOut && !chromeState.resetZoom, 'Manual zoom/fit controls must be removed');
    assert(chromeState.legendSwatches === 4, `Expected 4 legend swatches, got ${chromeState.legendSwatches}`);

    // 5. Re-clicking selected Damascus deselects it
    const damBoxAfter = await evalCode(`(() => {
      const el = document.querySelector('.map-badge[data-gov-id="damascus"], path[data-gov-id="damascus"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    assert(damBoxAfter, 'Damascus target missing after selection');
    await sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x: damBoxAfter.x, y: damBoxAfter.y, button: 'left', clickCount: 1 });
    await sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x: damBoxAfter.x, y: damBoxAfter.y, button: 'left', clickCount: 1 });
    await sleep(350);

    const damDeselected = await evalCode(
      `document.querySelector('path[data-gov-id="damascus"]')?.getAttribute('aria-pressed') === 'false'`
    );
    assert(damDeselected, 'Re-clicking selected Damascus should deselect it');

    console.log('[OK] Map interaction verification passed!');

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
