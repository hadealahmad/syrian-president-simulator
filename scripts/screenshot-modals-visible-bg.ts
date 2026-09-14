import { spawn } from 'child_process';
import * as fs from 'fs';

async function testModals() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9534',
    '--user-data-dir=/tmp/test-chrome-modals',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9534/json');
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

    // 1. Guide Modal
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.setGuideModal(true, 0);
      `,
    });
    await new Promise((r) => setTimeout(r, 500));
    const shotGuide = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/guide_visible_background.png',
      Buffer.from(shotGuide.result.data, 'base64')
    );
    console.log('Saved guide_visible_background.png');

    // Close guide, open Turn Review modal
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.setGuideModal(false);
        (window as any).__uiStore.setTurnReviewModal(true);
      `,
    });
    await new Promise((r) => setTimeout(r, 500));
    const shotReview = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/turn_review_visible_background.png',
      Buffer.from(shotReview.result.data, 'base64')
    );
    console.log('Saved turn_review_visible_background.png');

    // Close review, open Restart modal
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.setTurnReviewModal(false);
        (window as any).__uiStore.setRestartModal(true);
      `,
    });
    await new Promise((r) => setTimeout(r, 500));
    const shotRestart = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/restart_visible_background.png',
      Buffer.from(shotRestart.result.data, 'base64')
    );
    console.log('Saved restart_visible_background.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

testModals().catch(console.error);
