import { spawn } from 'child_process';
import * as fs from 'fs';

async function testHexStyling() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9530',
    '--user-data-dir=/tmp/test-chrome-hex-styling',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9530/json');
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

    // Deselect any selected governorate
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.selectGovernorate(null);
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Hover directly over Homs (615, 248)
    await sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 615,
      y: 248,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const homsHoverShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/stylized_hexagons_homs_hover.png',
      Buffer.from(homsHoverShot.result.data, 'base64')
    );
    console.log('Saved stylized_hexagons_homs_hover.png');

    // Click on Homs to select it
    await sendCommand('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: 615,
      y: 248,
      button: 'left',
      clickCount: 1,
    });
    await sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: 615,
      y: 248,
      button: 'left',
      clickCount: 1,
    });
    await new Promise((r) => setTimeout(r, 800));

    const homsSelectedShot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/stylized_hexagons_homs_selected.png',
      Buffer.from(homsSelectedShot.result.data, 'base64')
    );
    console.log('Saved stylized_hexagons_homs_selected.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

testHexStyling().catch(console.error);
