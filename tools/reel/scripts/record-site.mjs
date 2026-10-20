import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const tool = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [, , url = 'http://localhost:4321/', outDir = path.join(tool, 'media', 'frames')] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--window-size=1280,720', '--force-device-scale-factor=1', '--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await sleep(800);

const client = await page.createCDPSession();
const frames = [];
client.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const file = path.join(outDir, `f${String(frames.length).padStart(4, '0')}.jpg`);
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  frames.push({ file, t: metadata.timestamp });
  await client.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await client.send('Page.startScreencast', { format: 'jpeg', quality: 82, maxWidth: 1280, maxHeight: 720, everyNthFrame: 1 });
const marks = {};
const mark = (name) => (marks[name] = Date.now() / 1000);

const hitbox = await page.evaluate(() => {
  const r = document.querySelector('button[aria-label="Play the BitDroid mini game"]').getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});

mark('idle');
await page.mouse.move(700, 300);
await sleep(900);
await page.mouse.move(hitbox.x + 160, hitbox.y + 20, { steps: 20 });
await sleep(700);
await page.mouse.move(hitbox.x, hitbox.y, { steps: 12 });
await sleep(900);

mark('start');
await page.mouse.click(hitbox.x, hitbox.y);
await page.mouse.move(1200, 120);
await sleep(1100);
await page.evaluate(() => {
  const g = window.__bitdroid;
  g.spawnIndex = 1;
});
for (let i = 0; i < 3; i++) {
  await page.keyboard.down('ArrowDown');
  await sleep(70);
  await page.keyboard.up('ArrowDown');
  await sleep(650);
}
await page.keyboard.down('ArrowRight');
await sleep(250);
await page.keyboard.press('Space');
await sleep(500);
await page.keyboard.press('Space');
await sleep(700);
await page.keyboard.up('ArrowRight');
await sleep(500);

mark('zap');
const target = await page.evaluate(() => {
  const g = window.__bitdroid;
  g.player.invulnerable = 6;
  const drones = g.hostiles.filter((h) => h.constructor.name !== 'Enemy' && h.alive && !('legs' in h));
  const feet = g.player.feet();
  const anchor = { x: Math.min(Math.max(feet.x + 260, 200), innerWidth - 300), y: window.scrollY + 260 };
  drones.slice(0, 3).forEach((d, i) => (d.position = { x: anchor.x + i * 85, y: anchor.y + (i % 2) * 30 }));
  return { x: anchor.x, y: anchor.y - window.scrollY };
});
await sleep(450);
await page.mouse.click(target.x, target.y);
await sleep(1800);

mark('quit');
await page.keyboard.press('Escape');
await sleep(2600);

mark('cards');
await page.evaluate(() => window.scrollTo({ top: document.querySelector('#xr').offsetTop - 60, behavior: 'smooth' }));
await sleep(900);
const cards = await page.evaluate(() =>
  [...document.querySelectorAll('#xr .card')].slice(0, 3).map((c) => {
    const r = c.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.35 };
  }),
);
await page.mouse.move(cards[0].x, cards[0].y, { steps: 10 });
await sleep(1300);
await page.mouse.move(cards[1].x, cards[1].y, { steps: 10 });
await sleep(1300);
mark('end');

await client.send('Page.stopScreencast');
await sleep(300);
fs.writeFileSync(path.join(outDir, 'frames.json'), JSON.stringify({ frames, marks }, null, 1));
console.log('frames', frames.length, 'duration', (frames.at(-1).t - frames[0].t).toFixed(1), 's');
await browser.close();
