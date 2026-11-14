import { spawn } from 'child_process';
import * as fs from 'fs';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CHROMIUM = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : 'chromium';
const PORT = 9525;
const PROFILE_DIR = '/tmp/ui6/test-ui/hover-translation';
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

async function testHoverTranslation() {
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

    // 1. Hover over Damascus
    const damBox = await evalCode(`(() => {
      const el = document.querySelector('.map-badge[data-gov-id="damascus"], path[data-gov-id="damascus"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    assert(damBox, 'Damascus target not found');
    await sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: damBox.x, y: damBox.y });
    await sleep(300);

    const damTooltip = await evalCode(`document.querySelector('.map-root [role="status"]')?.textContent?.trim() || ''`);
    console.log('Damascus hover tooltip:', damTooltip);
    assert(damTooltip.includes('دمشق'), 'Damascus tooltip should show Arabic name');
    assert(!/DAMASCUS|CALM|TENSE|UNREST|REBELLION/.test(damTooltip), 'Tooltip contains untranslated enum key');

    const shot1 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/hover_translation_1.png`, Buffer.from(shot1.data, 'base64'));

    // 2. Hover over Tartus
    const tartusBox = await evalCode(`(() => {
      const el = document.querySelector('.map-badge[data-gov-id="tartus"], path[data-gov-id="tartus"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    assert(tartusBox, 'Tartus target not found');
    await sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: tartusBox.x, y: tartusBox.y });
    await sleep(300);

    const tartusTooltip = await evalCode(`document.querySelector('.map-root [role="status"]')?.textContent?.trim() || ''`);
    console.log('Tartus hover tooltip:', tartusTooltip);
    assert(tartusTooltip.includes('طرطوس'), 'Tartus tooltip should show Arabic name');
    assert(!/TARTUS|CALM|TENSE|UNREST|REBELLION/.test(tartusTooltip), 'Tooltip contains untranslated enum key');

    const shot2 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/hover_translation_2.png`, Buffer.from(shot2.data, 'base64'));

    // 3. Click Damascus to open dossier and verify Arabic translations inside details
    await sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x: damBox.x, y: damBox.y, button: 'left', clickCount: 1 });
    await sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x: damBox.x, y: damBox.y, button: 'left', clickCount: 1 });
    await sleep(400);
    await evalCode(
      `Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent?.includes('التفاصيل والسجل'))?.click()`
    );
    await sleep(300);

    const dossierText = await evalCode(`document.querySelector('[role="dialog"][aria-label="ملف المحافظة"]')?.textContent || ''`);
    assert(dossierText.includes('دمشق') && dossierText.includes('الترتيب الوطني'), 'Damascus dossier text should be in Arabic');

    const shot3 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/connected_gov_translation.png`, Buffer.from(shot3.data, 'base64'));
    console.log('[OK] All hover and dossier Arabic translation checks passed!');

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

testHoverTranslation().catch((err) => {
  console.error(err);
  process.exit(1);
});
