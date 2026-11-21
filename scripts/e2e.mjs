// Proves in a real browser: the sample goes from 1 of 5 to 5 of 5, the app works offline after one visit,
// a go-link opens the right numbers offline, and no request ever leaves this site.
// Run with `npm run e2e`. Set CHROME_PATH if Chrome is not found.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;
const candidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));
if (!executablePath) { console.error('Chrome not found. Set CHROME_PATH.'); process.exit(1); }

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', shell: process.platform === 'win32' });
const stop = () => { try { server.kill(); } catch { /* already gone */ } };
process.on('exit', stop);

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(BASE)).ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('preview server did not start');
}

let failed = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`); if (!ok) failed++; };

await waitForServer();
const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
const page = await context.newPage();
const outside = [];
page.on('request', (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) outside.push(r.url()); });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

// 1. Sample person: before
await page.goto(BASE);
await page.getByRole('button', { name: 'Try with a sample person' }).click();
await page.waitForSelector('.score');
check('sample starts at 1 of 5', (await page.textContent('.score')).includes('1 of 5'), await page.textContent('.score'));
check('the sign-in loop is shown', (await page.textContent('main')).includes('Code goes to the stolen SIM'));
check('eight findings listed', (await page.locator('main li.card .sev').count()) === 8);

// 2. Fix everything: after
for (let i = 0; i < 12; i++) {
  const btn = page.getByRole('button', { name: 'I fixed this' }).first();
  if (!(await btn.count())) break;
  await btn.click();
}
check('sample reaches 5 of 5 after the fixes', (await page.textContent('.score')).includes('5 of 5'), await page.textContent('.score'));
check('before and after are both shown', (await page.textContent('main')).includes('it was 1 of 5'));

// 3. Answers survive a reload (saved on the device)
await page.reload();
await page.waitForSelector('.score');
check('result survives a reload', (await page.textContent('.score')).includes('5 of 5'));

// 3a. Copy my plan link puts the go-link on the clipboard
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
await page.getByRole('button', { name: 'Copy my plan link' }).click();
await page.getByRole('button', { name: 'Copied' }).waitFor({ timeout: 3000 }).catch(() => {});
const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
check('copy my plan link copies the go-link', copied === `${BASE}/#/go/ke.a.saf.eq-kcb`, copied);
check('copy button says Copied', (await page.getByRole('button', { name: 'Copied' }).count()) === 1);

// 3b. The wallet card is built from the drill
await page.goto(`${BASE}/#/card`);
await page.waitForSelector('.cards');
const cardText = await page.textContent('main');
check('card shows the plan code', cardText.includes('ke.a.saf.eq-kcb'));
check('card shows the Safaricom any-network number', cardText.includes('0722 002 100'));

// 3c. The About page renders the nine-row numbers table from the data
await page.goto(`${BASE}/#/about`);
await page.waitForSelector('table.numbers');
check('about numbers table has nine rows', (await page.locator('table.numbers tbody tr').count()) === 9);

// 4. Offline after one visit
await page.evaluate(() => navigator.serviceWorker.ready);
await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 10000 }).catch(() => {});
await context.setOffline(true);
await page.goto(`${BASE}/#/go/ke.a.saf.eq-kcb`);
await page.reload();
await page.waitForSelector('ol.steps');
const text = await page.textContent('main');
check('go-link opens offline', text.includes('Phone gone: do these in order'));
check('offline plan has the Safaricom any-network number', text.includes('0722 002 100'));
check('offline plan has the Equity and KCB numbers', text.includes('0763 000 000') && text.includes('0711 087 000'));
check('lock step comes before the carrier call on a go-link', text.indexOf('Lock the phone with Find Hub') < text.indexOf('Call your carrier'));
const tel = await page.locator('a.tel').first().getAttribute('href');
check('numbers are tap-to-call links', tel === 'tel:999', tel);

// 5. Drill form: keyboard-reachable and validates
await page.goto(`${BASE}/#/drill`);
await page.waitForSelector('form fieldset');
check('drill shows 15 questions', (await page.locator('form fieldset').count()) === 15);
await page.getByRole('button', { name: 'See my result' }).click();
check('drill refuses to finish with answers missing', (await page.textContent('[role=alert]')).includes('Answer question 1 first'));

// 6. A bad code is explained, not crashed on
await page.goto(`${BASE}/#/go/nonsense`);
await page.waitForSelector('h1');
check('bad go code gets a plain message', (await page.textContent('h1')).includes('not a Phoneless plan'));

await context.setOffline(false);
check('no request left this site', outside.length === 0, outside.join(', '));
check('no page errors', errors.length === 0, errors.join(' | '));

await browser.close();
stop();
console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
