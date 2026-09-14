import { spawn } from 'child_process';
import * as fs from 'fs';

async function testUXRefinements() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9522',
    '--user-data-dir=/tmp/test-chrome-ux-refinements',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9522/json');
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

    // Reset local storage for clean state
    await sendCommand('Runtime.evaluate', {
      expression: `localStorage.clear(); location.reload();`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    // 1. Initial State Screenshot (Consolidated 3 pillars, unified command deck, clustered ribbon)
    const shot1 = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/ux_refinement_initial.png',
      Buffer.from(shot1.result.data, 'base64')
    );
    console.log('Saved ux_refinement_initial.png');

    // 2. Select Damascus and check Provincial Drawer tabs
    await sendCommand('Runtime.evaluate', {
      expression: `(window as any).__uiStore.selectGovernorate('DAMASCUS');`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const shotDamascus = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/ux_damascus_directives.png',
      Buffer.from(shotDamascus.result.data, 'base64')
    );
    console.log('Saved ux_damascus_directives.png');

    // 3. Switch to Field Data sub-tab in Provincial Drawer
    await sendCommand('Runtime.evaluate', {
      expression: `
        const buttons = Array.from(document.querySelectorAll('button'));
        const fieldBtn = buttons.find(b => b.textContent && b.textContent.includes('البيانات والديموغرافيا'));
        if (fieldBtn) fieldBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    const shotField = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/ux_damascus_field_dossier.png',
      Buffer.from(shotField.result.data, 'base64')
    );
    console.log('Saved ux_damascus_field_dossier.png');

    // 4. Switch to Finance & Assets Pillar in Cabinet Drawer
    await sendCommand('Runtime.evaluate', {
      expression: `(window as any).__uiStore.setMinistryTab('finance');`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const shotFinance = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/ux_cabinet_finance_pillar.png',
      Buffer.from(shotFinance.result.data, 'base64')
    );
    console.log('Saved ux_cabinet_finance_pillar.png');

    // 5. Switch to Decrees & Governance Pillar in Cabinet Drawer
    await sendCommand('Runtime.evaluate', {
      expression: `(window as any).__uiStore.setMinistryTab('governance');`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const shotGovernance = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/ux_cabinet_governance_pillar.png',
      Buffer.from(shotGovernance.result.data, 'base64')
    );
    console.log('Saved ux_cabinet_governance_pillar.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

testUXRefinements().catch(console.error);
