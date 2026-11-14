import { spawn } from 'child_process';
import * as fs from 'fs';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CHROMIUM = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : 'chromium';
const PORT = 9522;
const PROFILE_DIR = '/tmp/ui6/test-ui/ux-refinements';
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

async function testUXRefinements() {
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

    const snap = async (filename: string) => {
      const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${OUT_DIR}/${filename}`, Buffer.from(shot.data, 'base64'));
      console.log('Saved', filename);
    };

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sleep(1200);

    // 1. Initial Operations Console state (5-section rail + map)
    const railCount = await evalCode(`document.querySelectorAll('nav[data-tour="hub"] button[data-panel-btn]').length`);
    assert(railCount === 5, `Expected 5 rail sections, got ${railCount}`);
    await snap('ux_refinement_initial.png');

    // 2. Click Damascus badge on map -> opens Provincial dossier
    const damBox = await evalCode(`(() => {
      const el = document.querySelector('.map-badge[data-gov-id="damascus"], path[data-gov-id="damascus"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    assert(damBox, 'Damascus map target missing');
    await sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x: damBox.x, y: damBox.y, button: 'left', clickCount: 1 });
    await sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x: damBox.x, y: damBox.y, button: 'left', clickCount: 1 });
    await sleep(450);

    const hasDamascus = await evalCode(
      `Boolean(document.querySelector('[role="dialog"][aria-label="ملف المحافظة"]')) && document.body.innerText.includes('دمشق')`
    );
    assert(hasDamascus, 'Provincial dossier should open for Damascus');
    await snap('ux_damascus_directives.png');

    // 3. Expand secondary details inside dossier ("التفاصيل والسجل")
    await evalCode(
      `Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent?.includes('التفاصيل والسجل'))?.click()`
    );
    await sleep(300);
    const hasDetails = await evalCode(`document.body.innerText.includes('الترتيب الوطني')`);
    assert(hasDetails, 'Provincial details accordion should expand');
    await snap('ux_damascus_field_dossier.png');

    // 4. Open Treasury section and inspect its 3 sub-tabs
    await evalCode(`document.querySelector('[data-panel-btn="tax"]')?.click()`);
    await sleep(400);
    const treasuryTabs = await evalCode(
      `Array.from(document.querySelectorAll('[role="dialog"] [role="tab"]')).map(el => el.textContent?.trim())`
    );
    assert(treasuryTabs.length === 3, `Expected 3 treasury tabs, got ${treasuryTabs.length}`);
    await snap('ux_cabinet_finance_pillar.png');

    // 5. Open Governance section and inspect Decrees & Stances tabs
    await evalCode(`document.querySelector('[data-panel-btn="decrees"]')?.click()`);
    await sleep(400);
    const govTabs = await evalCode(
      `Array.from(document.querySelectorAll('[role="dialog"] [role="tab"]')).map(el => el.textContent?.trim())`
    );
    assert(govTabs.length === 3, `Expected 3 governance tabs, got ${govTabs.length}`);
    await snap('ux_cabinet_governance_pillar.png');

    console.log('[OK] All Operations Console UX checks passed!');
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

testUXRefinements().catch((err) => {
  console.error(err);
  process.exit(1);
});
