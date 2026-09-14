import { spawn } from 'child_process';
import * as fs from 'fs';

async function run() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9536',
    '--user-data-dir=/tmp/test-chrome-interaction',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9536/json');
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

    // Close guide
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore?.setGuideModal(false);
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Evaluate screen coordinates of governorate centroids
    const evalRes = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          // Access three scene if available or compute via window.__gameStore
          return {
            hasGameStore: Boolean((window as any).__gameStore),
            hasUiStore: Boolean((window as any).__uiStore),
          };
        })()
      `,
      returnByValue: true,
    });
    console.log('Stores check:', evalRes.result.value);

    // Let's click on Damascus, Quneitra, Aleppo, Homs
    // In our map:
    // Damascus is at roughly screen x = 550, y = 550
    // Rif Dimashq is at x = 620, y = 560
    // Quneitra is at x = 480, y = 620
    // Aleppo is at x = 600, y = 300
    // Hasakah is at x = 900, y = 250
    // Let's test hovering over Damascus
    await sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 550,
      y: 550,
    });
    await new Promise((r) => setTimeout(r, 400));

    // Click Damascus to select it!
    await sendCommand('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: 550,
      y: 550,
      button: 'left',
      clickCount: 1,
    });
    await sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: 550,
      y: 550,
      button: 'left',
      clickCount: 1,
    });
    await new Promise((r) => setTimeout(r, 600));

    const selectedCheck = await sendCommand('Runtime.evaluate', {
      expression: `(window as any).__uiStore ? undefined : 'No store';`,
      returnByValue: true,
    });

    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/syria_map_damascus_click.png',
      Buffer.from(shot.result.data, 'base64')
    );
    console.log('Saved syria_map_damascus_click.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
