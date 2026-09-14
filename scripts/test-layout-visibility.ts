import { spawn } from 'child_process';
import * as fs from 'fs';

async function runLayoutCheck() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9488',
    '--user-data-dir=/tmp/test-chrome-profile-layout-2',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9488/json');
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

    // Measure positions
    const evalRes = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const header = document.querySelector('header');
          const leftSidebar = document.querySelector('aside.left-0');
          const rightSidebar = document.querySelector('aside.right-0');
          const leftButtons = document.querySelector('.left-\\\\[406px\\\\]');
          const rightButtons = document.querySelector('.right-\\\\[406px\\\\]');

          const hRect = header ? header.getBoundingClientRect() : null;
          const lsRect = leftSidebar ? leftSidebar.getBoundingClientRect() : null;
          const rsRect = rightSidebar ? rightSidebar.getBoundingClientRect() : null;
          const lbRect = leftButtons ? leftButtons.getBoundingClientRect() : null;
          const rbRect = rightButtons ? rightButtons.getBoundingClientRect() : null;

          // Check all children of header
          const headerChildren = header ? Array.from(header.children).map((c, i) => {
            const r = c.getBoundingClientRect();
            return {
              index: i,
              left: Math.round(r.left),
              right: Math.round(r.right),
              width: Math.round(r.width),
              text: c.textContent?.trim().slice(0, 30)
            };
          }) : [];

          return {
            viewportWidth: window.innerWidth,
            header: hRect ? { left: Math.round(hRect.left), right: Math.round(hRect.right), width: Math.round(hRect.width) } : null,
            leftSidebar: lsRect ? { left: Math.round(lsRect.left), right: Math.round(lsRect.right), width: Math.round(lsRect.width) } : null,
            rightSidebar: rsRect ? { left: Math.round(rsRect.left), right: Math.round(rsRect.right), width: Math.round(rsRect.width) } : null,
            leftButtons: lbRect ? { left: Math.round(lbRect.left), right: Math.round(lbRect.right), width: Math.round(lbRect.width) } : null,
            rightButtons: rbRect ? { left: Math.round(rbRect.left), right: Math.round(rbRect.right), width: Math.round(rbRect.width) } : null,
            headerChildren
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Layout Measurement Results:', JSON.stringify(evalRes.result.result.value, null, 2));

    ws.close();
  } finally {
    chrome.kill();
  }
}

runLayoutCheck();
