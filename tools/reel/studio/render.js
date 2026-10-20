import { FPS, W, H, DURATION, BEAT, BOOT_LINES, STAGES, SEGMENTS, COUNTDOWN_START, COIN_AT, segmentAt } from './timeline.js';
import { renderMusic, levels } from './music.js';
import { Muxer, ArrayBufferTarget } from './mp4-muxer.mjs';

const ACC = '#5ce1e6';
const ACC2 = '#c77dff';
const RED = '#ff4d6d';
const PIXEL = '"Press Start 2P"';
const MONO = '"JetBrains Mono"';

const canvas = document.querySelector('canvas');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');
const layer = new OffscreenCanvas(W, H);
const lctx = layer.getContext('2d');

const videos = new Map();
const images = new Map();
let siteFrames = [];

let seed = 42;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const hash = (n) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (x) => 1 - (1 - clamp(x, 0, 1)) ** 3;

async function loadVideo(src) {
  const blob = await (await fetch(`/${src}`)).blob();
  const v = document.createElement('video');
  v.muted = true;
  v.preload = 'auto';
  v.src = URL.createObjectURL(blob);
  await new Promise((resolve, reject) => {
    v.onloadeddata = resolve;
    v.onerror = () => reject(new Error(`video ${src}`));
  });
  return v;
}

async function loadImage(src) {
  const img = new Image();
  img.src = `/${src}`;
  await img.decode();
  return img;
}

async function seek(v, time) {
  const target = clamp(time, 0, v.duration - 0.05);
  if (Math.abs(v.currentTime - target) < 0.001 && v.readyState >= 2) return;
  const presented = new Promise((resolve) => {
    v.requestVideoFrameCallback(resolve);
    setTimeout(resolve, 250);
  });
  await new Promise((resolve) => {
    v.addEventListener('seeked', resolve, { once: true });
    v.currentTime = target;
  });
  await presented;
}

export async function prepare() {
  await Promise.all([`16px ${PIXEL}`, `20px ${MONO}`, `bold 20px ${MONO}`].map((f) => document.fonts.load(f)));
  for (const s of SEGMENTS) {
    if (s.src && !videos.has(s.src)) videos.set(s.src, await loadVideo(s.src));
    if (s.image && !images.has(s.image)) images.set(s.image, await loadImage(s.image));
  }
  const site = SEGMENTS.find((s) => s.kind === 'site');
  const meta = await (await fetch('/frames/frames.json')).json();
  const t0 = meta.frames[0].t;
  const wanted = meta.frames
    .map((f, i) => ({ i, t: f.t - t0 }))
    .filter((f) => f.t >= site.from - 0.1 && f.t <= site.from + (site.end - site.start) + 0.1);
  siteFrames = await Promise.all(wanted.map(async (f) => ({ t: f.t, img: await loadImage(`frames/f${String(f.i).padStart(4, '0')}.jpg`) })));
  return { videos: videos.size, images: images.size, siteFrames: siteFrames.length };
}

function drawCover(c, src, sw, sh, zoom = 1, dx = 0, dy = 0) {
  const ratio = sw / sh;
  const target = W / H;
  if (Math.abs(ratio - target) > 0.3) {
    c.save();
    c.filter = 'blur(24px) brightness(0.35) saturate(1.3)';
    const s = Math.max(W / sw, H / sh) * 1.15;
    c.drawImage(src, (W - sw * s) / 2, (H - sh * s) / 2, sw * s, sh * s);
    c.restore();
    const fit = Math.min(W / sw, H / sh) * zoom;
    c.drawImage(src, (W - sw * fit) / 2 + dx, (H - sh * fit) / 2 + dy, sw * fit, sh * fit);
    return;
  }
  const s = Math.max(W / sw, H / sh) * zoom;
  c.drawImage(src, (W - sw * s) / 2 + dx, (H - sh * s) / 2 + dy, sw * s, sh * s);
}

function beatPulse(t) {
  const since = (t % BEAT) / BEAT;
  return Math.exp(-since * 6);
}

function text(str, x, y, { font = `20px ${MONO}`, color = '#fff', align = 'left', baseline = 'alphabetic', shadow = 0, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = shadow;
  }
  ctx.fillText(str, x, y);
  ctx.restore();
}

function rgbText(str, x, y, font, color, jitter) {
  text(str, x - jitter, y, { font, color: ACC2, align: 'center', alpha: 0.75 });
  text(str, x + jitter, y, { font, color: ACC, align: 'center', alpha: 0.75 });
  text(str, x, y, { font, color, align: 'center', shadow: 18 });
}

function scoreAt(t) {
  let score = 0;
  for (const s of SEGMENTS) {
    if (!s.slug || t < s.start) continue;
    score += 1000 * ease((t - s.start) / 0.35);
  }
  return Math.round(score / 10) * 10;
}

function hud(t, seg) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, 70);
  g.addColorStop(0, 'rgba(0,0,0,0.75)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 70);
  ctx.restore();
  text(STAGES[seg.stage] ?? '', 32, 40, { font: `14px ${PIXEL}`, color: seg.stage === 4 ? RED : ACC });
  if (Math.floor(t * 2) % 2 === 0) text('1UP', W - 300, 40, { font: `14px ${PIXEL}`, color: RED });
  text(`SCORE ${String(scoreAt(t)).padStart(6, '0')}`, W - 32, 40, { font: `14px ${PIXEL}`, color: '#fff', align: 'right' });
}

function label(t, seg, command) {
  const local = t - seg.start;
  const cmd = command ?? `❯ cat ~/projects/${seg.slug}/`;
  const shown = cmd.slice(0, Math.floor(clamp(local, 0, 1) * 110));
  ctx.save();
  ctx.font = `bold 34px ${MONO}`;
  const titleW = ctx.measureText(seg.title).width;
  ctx.font = `18px ${MONO}`;
  const cmdW = ctx.measureText(cmd).width;
  const w = Math.max(titleW, cmdW) + 48;
  const x = 32;
  const y = H - 128;
  const slide = (1 - ease(local / 0.25)) * -40;
  ctx.translate(slide, 0);
  ctx.fillStyle = 'rgba(10,13,11,0.82)';
  ctx.fillRect(x, y, w, 96);
  ctx.fillStyle = ACC;
  ctx.fillRect(x, y, 4, 96);
  ctx.fillRect(x, y + 92, w, 4);
  ctx.restore();
  ctx.save();
  ctx.translate(slide, 0);
  text(shown + (Math.floor(t * 4) % 2 ? '█' : ''), x + 24, y + 34, { font: `18px ${MONO}`, color: ACC });
  text(seg.title, x + 24, y + 76, { font: `bold 34px ${MONO}`, color: '#fff' });
  ctx.restore();
}

function cutGlitch(t, seg) {
  const local = t - seg.start;
  if (local > 0.14) return;
  const k = 1 - local / 0.14;
  lctx.clearRect(0, 0, W, H);
  lctx.drawImage(canvas, 0, 0);
  const slices = 9;
  for (let i = 0; i < slices; i++) {
    const y = Math.floor(hash(i + seg.start * 13 + Math.floor(t * FPS)) * H);
    const h = 8 + Math.floor(hash(i * 3.3 + seg.start) * 50);
    const dx = (hash(i * 7.7 + t) - 0.5) * 140 * k;
    ctx.drawImage(layer, 0, y, W, h, dx, y, W, h);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.35 * k;
  ctx.drawImage(layer, -10 * k, 0);
  ctx.fillStyle = ACC2;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  if (local < 1 / FPS + 0.001) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, 0, W, H);
  }
}

function grid(t, color, speed = 1) {
  ctx.save();
  const horizon = H * 0.58;
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#07090a');
  sky.addColorStop(1, '#1c0f2a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, horizon);
  ctx.fillStyle = '#080a09';
  ctx.fillRect(0, horizon, W, H - horizon);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.55;
  for (let i = -12; i <= 12; i++) {
    ctx.beginPath();
    ctx.moveTo(W / 2 + i * 30, horizon);
    ctx.lineTo(W / 2 + i * 260, H);
    ctx.stroke();
  }
  const phase = (t * speed * 2) % 1;
  for (let i = 0; i < 12; i++) {
    const z = (i + phase) / 12;
    const y = horizon + (H - horizon) * z * z;
    ctx.globalAlpha = 0.15 + 0.5 * z;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 30;
  ctx.fillRect(0, horizon - 1, W, 2);
  ctx.restore();
}

function drawBoot(t) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  if (t < 3.2) {
    BOOT_LINES.forEach((line, i) => {
      if (t < line.t) return;
      const typed = line.text.slice(0, Math.floor((t - line.t) * 60));
      const y = 150 + i * 46;
      text(typed, 120, y, { font: `24px ${MONO}`, color: ACC });
      if (line.status && t > line.t + 0.36) {
        const dots = '.'.repeat(Math.max(2, 34 - line.text.length));
        const isBar = line.status === '100%';
        const prog = clamp((t - line.t - 0.1) / 0.5, 0, 1);
        const status = isBar ? `[${'█'.repeat(Math.round(prog * 12)).padEnd(12, '·')}] ${Math.round(prog * 100)}%` : `${dots} ${line.status}`;
        text(status, 120 + typed.length * 14.5, y, { font: `24px ${MONO}`, color: line.status === 'ONLINE' ? ACC2 : '#c9d4cd' });
      }
      const last = BOOT_LINES.filter((l) => t >= l.t).at(-1) === line;
      if (last && Math.floor(t * 6) % 2 === 0) text('█', 120 + typed.length * 14.5 + 4, y, { font: `24px ${MONO}`, color: ACC });
    });
    text('NINQUIET BIOS v6 · 2020–2026', 120, 92, { font: `14px ${PIXEL}`, color: '#7a8a80' });
  } else {
    const k = t - 3.2;
    const jitter = k < 0.3 || (k > 0.48 && k < 0.56) ? 6 + hash(t * 99) * 12 : 2;
    grid(t, ACC2, 0.5);
    rgbText('NINQUIET_', W / 2, H / 2 - 20, `72px ${PIXEL}`, '#fff', jitter);
    text('JESÚS ANGARITA · UNITY · XR · VFX · GAMES · AI AGENTS', W / 2, H / 2 + 50, { font: `20px ${MONO}`, color: ACC, align: 'center', alpha: ease(k / 0.3) });
    if (k > 0.7) {
      ctx.fillStyle = `rgba(255,255,255,${(k - 0.7) / 0.1})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

function drawCard(t, seg) {
  const local = t - seg.start;
  const color = [null, ACC, ACC2, ACC][seg.stage];
  grid(t, color, 1);
  const jitter = local < 0.18 ? 14 * (1 - local / 0.18) + hash(t * 50) * 6 : 0;
  const pop = 1 + 0.25 * (1 - ease(local / 0.2));
  ctx.save();
  ctx.translate(W / 2, H / 2 - 40);
  ctx.scale(pop, pop);
  rgbText(seg.title, 0, 0, `76px ${PIXEL}`, color, jitter + 3);
  ctx.restore();
  text(seg.subtitle, W / 2, H / 2 + 30, { font: `28px ${PIXEL}`, color: '#fff', align: 'center', alpha: ease((local - 0.1) / 0.2) });
  if (local > 1 && local < 1.75 && Math.floor(local * 8) % 2 === 0) text('READY?', W / 2, H / 2 + 110, { font: `20px ${PIXEL}`, color: '#fff', align: 'center' });
  if (local >= 1.75) text('GO!', W / 2, H / 2 + 120, { font: `40px ${PIXEL}`, color: RED, align: 'center', shadow: 20 });
  text(`SCORE ${String(scoreAt(t)).padStart(6, '0')}`, W - 32, 40, { font: `14px ${PIXEL}`, color: '#fff', align: 'right' });
}

async function drawClip(t, seg) {
  const v = videos.get(seg.src);
  await seek(v, seg.from + (t - seg.start));
  const zoom = (seg.zoom ?? 1) + 0.018 * beatPulse(t) + 0.03 * ((t - seg.start) / (seg.end - seg.start));
  drawCover(ctx, v, v.videoWidth, v.videoHeight, zoom);
}

function drawCounter(t, seg) {
  const local = t - seg.start;
  const img = images.get(seg.image);
  drawCover(ctx, img, img.naturalWidth, img.naturalHeight, 1.05 + local * 0.02);
  ctx.fillStyle = 'rgba(5,7,6,0.84)';
  ctx.fillRect(0, 0, W, H);
  const n = Math.round(ease(local / 1.2) * 400);
  const done = n >= 400;
  const pop = done ? 1 + 0.12 * Math.exp(-(local - 1.2) * 8) : 1;
  ctx.save();
  ctx.translate(W / 2, H / 2 + 10);
  ctx.scale(pop, pop);
  rgbText(`${n}K${done ? '+' : ''}`, 0, 0, `110px ${PIXEL}`, '#fff', done ? 3 : 6);
  ctx.restore();
  text('USERS', W / 2, H / 2 + 80, { font: `26px ${PIXEL}`, color: ACC, align: 'center' });
  text('Unity Dev Assistant & friends', W / 2, H / 2 - 110, { font: `22px ${MONO}`, color: '#c9d4cd', align: 'center' });
}

function drawPrompt(t, seg) {
  const local = t - seg.start;
  const img = images.get(seg.image);
  drawCover(ctx, img, img.naturalWidth, img.naturalHeight, 1.1);
  ctx.fillStyle = 'rgba(5,7,6,0.78)';
  ctx.fillRect(0, 0, W, H);
  const x = 150;
  const y = 120;
  const w = W - 300;
  const h = 400;
  ctx.fillStyle = '#0e1311';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = ACC;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#141b17';
  ctx.fillRect(x, y, w, 40);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + 18 + i * 24, y + 14, 12, 12);
  });
  text('codex · unity essentials', x + w / 2, y + 27, { font: `16px ${MONO}`, color: '#7a8a80', align: 'center' });
  const prompt = 'Investigate this Unity bug and find the root cause with evidence.';
  text('❯ ' + prompt.slice(0, Math.floor(local * 80)), x + 30, y + 95, { font: `21px ${MONO}`, color: '#fff' });
  const skills = ['unity-project-onboarding', 'unity-bug-investigation', 'unity-project-health-check', 'unity-build-validation'];
  skills.forEach((s, i) => {
    const at = 0.9 + i * 0.18;
    if (local < at) return;
    text(`✔ ${s}`, x + 30, y + 160 + i * 44, { font: `20px ${MONO}`, color: i === 1 ? ACC2 : ACC });
  });
}

function drawSite(t, seg) {
  const rt = seg.from + (t - seg.start);
  let frame = siteFrames[0];
  for (const f of siteFrames) if (f.t <= rt) frame = f;
  drawCover(ctx, frame.img, frame.img.naturalWidth, frame.img.naturalHeight, 1.08 + 0.012 * beatPulse(t));
  ctx.save();
  ctx.globalAlpha = 0.12 * beatPulse(t);
  ctx.fillStyle = RED;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function hazard(y, t, dir) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y, W, 44);
  ctx.clip();
  ctx.fillStyle = '#1a0006';
  ctx.fillRect(0, y, W, 44);
  ctx.fillStyle = RED;
  const off = (t * 160 * dir) % 80;
  for (let x = -120; x < W + 120; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x + off, y + 44);
    ctx.lineTo(x + off + 40, y + 44);
    ctx.lineTo(x + off + 84, y);
    ctx.lineTo(x + off + 44, y);
    ctx.fill();
  }
  ctx.restore();
}

function drawWarning(t, seg) {
  const local = t - seg.start;
  const on = Math.floor(local * 4) % 2 === 0;
  ctx.fillStyle = on ? '#16000a' : '#050000';
  ctx.fillRect(0, 0, W, H);
  hazard(80, t, 1);
  hazard(H - 124, t, -1);
  if (on) rgbText('WARNING!', W / 2, H / 2 - 20, `84px ${PIXEL}`, RED, 4 + hash(t) * 4);
  text('BOSS APPROACHING', W / 2, H / 2 + 50, { font: `24px ${PIXEL}`, color: '#fff', align: 'center' });
  text('ninquiet.com', W / 2, H / 2 + 100, { font: `26px ${MONO}`, color: ACC, align: 'center', alpha: ease((local - 0.5) / 0.3) });
}

function drawContinue(t) {
  const local = t - COUNTDOWN_START;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  grid(t, ACC2, 0.25);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);
  if (t < COIN_AT) {
    const i = Math.min(9, Math.floor(local / BEAT));
    const k = (local % BEAT) / BEAT;
    rgbText('CONTINUE?', W / 2, 150, `52px ${PIXEL}`, ACC2, 3);
    ctx.save();
    ctx.translate(W / 2, 360);
    const s = 1 + 0.35 * Math.exp(-k * 7);
    ctx.scale(s, s);
    text(String(9 - i), 0, 0, { font: `150px ${PIXEL}`, color: '#fff', align: 'center', baseline: 'middle', shadow: 26 });
    ctx.restore();
    if (Math.floor(t * 3) % 2 === 0) text('INSERT COIN  =  HIRE ME', W / 2, 520, { font: `22px ${PIXEL}`, color: ACC, align: 'center' });
    text('jesus.ninquiet@gmail.com', W / 2, 590, { font: `28px ${MONO}`, color: '#fff', align: 'center' });
    text('ninquiet.com  ·  cv.pdf', W / 2, 635, { font: `22px ${MONO}`, color: '#7a8a80', align: 'center' });
  } else {
    const k = t - COIN_AT;
    rgbText('CREDIT 01', W / 2, 250, `64px ${PIXEL}`, ACC, k < 0.2 ? 10 : 3);
    text('THANKS FOR PLAYING', W / 2, 340, { font: `26px ${PIXEL}`, color: '#fff', align: 'center' });
    text('jesus.ninquiet@gmail.com', W / 2, 470, { font: `28px ${MONO}`, color: '#fff', align: 'center' });
    text('ninquiet.com', W / 2, 520, { font: `28px ${MONO}`, color: ACC, align: 'center' });
    if (k < 0.12) {
      ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - k / 0.12)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

const grain = new OffscreenCanvas(256, 256);
{
  const g = grain.getContext('2d');
  const data = g.createImageData(256, 256);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = rnd() * 255;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
    data.data[i + 3] = 22;
  }
  g.putImageData(data, 0, 0);
}
const scan = new OffscreenCanvas(W, H);
{
  const s = scan.getContext('2d');
  s.fillStyle = 'rgba(0,0,0,0.16)';
  for (let y = 0; y < H; y += 3) s.fillRect(0, y, W, 1);
  const v = s.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.6)');
  s.fillStyle = v;
  s.fillRect(0, 0, W, H);
}

function post(t) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const ox = Math.floor(hash(t * 3) * 256);
  const oy = Math.floor(hash(t * 7) * 256);
  ctx.fillStyle = ctx.createPattern(grain, 'repeat');
  ctx.translate(-ox, -oy);
  ctx.fillRect(ox, oy, W, H);
  ctx.restore();
  ctx.drawImage(scan, 0, 0);
}

export async function drawFrame(t) {
  const seg = segmentAt(t);
  ctx.save();
  switch (seg.kind) {
    case 'boot':
      drawBoot(t);
      break;
    case 'card':
      drawCard(t, seg);
      break;
    case 'clip':
      await drawClip(t, seg);
      break;
    case 'counter':
      drawCounter(t, seg);
      break;
    case 'prompt':
      drawPrompt(t, seg);
      break;
    case 'site':
      drawSite(t, seg);
      break;
    case 'warning':
      drawWarning(t, seg);
      break;
    case 'continue':
      drawContinue(t);
      break;
  }
  ctx.restore();
  if (seg.slug) {
    hud(t, seg);
    label(t, seg, seg.kind === 'site' ? '❯ ./play bitdroid --level home' : undefined);
  }
  if (seg.kind !== 'boot') cutGlitch(t, seg);
  post(t);
}

export async function still(t) {
  await drawFrame(t);
  return canvas.toDataURL('image/jpeg', 0.85);
}

let output = null;

export async function encode(onProgress) {
  const audioRate = 48000;
  const { buffer: audio, peak } = await renderMusic(audioRate, DURATION);
  const report = levels(audio, [
    [0, 4, 'boot'], [4, 6, 'card1'], [6, 22, 'stage1'], [22, 24, 'card2'], [24, 36, 'stage2'],
    [36, 38, 'card3'], [38, 46, 'stage3'], [46, 48, 'warning'], [48, 54, 'boss'], [54, 60, 'continue'],
  ]);
  const aacOk = (await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: audioRate, numberOfChannels: 2, bitrate: 160000 })).supported;
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: W, height: H, frameRate: FPS },
    audio: { codec: aacOk ? 'aac' : 'opus', numberOfChannels: 2, sampleRate: audioRate },
    fastStart: 'in-memory',
  });

  const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => { throw e; } });
  ae.configure({ codec: aacOk ? 'mp4a.40.2' : 'opus', sampleRate: audioRate, numberOfChannels: 2, bitrate: 160000 });
  const L = audio.getChannelData(0);
  const R = audio.getChannelData(1);
  const chunk = 4800;
  for (let i = 0; i < L.length; i += chunk) {
    const n = Math.min(chunk, L.length - i);
    const data = new Float32Array(n * 2);
    data.set(L.subarray(i, i + n), 0);
    data.set(R.subarray(i, i + n), n);
    const ad = new AudioData({ format: 'f32-planar', sampleRate: audioRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / audioRate) * 1e6), data });
    ae.encode(ad);
    ad.close();
  }
  await ae.flush();

  const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => { throw e; } });
  ve.configure({ codec: 'avc1.640028', width: W, height: H, bitrate: 2_000_000, framerate: FPS, latencyMode: 'quality', avc: { format: 'avc' } });
  const total = DURATION * FPS;
  for (let f = 0; f < total; f++) {
    const t = f / FPS;
    await drawFrame(t);
    const frame = new VideoFrame(canvas, { timestamp: Math.round((f * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    ve.encode(frame, { keyFrame: f % (FPS * 2) === 0 });
    frame.close();
    while (ve.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 1));
    if (f % 150 === 0) onProgress?.(f, total);
  }
  await ve.flush();
  muxer.finalize();
  output = new Uint8Array(muxer.target.buffer);

  const wav = toWav(audio);
  window.__wav = wav;
  return { bytes: output.length, aac: aacOk, peak, report };
}

function toWav(buffer) {
  const n = buffer.length;
  const out = new DataView(new ArrayBuffer(44 + n * 4));
  const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  out.setUint32(4, 36 + n * 4, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, 2, true);
  out.setUint32(24, buffer.sampleRate, true);
  out.setUint32(28, buffer.sampleRate * 4, true);
  out.setUint16(32, 4, true);
  out.setUint16(34, 16, true);
  w(36, 'data');
  out.setUint32(40, n * 4, true);
  const L = buffer.getChannelData(0);
  const R = buffer.getChannelData(1);
  for (let i = 0; i < n; i++) {
    out.setInt16(44 + i * 4, clamp(L[i], -1, 1) * 32767, true);
    out.setInt16(46 + i * 4, clamp(R[i], -1, 1) * 32767, true);
  }
  return new Uint8Array(out.buffer);
}

function slice(bytes, offset, size) {
  const part = bytes.subarray(offset, offset + size);
  let s = '';
  for (let i = 0; i < part.length; i += 0x8000) s += String.fromCharCode(...part.subarray(i, i + 0x8000));
  return btoa(s);
}

export const readOutput = (offset, size) => slice(output, offset, size);
export const readWav = (offset, size) => slice(window.__wav, offset, size);
export const wavLength = () => window.__wav.length;

export async function probe(src, t) {
  if (!videos.has(src)) videos.set(src, await loadVideo(src));
  const v = videos.get(src);
  await seek(v, t);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  drawCover(ctx, v, v.videoWidth, v.videoHeight);
  text(`${src} @ ${t}`, 20, 40, { font: `28px ${MONO}`, color: '#ff0' });
  return canvas.toDataURL('image/jpeg', 0.7);
}
