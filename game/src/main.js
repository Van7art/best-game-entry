// Emberfall — boot and main loop. Wires the canvas, input, sound and world
// together, runs the title / playing / paused / game-over state machine, and
// keeps the best score in localStorage.
import { CONFIG } from './config.js';
import { createWorld, startGame, update } from './world.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { sceneFor, isShotMode } from './shots.js';

const BEST_KEY = 'emberfall-best-score';

function loadBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY) || '0') || 0;
  } catch (err) {
    return 0;
  }
}

function saveBest(score) {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch (err) {
    // Private mode or no storage: the game still plays fine.
  }
}

function boot() {
  const canvas = document.getElementById('game');
  const input = createInput(canvas);
  const audio = createAudio();
  const render = createRenderer(canvas);
  const shotMode = isShotMode(window.location.search);

  let world;
  if (shotMode) {
    // A screenshot scene: render one fixed moment, no loop needed. The page
    // hint below the canvas is chrome, not the game, so it stays out of the
    // frame.
    world = sceneFor(window.location.search);
    const hint = document.querySelector('.hint');
    if (hint) hint.style.display = 'none';
    render.draw(world);
    document.title = 'Emberfall — ' + (new URLSearchParams(window.location.search).get('shot') || 'shot');
    return;
  }

  world = createWorld((Date.now() % 2147483647) || 1);
  world.best = loadBest();

  function saveBestIfBeaten() {
    if (world.score > world.best) {
      world.best = world.score;
      saveBest(world.score);
    }
  }

  function begin() {
    audio.unlock();
    startGame(world);
  }

  canvas.addEventListener('mousedown', () => audio.unlock());
  window.addEventListener('keydown', () => audio.unlock());

  // Leaving the tab mid-fight pauses the game instead of letting the grove
  // burn while nobody is watching.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && world.phase === 'playing') world.phase = 'paused';
  });
  window.addEventListener('blur', () => {
    if (world.phase === 'playing') world.phase = 'paused';
  });

  // A small handle for play-testing (read-only state for automated checks).
  window.__emberfall = {
    world,
    phase() { return world.phase; },
    score() { return world.score; },
    start() { startGame(world); },
  };

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    world.time += world.phase === 'title' || world.phase === 'gameover' ? dt : 0;

    if (input.pressed.has('mute')) {
      const muted = audio.toggleMute();
      document.title = muted ? 'Emberfall (muted)' : 'Emberfall';
    }

    if (world.phase === 'title') {
      if (input.pressed.has('confirm')) begin();
    } else if (world.phase === 'playing') {
      if (input.pressed.has('pause')) {
        world.phase = 'paused';
      } else {
        update(world, input, dt, audio);
        if (world.phase === 'gameover') saveBestIfBeaten();
      }
    } else if (world.phase === 'paused') {
      if (input.pressed.has('pause')) {
        world.phase = 'playing';
      } else if (input.pressed.has('restart')) {
        begin();
      }
    } else if (world.phase === 'gameover') {
      if (input.pressed.has('restart') || input.pressed.has('confirm')) begin();
    }

    render.draw(world);
    input.endFrame();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
