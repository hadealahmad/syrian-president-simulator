import { spawn } from 'child_process';
import * as fs from 'fs';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CHROMIUM = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : 'chromium';
const PORT = 9333;
const PROFILE_DIR = '/tmp/ui6/test-ui/console-errors';

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
    console.log('Connecting to page:', pageTab.title, pageTab.url);
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

    let msgId = 1;
    const pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
    const consoleErrors: string[] = [];
    const consoleLogs: string[] = [];

    const send = (method: string, params: Record<string, unknown> = {}) =>
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
      const msg = JSON.parse(event.data.toString());
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id)!;
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(JSON.stringify(msg.params.exceptionDetails));
      } else if (msg.method === 'Console.messageAdded') {
        const m = msg.params.message;
        if (m.level === 'error') {
          consoleErrors.push(m.text);
        } else {
          consoleLogs.push(`[${m.level}] ${m.text}`);
        }
      }
    };

    await send('Console.enable');
    await send('Runtime.enable');
    await sleep(1200);

    // Exercise each of the 5 command dock sections cleanly via real DOM clicks
    for (const id of ['provincial', 'tax', 'emergency', 'decrees', 'stats']) {
      await send('Runtime.evaluate', {
        returnByValue: true,
        expression: `document.querySelector('[data-panel-btn="${id}"]')?.click()`,
      });
      await sleep(300);
    }

    const headerOk = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `Boolean(document.querySelector('header[aria-label="الشريط السيادي للمؤشرات"]'))`,
    });
    if (!headerOk?.result?.value) {
      throw new Error('TopBar header did not render in Operations Console');
    }

    ws.close();

    console.log('--- CONSOLE LOGS ---');
    consoleLogs.forEach((l) => console.log(l));
    console.log('--- CONSOLE ERRORS ---');
    consoleErrors.forEach((e) => console.error(e));

    if (consoleErrors.length > 0) {
      throw new Error(`FOUND ${consoleErrors.length} CONSOLE/RUNTIME ERRORS`);
    }
    console.log('[OK] ZERO CONSOLE ERRORS DETECTED! BROWSER CLIENT HEALTHY!');
  } finally {
    chrome.kill('SIGKILL');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
