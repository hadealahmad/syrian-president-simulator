import { spawn } from 'child_process';
import * as fs from 'fs';

async function captureLayout() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9532',
    '--user-data-dir=/tmp/test-chrome-layout-update',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9532/json');
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
    await new Promise((r) => setTimeout(r, 2000));

    // Deselect any selected governorate to view entire national map cleanly
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.selectGovernorate(null);
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    const fullShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/layout_full_view.png',
      Buffer.from(fullShot.result.data, 'base64')
    );
    console.log('Saved layout_full_view.png');

    // Select As-Suwayda to verify selection interaction
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.selectGovernorate('as_suwayda');
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    const suwaydaSelectedShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/layout_suwayda_selected.png',
      Buffer.from(suwaydaSelectedShot.result.data, 'base64')
    );
    console.log('Saved layout_suwayda_selected.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

captureLayout().catch(console.error);
