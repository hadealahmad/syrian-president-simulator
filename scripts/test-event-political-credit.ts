import { spawn } from 'child_process';
import * as fs from 'fs';
import { createInitialGameState } from '../src/lib/engine/baseline';
import { validateOptionAvailability, resolveEventOption } from '../src/lib/engine/events';
import { MASTER_EVENTS } from '../src/lib/engine/deck/master-events';

// 1. Programmatic Unit Check
const state = createInitialGameState(42);
state.macro.politicalCapital = 5; // low political credit

const swapOpt = MASTER_EVENTS[0].options.find((o) => o.costPC > 0)!;
console.log('Testing option:', swapOpt.labelAr, 'costPC:', swapOpt.costPC, 'player PC:', state.macro.politicalCapital);

const available = validateOptionAvailability(state, swapOpt);
console.log('validateOptionAvailability result (should be false):', available);
if (available) {
  throw new Error('FAILED: Option should not be available when player has insufficient PC!');
}

const initialPC = state.macro.politicalCapital;
resolveEventOption(state, MASTER_EVENTS[0].id, swapOpt.id);
console.log('After resolveEventOption attempt, player PC (should remain unchanged):', state.macro.politicalCapital);
if (state.macro.politicalCapital !== initialPC) {
  throw new Error('FAILED: resolveEventOption allowed spending PC that player did not have!');
}
console.log('Unit test PASSED!');

// 2. Visual Browser Test
async function runVisualTest() {
  const chrome = spawn('chromium', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9534',
    '--user-data-dir=/tmp/test-chrome-event-pc',
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

    // Close guide if open, set political credit to 5%, and inject event 1
    await sendCommand('Runtime.evaluate', {
      expression: `
        (window as any).__uiStore.setGuideModal(false);
        (window as any).__gameStore.update((s: any) => {
          s.macro.politicalCapital = 5;
          const ev = s.activeEvents.length > 0 ? s.activeEvents[0] : null;
          if (!ev) {
            // Put grain corridor event in activeEvents
            s.activeEvents = [{
              id: 'event_01_grain_corridor',
              titleAr: 'أزمة عقود القمح الاستراتيجية',
              sourceAr: 'وزارة التجارة الداخلية وحماية المستهلك',
              category: 'CENTRAL',
              descriptionAr: 'توقف تدفق بواخر القمح الروسي إلى ميناء طرطوس بسبب اشتراط الدفع الفوري بالعملة الصعبة أو منح تنازلات سيادية.',
              options: [
                {
                  id: 'opt_spot',
                  labelAr: 'الدفع الفوري من احتياطي النقد الأجنبي',
                  descriptionAr: 'سداد كامل قيمة الشحنات بالدولار النقدي الفوري.',
                  costUSD: 180000000,
                  costSYP: 0,
                  costPC: 0,
                  effectTrust: 4,
                  effectRRI: -6,
                  customEffectAr: 'استقرار أسواق الخبز (+4 ثقة)',
                },
                {
                  id: 'opt_swap',
                  labelAr: 'مبادلة قمح عبر خط ائتماني بشرط امتيازي',
                  descriptionAr: 'توقيع اتفاقية استيراد قمح طويلة الأجل مقابل امتيازات استثمارية في ميناء طرطوس.',
                  costUSD: 0,
                  costSYP: 0,
                  costPC: 15,
                  effectTrust: -2,
                  customEffectAr: 'رهن امتيازات المرفأ (-15% رصيد سياسي)',
                }
              ]
            }];
          }
          return s;
        });
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Capture screenshot of EventModal with disabled PC option
    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      '/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/event_disabled_pc_option.png',
      Buffer.from(shot.result.data, 'base64')
    );
    console.log('Saved event_disabled_pc_option.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

runVisualTest().catch(console.error);
