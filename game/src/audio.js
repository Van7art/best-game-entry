// Synthesized sound effects + a dreamy synthwave music loop (WebAudio, no files).
export function createAudio() {
  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let step = 0;
  const BASS = [110, 130.81, 98, 146.83];
  const LEAD = [440, 523.25, 659.25, 523.25, 587.33, 698.46];
  function ensure() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }
  function noise(dur, vol, low) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = low || 1200;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  }
  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    shoot() { tone(920, 0.07, 'square', 0.04, 520); },
    hit() { tone(300, 0.05, 'triangle', 0.05, 180); },
    boom() { noise(0.3, 0.15, 800); tone(80, 0.25, 'sine', 0.12, 35); },
    pickup() { tone(784, 0.08, 'sine', 0.07); setTimeout(() => tone(1175, 0.12, 'sine', 0.07), 60); },
    hurt() { tone(140, 0.3, 'sawtooth', 0.12, 50); noise(0.15, 0.1, 500); },
    sector() { tone(440, 0.16, 'triangle', 0.09); setTimeout(() => tone(660, 0.22, 'triangle', 0.09), 130); },
    victory() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.09), i * 130)); },
    startMusic() {
      if (musicTimer) return;
      musicTimer = setInterval(() => {
        if (muted) return;
        step++;
        if (step % 2 === 0) tone(BASS[(step / 2 | 0) % BASS.length], 0.5, 'sawtooth', 0.02);
        if (step % 4 === 3) tone(LEAD[step % LEAD.length], 0.3, 'sine', 0.02);
      }, 280);
    },
    stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } },
  };
}
