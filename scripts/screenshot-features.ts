import { spawn } from 'child_process';
import * as fs from 'fs';

async function capture() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9455',
    '--window-size=1440,900',
    '--user-data-dir=/tmp/test-chrome-profile-features',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9455/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find((t: any) => t.type === 'page' && t.url.includes('5173'));

    if (!pageTab) {
      console.error('No page tab found!');
      return;
    }

    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

    let msgId = 1;
    function evalCode(expr: string): Promise<any> {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (event: any) => {
          const res = JSON.parse(event.data.toString());
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            resolve(res.result?.result?.value);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { returnByValue: true, expression: expr } }));
      });
    }

    function takeScreenshot(filename: string): Promise<void> {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (event: any) => {
          const res = JSON.parse(event.data.toString());
          if (res.id === id) {
            ws.removeEventListener('message', handler);
            const base64Data = res.result?.data;
            if (base64Data) {
              fs.writeFileSync(filename, Buffer.from(base64Data, 'base64'));
              console.log(`Saved screenshot to ${filename}`);
            }
            resolve();
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method: 'Page.captureScreenshot', params: { format: 'png' } }));
      });
    }

    await new Promise<void>((resolve) => {
      ws.onopen = async () => {
        console.log('WS opened. Initializing session...');
        await new Promise((r) => setTimeout(r, 1500));

        // 1. Select Damascus (mine saturation 5% <= 8%)
        await evalCode(`
          if (window.__uiStore) {
            window.__uiStore.selectGovernorate('damascus');
          }
        `);
        await new Promise((r) => setTimeout(r, 600));

        // Take screenshot of Damascus in Provincial Drawer
        await takeScreenshot('/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/damascus_demining_and_power.png');

        // Click the Power Boost button for Damascus
        await evalCode(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('تعزيز جهود الكهرباء'));
            if (btn) btn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 500));

        // 2. Select Homs (mine saturation > 8%)
        await evalCode(`
          if (window.__uiStore) {
            window.__uiStore.selectGovernorate('homs');
          }
        `);
        await new Promise((r) => setTimeout(r, 600));

        // Click demining for Homs
        await evalCode(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('تعيين كأولوية تطهير'));
            if (btn) btn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 500));

        await takeScreenshot('/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/homs_demining_active.png');

        // 3. Open Turn Review Modal
        await evalCode(`
          if (window.__uiStore) {
            window.__uiStore.setTurnReviewModal(true);
          }
        `);
        await new Promise((r) => setTimeout(r, 600));

        await takeScreenshot('/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/turn_review_with_power_and_demining.png');

        resolve();
      };
    });
  } finally {
    chrome.kill();
  }
}

capture();
