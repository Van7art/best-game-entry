// Nova Salvage — pure game state and rules (no DOM; unit-testable in Node).
// States: title -> playing -> upgrade -> playing ... -> victory | gameover
import { CONFIG } from './config.js';
import { makeRng, randRange, shuffle } from './random.js';

export function createWorld(seed = 1) {
  const rng = makeRng(seed);
  const C = CONFIG;
  const state = {
    mode: 'title',
    time: 0,
    sector: 0,
    quota: 0,
    collected: 0,
    score: 0,
    kills: 0,
    best: 0,
    combo: 0,
    comboTimer: 0,
    mult: 1,
    hull: C.ship.maxHull,
    hullMax: C.ship.maxHull,
    shield: 50,
    shieldMax: 50,
    shieldTimer: 0,
    invuln: 0,
    ship: {
      x: 640, y: 360, vx: 0, vy: 0, aim: -Math.PI / 2,
      thrust: C.ship.thrust, maxSpeed: C.ship.maxSpeed,
      fireInterval: C.ship.fireInterval, damage: C.ship.boltDamage,
      shots: 1, pierce: 0, magnet: false, shieldRegen: 2,
      fireTimer: 0, radius: C.ship.radius,
    },
    asteroids: [], drones: [], crystals: [], bolts: [], ebolts: [],
    particles: [], floats: [],
    upgradeChoices: [], upgradesTaken: [],
    shake: 0, banner: 0, bannerText: '',
    stats: { shotsFired: 0, boltsHit: 0, rocksMined: 0 },
    events: [],
  };

  function emit(name) { state.events.push({ name }); }
  function burst(x, y, color, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2;
      const s = randRange(rng, speed * 0.3, speed);
      state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: randRange(rng, 0.3, 0.8), maxLife: 0.8, color, size: randRange(rng, 2, 5) });
    }
  }
  function addFloat(x, y, text, color) { state.floats.push({ x, y, text, color, life: 1 }); }
  function bumpCombo() {
    state.combo++;
    state.comboTimer = C.combo.windowSec;
    state.mult = Math.min(C.combo.maxMult, 1 + (state.combo - 1) * C.combo.step);
  }
  function gainScore(base, x, y) {
    const g = Math.round(base * state.mult);
    state.score += g;
    if (x !== undefined) addFloat(x, y, `+${g}`, '#ffe9a8');
    return g;
  }
  function spawnCrystal(x, y, value) {
    const a = rng() * Math.PI * 2;
    state.crystals.push({ x, y, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, value, kind: value >= 5 ? 'gold' : 'cyan', t: rng() * 6, life: 25 });
  }
  function spawnAsteroid(size, x, y) {
    const def = C.asteroids[size];
    const a = Math.atan2(360 - (y ?? 360), 640 - (x ?? 640)) + randRange(rng, -0.6, 0.6);
    const sp = randRange(rng, 25, 55);
    state.asteroids.push({
      size, x: x ?? randRange(rng, 60, 1220), y: y ?? randRange(rng, 60, 660),
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      rot: rng() * 6.28, vr: randRange(rng, -0.8, 0.8),
      hp: def.hp, maxHp: def.hp, radius: def.radius, score: def.score, crystal: def.crystal,
      verts: Array.from({ length: 9 }, () => randRange(rng, 0.75, 1.15)),
    });
  }
  function spawnDrone() {
    const edge = Math.floor(rng() * 4);
    const p = edge === 0 ? { x: randRange(rng, 0, 1280), y: -30 } : edge === 1 ? { x: randRange(rng, 0, 1280), y: 750 } : edge === 2 ? { x: -30, y: randRange(rng, 0, 720) } : { x: 1310, y: randRange(rng, 0, 720) };
    state.drones.push({ ...p, hp: C.drone.hp, maxHp: C.drone.hp, radius: C.drone.radius, shootTimer: randRange(rng, 1, 2.5), flash: 0 });
  }
  function startSector(n) {
    state.sector = n;
    state.quota = C.sectors.quotaBase + C.sectors.quotaStep * (n - 1);
    state.collected = 0;
    state.asteroids = [];
    state.drones = [];
    state.ebolts = [];
    for (let i = 0; i < 6 + n * 2; i++) spawnAsteroid(rng() < 0.4 ? 'big' : rng() < 0.6 ? 'medium' : 'small');
    for (let i = 0; i < Math.min(n, 4); i++) spawnDrone();
    for (let i = 0; i < 4; i++) spawnCrystal(randRange(rng, 100, 1180), randRange(rng, 100, 620), 1);
    state.banner = 2.2;
    state.bannerText = `SECTOR ${n} — COLLECT ${state.quota} CRYSTALS`;
    emit('sector');
  }
  function damageShip(amount, x, y) {
    if (state.invuln > 0) return;
    state.invuln = 0.9;
    let rest = amount;
    if (state.shield > 0) { const absorbed = Math.min(state.shield, rest); state.shield -= absorbed; rest -= absorbed; }
    if (rest > 0) state.hull = Math.max(0, state.hull - rest);
    state.shieldTimer = 4;
    state.shake = Math.max(state.shake, 0.3);
    burst(x, y, '#ff8a80', 12, 220);
    emit('hurt');
    if (state.hull <= 0) endGame(false);
  }
  function endGame(won) {
    state.mode = won ? 'victory' : 'gameover';
    if (won) emit('victory');
    if (state.score > state.best) state.best = state.score;
  }
  function offerUpgrades() {
    state.upgradeChoices = shuffle(rng, C.upgrades).slice(0, 3);
    state.mode = 'upgrade';
  }
  function chooseUpgrade(i) {
    const u = state.upgradeChoices[i];
    if (!u) return;
    u.apply(state.ship, state);
    state.upgradesTaken.push(u.id);
    state.upgradeChoices = [];
    state.mode = 'playing';
    if (state.sector >= C.sectors.winSector) { endGame(true); return; }
    startSector(state.sector + 1);
  }
  function splitAsteroid(a, idx) {
    state.asteroids.splice(idx, 1);
    state.kills++;
    state.stats.rocksMined++;
    bumpCombo();
    gainScore(a.score, a.x, a.y);
    burst(a.x, a.y, '#ffb37a', a.size === 'big' ? 26 : 14, 260);
    emit('boom');
    for (let i = 0; i < a.crystal; i++) spawnCrystal(a.x, a.y, 1);
    if (a.size === 'big') { spawnAsteroid('medium', a.x - 20, a.y); spawnAsteroid('medium', a.x + 20, a.y); }
    else if (a.size === 'medium') { spawnAsteroid('small', a.x - 12, a.y); spawnAsteroid('small', a.x + 12, a.y); }
    // fresh asteroids keep the field stocked
    if (state.asteroids.length < 4 && state.mode === 'playing') spawnAsteroid(rng() < 0.5 ? 'medium' : 'small');
  }

  function stepPlaying(dt, input) {
    const p = state.ship;
    // thrust (WASD / arrows) with inertia
    let ax = 0, ay = 0;
    if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) ay -= 1;
    if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) ay += 1;
    if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) ax -= 1;
    if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) ax += 1;
    const len = Math.hypot(ax, ay) || 1;
    p.vx += (ax / len) * p.thrust * dt * (ax || ay ? 1 : 0);
    p.vy += (ay / len) * p.thrust * dt * (ax || ay ? 1 : 0);
    const damp = Math.pow(0.35, dt);
    p.vx *= damp; p.vy *= damp;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > p.maxSpeed) { p.vx = (p.vx / sp) * p.maxSpeed; p.vy = (p.vy / sp) * p.maxSpeed; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 20) { p.x = 20; p.vx = Math.abs(p.vx) * 0.5; }
    if (p.x > 1260) { p.x = 1260; p.vx = -Math.abs(p.vx) * 0.5; }
    if (p.y < 20) { p.y = 20; p.vy = Math.abs(p.vy) * 0.5; }
    if (p.y > 700) { p.y = 700; p.vy = -Math.abs(p.vy) * 0.5; }
    p.aim = Math.atan2(input.mouse.y - p.y, input.mouse.x - p.x);
    // firing
    p.fireTimer -= dt;
    if (input.mouse.down && p.fireTimer <= 0) {
      p.fireTimer = p.fireInterval;
      for (let i = 0; i < p.shots; i++) {
        const spread = (i - (p.shots - 1) / 2) * 0.13;
        const a = p.aim + spread;
        state.bolts.push({ x: p.x + Math.cos(a) * 22, y: p.y + Math.sin(a) * 22, vx: Math.cos(a) * C.ship.boltSpeed, vy: Math.sin(a) * C.ship.boltSpeed, pierce: p.pierce, damage: p.damage, life: 1.1 });
      }
      state.stats.shotsFired++;
      emit('shoot');
    }
    // shield regen
    if (state.invuln > 0) state.invuln -= dt;
    if (state.shieldTimer > 0) state.shieldTimer -= dt;
    else if (state.shield < state.shieldMax) state.shield = Math.min(state.shieldMax, state.shield + p.shieldRegen * dt);
    // asteroids drift + spin
    for (const a of state.asteroids) {
      a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vr * dt;
      if (a.x < -60) a.x = 1340; if (a.x > 1340) a.x = -60;
      if (a.y < -60) a.y = 780; if (a.y > 780) a.y = -60;
    }
    // drones chase + shoot
    for (const d of state.drones) {
      d.flash = Math.max(0, d.flash - dt);
      const a = Math.atan2(p.y - d.y, p.x - d.x);
      const dist = Math.hypot(p.x - d.x, p.y - d.y);
      const want = 240;
      const dir = dist > want + 40 ? 1 : dist < want - 40 ? -1 : 0;
      d.x += Math.cos(a) * C.drone.speed * dir * dt;
      d.y += Math.sin(a) * C.drone.speed * dir * dt;
      d.shootTimer -= dt;
      if (d.shootTimer <= 0 && dist < 520) {
        d.shootTimer = C.drone.shootInterval;
        state.ebolts.push({ x: d.x, y: d.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, damage: C.drone.damage, life: 3 });
      }
    }
    // bolts vs asteroids + drones
    for (let bi = state.bolts.length - 1; bi >= 0; bi--) {
      const b = state.bolts[bi];
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || b.x < -20 || b.x > 1300 || b.y < -20 || b.y > 740) { state.bolts.splice(bi, 1); continue; }
      let consumed = false;
      for (let ai = state.asteroids.length - 1; ai >= 0; ai--) {
        const a = state.asteroids[ai];
        const dx = a.x - b.x, dy = a.y - b.y;
        if (dx * dx + dy * dy < (a.radius + 5) * (a.radius + 5)) {
          a.hp -= b.damage;
          state.stats.boltsHit++;
          emit('hit');
          burst(b.x, b.y, '#ffe9a8', 4, 140);
          if (a.hp <= 0) splitAsteroid(a, ai);
          if (b.pierce > 0) b.pierce--; else { state.bolts.splice(bi, 1); consumed = true; }
          break;
        }
      }
      if (consumed) continue;
      for (let di = state.drones.length - 1; di >= 0; di--) {
        const d = state.drones[di];
        const dx = d.x - b.x, dy = d.y - b.y;
        if (dx * dx + dy * dy < (d.radius + 5) * (d.radius + 5)) {
          d.hp -= b.damage; d.flash = 0.12;
          state.stats.boltsHit++;
          emit('hit');
          if (d.hp <= 0) {
            state.drones.splice(di, 1);
            state.kills++;
            bumpCombo();
            gainScore(C.drone.score, d.x, d.y);
            burst(d.x, d.y, '#ff5d8f', 18, 240);
            emit('boom');
            spawnCrystal(d.x, d.y, 3);
          }
          if (b.pierce > 0) b.pierce--; else state.bolts.splice(bi, 1);
          break;
        }
      }
    }
    // ship vs asteroids (bounce + damage)
    for (let ai = state.asteroids.length - 1; ai >= 0; ai--) {
      const a = state.asteroids[ai];
      const dx = p.x - a.x, dy = p.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + p.radius - 2 && dist > 0.01) {
        const nx = dx / dist, ny = dy / dist;
        p.x = a.x + nx * (a.radius + p.radius);
        p.y = a.y + ny * (a.radius + p.radius);
        p.vx = nx * 260; p.vy = ny * 260;
        damageShip(a.size === 'big' ? 10 : a.size === 'medium' ? 7 : 4, p.x, p.y);
        if (state.mode !== 'playing') return;
      }
    }
    // ship vs drones (ram)
    for (let di = state.drones.length - 1; di >= 0; di--) {
      const d = state.drones[di];
      if (Math.hypot(p.x - d.x, p.y - d.y) < p.radius + d.radius) {
        state.drones.splice(di, 1);
        burst(d.x, d.y, '#ff5d8f', 16, 220);
        damageShip(10, p.x, p.y);
        if (state.mode !== 'playing') return;
      }
    }
    // enemy bolts vs ship
    for (let i = state.ebolts.length - 1; i >= 0; i--) {
      const b = state.ebolts[i];
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0) { state.ebolts.splice(i, 1); continue; }
      if (Math.hypot(b.x - p.x, b.y - p.y) < p.radius + 5) {
        state.ebolts.splice(i, 1);
        damageShip(b.damage, p.x, p.y);
        if (state.mode !== 'playing') return;
      }
    }
    // crystals: drift, magnet, collect
    for (let i = state.crystals.length - 1; i >= 0; i--) {
      const cr = state.crystals[i];
      cr.t += dt; cr.life -= dt;
      if (cr.life <= 0) { state.crystals.splice(i, 1); continue; }
      const d = Math.hypot(p.x - cr.x, p.y - cr.y);
      if (p.magnet && d < 300 && d > 1) { cr.x += ((p.x - cr.x) / d) * 340 * dt; cr.y += ((p.y - cr.y) / d) * 340 * dt; }
      else { cr.x += cr.vx * dt; cr.y += cr.vy * dt; cr.vx *= 0.98; cr.vy *= 0.98; }
      if (d < p.radius + 14) {
        state.crystals.splice(i, 1);
        state.collected += cr.value;
        bumpCombo();
        gainScore(40 * cr.value, cr.x, cr.y);
        emit('pickup');
        burst(cr.x, cr.y, '#7df9ff', 8, 160);
        if (state.collected >= state.quota) {
          if (state.sector >= C.sectors.winSector) { endGame(true); return; }
          offerUpgrades();
          return;
        }
      }
    }
    // combo decay
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) { state.combo = 0; state.mult = 1; }
    }
    if (state.banner > 0) state.banner -= dt;
  }

  function step(dt, input) {
    state.time += dt;
    state.shake = Math.max(0, state.shake - dt);
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const pt = state.particles[i];
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vx *= 0.96; pt.vy *= 0.96; pt.life -= dt;
      if (pt.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floats.length - 1; i >= 0; i--) {
      const f = state.floats[i];
      f.y -= 34 * dt; f.life -= dt * 0.9;
      if (f.life <= 0) state.floats.splice(i, 1);
    }
    if (state.mode === 'playing') stepPlaying(dt, input);
  }

  function startGame() {
    const keepBest = state.best;
    const fresh = createWorld(1).state;
    for (const k of Object.keys(state)) delete state[k];
    Object.assign(state, fresh);
    state.best = keepBest;
    state.mode = 'playing';
    startSector(1);
    emit('sector');
  }

  return {
    state, startGame, startSector, chooseUpgrade, step,
    drainEvents() { const e = state.events; state.events = []; return e; },
  };
}
