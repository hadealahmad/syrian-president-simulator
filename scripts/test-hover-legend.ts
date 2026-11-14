import { spawn } from 'child_process';
import * as fs from 'fs';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CHROMIUM = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : 'chromium';
const PORT = 9499;
const PROFILE_DIR = '/tmp/ui6/test-ui/hover-legend';
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

async function testHoverLegend() {
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

    // Move mouse over Homs path center to trigger map hover tooltip
    const homsCenter = await evalCode(`(() => {
      const el = document.querySelector('path[data-gov-id="homs"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    assert(homsCenter, 'Homs SVG path not found');

    await sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: homsCenter.x,
      y: homsCenter.y,
    });
    await sleep(350);

    const measurements = await evalCode(`(() => {
      const header = document.querySelector('header[aria-label="الشريط السيادي للمؤشرات"]');
      const legend = document.querySelector('[aria-label^="مفتاح طبقة"]');
      const tooltip = document.querySelector('.map-root [role="status"]');
      const hRect = header?.getBoundingClientRect();
      const lRect = legend?.getBoundingClientRect();
      const tRect = tooltip?.getBoundingClientRect();
      return {
        headerBottom: hRect ? Math.round(hRect.bottom) : null,
        legend: lRect ? {
          top: Math.round(lRect.top),
          bottom: Math.round(lRect.bottom),
          left: Math.round(lRect.left),
          right: Math.round(lRect.right),
          swatches: legend?.querySelectorAll('i').length ?? 0,
        } : null,
        tooltip: tRect ? {
          top: Math.round(tRect.top),
          bottom: Math.round(tRect.bottom),
          left: Math.round(tRect.left),
          right: Math.round(tRect.right),
          text: tooltip?.textContent?.trim(),
        } : null,
      };
    })()`);

    console.log('Hover & Legend Measurements:', JSON.stringify(measurements, null, 2));
    assert(measurements.legend && measurements.legend.swatches === 4, 'Map legend with 4 swatches must be visible');
    assert(measurements.tooltip && measurements.tooltip.text?.includes('حمص'), 'Hover tooltip for Homs must appear');
    assert(
      measurements.tooltip.top >= (measurements.headerBottom ?? 0) &&
        measurements.tooltip.bottom <= 900 &&
        measurements.tooltip.left >= 0 &&
        measurements.tooltip.right <= 1440,
      'Tooltip must sit within viewport below TopBar'
    );

    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/hover_legend_verified.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved /tmp/ui6/test-ui/hover_legend_verified.png');

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

testHoverLegend().catch((err) => {
  console.error(err);
  process.exit(1);
});
