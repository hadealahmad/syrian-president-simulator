/**
 * Tiny CDP driver for store-asset captures: launches headless Chromium,
 * exposes send/eval/tap/shot helpers. Used by capture-store-shots.ts.
 */
import { spawn, type ChildProcess } from 'child_process';
import * as fs from 'fs';

export interface Page {
  send(method: string, params?: Record<string, unknown>): Promise<any>;
  eval<T = unknown>(expr: string): Promise<T>;
  goto(url: string, waitMs?: number): Promise<void>;
  size(width: number, height: number, scale: number, mobile: boolean): Promise<void>;
  tapText(text: string, waitMs?: number): Promise<boolean>;
  shot(file: string): Promise<void>;
  close(): void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function launch(port = 9477): Promise<Page> {
  const profile = `/tmp/store-shots-${port}`;
  fs.rmSync(profile, { recursive: true, force: true });
  const chrome: ChildProcess = spawn('chromium', [
    '--headless=new',
    '--hide-scrollbars',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ]);
  let tabs: any[] = [];
  for (let i = 0; i < 40 && !tabs.length; i++) {
    await sleep(250);
    try {
      tabs = ((await (await fetch(`http://localhost:${port}/json`)).json()) as any[]).filter((t) => t.type === 'page');
    } catch {
      /* not up yet */
    }
  }
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map<number, (v: any) => void>();
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(String(e.data));
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)!(msg.result ?? msg.error);
      pending.delete(msg.id);
    }
  });
  const send = (method: string, params: Record<string, unknown> = {}) =>
    new Promise<any>((resolve) => {
      const n = ++id;
      pending.set(n, resolve);
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  await send('Page.enable');
  await send('Runtime.enable');

  const page: Page = {
    send,
    async eval<T>(expr: string) {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      return r?.result?.value as T;
    },
    async goto(url, waitMs = 2500) {
      await send('Page.navigate', { url });
      await sleep(waitMs);
    },
    async size(width, height, scale, mobile) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
      await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
    },
    async tapText(text, waitMs = 900) {
      const box = await page.eval<{ x: number; y: number } | null>(`(() => {
        const want = ${JSON.stringify(text)};
        const els = [...document.querySelectorAll('button, a, [role=button]')]
          .filter((el) => el.textContent && el.textContent.includes(want))
          .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
        if (!els.length) return null;
        const el = els.sort((a, b) => a.textContent.length - b.textContent.length)[0];
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()`);
      if (!box) return false;
      for (const type of ['mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
      }
      await sleep(waitMs);
      return true;
    },
    async shot(file) {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
      console.log('saved', file);
    },
    close() {
      ws.close();
      chrome.kill();
    },
  };
  return page;
}
