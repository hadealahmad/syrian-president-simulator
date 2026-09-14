import { spawn } from 'child_process';

async function run() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9333',
    '--user-data-dir=/tmp/test-chrome-profile',
    'http://localhost:5173',
  ]);

  try {
    await new Promise((r) => setTimeout(r, 2000));
    const listRes = await fetch('http://localhost:9333/json');
    const tabs = await listRes.json();
    const pageTab = tabs.find((t: any) => t.type === 'page' && t.url.includes('5173'));

    if (!pageTab) {
      console.log('No page tab found in chrome tabs:', tabs);
      return;
    }

    console.log('Connecting to page:', pageTab.title, pageTab.url);
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

    const consoleErrors: string[] = [];
    const consoleLogs: string[] = [];

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => {
        // Enable Console and Runtime domains
        ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.method === 'Runtime.exceptionThrown') {
          consoleErrors.push(JSON.stringify(msg.params.exceptionDetails));
        }
        if (msg.method === 'Console.messageAdded') {
          const m = msg.params.message;
          if (m.level === 'error') {
            consoleErrors.push(m.text);
          } else {
            consoleLogs.push(`[${m.level}] ${m.text}`);
          }
        }
      };

      setTimeout(() => {
        ws.close();
        resolve();
      }, 3500);
    });

    console.log('--- CONSOLE LOGS ---');
    consoleLogs.forEach((l) => console.log(l));
    console.log('--- CONSOLE ERRORS ---');
    consoleErrors.forEach((e) => console.error(e));

    if (consoleErrors.length === 0) {
      console.log('[OK] ZERO CONSOLE ERRORS DETECTED! BROWSER CLIENT HEALTHY!');
    } else {
      console.error(`[FAIL] FOUND ${consoleErrors.length} ERRORS`);
    }
  } finally {
    chrome.kill();
  }
}

run().catch(console.error);
