// Nova Salvage — boot and main loop.
import { createWorld } from './world.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { buildShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const audio = createAudio();
const input = createInput(canvas);
const renderer = createRenderer();
const world = createWorld(seed);
const s = world.state;

try { s.best = Number(localStorage.getItem('nova-salvage-best') || '0') || 0; } catch { /* ignore */ }

let paused = false;
let last = performance.now();

function saveBest() {
  try { localStorage.setItem('nova-salvage-best', String(Math.max(s.best, s.score))); } catch { /* ignore */ }
}
function handleEvents() {
  for (const e of world.drainEvents()) {
    if (e.name === 'shoot') audio.shoot();
    else if (e.name === 'hit') audio.hit();
    else if (e.name === 'boom') audio.boom();
    else if (e.name === 'pickup') audio.pickup();
    else if (e.name === 'hurt') audio.hurt();
    else if (e.name === 'sector') audio.sector();
    else if (e.name === 'victory') { audio.victory(); saveBest(); }
  }
  if (s.mode === 'gameover') saveBest();
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (input.consumePressed('KeyM')) { const m = audio.toggleMute(); if (!m) audio.unlock(); }
  if (input.consumePressed('KeyP') || input.consumePressed('Escape')) {
    if (s.mode === 'playing') paused = !paused;
  }
  if (s.mode === 'title') {
    if (input.consumePressed('Enter') || input.consumePressed('Space') || input.consumeClick()) {
      audio.unlock(); audio.startMusic();
      world.startGame();
    }
  } else if (s.mode === 'upgrade') {
    const c = input.consumeClick();
    if (c && s._cards) {
      for (const card of s._cards) {
        if (c.x >= card.x && c.x <= card.x + card.w && c.y >= card.y && c.y <= card.y + card.h) {
          world.chooseUpgrade(card.index);
          break;
        }
      }
    }
    if (input.consumePressed('Digit1')) world.chooseUpgrade(0);
    if (input.consumePressed('Digit2')) world.chooseUpgrade(1);
    if (input.consumePressed('Digit3')) world.chooseUpgrade(2);
  } else if (s.mode === 'victory' || s.mode === 'gameover') {
    if (input.consumePressed('KeyR') || input.consumePressed('Enter') || input.consumeClick()) {
      audio.unlock();
      world.startGame();
    }
  }
  if (!paused) world.step(dt, input);
  handleEvents();
  renderer.render(ctx, s, s.mode, paused);
  input.endFrame();
  requestAnimationFrame(frame);
}

if (shotName) {
  buildShot(world, shotName, seed);
  handleEvents();
  renderer.render(ctx, s, s.mode, false);
  document.title = `Nova Salvage — shot ${shotName}`;
} else {
  requestAnimationFrame(frame);
}
