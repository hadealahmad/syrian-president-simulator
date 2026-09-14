import { spawn } from 'child_process';
import * as fs from 'fs';

async function run() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9535',
    '--user-data-dir=/tmp/test-chrome-syria-geojson',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9535/json');
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

    // Close guide if open
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore?.setGuideModal(false);
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Capture main view
    const shot1 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/syria_geojson_3d_main.png',
      Buffer.from(shot1.result.data, 'base64')
    );
    console.log('Saved syria_geojson_3d_main.png');

    // Hover over Damascus / Rif Dimashq area (center map)
    await sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 650,
      y: 450,
    });
    await new Promise((r) => setTimeout(r, 600));

    const shot2 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/syria_geojson_3d_hover.png',
      Buffer.from(shot2.result.data, 'base64')
    );
    console.log('Saved syria_geojson_3d_hover.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
