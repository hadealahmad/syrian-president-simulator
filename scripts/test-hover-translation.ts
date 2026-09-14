import { spawn } from 'child_process';
import * as fs from 'fs';

async function testHoverTranslation() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9525',
    '--user-data-dir=/tmp/test-chrome-hover-trans',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9525/json');
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
    await new Promise((r) => setTimeout(r, 1500));

    // Move pointer over Damascus or Tartus
    // Coordinates around center of map (x=720, y=550)
    await sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 650,
      y: 500,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const shotHover1 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/hover_translation_1.png',
      Buffer.from(shotHover1.result.data, 'base64')
    );
    console.log('Saved hover_translation_1.png');

    // Move pointer over Tartus/Latakia area
    await sendCommand('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 600,
      y: 430,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const shotHover2 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/hover_translation_2.png',
      Buffer.from(shotHover2.result.data, 'base64')
    );
    console.log('Saved hover_translation_2.png');

    // Also select Damascus and view field tab to verify connected governorates tier translation
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.selectGovernorate('DAMASCUS');
      `,
    });
    await new Promise((r) => setTimeout(r, 600));
    await sendCommand('Runtime.evaluate', {
      expression: `
        const buttons = Array.from(document.querySelectorAll('button'));
        const fieldBtn = buttons.find(b => b.textContent && b.textContent.includes('البيانات والديموغرافيا'));
        if (fieldBtn) fieldBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    const shotConnected = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/connected_gov_translation.png',
      Buffer.from(shotConnected.result.data, 'base64')
    );
    console.log('Saved connected_gov_translation.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

testHoverTranslation().catch(console.error);
