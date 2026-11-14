import { spawn } from 'child_process';
import * as fs from 'fs';
import { createInitialGameState } from '../src/lib/engine/baseline';
import { validateOptionAvailability, resolveEventOption } from '../src/lib/engine/events';
import { MASTER_EVENTS } from '../src/lib/engine/deck/master-events';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CHROMIUM = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : 'chromium';
const PORT = 9534;
const PROFILE_DIR = '/tmp/ui6/test-ui/event-pc-profile';
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

// 1. Programmatic Unit Check
const state = createInitialGameState(42);
state.macro.politicalCapital = 5; // low political credit

const swapOpt = MASTER_EVENTS[0].options.find((o) => o.costPC > 0)!;
console.log('Testing option:', swapOpt.labelAr, 'costPC:', swapOpt.costPC, 'player PC:', state.macro.politicalCapital);

const available = validateOptionAvailability(state, swapOpt);
console.log('validateOptionAvailability result (should be false):', available);
assert(!available, 'Option should not be available when player has insufficient PC!');

const initialPC = state.macro.politicalCapital;
resolveEventOption(state, MASTER_EVENTS[0].id, swapOpt.id);
console.log('After resolveEventOption attempt, player PC (should remain unchanged):', state.macro.politicalCapital);
assert(state.macro.politicalCapital === initialPC, 'resolveEventOption allowed spending PC that player did not have!');
console.log('Unit test PASSED!');

// 2. Pure-UI Browser Test (no window.__gameStore hooks)
async function runVisualTest() {
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

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sleep(1200);

    // Open Governance > Decrees and queue 4 Turn-1 decrees totaling 45 PC (50 -> 5 PC remaining)
    await evalCode(`document.querySelector('[data-panel-btn="decrees"]')?.click()`);
    await sleep(350);

    const decreeIds = [
      'ANTI_CORRUPTION_COMMISSION', // 15 PC
      'PROPERTY_RESTITUTION_PORTAL', // 10 PC
      'SMUGGLING_BORDER_SWEEP', // 12 PC
      'TRIBAL_CUSTOMS_COUNCIL', // 8 PC
    ];

    for (const id of decreeIds) {
      const clicked = await evalCode(`(() => {
        const card = document.querySelector('[data-decree-id="${id}"]');
        const btn = card?.querySelector('button.kit-btn');
        if (!btn || btn.disabled) return false;
        btn.click();
        return true;
      })()`);
      assert(clicked, `Failed to queue decree ${id}`);
      await sleep(200);

      // If ONE_TIME dialog opened, confirm it
      await evalCode(`(() => {
        const dlg = document.querySelector('dialog[open]');
        if (!dlg) return false;
        const confirmBtn = Array.from(dlg.querySelectorAll('footer button')).pop();
        confirmBtn?.click();
        return true;
      })()`);
      await sleep(200);
    }

    // Advance to Turn 2 via real UI controls
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

    // If pre-card focus banner appeared, open card
    await evalCode(
      `Array.from(document.querySelectorAll('[data-flow-stage="events-focus"] button')).find(b => b.textContent?.includes('فتح البرقية'))?.click()`
    );
    await sleep(300);

    // Verify Turn 2 EventModal has an affordable check disabled option due to low PC (5 < 15)
    const eventCheck = await evalCode(`(() => {
      const modal = document.querySelector('[data-flow-stage="events"]');
      if (!modal) return null;
      const opts = Array.from(modal.querySelectorAll('[aria-pressed]'));
      const disabledOpts = opts.filter(o => o.getAttribute('aria-disabled') === 'true');
      const swapDisabled = disabledOpts.find(o => (o.textContent || '').includes('مبادلة'));
      if (swapDisabled) swapDisabled.click();
      return {
        optionCount: opts.length,
        disabledCount: disabledOpts.length,
        swapDisabledPressedAfterClick: swapDisabled?.getAttribute('aria-pressed') ?? null,
        hasDeficitText: (modal.textContent || '').includes('نقص'),
      };
    })()`);

    console.log('Browser Event PC check:', eventCheck);
    assert(eventCheck && eventCheck.disabledCount >= 1, 'Expected at least one disabled event option when PC is low');
    assert(eventCheck.swapDisabledPressedAfterClick === 'false', 'Clicking disabled option must not select it');

    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/event_disabled_pc_option.png`, Buffer.from(shot.data, 'base64'));
    console.log('Saved /tmp/ui6/test-ui/event_disabled_pc_option.png');

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

runVisualTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
