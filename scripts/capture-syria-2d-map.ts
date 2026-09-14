import { spawn } from 'child_process';
import * as fs from 'fs';

async function run() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9544',
    '--user-data-dir=/tmp/test-chrome-hasakah-raqqa2',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9544/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find((t: any) => t.type === 'page' && t.url.includes('5173'));

    if (!pageTab) {
      console.error('No page tab found!');
      return;
    }

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

    let msgId = 1;
    function sendCommand(method: string, params: any = {}): Promise<any> {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (event: any) => {
          const res = JSON.parse(event.data.toString());
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            resolve(res);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise((resolve) => {
      ws.addEventListener('open', resolve);
    });

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await new Promise((r) => setTimeout(r, 2500));

    // Close guide modal
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore?.setGuideModal(false);
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    // 1. Hover on Hasakah
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const p = document.querySelector('path[aria-label="الحسكة"]');
          if (p) {
            p.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
            p.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
          }
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 400));

    const checkHasakah = await sendCommand('Runtime.evaluate', {
      expression: `document.querySelector('.w-72')?.textContent`,
      returnByValue: true,
    });
    console.log('Hasakah HUD text:', checkHasakah.result.value);

    const shotHasakah = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/syria_2d_hasakah_hover.png',
      Buffer.from(shotHasakah.result.data, 'base64')
    );

    // 2. Hover on Raqqa
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const p = document.querySelector('path[aria-label="الرقة"]');
          if (p) {
            p.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
            p.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
          }
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 400));

    const checkRaqqa = await sendCommand('Runtime.evaluate', {
      expression: `document.querySelector('.w-72')?.textContent`,
      returnByValue: true,
    });
    console.log('Raqqa HUD text:', checkRaqqa.result.value);

    const shotRaqqa = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/syria_2d_raqqa_hover.png',
      Buffer.from(shotRaqqa.result.data, 'base64')
    );

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
