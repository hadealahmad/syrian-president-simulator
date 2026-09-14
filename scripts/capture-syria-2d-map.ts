import { spawn } from 'child_process';
import * as fs from 'fs';

async function run() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9542',
    '--user-data-dir=/tmp/test-chrome-rect3',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9542/json');
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

    // Trigger hover on Damascus via DOM events
    const triggerRes = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const pathDamascus = document.querySelector('path[aria-label="مدينة دمشق"]');
          if (!pathDamascus) return { success: false, error: 'not found' };
          
          pathDamascus.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
          pathDamascus.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
          
          // Also verify if the HUD element appeared
          return { success: true };
        })()
      `,
      returnByValue: true,
    });
    console.log('Trigger result:', triggerRes.result.result ? triggerRes.result.result.value : triggerRes.result.value);

    await new Promise((r) => setTimeout(r, 500));

    const verifyRes = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const hud = document.querySelector('.w-72');
          if (!hud) return null;
          return { text: hud.textContent, className: hud.className };
        })()
      `,
      returnByValue: true,
    });
    console.log('HUD in DOM:', verifyRes.result.result ? verifyRes.result.result.value : verifyRes.result.value);

    const shotHover = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/syria_2d_syid_damascus_hover.png',
      Buffer.from(shotHover.result.data, 'base64')
    );
    console.log('Saved syria_2d_syid_damascus_hover.png successfully!');

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
