// Emberfall — the game world: pure state and rules, no DOM and no canvas, so
// the same file runs in the browser and in a Node play-test. The Heart Tree
// stands at the centre of the grove; ember fiends crawl in from the dark and
// the wisp (the player) shoots them down before they reach it.
import { CONFIG } from './config.js';
import { makeRandom, pickFrom, range } from './random.js';

export function createWorld(seed) {
  const rng = makeRandom(seed);
  return {
    rng,
    seed,
    phase: 'title',
    time: 0,
    score: 0,
    best: 0,
    wave: 0,
    waveState: 'idle',
    betweenTimer: 0,
    spawnQueue: [],
    spawnTimer: 0,
    player: {
      x: CONFIG.world.width / 2,
      y: CONFIG.world.height / 2 + 170,
      angle: -Math.PI / 2,
      fireTimer: 0,
    },
    tree: { hp: CONFIG.tree.maxHp },
    bullets: [],
    enemies: [],
    particles: [],
    pickups: [],
    floaters: [],
    combo: 0,
    comboTimer: 0,
    multiplier: 1,
    rapidTimer: 0,
    spreadTimer: 0,
    kills: 0,
    shotsFired: 0,
    waveKills: 0,
    shake: 0,
  };
}

export function startGame(world) {
  world.phase = 'playing';
  world.time = 0;
  world.score = 0;
  world.wave = 0;
  world.bullets = [];
  world.enemies = [];
  world.particles = [];
  world.pickups = [];
  world.floaters = [];
  world.combo = 0;
  world.comboTimer = 0;
  world.multiplier = 1;
  world.rapidTimer = 0;
  world.spreadTimer = 0;
  world.kills = 0;
  world.shotsFired = 0;
  world.tree.hp = CONFIG.tree.maxHp;
  world.player.x = CONFIG.world.width / 2;
  world.player.y = CONFIG.world.height / 2 + 170;
  world.player.angle = -Math.PI / 2;
  startWave(world, 1);
}

// Build one wave's spawn list. Early waves are embers only; swifts join at
// wave 2, splitters at wave 3, bulwarks at wave 4, and the mix keeps growing.
export function buildWaveList(wave, rng) {
  const count = CONFIG.waves.baseCount + CONFIG.waves.perWave * (wave - 1);
  const kinds = ['ember'];
  if (wave >= 2) kinds.push('swift');
  if (wave >= 3) kinds.push('splitter');
  if (wave >= 4) kinds.push('bulwark');
  const list = [];
  for (let i = 0; i < count; i++) {
    let kind = 'ember';
    if (wave >= 4) {
      const roll = rng();
      if (roll < 0.5) kind = 'ember';
      else if (roll < 0.72) kind = 'swift';
      else if (roll < 0.86) kind = 'splitter';
      else kind = 'bulwark';
    } else if (wave >= 3) {
      kind = pickFrom(rng, ['ember', 'ember', 'swift', 'splitter']);
    } else if (wave >= 2) {
      kind = pickFrom(rng, ['ember', 'ember', 'ember', 'swift']);
    }
    list.push(kind);
  }
  return list;
}

export function startWave(world, wave) {
  world.wave = wave;
  world.waveState = 'spawning';
  world.spawnQueue = buildWaveList(wave, world.rng);
  world.spawnTimer = 0.4;
  world.waveKills = 0;
}

function spawnEnemy(world, kind) {
  const def = CONFIG.enemies[kind];
  const angle = world.rng() * Math.PI * 2;
  const margin = 30;
  const cx = CONFIG.world.width / 2;
  const cy = CONFIG.world.height / 2;
  const rx = CONFIG.world.width / 2 + margin;
  const ry = CONFIG.world.height / 2 + margin;
  const x = cx + Math.cos(angle) * rx;
  const y = cy + Math.sin(angle) * ry;
  world.enemies.push({
    kind,
    x,
    y,
    hp: def.hp,
    maxHp: def.hp,
    speed: def.speed * range(world.rng, 0.9, 1.15),
    radius: def.radius,
    score: def.score,
    wobble: world.rng() * Math.PI * 2,
    wobbleSpeed: range(world.rng, 1.5, 3.5),
    hitFlash: 0,
    age: 0,
  });
}

function burst(world, x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const a = world.rng() * Math.PI * 2;
    const v = range(world.rng, speed * 0.3, speed);
    world.particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: range(world.rng, 0.3, 0.7),
      maxLife: 0.7,
      color,
      size: range(world.rng, 2, 5),
    });
  }
}

function addFloater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
}

function awardScore(world, base, x, y) {
  const points = base * world.multiplier;
  world.score += points;
  addFloater(world, x, y, '+' + points, '#ffe9a8');
  return points;
}

function registerKill(world, enemy) {
  world.kills += 1;
  world.waveKills += 1;
  world.combo += 1;
  world.comboTimer = CONFIG.combo.window;
  world.multiplier = Math.min(1 + Math.floor(world.combo / 3), CONFIG.combo.maxMultiplier);
  awardScore(world, enemy.score, enemy.x, enemy.y);
  burst(world, enemy.x, enemy.y, CONFIG.enemies[enemy.kind].color, 12, 190);
  if (enemy.kind === 'splitter') {
    for (let i = 0; i < 2; i++) {
      const mote = {
        kind: 'mote',
        x: enemy.x + range(world.rng, -14, 14),
        y: enemy.y + range(world.rng, -14, 14),
        hp: 1,
        maxHp: 1,
        speed: CONFIG.enemies.mote.speed,
        radius: CONFIG.enemies.mote.radius,
        score: CONFIG.enemies.mote.score,
        wobble: world.rng() * Math.PI * 2,
        wobbleSpeed: range(world.rng, 2, 4),
        hitFlash: 0,
      };
      world.enemies.push(mote);
    }
  }
  if (world.rng() < CONFIG.pickups.dropChance) {
    dropPickup(world, enemy.x, enemy.y);
  }
}

function dropPickup(world, x, y) {
  const kind = pickFrom(world.rng, CONFIG.pickups.kinds);
  world.pickups.push({
    kind,
    x: Math.max(40, Math.min(CONFIG.world.width - 40, x)),
    y: Math.max(40, Math.min(CONFIG.world.height - 40, y)),
    life: CONFIG.pickups.lifetime,
    bob: world.rng() * Math.PI * 2,
  });
}

function applyPickup(world, pickup, audio) {
  if (pickup.kind === 'rapid') {
    world.rapidTimer = CONFIG.pickups.rapidSeconds;
    addFloater(world, world.player.x, world.player.y - 30, 'RAPID FIRE!', '#7df9ff');
  } else if (pickup.kind === 'spread') {
    world.spreadTimer = CONFIG.pickups.spreadSeconds;
    addFloater(world, world.player.x, world.player.y - 30, 'SPREAD SHOT!', '#c9a7ff');
  } else if (pickup.kind === 'mend') {
    world.tree.hp = Math.min(CONFIG.tree.maxHp, world.tree.hp + CONFIG.pickups.mendHp);
    addFloater(world, world.player.x, world.player.y - 30, 'TREE +18', '#8dff9e');
  } else if (pickup.kind === 'star') {
    awardScore(world, CONFIG.pickups.starScore, world.player.x, world.player.y - 30);
  }
  if (audio) audio.pickup();
}

function damageTree(world, amount, audio) {
  world.tree.hp = Math.max(0, world.tree.hp - amount);
  world.shake = 0.35;
  burst(world, CONFIG.tree.x, CONFIG.tree.y, '#ff5d5d', 14, 220);
  if (audio) audio.hurt();
  if (world.tree.hp <= 0) {
    world.phase = 'gameover';
    if (audio) audio.gameover();
  }
}

function fireBullets(world, audio) {
  const player = world.player;
  // fireTimer is a countdown in seconds, ticked down by update(); firing
  // resets it to the interval, so the wisp shoots at the tuned rate instead
  // of once per frame.
  if (player.fireTimer > 0) return;
  const interval = world.rapidTimer > 0 ? CONFIG.player.fireInterval * 0.55 : CONFIG.player.fireInterval;
  player.fireTimer = interval;
  const angles = world.spreadTimer > 0 ? [-0.2, 0, 0.2] : [0];
  for (const offset of angles) {
    const a = player.angle + offset;
    world.bullets.push({
      x: player.x + Math.cos(a) * 22,
      y: player.y + Math.sin(a) * 22,
      vx: Math.cos(a) * CONFIG.player.bulletSpeed,
      vy: Math.sin(a) * CONFIG.player.bulletSpeed,
      radius: CONFIG.player.bulletRadius,
      damage: CONFIG.player.bulletDamage,
      life: 1.4,
    });
  }
  world.shotsFired += 1;
  if (audio) audio.shoot();
}

function movePlayer(world, input, dt) {
  const player = world.player;
  let dx = 0;
  let dy = 0;
  if (input.keys.has('left')) dx -= 1;
  if (input.keys.has('right')) dx += 1;
  if (input.keys.has('up')) dy -= 1;
  if (input.keys.has('down')) dy += 1;
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    player.x += (dx / len) * CONFIG.player.speed * dt;
    player.y += (dy / len) * CONFIG.player.speed * dt;
  }
  player.x = Math.max(24, Math.min(CONFIG.world.width - 24, player.x));
  player.y = Math.max(24, Math.min(CONFIG.world.height - 24, player.y));
  player.angle = Math.atan2(input.mouse.y - player.y, input.mouse.x - player.x);
}

// One frame of play. input is the object from input.js; audio may be null in
// tests. Returns nothing; the world is mutated in place.
export function update(world, input, dt, audio) {
  if (world.phase !== 'playing') return;
  dt = Math.min(dt, 0.05);
  world.time += dt;
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt);
  if (world.rapidTimer > 0) world.rapidTimer -= dt;
  if (world.spreadTimer > 0) world.spreadTimer -= dt;
  if (world.player.fireTimer > 0) world.player.fireTimer -= dt;

  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) {
      world.combo = 0;
      world.multiplier = 1;
    }
  }

  movePlayer(world, input, dt);
  if (input.mouse.down) fireBullets(world, audio);

  // Spawning.
  if (world.waveState === 'spawning') {
    world.spawnTimer -= dt;
    if (world.spawnTimer <= 0) {
      const kind = world.spawnQueue.shift();
      if (kind) {
        spawnEnemy(world, kind);
        world.spawnTimer = Math.max(0.3, CONFIG.waves.spawnGap - world.wave * 0.04);
      } else {
        world.waveState = 'fighting';
      }
    }
  }

  // Enemies drift toward the tree with a slow wobble; swifts also strafe
  // sideways, weaving as they close in so they are harder to lead.
  const tx = CONFIG.tree.x;
  const ty = CONFIG.tree.y;
  for (let i = world.enemies.length - 1; i >= 0; i--) {
    const e = world.enemies[i];
    e.wobble += e.wobbleSpeed * dt;
    // A fiend that survives too long grows desperate and quickens: no
    // stalemates where one ember wanders the rim forever.
    e.age = (e.age || 0) + dt;
    const pace = e.age > CONFIG.enemies.enrageAfter ? CONFIG.enemies.enrageBoost : 1;
    const toTree = Math.atan2(ty - e.y, tx - e.x);
    const wobble = Math.sin(e.wobble) * 0.45;
    const a = toTree + wobble;
    const strafe = e.kind === 'swift' ? Math.cos(e.wobble * 1.7) * 0.7 : 0;
    e.x += (Math.cos(a) + Math.cos(a + Math.PI / 2) * strafe) * e.speed * pace * dt;
    e.y += (Math.sin(a) + Math.sin(a + Math.PI / 2) * strafe) * e.speed * pace * dt;
    if (e.hitFlash > 0) e.hitFlash -= dt;
    const distTree = Math.hypot(e.x - tx, e.y - ty);
    if (distTree < CONFIG.tree.radius + e.radius) {
      const damage = { ember: 8, swift: 6, bulwark: 16, splitter: 10, mote: 4 }[e.kind];
      world.enemies.splice(i, 1);
      world.combo = 0;
      world.multiplier = 1;
      damageTree(world, damage, audio);
      if (world.phase !== 'playing') return;
    }
  }

  // Bullets fly and hit enemies.
  for (let i = world.bullets.length - 1; i >= 0; i--) {
    const b = world.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    let dead = b.life <= 0 || b.x < -20 || b.x > CONFIG.world.width + 20 || b.y < -20 || b.y > CONFIG.world.height + 20;
    if (!dead) {
      for (let j = world.enemies.length - 1; j >= 0; j--) {
        const e = world.enemies[j];
        const d = Math.hypot(b.x - e.x, b.y - e.y);
        if (d < b.radius + e.radius) {
          e.hp -= b.damage;
          e.hitFlash = 0.12;
          burst(world, b.x, b.y, '#ffe9a8', 3, 120);
          if (audio) audio.hit();
          dead = true;
          if (e.hp <= 0) {
            world.enemies.splice(j, 1);
            registerKill(world, e);
            if (audio) audio.kill();
          }
          break;
        }
      }
    }
    if (dead) world.bullets.splice(i, 1);
  }

  // Pickups bob, drift toward the player when near, and get collected.
  for (let i = world.pickups.length - 1; i >= 0; i--) {
    const p = world.pickups[i];
    p.life -= dt;
    p.bob += dt * 3;
    const d = Math.hypot(world.player.x - p.x, world.player.y - p.y);
    if (d < 130) {
      const pull = 260 * dt;
      p.x += ((world.player.x - p.x) / (d || 1)) * pull;
      p.y += ((world.player.y - p.y) / (d || 1)) * pull;
    }
    if (d < world.player.radius + 16) {
      world.pickups.splice(i, 1);
      applyPickup(world, p, audio);
    } else if (p.life <= 0) {
      world.pickups.splice(i, 1);
    }
  }

  // Particles and floating score text fade out.
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const p = world.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= dt;
    if (p.life <= 0) world.particles.splice(i, 1);
  }
  for (let i = world.floaters.length - 1; i >= 0; i--) {
    const f = world.floaters[i];
    f.y -= 34 * dt;
    f.life -= dt;
    if (f.life <= 0) world.floaters.splice(i, 1);
  }

  // Wave cleared: bonus, a little tree healing, then the next wave.
  if (world.waveState === 'fighting' && world.enemies.length === 0 && world.spawnQueue.length === 0) {
    const bonus = 100 * world.wave;
    world.score += bonus;
    world.tree.hp = Math.min(CONFIG.tree.maxHp, world.tree.hp + CONFIG.treeRegenPerWave);
    addFloater(world, CONFIG.tree.x, CONFIG.tree.y - 70, 'WAVE ' + world.wave + ' CLEAR  +' + bonus, '#8dff9e');
    world.waveState = 'between';
    world.betweenTimer = CONFIG.waves.betweenWaves;
  }
  if (world.waveState === 'between') {
    world.betweenTimer -= dt;
    if (world.betweenTimer <= 0) {
      startWave(world, world.wave + 1);
      if (audio) audio.wave();
    }
  }
}
