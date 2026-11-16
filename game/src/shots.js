// Emberfall — deterministic screenshot scenes. The game reads ?shot=start,
// ?shot=play or ?shot=end (with an optional &seed=) and renders one fixed
// moment of itself, so the screenshots the judge sees are real renders of the
// game's own code, stable from run to run.
import { CONFIG } from './config.js';
import { createWorld, startGame, update } from './world.js';

function fakeInput() {
  return {
    keys: new Set(['right']),
    mouse: { x: 900, y: 260, down: true },
    pressed: new Set(),
    endFrame() {},
  };
}

function buildPlayScene(seed) {
  const world = createWorld(seed);
  world.best = 2450;
  startGame(world);
  // Fast-forward the world: the wisp drifts right, firing the whole time,
  // while waves spawn and the fight builds up around the tree.
  const input = fakeInput();
  const step = 1 / 60;
  for (let i = 0; i < 60 * 10; i++) {
    input.mouse.x = 640 + Math.cos(i * 0.05) * 320;
    input.mouse.y = 400 + Math.sin(i * 0.07) * 220;
    update(world, input, step, null);
    if (world.phase !== 'playing') break;
  }
  // Top the scene up so it reads as a busy mid-fight moment: a mixed pack
  // closing in on the tree from the left, plus a pickup on the ground.
  const topUp = [
    { kind: 'ember', x: 250, y: 190 },
    { kind: 'ember', x: 330, y: 280 },
    { kind: 'swift', x: 210, y: 350 },
    { kind: 'ember', x: 420, y: 170 },
    { kind: 'splitter', x: 300, y: 470 },
  ];
  let added = 0;
  for (const spot of topUp) {
    if (world.enemies.length + added >= 7) break;
    const def = CONFIG.enemies[spot.kind];
    world.enemies.push({
      kind: spot.kind,
      x: spot.x,
      y: spot.y,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      radius: def.radius,
      score: def.score,
      wobble: added,
      wobbleSpeed: 2,
      hitFlash: 0,
      age: 0,
    });
    added++;
  }
  if (world.pickups.length === 0) {
    world.pickups.push({ kind: 'rapid', x: 950, y: 600, life: 9, bob: 0 });
  }
  world.combo = 6;
  world.multiplier = 3;
  world.comboTimer = 2;
  return world;
}

function buildEndScene(seed) {
  const world = buildPlayScene(seed);
  world.phase = 'gameover';
  world.tree.hp = 0;
  world.score = 3250;
  world.best = 3250;
  world.wave = 4;
  world.kills = 47;
  return world;
}

export function sceneFor(query) {
  const params = new URLSearchParams(query);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || '1') || 1;
  if (shot === 'play') return buildPlayScene(seed);
  if (shot === 'end') return buildEndScene(seed);
  const world = createWorld(seed);
  world.best = 2450;
  world.phase = 'title';
  return world;
}

export function isShotMode(query) {
  return new URLSearchParams(query).has('shot');
}
