// Deterministic screenshot scenes (?shot=title|sector|chaos|victory&seed=1).
import { CONFIG } from './config.js';

const C = CONFIG;

function rock(world, size, x, y, hpScale = 1) {
  const def = C.asteroids[size];
  const a = {
    size, x, y, vx: 0, vy: 0, rot: 0.7, vr: 0.3,
    hp: def.hp * hpScale, maxHp: def.hp * hpScale,
    radius: def.radius, score: def.score, crystal: def.crystal,
    verts: [1, 0.85, 1.1, 0.9, 1.05, 0.8, 1.12, 0.88, 1],
  };
  world.state.asteroids.push(a);
  return a;
}

export function buildShot(world, name, seed) {
  const s = world.state;
  if (name === 'title') {
    s.mode = 'title';
    s.best = 3120;
    return;
  }
  world.startGame();
  const input = { keys: new Set(), mouse: { x: 900, y: 300, down: true } };
  const stepN = (n) => { for (let i = 0; i < n; i++) world.step(1 / 60, input); };
  if (name === 'sector') {
    // sector 2, mid-salvage: rocks, drones, crystals, combo
    s.sector = 2;
    s.quota = 20;
    s.collected = 8;
    s.score = 2840;
    s.kills = 21;
    s.combo = 5;
    s.mult = 2;
    s.hull = 82;
    s.shield = 34;
    rock(world, 'big', 300, 180);
    rock(world, 'medium', 950, 170);
    rock(world, 'medium', 180, 520);
    rock(world, 'small', 620, 140);
    rock(world, 'small', 1080, 480);
    rock(world, 'big', 1120, 620);
    s.drones.push({ x: 420, y: 300, hp: 3, maxHp: 3, radius: 13, shootTimer: 1, flash: 0 });
    s.drones.push({ x: 1020, y: 330, hp: 2, maxHp: 3, radius: 13, shootTimer: 2, flash: 0.1 });
    s.crystals.push({ x: 520, y: 300, vx: 0, vy: 0, value: 2, kind: 'gold', t: 0.4, life: 25 });
    s.crystals.push({ x: 830, y: 470, vx: 0, vy: 0, value: 1, kind: 'cyan', t: 0.9, life: 25 });
    s.crystals.push({ x: 700, y: 200, vx: 0, vy: 0, value: 1, kind: 'cyan', t: 1.7, life: 25 });
    s.ship.x = 640; s.ship.y = 430; s.ship.aim = Math.atan2(300 - 430, 900 - 640);
    s.ship.shots = 2;
    stepN(90);
    s.banner = 0;
    return;
  }
  if (name === 'chaos') {
    // sector 4: dense asteroid field + drone pack
    s.sector = 4;
    s.quota = 32;
    s.collected = 21;
    s.score = 12480;
    s.kills = 87;
    s.combo = 11;
    s.mult = 3.5;
    s.hull = 58;
    s.shield = 18;
    rock(world, 'big', 250, 150, 1);
    rock(world, 'big', 1050, 180, 1);
    rock(world, 'big', 640, 620, 1);
    rock(world, 'medium', 420, 320);
    rock(world, 'medium', 880, 420);
    rock(world, 'medium', 180, 480);
    rock(world, 'small', 760, 180);
    rock(world, 'small', 520, 560);
    rock(world, 'small', 1120, 520);
    s.drones.push({ x: 300, y: 380, hp: 3, maxHp: 3, radius: 13, shootTimer: 0.5, flash: 0 });
    s.drones.push({ x: 980, y: 260, hp: 3, maxHp: 3, radius: 13, shootTimer: 1.2, flash: 0 });
    s.drones.push({ x: 700, y: 120, hp: 2, maxHp: 3, radius: 13, shootTimer: 0.2, flash: 0 });
    s.crystals.push({ x: 600, y: 300, vx: 0, vy: 0, value: 3, kind: 'gold', t: 0.4, life: 25 });
    s.crystals.push({ x: 900, y: 560, vx: 0, vy: 0, value: 1, kind: 'cyan', t: 1.1, life: 25 });
    s.ship.x = 640; s.ship.y = 400; s.ship.aim = -Math.PI / 2;
    s.ship.shots = 2; s.ship.pierce = 1;
    stepN(150);
    s.banner = 0;
    return;
  }
  if (name === 'victory') {
    s.mode = 'victory';
    s.sector = 5;
    s.score = 21450;
    s.kills = 168;
    s.best = 21450;
    s.upgradesTaken = ['rapid', 'spread', 'magnet', 'thrust'];
    return;
  }
  s.mode = 'title';
}
