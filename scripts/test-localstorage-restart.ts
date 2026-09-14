import { spawn } from 'child_process';
import * as fs from 'fs';

async function runTest() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9465',
    '--user-data-dir=/tmp/test-chrome-profile-storage',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9465/json');
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
        console.log('Connected to browser...');
        await evalCode('1+1');
        await new Promise((r) => setTimeout(r, 1500));

        const artifactDir = '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2';

        // 1. Verify localStorage has state
        const stored = await evalCode(`Boolean(localStorage.getItem('president_game_state_v1'))`);
        console.log('1. localStorage has initial state saved:', stored);
        if (!stored) throw new Error('State was not saved to localStorage on initial load');

        // 2. Take screenshot of the floating buttons showing restart next to end turn
        await takeScreenshot(`${artifactDir}/floating_buttons_with_restart.png`);

        // 3. Advance to Turn 2 using turn review modal or direct commit
        console.log('Advancing to Turn 2...');
        await evalCode(`
          if (window.__gameStore && window.__draftStore) {
            // Subscribe to get directives and commit
            let dir;
            window.__draftStore.subscribe(d => { dir = d; })();
            window.__gameStore.commitTurn(dir);
          }
        `);
        await new Promise((r) => setTimeout(r, 800));

        const turn2Check = await evalCode(`document.body.innerText.includes('الدور 02')`);
        console.log('2. Game advanced to Turn 02:', turn2Check);

        const storedTurn = await evalCode(`
          JSON.parse(localStorage.getItem('president_game_state_v1')).turnNumber
        `);
        console.log('3. Stored turnNumber in localStorage is:', storedTurn);
        if (storedTurn !== 2) throw new Error(`Expected turnNumber 2 in localStorage, got ${storedTurn}`);

        // 4. Reload page to test persistence across page reloads
        console.log('Testing reload persistence...');
        await evalCode(`location.reload()`);
        await new Promise((r) => setTimeout(r, 2000));

        const turnAfterReload = await evalCode(`document.body.innerText.includes('الدور 02')`);
        console.log('4. After reload, state is still Turn 02:', turnAfterReload);
        if (!turnAfterReload) throw new Error('State was not restored from localStorage after reload');

        // 5. Click Restart button next to End Turn
        console.log('Clicking restart button...');
        await evalCode(`
          (() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const restartBtn = btns.find(b => b.innerText.includes('إعادة البدء') && !b.innerText.includes('تأكيد'));
            if (restartBtn) restartBtn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 600));

        // Take screenshot of confirmation modal
        await takeScreenshot(`${artifactDir}/restart_confirmation_modal.png`);

        const modalOpen = await evalCode(`document.body.innerText.includes('تأكيد إعادة تشغيل المحاكاة')`);
        console.log('5. Restart confirmation modal is visible:', modalOpen);
        if (!modalOpen) throw new Error('Restart confirmation modal did not open');

        // 6. Test Cancel button
        console.log('Testing Cancel button in modal...');
        await evalCode(`
          (() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const cancelBtn = btns.find(b => b.innerText.includes('إلغاء ومتابعة'));
            if (cancelBtn) cancelBtn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 500));

        const stillTurn2 = await evalCode(`document.body.innerText.includes('الدور 02')`);
        const modalClosed = await evalCode(`!document.body.innerText.includes('تأكيد إعادة تشغيل المحاكاة')`);
        console.log('6. After cancel, game continues on Turn 02 and modal closed:', stillTurn2 && modalClosed);

        // 7. Re-open modal and confirm restart
        console.log('Re-opening modal and confirming restart...');
        await evalCode(`
          (() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const restartBtn = btns.find(b => b.innerText.includes('إعادة البدء') && !b.innerText.includes('تأكيد'));
            if (restartBtn) restartBtn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 500));

        await evalCode(`
          (() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const confirmBtn = btns.find(b => b.innerText.trim() === 'تأكيد إعادة البدء');
            if (confirmBtn) confirmBtn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 800));

        const backToTurn1 = await evalCode(`document.body.innerText.includes('الدور 01')`);
        const storedTurnAfterRestart = await evalCode(`
          JSON.parse(localStorage.getItem('president_game_state_v1')).turnNumber
        `);
        console.log('7. After confirm restart, back to Turn 01:', backToTurn1, 'and stored turn is:', storedTurnAfterRestart);
        if (!backToTurn1 || storedTurnAfterRestart !== 1) {
          throw new Error('Simulation did not reset to Turn 01');
        }

        // Take screenshot of clean reset
        await takeScreenshot(`${artifactDir}/after_successful_restart.png`);

        console.log('ALL LOCAL STORAGE & RESTART TESTS PASSED SUCCESSFULLY!');
        resolve();
      };
    });
  } finally {
    chrome.kill();
  }
}

runTest();
