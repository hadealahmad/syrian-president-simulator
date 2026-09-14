import { spawn } from 'child_process';
import * as fs from 'fs';

async function testGuideWalkthrough() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9534',
    '--user-data-dir=/tmp/test-chrome-guide',
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

    // Make sure guide modal is open at step 0 (Mandate)
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.setGuideModal(true, 0);
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Capture Step 1
    const shotStep1 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/guide_step1_mandate.png',
      Buffer.from(shotStep1.result.data, 'base64')
    );
    console.log('Saved guide_step1_mandate.png');

    // Go to Step 2 (Ribbon)
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.setGuideStep(1);
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    const shotStep2 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/guide_step2_ribbon.png',
      Buffer.from(shotStep2.result.data, 'base64')
    );
    console.log('Saved guide_step2_ribbon.png');

    // Go to Step 3 (Map)
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.setGuideStep(2);
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    const shotStep3 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/guide_step3_map.png',
      Buffer.from(shotStep3.result.data, 'base64')
    );
    console.log('Saved guide_step3_map.png');

    // Go to Step 4 (Drawers)
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.setGuideStep(3);
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    const shotStep4 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/guide_step4_drawers.png',
      Buffer.from(shotStep4.result.data, 'base64')
    );
    console.log('Saved guide_step4_drawers.png');

    // Go to Step 5 (Turn)
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.setGuideStep(4);
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    const shotStep5 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/guide_step5_turn.png',
      Buffer.from(shotStep5.result.data, 'base64')
    );
    console.log('Saved guide_step5_turn.png');

    // Close guide
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.setGuideModal(false);
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    const shotClosed = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/guide_closed_gameplay.png',
      Buffer.from(shotClosed.result.data, 'base64')
    );
    console.log('Saved guide_closed_gameplay.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

testGuideWalkthrough().catch(console.error);
