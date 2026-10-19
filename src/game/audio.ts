type Wave = OscillatorType;

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  resume(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private tone(from: number, to: number, duration: number, wave: Wave = 'square', volume = 1, delay = 0): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private noise(duration: number, volume = 1, delay = 0): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const length = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain).connect(this.master);
    source.start(t);
  }

  start(): void {
    this.tone(262, 523, 0.12);
    this.tone(523, 1047, 0.16, 'square', 1, 0.1);
  }

  jump(): void {
    this.tone(300, 620, 0.12, 'square', 0.7);
  }

  doubleJump(): void {
    this.tone(520, 1180, 0.14, 'square', 0.7);
  }

  land(): void {
    this.tone(140, 70, 0.05, 'triangle', 0.6);
  }

  collect(): void {
    this.tone(988, 988, 0.06);
    this.tone(1319, 1319, 0.12, 'square', 1, 0.06);
  }

  spawn(): void {
    this.tone(80, 260, 0.3, 'sawtooth', 0.5);
  }

  stomp(): void {
    this.tone(220, 80, 0.12, 'square', 0.9);
  }

  explode(): void {
    this.noise(0.45, 1.4);
    this.tone(120, 40, 0.35, 'sawtooth', 0.5);
  }

  lose(): void {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, f * 0.97, 0.18, 'square', 0.9, i * 0.16));
  }

  win(): void {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, f, 0.13, 'square', 0.9, i * 0.1));
  }

  alert(): void {
    this.tone(880, 880, 0.06, 'square', 0.6);
    this.tone(1175, 1175, 0.08, 'square', 0.6, 0.08);
  }

  zap(): void {
    this.tone(1600, 200, 0.18, 'sawtooth', 0.6);
  }

  whoosh(): void {
    this.tone(200, 900, 0.5, 'triangle', 0.5);
  }
}
