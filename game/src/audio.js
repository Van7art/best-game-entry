// Emberfall — synthesized sound effects. No audio files ship with the game:
// every sound is a short WebAudio oscillator phrase built at runtime, so the
// game loads nothing over the network and stays silent until the player first
// interacts (browsers block audio before a gesture).
export function createAudio() {
  const audio = {
    context: null,
    muted: false,
    enabled: true,
  };

  audio.unlock = function unlock() {
    if (audio.context) {
      if (audio.context.state === 'suspended') audio.context.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) {
        audio.enabled = false;
        return;
      }
      audio.context = new Ctor();
    } catch (err) {
      audio.enabled = false;
    }
  };

  function tone(freq, seconds, kind, volume, slideTo) {
    if (!audio.enabled || audio.muted || !audio.context) return;
    const now = audio.context.currentTime;
    const osc = audio.context.createOscillator();
    const gain = audio.context.createGain();
    osc.type = kind;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + seconds);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    osc.connect(gain);
    gain.connect(audio.context.destination);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  audio.shoot = function shoot() {
    tone(720, 0.09, 'square', 0.05, 240);
  };

  audio.hit = function hit() {
    tone(190, 0.07, 'triangle', 0.09, 90);
  };

  audio.kill = function kill() {
    tone(320, 0.16, 'sawtooth', 0.08, 60);
    tone(520, 0.1, 'sine', 0.06, 900);
  };

  audio.hurt = function hurt() {
    tone(140, 0.35, 'sawtooth', 0.14, 55);
  };

  audio.pickup = function pickup() {
    tone(660, 0.1, 'sine', 0.09, 660);
    setTimeout(() => tone(990, 0.14, 'sine', 0.09, 990), 70);
  };

  audio.wave = function wave() {
    tone(262, 0.18, 'triangle', 0.1, 262);
    setTimeout(() => tone(392, 0.22, 'triangle', 0.1, 392), 140);
  };

  audio.gameover = function gameover() {
    tone(392, 0.3, 'triangle', 0.11, 392);
    setTimeout(() => tone(311, 0.3, 'triangle', 0.11, 311), 240);
    setTimeout(() => tone(233, 0.55, 'triangle', 0.12, 180), 480);
  };

  audio.toggleMute = function toggleMute() {
    audio.muted = !audio.muted;
    return audio.muted;
  };

  return audio;
}
