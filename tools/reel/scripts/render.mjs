import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const tool = path.resolve(here, '..');
const studio = path.join(tool, 'studio');
const media = path.join(tool, 'media');
const out = path.join(tool, 'out');
const muxer = path.join(tool, 'node_modules', 'mp4-muxer', 'build', 'mp4-muxer.mjs');
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [, , mode = 'stills', list = '1.5,5,7,25,41,43,47,50,56,59.5'] = process.argv;

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.png': 'image/png' };

function resolve(urlPath) {
  if (urlPath === '/studio/mp4-muxer.mjs') return muxer;
  if (urlPath.startsWith('/studio/')) return path.join(studio, urlPath.slice('/studio/'.length));
  return path.join(media, urlPath);
}

const server = http
  .createServer((req, res) => {
    const file = resolve(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!(file.startsWith(tool) && fs.existsSync(file) && fs.statSync(file).isFile())) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(8765);

const outDir = path.join(out, mode);
fs.mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  protocolTimeout: 1_800_000,
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
  defaultViewport: { width: 1280, height: 720 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8765/studio/index.html');
await page.waitForFunction('window.studioReady', { timeout: 60000 });
console.log('prepare', await page.evaluate(() => window.studio.prepare()));

const pull = async (fn, length) => {
  const parts = [];
  for (let offset = 0; offset < length; offset += 4_000_000) {
    parts.push(Buffer.from(await page.evaluate((f, o) => window.studio[f](o, 4_000_000), fn, offset), 'base64'));
  }
  return Buffer.concat(parts);
};
const saveJpeg = (name, dataUrl) => fs.writeFileSync(path.join(outDir, name), Buffer.from(dataUrl.split(',')[1], 'base64'));

if (mode === 'stills') {
  for (const t of list.split(',').map(Number)) saveJpeg(`t${t.toFixed(2).padStart(6, '0')}.jpg`, await page.evaluate((t) => window.studio.still(t), t));
} else if (mode === 'probe') {
  const [src, times] = list.split('@');
  for (const t of times.split(',').map(Number)) saveJpeg(`p${String(t).padStart(6, '0')}.jpg`, await page.evaluate((s, t) => window.studio.probe(s, t), src, t));
} else if (mode === 'full') {
  await page.exposeFunction('progress', (f, total) => console.log('frame', f, '/', total));
  const info = await page.evaluate(() => window.studio.encode((f, t) => window.progress(f, t)));
  console.log(JSON.stringify(info, null, 1));
  fs.writeFileSync(path.join(outDir, 'reel.mp4'), await pull('readOutput', info.bytes));
  fs.writeFileSync(path.join(outDir, 'reel.wav'), await pull('readWav', await page.evaluate(() => window.studio.wavLength())));
} else {
  console.log(`unknown mode: ${mode} (use stills | probe | full)`);
}
console.log('output:', outDir);
await browser.close();
server.close();
