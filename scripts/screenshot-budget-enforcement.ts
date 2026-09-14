import { spawn } from 'child_process';
import * as fs from 'fs';

async function run() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9462',
    '--user-data-dir=/tmp/test-chrome-profile-budget-v5',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9462/json');
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
            resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    function evalCode(expr: string): Promise<any> {
      return sendCommand('Runtime.evaluate', { returnByValue: true, expression: expr })
        .then((r) => r?.result?.value);
    }

    async function takeScreenshot(filePath: string) {
      const { data } = await sendCommand('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      console.log('Saved screenshot:', filePath);
    }

    await new Promise<void>((resolve) => {
      ws.onopen = async () => {
        console.log('WS connected. Waiting for page load...');
        await evalCode('1+1');
        await new Promise((r) => setTimeout(r, 1500));

        const artifactDir = '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2';

        // 1. Commit Tartus project (12 PC) and two decrees: ANTI_CORRUPTION (15) and SMUGGLING (12)
        // Total committed PC: 12 + 15 + 12 = 39 PC.
        // Also commit PROPERTY_RESTITUTION_PORTAL (10 PC) -> Total committed: 49 PC!
        // Remaining PC: 50 - 49 = 1 PC!
        console.log('Committing Tartus project and 3 decrees to leave 1 PC remaining...');
        await evalCode(`
          if (window.__draftStore) {
            window.__draftStore.toggleProvincialProject('proj_tartus_citrus_export'); // 12 PC
            window.__draftStore.togglePoliticalAction('ANTI_CORRUPTION_COMMISSION'); // 15 PC
            window.__draftStore.togglePoliticalAction('SMUGGLING_BORDER_SWEEP'); // 12 PC
            window.__draftStore.togglePoliticalAction('PROPERTY_RESTITUTION_PORTAL'); // 10 PC
          }
        `);
        await new Promise((r) => setTimeout(r, 600));

        // Switch to Decrees Tab
        await evalCode(`
          if (window.__uiStore) {
            window.__uiStore.setMinistryTab('decrees');
          }
        `);
        await new Promise((r) => setTimeout(r, 600));

        // Now TRIBAL_CUSTOMS_COUNCIL requires 8 PC, player has 1 PC -> MUST BE DISABLED with "رصيد غير كافٍ (8)"
        const disabledDecreeButtons = await evalCode(`
          Array.from(document.querySelectorAll('aside button')).map(b => b.innerText.trim()).filter(t => t.includes('رصيد غير كافٍ'))
        `);
        console.log('Disabled decree buttons found:', disabledDecreeButtons);

        // Capture screenshot of Decrees tab with disabled decree button
        await takeScreenshot(`${artifactDir}/budget_decree_disabled_insufficient_pc.png`);

        // Now select Homs in Provincial Drawer (costs 5 PC). Remaining is 1 PC -> MUST BE DISABLED with "رصيد سياسي غير كافٍ"
        console.log('Selecting Homs in provincial drawer...');
        await evalCode(`
          if (window.__uiStore) {
            window.__uiStore.selectGovernorate('homs');
          }
        `);
        await new Promise((r) => setTimeout(r, 600));

        const homsButtonText = await evalCode(`
          (() => {
            const btns = Array.from(document.querySelectorAll('aside button'));
            return btns.map(b => b.innerText.trim()).filter(t => t.includes('رصيد') || t.includes('مشروع') || t.includes('قرار'));
          })()
        `);
        console.log('Homs provincial drawer button status:', homsButtonText);

        // Capture screenshot of Homs in Provincial Drawer showing disabled strategic project button
        await takeScreenshot(`${artifactDir}/budget_homs_disabled_insufficient_pc.png`);

        // Open Turn Review Modal
        console.log('Opening Turn Review Modal...');
        await evalCode(`
          if (window.__uiStore) {
            window.__uiStore.setTurnReviewModal(true);
          }
        `);
        await new Promise((r) => setTimeout(r, 600));

        // Capture screenshot of Turn Review Modal showing budget bar with remaining 1 PC
        await takeScreenshot(`${artifactDir}/budget_turn_review_modal_remaining_1pc.png`);

        resolve();
      };
    });
  } finally {
    chrome.kill();
  }
}

run();
