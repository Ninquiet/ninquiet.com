import { BEAT, BAR, BOOT_LINES, COUNTDOWN_START, COIN_AT } from './timeline.js';

const S16 = BEAT / 4;
const S8 = BEAT / 2;
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

const PROG = [
  { root: 45, pad: [57, 60, 64], arp: [69, 72, 76, 81] },
  { root: 41, pad: [57, 60, 65], arp: [65, 69, 72, 77] },
  { root: 48, pad: [55, 60, 64], arp: [67, 72, 76, 79] },
  { root: 43, pad: [55, 59, 62], arp: [67, 71, 74, 79] },
];

const MELODY = [
  [69, 72, 76, 81, 79, 76, 74, 76],
  [72, 69, 72, 77, 76, 72, 69, 72],
  [67, 72, 76, 79, 76, 79, 81, 79],
  [74, 71, 67, 71, 74, 79, 74, 71],
  [81, 0, 81, 79, 76, 0, 72, 74],
  [76, 74, 71, 67, 71, 74, 79, 83],
];

export async function renderMusic(sampleRate, duration) {
  const ctx = new OfflineAudioContext(2, Math.round(sampleRate * duration), sampleRate);
  let seed = 1337;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const gainNode = (value, dest) => {
    const g = ctx.createGain();
    g.gain.value = value;
    if (dest) g.connect(dest);
    return g;
  };

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.knee.value = 8;
  comp.ratio.value = 3.5;
  comp.attack.value = 0.004;
  comp.release.value = 0.15;
  comp.connect(ctx.destination);
  const master = gainNode(0.7, comp);

  const noise = ctx.createBuffer(1, sampleRate * 2, sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;

  const impulse = ctx.createBuffer(2, sampleRate * 2.4, sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] = (rnd() * 2 - 1) * (1 - i / d.length) ** 3;
  }
  const reverb = ctx.createConvolver();
  reverb.buffer = impulse;
  reverb.connect(gainNode(0.28, master));

  const delay = ctx.createDelay(1);
  delay.delayTime.value = S16 * 3;
  const feedback = gainNode(0.38, delay);
  delay.connect(feedback);
  const delayPan = ctx.createStereoPanner();
  delayPan.pan.value = 0.35;
  delay.connect(gainNode(0.32, delayPan));
  delayPan.connect(master);

  const drums = gainNode(0.95, master);
  const duckBus = gainNode(1, master);
  const chip = gainNode(0.9, master);
  const kicks = [];

  const pulseWave = (duty) => {
    const n = 64;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return ctx.createPeriodicWave(real, imag);
  };
  const pulse25 = pulseWave(0.25);
  const pulse12 = pulseWave(0.125);

  const send = (node, amount, target = reverb) => node.connect(gainNode(amount, target));

  function tone({ type = 'sawtooth', wave, freq, t, dur, gain = 0.2, attack = 0.005, release = 0.06, pluck = false, dest = duckBus, detune = 0, cutoff, q = 0.8, glideTo, pan = 0, rev = 0, echo = 0 }) {
    const o = ctx.createOscillator();
    if (wave) o.setPeriodicWave(wave);
    else o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    o.detune.value = detune;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    if (pluck) g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    else {
      g.gain.setValueAtTime(gain, Math.max(t + attack, t + dur - release));
      g.gain.linearRampToValueAtTime(0, t + dur);
    }
    let node = o;
    if (cutoff) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cutoff;
      f.Q.value = q;
      o.connect(f);
      node = f;
    }
    node.connect(g);
    let out = g;
    if (pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      out = p;
    }
    out.connect(dest);
    if (rev) send(out, rev);
    if (echo) send(out, echo, delay);
    o.start(t);
    o.stop(t + dur + 0.05);
    return g;
  }

  function noiseHit({ t, dur, gain, type = 'highpass', freq = 6000, q = 0.7, dest = drums, rev = 0, sweepTo, decay = true, pan = 0 }) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    if (decay) {
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    } else {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + dur);
      g.gain.setValueAtTime(0, t + dur);
    }
    src.connect(f).connect(g);
    let out = g;
    if (pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      out = p;
    }
    out.connect(dest);
    if (rev) send(out, rev);
    src.start(t, rnd() * 1.5);
    src.stop(t + dur + 0.02);
  }

  function kick(t, vol = 1, duck = true) {
    tone({ type: 'sine', freq: 165, glideTo: 42, t, dur: 0.38, gain: vol, attack: 0.002, pluck: true, dest: drums });
    noiseHit({ t, dur: 0.015, gain: 0.25 * vol, freq: 3000 });
    if (duck) kicks.push(t);
  }
  function chipKick(t, vol = 0.8) {
    tone({ type: 'square', freq: 140, glideTo: 40, t, dur: 0.12, gain: 0.35 * vol, attack: 0.001, pluck: true, dest: chip, cutoff: 900 });
    tone({ type: 'sine', freq: 120, glideTo: 40, t, dur: 0.25, gain: 0.7 * vol, attack: 0.001, pluck: true, dest: drums });
    kicks.push(t);
  }
  const snare = (t, vol = 0.55) => {
    noiseHit({ t, dur: 0.22, gain: vol, freq: 1400, rev: 0.35 });
    tone({ type: 'triangle', freq: 210, glideTo: 150, t, dur: 0.12, gain: vol * 0.5, pluck: true, dest: drums });
  };
  const chipSnare = (t, vol = 0.45) => noiseHit({ t, dur: 0.11, gain: vol, type: 'bandpass', freq: 2600, q: 0.6, rev: 0.1 });
  const hat = (t, vol = 0.12, open = false) => noiseHit({ t, dur: open ? 0.22 : 0.035, gain: vol, freq: 8500, pan: 0.15 });
  const crash = (t, vol = 0.35) => noiseHit({ t, dur: 1.6, gain: vol, freq: 3800, rev: 0.4 });

  function impact(t, vol = 1) {
    kick(t, vol, false);
    tone({ type: 'sine', freq: 75, glideTo: 26, t, dur: 0.95, gain: 0.75 * vol, attack: 0.003, pluck: true, dest: drums });
    noiseHit({ t, dur: 0.5, gain: 0.35 * vol, type: 'lowpass', freq: 1800, rev: 0.5 });
    crash(t, 0.4 * vol);
  }

  function riser(t0, t1, vol = 0.3) {
    noiseHit({ t: t0, dur: t1 - t0, gain: vol, type: 'bandpass', freq: 400, sweepTo: 7000, q: 2.5, decay: false, rev: 0.3, dest: master });
    tone({ freq: 110, glideTo: 880, t: t0, dur: t1 - t0, gain: vol * 0.22, attack: t1 - t0 - 0.05, release: 0.03, cutoff: 2400, dest: master });
  }

  function roll(t0, t1, from = 0.12, to = 0.6) {
    const n = Math.round((t1 - t0) / S16);
    for (let i = 0; i < n; i++) {
      const k = i / Math.max(1, n - 1);
      noiseHit({ t: t0 + i * S16, dur: 0.12, gain: from + (to - from) * k, freq: 1300 + 1400 * k, rev: 0.2 });
    }
  }

  function jingle(t, notes) {
    notes.forEach((m, i) => {
      const last = i === notes.length - 1;
      tone({ wave: pulse25, freq: mtof(m), t: t + i * 0.085, dur: last ? 0.45 : 0.09, gain: 0.11, attack: 0.002, pluck: last, dest: chip, rev: 0.2, echo: last ? 0.4 : 0 });
    });
  }

  function pad(t, chord, dur, gain = 0.045, cutoff = 1500) {
    chord.pad.forEach((m, i) => {
      [-9, 9].forEach((detune) => tone({ freq: mtof(m), t, dur, gain, attack: 0.25, release: 0.35, detune, cutoff, pan: detune > 0 ? 0.25 : -0.25, rev: 0.35 }));
      if (i === 0) tone({ type: 'triangle', freq: mtof(m - 12), t, dur, gain: gain * 0.8, attack: 0.25, release: 0.35 });
    });
  }

  function synthwaveBar(t, chord, opts = {}) {
    const { arpCutoff = 3800, hats16 = true, openHats = false, snareOn = true } = opts;
    for (let b = 0; b < 4; b++) {
      const bt = t + b * BEAT;
      kick(bt);
      if (snareOn && b % 2 === 1) snare(bt);
      hat(bt + S8, 0.13, openHats);
      if (hats16) {
        hat(bt + S16, 0.045);
        hat(bt + 3 * S16, 0.045);
      }
    }
    for (let i = 0; i < 8; i++) {
      const m = chord.root - 12 + (i % 2 ? 12 : 0);
      tone({ freq: mtof(m), t: t + i * S8, dur: S8 * 0.9, gain: 0.2, attack: 0.004, release: 0.05, cutoff: 650, q: 3 });
    }
    const order = [0, 1, 2, 3, 2, 1, 0, 1];
    for (let i = 0; i < 16; i++) {
      tone({ type: 'square', freq: mtof(chord.arp[order[i % 8]]), t: t + i * S16, dur: 0.14, gain: 0.05, attack: 0.002, pluck: true, cutoff: arpCutoff, echo: 0.5, pan: i % 2 ? 0.2 : -0.2 });
    }
    pad(t, chord, BAR);
  }

  function chipBar(t, chord, melody) {
    for (let b = 0; b < 4; b++) {
      const bt = t + b * BEAT;
      if (b % 2 === 0) chipKick(bt);
      else chipSnare(bt);
      hat(bt + S8, 0.09);
    }
    chipKick(t + 3 * BEAT + S8, 0.5);
    for (let i = 0; i < 8; i++) {
      const m = chord.root - 12 + (i % 2 ? 12 : 0);
      tone({ type: 'triangle', freq: mtof(m), t: t + i * S8, dur: S8 * 0.85, gain: 0.32, attack: 0.002, release: 0.02, dest: chip });
    }
    melody.forEach((m, i) => {
      if (!m) return;
      tone({ wave: pulse25, freq: mtof(m), t: t + i * S8, dur: S8 * 0.9, gain: 0.085, attack: 0.002, release: 0.03, dest: chip, echo: 0.25, rev: 0.12 });
    });
    const step = BEAT / 8;
    for (let i = 0; i < BAR / step; i++) {
      tone({ wave: pulse12, freq: mtof(chord.arp[i % 3] - 12), t: t + i * step, dur: step, gain: 0.028, attack: 0.001, release: 0.005, dest: chip, pan: -0.3 });
    }
  }

  function techBar(t, chord, k) {
    for (let b = 0; b < 4; b++) {
      const bt = t + b * BEAT;
      kick(bt, 0.9);
      if (b % 2 === 1) noiseHit({ t: bt, dur: 0.16, gain: 0.4, type: 'bandpass', freq: 1800, q: 1.2, rev: 0.45 });
      for (let s = 0; s < 4; s++) hat(bt + s * S16, s === 2 ? 0.11 : 0.04);
    }
    for (let i = 0; i < 16; i++) {
      tone({ type: 'triangle', freq: mtof(chord.arp[(i * 3) % 4] + (i % 8 === 7 ? 12 : 0)), t: t + i * S16, dur: 0.16, gain: 0.07, attack: 0.002, pluck: true, echo: 0.55, pan: Math.sin(i) * 0.4 });
      if (rnd() < 0.32) tone({ type: 'sine', freq: 1800 + rnd() * 2600, t: t + i * S16 + S16 / 2, dur: 0.03, gain: 0.035, attack: 0.001, release: 0.01, dest: master, pan: rnd() * 1.6 - 0.8 });
    }
    for (let i = 0; i < 8; i++) {
      tone({ freq: mtof(chord.root - 12), t: t + i * S8, dur: S8 * 0.6, gain: 0.2, attack: 0.003, release: 0.04, cutoff: 300 + 900 * ((i + k * 8) / 32), q: 6 });
    }
    pad(t, chord, BAR, 0.04, 1100 + k * 300);
  }

  function bossBar(t, root, chordNotes) {
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * 4);
    }
    shaper.curve = curve;
    const dist = gainNode(0.5, duckBus);
    shaper.connect(dist);
    for (let b = 0; b < 4; b++) {
      const bt = t + b * BEAT;
      kick(bt, 1.05);
      if (b % 2 === 1) snare(bt, 0.6);
      for (let s = 0; s < 4; s++) hat(bt + s * S16, s % 2 ? 0.1 : 0.05);
    }
    kick(t + 2 * BEAT + 3 * S16, 0.7);
    for (let i = 0; i < 16; i++) {
      const m = root - 12 + (i % 4 === 3 ? 12 : 0);
      tone({ freq: mtof(m), t: t + i * S16, dur: S16 * 0.85, gain: 0.32, attack: 0.002, release: 0.02, cutoff: 1400, q: 4, dest: shaper });
    }
    [S8, BEAT + S8, 2 * BEAT + S8, 3 * BEAT + S8].forEach((o) => {
      chordNotes.forEach((m) => tone({ freq: mtof(m), t: t + o, dur: 0.18, gain: 0.05, attack: 0.003, pluck: true, cutoff: 3000, rev: 0.25, echo: 0.2 }));
    });
  }

  tone({ type: 'sine', freq: 40, glideTo: 90, t: 0, dur: 0.9, gain: 0.25, attack: 0.4, release: 0.3, dest: master });
  for (let i = 1; i < 24; i++) {
    const t = 0.2 + i * S16;
    if (t > 3.1 || rnd() > 0.55) continue;
    const freqs = [1046, 1318, 1568, 1760, 2093];
    tone({ type: 'square', freq: freqs[Math.floor(rnd() * freqs.length)], t, dur: 0.04, gain: 0.03, attack: 0.001, release: 0.01, dest: master, pan: rnd() * 1.4 - 0.7 });
  }
  BOOT_LINES.forEach((line) => {
    if (!line.status) return;
    tone({ type: 'square', freq: 1568, t: line.t + 0.36, dur: 0.05, gain: 0.05, attack: 0.001, release: 0.01, dest: master });
    tone({ type: 'square', freq: 2093, t: line.t + 0.41, dur: 0.07, gain: 0.05, attack: 0.001, release: 0.02, dest: master });
  });
  riser(2.2, 4, 0.28);
  [3.25, 3.36, 3.42, 3.7].forEach((t) => noiseHit({ t, dur: 0.06, gain: 0.25, type: 'bandpass', freq: 3000, q: 0.5, dest: master }));
  tone({ type: 'sawtooth', freq: mtof(45), t: 3.2, dur: 0.8, gain: 0.06, attack: 0.05, release: 0.1, cutoff: 900, dest: master, rev: 0.4 });

  function card(t, notes, vol = 1) {
    impact(t, vol);
    jingle(t + 0.05, notes);
    kick(t + BEAT * 2, 0.7);
    kick(t + BEAT * 3, 0.7);
    roll(t + BEAT * 2, t + BAR, 0.08, 0.55);
    noiseHit({ t: t + BEAT * 2, dur: BEAT * 2, gain: 0.25, type: 'lowpass', freq: 600, sweepTo: 9000, decay: false, rev: 0.3, dest: master });
  }

  card(4, [69, 72, 76, 81]);
  for (let bar = 0; bar < 8; bar++) {
    const t = 6 + bar * BAR;
    synthwaveBar(t, PROG[bar % 4], { arpCutoff: 2200 + bar * 350, openHats: bar >= 6 });
  }
  crash(6, 0.4);
  crash(14, 0.3);
  crash(18, 0.3);
  roll(21, 22, 0.1, 0.5);

  card(22, [72, 76, 79, 84]);
  for (let bar = 0; bar < 6; bar++) chipBar(24 + bar * BAR, PROG[[0, 1, 2, 3, 0, 3][bar]], MELODY[bar]);
  crash(24, 0.35);
  crash(32, 0.3);

  card(36, [64, 69, 72, 76]);
  for (let bar = 0; bar < 4; bar++) techBar(38 + bar * BAR, PROG[bar], bar);
  crash(38, 0.3);

  impact(46, 1);
  for (let i = 0; i < 8; i++) {
    tone({ type: 'square', freq: i % 2 ? 660 : 880, t: 46 + i * 0.25, dur: 0.24, gain: 0.05, attack: 0.005, release: 0.02, dest: master, cutoff: 2500, rev: 0.2 });
  }
  tone({ freq: mtof(33), t: 46, dur: 2, gain: 0.1, attack: 0.1, release: 0.05, cutoff: 500, dest: master });
  riser(46.5, 48, 0.3);
  roll(47, 48, 0.1, 0.65);

  impact(48, 1.1);
  bossBar(48, 45, [69, 72, 76]);
  bossBar(50, 46, [70, 74, 77]);
  bossBar(52, 40, [68, 71, 76]);
  riser(53, 54, 0.22);

  impact(COUNTDOWN_START, 1.1);
  tone({ type: 'sawtooth', freq: mtof(57), t: COUNTDOWN_START, dur: 5.6, gain: 0.03, attack: 0.6, release: 1.2, cutoff: 900, dest: master, rev: 0.5, detune: -7 });
  tone({ type: 'sawtooth', freq: mtof(64), t: COUNTDOWN_START, dur: 5.6, gain: 0.025, attack: 0.6, release: 1.2, cutoff: 900, dest: master, rev: 0.5, detune: 7 });
  tone({ type: 'triangle', freq: mtof(33), t: COUNTDOWN_START, dur: 5.4, gain: 0.07, attack: 0.3, release: 1.5, dest: master });
  for (let i = 0; i < 10; i++) {
    const t = COUNTDOWN_START + i * BEAT;
    const last = i === 9;
    tone({ type: 'square', freq: last ? 440 : 880, t, dur: last ? 0.2 : 0.08, gain: 0.07, attack: 0.002, release: 0.02, dest: master, rev: 0.15 });
    tone({ type: 'sine', freq: 110, glideTo: 45, t, dur: 0.22, gain: 0.35, attack: 0.002, pluck: true, dest: master });
  }
  tone({ type: 'square', freq: 988, t: COIN_AT, dur: 0.08, gain: 0.09, attack: 0.001, release: 0.005, dest: master });
  tone({ type: 'square', freq: 1319, t: COIN_AT + 0.08, dur: 0.7, gain: 0.09, attack: 0.001, pluck: true, dest: master, rev: 0.3, echo: 0.4 });
  tone({ wave: pulse25, freq: mtof(69), t: COIN_AT + 0.1, dur: 0.85, gain: 0.05, attack: 0.01, pluck: true, dest: master, rev: 0.5 });

  kicks.sort((a, b) => a - b);
  duckBus.gain.setValueAtTime(1, 0);
  for (const t of kicks) {
    duckBus.gain.setValueAtTime(1, t);
    duckBus.gain.linearRampToValueAtTime(0.42, t + 0.01);
    duckBus.gain.linearRampToValueAtTime(1, t + 0.24);
  }

  master.gain.setValueAtTime(0.7, duration - 0.6);
  master.gain.linearRampToValueAtTime(0, duration);

  const buffer = await ctx.startRendering();
  let peak = 0;
  for (let c = 0; c < 2; c++) for (const v of buffer.getChannelData(c)) peak = Math.max(peak, Math.abs(v));
  const scale = 0.89 / peak;
  for (let c = 0; c < 2; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] *= scale;
  }
  return { buffer, peak };
}

export function levels(buffer, windows) {
  const d = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  return windows.map(([a, b, name]) => {
    let sum = 0;
    let peak = 0;
    for (let i = Math.floor(a * sr); i < Math.floor(b * sr); i++) {
      sum += d[i] * d[i];
      peak = Math.max(peak, Math.abs(d[i]));
    }
    const rms = Math.sqrt(sum / ((b - a) * sr));
    return { name, rmsDb: (20 * Math.log10(rms)).toFixed(1), peakDb: (20 * Math.log10(peak)).toFixed(1) };
  });
}
