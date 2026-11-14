import { spawn } from 'child_process';
import * as fs from 'fs';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CHROMIUM = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : 'chromium';
const PORT = 9465;
const PROFILE_DIR = '/tmp/ui6/test-ui/localstorage-restart';
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

async function runTest() {
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
      const r = await sendCommand('Runtime.evaluate', {
        returnByValue: true,
        awaitPromise: true,
        expression: expr,
      });
      if (r.exceptionDetails) throw new Error(`Eval failed: ${JSON.stringify(r.exceptionDetails)}`);
      return r.result?.value;
    };

    async function takeScreenshot(filePath: string) {
      const { data } = await sendCommand('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      console.log('Saved screenshot:', filePath);
    }

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sleep(1200);

    // 1. Verify localStorage has initial state saved
    const stored = await evalCode(`Boolean(localStorage.getItem('president_game_state_v1'))`);
    console.log('1. localStorage has initial state saved:', stored);
    assert(stored, 'State was not saved to localStorage on initial load');

    // 2. Advance to Turn 2 via REAL UI controls (End Turn -> Confirm -> Skip -> Continue)
    console.log('Advancing to Turn 2 via real UI...');
    await evalCode(`document.querySelector('[data-tour="end-turn"]')?.click()`);
    await sleep(350);
    await evalCode(
      `Array.from(document.querySelectorAll('[data-flow-stage="review"] footer button')).find(b => b.textContent?.includes('تأكيد وإنهاء الدور'))?.click()`
    );
    await sleep(500);
    await evalCode(
      `Array.from(document.querySelectorAll('[data-flow-stage="results"] footer button')).find(b => b.textContent?.includes('تخطي إلى الملخص'))?.click()`
    );
    await sleep(250);
    await evalCode(
      `Array.from(document.querySelectorAll('[data-flow-stage="results"] footer button')).find(b => b.textContent?.includes('متابعة المهام'))?.click()`
    );
    await sleep(500);

    const turn2Check = await evalCode(
      `document.querySelector('header[aria-label="الشريط السيادي للمؤشرات"]')?.textContent?.includes('02/40')`
    );
    console.log('2. Game advanced to Turn 02:', turn2Check);
    assert(turn2Check, 'UI did not advance to Turn 02');

    const storedTurn = await evalCode(`JSON.parse(localStorage.getItem('president_game_state_v1')).turnNumber`);
    console.log('3. Stored turnNumber in localStorage is:', storedTurn);
    assert(storedTurn === 2, `Expected turnNumber 2 in localStorage, got ${storedTurn}`);

    // Resolve Turn 2 event via UI so the stage returns to normal map before testing settings gear
    for (let e = 0; e < 3; e++) {
      const stage = await evalCode(`document.querySelector('[data-flow-stage]')?.getAttribute('data-flow-stage') || ''`);
      if (stage === 'events-focus') {
        await evalCode(
          `Array.from(document.querySelectorAll('[data-flow-stage="events-focus"] button')).find(b => b.textContent?.includes('فتح البرقية'))?.click()`
        );
        await sleep(250);
      }
      const stage2 = await evalCode(`document.querySelector('[data-flow-stage]')?.getAttribute('data-flow-stage') || ''`);
      if (stage2 === 'events') {
        await evalCode(
          `Array.from(document.querySelectorAll('[data-flow-stage="events"] button[aria-pressed]')).find(b => b.getAttribute('aria-disabled') !== 'true')?.click()`
        );
        await sleep(150);
        await evalCode(`Array.from(document.querySelectorAll('[data-flow-stage="events"] footer button')).pop()?.click()`);
        await sleep(150);
        await evalCode(
          `document.querySelector('[role="dialog"][aria-label="تأكيد الخيار"] button:last-of-type, dialog[open] footer button:last-of-type')?.click()`
        );
        await sleep(300);
        continue;
      }
      break;
    }

    // 4. Reload page to test persistence across page reloads
    console.log('Testing reload persistence...');
    await evalCode(`location.reload()`);
    await sleep(1800);

    const turnAfterReload = await evalCode(
      `document.querySelector('header[aria-label="الشريط السيادي للمؤشرات"]')?.textContent?.includes('02/40')`
    );
    console.log('4. After reload, state is still Turn 02:', turnAfterReload);
    assert(turnAfterReload, 'State was not restored from localStorage after reload');

    // 5. Open Settings gear -> New Game -> Restart Confirmation view
    console.log('Opening settings gear and clicking New Game...');
    await evalCode(`document.querySelector('[data-tour="settings-gear"]')?.click()`);
    await sleep(400);
    await evalCode(
      `Array.from(document.querySelectorAll('[role="dialog"][aria-label="الإعدادات"] button')).find(b => b.textContent?.includes('لعبة جديدة'))?.click()`
    );
    await sleep(400);

    await takeScreenshot(`${OUT_DIR}/restart_confirmation_modal.png`);

    const modalOpen = await evalCode(`document.body.innerText.includes('تأكيد إعادة التشغيل')`);
    console.log('5. Restart confirmation view is visible:', modalOpen);
    assert(modalOpen, 'Restart confirmation view did not open');

    // 6. Test Cancel button ("متابعة اللعبة")
    console.log('Testing Cancel button...');
    await evalCode(
      `Array.from(document.querySelectorAll('[role="dialog"][aria-label="الإعدادات"] button')).find(b => b.textContent?.trim() === 'متابعة اللعبة')?.click()`
    );
    await sleep(400);

    const stillTurn2 = await evalCode(
      `document.querySelector('header[aria-label="الشريط السيادي للمؤشرات"]')?.textContent?.includes('02/40')`
    );
    const settingsClosed = await evalCode(`!document.querySelector('[role="dialog"][aria-label="الإعدادات"]')`);
    console.log('6. After cancel, still Turn 02 & menu closed:', stillTurn2 && settingsClosed);
    assert(stillTurn2 && settingsClosed, 'Cancel should return to Turn 02 and close settings');

    // 7. Re-open Settings -> New Game -> Confirm Restart ("تأكيد إعادة البدء")
    console.log('Re-opening restart confirmation and confirming...');
    await evalCode(`document.querySelector('[data-tour="settings-gear"]')?.click()`);
    await sleep(400);
    await evalCode(
      `Array.from(document.querySelectorAll('[role="dialog"][aria-label="الإعدادات"] button')).find(b => b.textContent?.includes('لعبة جديدة'))?.click()`
    );
    await sleep(350);
    await evalCode(
      `Array.from(document.querySelectorAll('[role="dialog"][aria-label="الإعدادات"] button')).find(b => b.textContent?.trim() === 'تأكيد إعادة البدء')?.click()`
    );
    await sleep(700);

    const backToTurn1 = await evalCode(
      `document.querySelector('header[aria-label="الشريط السيادي للمؤشرات"]')?.textContent?.includes('01/40')`
    );
    const storedTurnAfterRestart = await evalCode(
      `JSON.parse(localStorage.getItem('president_game_state_v1')).turnNumber`
    );
    console.log('7. After confirm restart, back to Turn 01:', backToTurn1, 'stored turn:', storedTurnAfterRestart);
    assert(backToTurn1 && storedTurnAfterRestart === 1, 'Simulation did not reset to Turn 01');

    await takeScreenshot(`${OUT_DIR}/after_successful_restart.png`);
    console.log('ALL LOCAL STORAGE & RESTART TESTS PASSED SUCCESSFULLY!');
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
