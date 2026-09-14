import { spawn } from 'child_process';
import * as fs from 'fs';

async function run() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9538',
    '--user-data-dir=/tmp/test-chrome-2d-map',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9538/json');
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

    // Close guide modal if open
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore?.setGuideModal(false);
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    // 1. Capture clean 2D map view
    const shot1 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/syria_2d_syid_main.png',
      Buffer.from(shot1.result.data, 'base64')
    );
    console.log('Saved syria_2d_syid_main.png');

    // 2. Hover over Damascus / Rif Dimashq area
    // Damascus is at SVG center (467.4, 691.0)
    // On screen: SVG is inside left: 390px, right: 390px (width: 660px, height: 834px)
    // Let's dispatch mouse move directly or trigger hover state
    await sendCommand('Runtime.evaluate', {
      expression: `
        const pathDamascus = document.querySelector('path[aria-label="دمشق"]');
        if (pathDamascus) {
          pathDamascus.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        }
      `,
    });
    await new Promise((r) => setTimeout(r, 500));

    const shot2 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/syria_2d_syid_damascus_hover.png',
      Buffer.from(shot2.result.data, 'base64')
    );
    console.log('Saved syria_2d_syid_damascus_hover.png');

    // 3. Click Damascus to open drawer
    await sendCommand('Runtime.evaluate', {
      expression: `
        const pathDamascus = document.querySelector('path[aria-label="دمشق"]');
        if (pathDamascus) {
          pathDamascus.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    const shot3 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/syria_2d_syid_damascus_selected.png',
      Buffer.from(shot3.result.data, 'base64')
    );
    console.log('Saved syria_2d_syid_damascus_selected.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
