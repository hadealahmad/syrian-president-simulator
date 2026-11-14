import { spawn } from 'child_process';
import * as fs from 'fs';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CHROMIUM = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : 'chromium';
const PORT = 9488;
const PROFILE_DIR = '/tmp/ui6/test-ui/layout-visibility';

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

async function runLayoutCheck() {
  fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
  fs.mkdirSync(PROFILE_DIR, { recursive: true });

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

    await sendCommand('Runtime.enable');
    await sleep(1200);

    // 1. Desktop 1440x900 with docked section
    await evalCode(`document.querySelector('[data-panel-btn="tax"]')?.click()`);
    await sleep(450);

    const desktopMetrics = await evalCode(`(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const header = document.querySelector('header[aria-label="الشريط السيادي للمؤشرات"]');
      const dock = document.querySelector('nav[data-tour="hub"]');
      const sheet = document.querySelector('[role="dialog"][aria-label="الخزينة"]');
      const mapSvg = document.querySelector('.map-root svg');
      const h = header?.getBoundingClientRect();
      const d = dock?.getBoundingClientRect();
      const s = sheet?.getBoundingClientRect();
      const m = mapSvg?.getBoundingClientRect();
      return {
        vw, vh,
        overflow: document.documentElement.scrollWidth > vw + 1,
        headerBottom: h ? Math.round(h.bottom) : 0,
        dockTop: d ? Math.round(d.top) : 0,
        dockLeft: d ? Math.round(d.left) : 0,
        dockRight: d ? Math.round(d.right) : 0,
        sheetLeft: s ? Math.round(s.left) : 0,
        sheetRight: s ? Math.round(s.right) : 0,
        sheetWidth: s ? Math.round(s.width) : 0,
        mapWidth: m ? Math.round(m.width) : 0,
        mapHeight: m ? Math.round(m.height) : 0,
      };
    })()`);

    console.log('Desktop 1440x900 layout:', desktopMetrics);
    assert(!desktopMetrics.overflow, 'Desktop has horizontal overflow');
    assert(desktopMetrics.headerBottom > 0 && desktopMetrics.dockTop >= desktopMetrics.headerBottom - 1, 'Dock overlaps TopBar on desktop');
    assert(desktopMetrics.sheetWidth >= 450, `Expected 460px Treasury docked sheet, got ${desktopMetrics.sheetWidth}`);
    assert(desktopMetrics.sheetRight <= desktopMetrics.dockLeft + 1, 'Docked sheet overlaps start rail on desktop RTL');
    assert(desktopMetrics.mapWidth > 200 && desktopMetrics.mapHeight > 200, 'Map SVG missing or collapsed');

    // 2. Mobile portrait 390x844
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(400);

    const phoneMetrics = await evalCode(`(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const header = document.querySelector('header[aria-label="الشريط السيادي للمؤشرات"]');
      const dock = document.querySelector('nav[data-tour="hub"]');
      const sheet = document.querySelector('[role="dialog"][aria-label="الخزينة"]');
      const h = header?.getBoundingClientRect();
      const d = dock?.getBoundingClientRect();
      const s = sheet?.getBoundingClientRect();
      return {
        vw, vh,
        overflow: document.documentElement.scrollWidth > vw + 1,
        headerBottom: h ? Math.round(h.bottom) : 0,
        dockTop: d ? Math.round(d.top) : 0,
        dockBottom: d ? Math.round(d.bottom) : 0,
        sheetTop: s ? Math.round(s.top) : 0,
        sheetBottom: s ? Math.round(s.bottom) : 0,
      };
    })()`);

    console.log('Phone portrait 390x844 layout:', phoneMetrics);
    assert(!phoneMetrics.overflow, 'Phone portrait has horizontal overflow');
    assert(phoneMetrics.dockBottom <= 845 && phoneMetrics.dockTop > 700, 'Bottom tab bar should sit at bottom of portrait screen');
    assert(phoneMetrics.sheetTop <= phoneMetrics.headerBottom + 2, 'Full-height portrait sheet should dock directly under TopBar');
    assert(phoneMetrics.sheetBottom <= phoneMetrics.dockTop + 2, 'Portrait sheet should sit above bottom tab bar');

    console.log('[OK] Layout visibility checks passed across desktop and mobile!');
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

runLayoutCheck().catch((err) => {
  console.error(err);
  process.exit(1);
});
