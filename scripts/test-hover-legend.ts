import { spawn } from 'child_process';
import * as fs from 'fs';

async function testHoverLegend() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9499',
    '--user-data-dir=/tmp/test-chrome-profile-hover-2',
    '--window-size=1440,900',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9499/json');
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

    // Simulate pointer move over center of map (Homs is around center x: 720, y: 520)
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const clientX = rect.left + rect.width * 0.5;
            const clientY = rect.top + rect.height * 0.58;
            canvas.dispatchEvent(new PointerEvent('pointermove', {
              clientX,
              clientY,
              bubbles: true
            }));
          }
        })()
      `
    });

    await new Promise((r) => setTimeout(r, 600));

    // Measure positions of header, sidebars, and hover legend
    const evalRes = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const header = document.querySelector('header');
          const leftSidebar = document.querySelector('aside.left-0');
          const rightSidebar = document.querySelector('aside.right-0');
          const legend = document.querySelector('.pointer-events-none.bg-forest-deep\\\\/95');

          const hRect = header ? header.getBoundingClientRect() : null;
          const lsRect = leftSidebar ? leftSidebar.getBoundingClientRect() : null;
          const rsRect = rightSidebar ? rightSidebar.getBoundingClientRect() : null;
          const legRect = legend ? legend.getBoundingClientRect() : null;

          return {
            headerBottom: hRect ? Math.round(hRect.bottom) : null,
            leftSidebarRight: lsRect ? Math.round(lsRect.right) : null,
            rightSidebarLeft: rsRect ? Math.round(rsRect.left) : null,
            legend: legRect ? {
              top: Math.round(legRect.top),
              bottom: Math.round(legRect.bottom),
              left: Math.round(legRect.left),
              right: Math.round(legRect.right),
              width: Math.round(legRect.width),
              height: Math.round(legRect.height),
              text: legend.textContent?.trim()
            } : null
          };
        })()
      `,
      returnByValue: true
    });

    const measurements = evalRes.result.result.value;
    console.log('Hover Legend Measurements:', JSON.stringify(measurements, null, 2));

    // Capture screenshot of hover state
    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const b64 = shot.result?.data || shot.data;
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/hover_legend_verified.png',
      Buffer.from(b64, 'base64')
    );
    console.log('Saved hover_legend_verified.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

testHoverLegend();
