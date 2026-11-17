// Nova Salvage — all canvas drawing (vivid nebula, parallax starfield, bright crystals).
import { CONFIG } from './config.js';

const C = CONFIG;
const TAU = Math.PI * 2;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function glow(ctx, x, y, radius, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = 1;
}
function text(ctx, s, x, y, size, color, weight = 700, align = 'center') {
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

export function createRenderer() {
  const stars = [];
  for (let i = 0; i < 3; i++) {
    const layer = [];
    for (let j = 0; j < 60; j++) layer.push({ x: (j * 131 + i * 47) % 1280, y: (j * 89 + i * 211) % 720, r: 0.8 + ((j + i) % 3) * 0.7, p: (j * 0.9 + i) % TAU });
    stars.push(layer);
  }
  const nebulas = [
    { x: 220, y: 140, r: 300, c: 'rgba(150, 60, 220, 0.20)' },
    { x: 1080, y: 560, r: 340, c: 'rgba(40, 120, 255, 0.18)' },
    { x: 950, y: 120, r: 240, c: 'rgba(255, 60, 140, 0.14)' },
    { x: 300, y: 600, r: 260, c: 'rgba(0, 220, 200, 0.12)' },
  ];

  function drawBackground(ctx, s) {
    const g = ctx.createLinearGradient(0, 0, 1280, 720);
    g.addColorStop(0, '#160a2e');
    g.addColorStop(0.5, '#0d1033');
    g.addColorStop(1, '#0a0618');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1280, 720);
    for (const n of nebulas) glow(ctx, n.x, n.y, n.r, n.c, 1);
    // parallax starfield drifts with the ship
    const px = (s.ship ? s.ship.x - 640 : 0);
    const py = (s.ship ? s.ship.y - 360 : 0);
    stars.forEach((layer, li) => {
      const f = 0.02 * (li + 1);
      for (const st of layer) {
        const x = (((st.x - px * f) % 1280) + 1280) % 1280;
        const y = (((st.y - py * f) % 720) + 720) % 720;
        ctx.globalAlpha = 0.4 + 0.4 * Math.sin(s.time * 1.5 + st.p);
        ctx.fillStyle = li === 2 ? '#cfe8ff' : '#ffffff';
        ctx.beginPath(); ctx.arc(x, y, st.r, 0, TAU); ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  function drawShip(ctx, s) {
    const p = s.ship;
    glow(ctx, p.x, p.y, 56, 'rgba(90, 220, 255, 0.35)', 1);
    // engine flame
    const thrusting = Math.hypot(p.vx, p.vy) > 60;
    if (thrusting) {
      const back = Math.atan2(p.vy, p.vx) + Math.PI;
      const fl = 14 + 8 * Math.sin(s.time * 30);
      ctx.fillStyle = '#ff9a3d';
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(back + 0.4) * 10, p.y + Math.sin(back + 0.4) * 10);
      ctx.lineTo(p.x + Math.cos(back) * (18 + fl), p.y + Math.sin(back) * (18 + fl));
      ctx.lineTo(p.x + Math.cos(back - 0.4) * 10, p.y + Math.sin(back - 0.4) * 10);
      ctx.closePath(); ctx.fill();
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.aim);
    if (s.invuln > 0 && Math.floor(s.time * 12) % 2 === 0) ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#e8f6ff';
    ctx.beginPath();
    ctx.moveTo(20, 0); ctx.lineTo(-12, -11); ctx.lineTo(-6, 0); ctx.lineTo(-12, 11);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#38b6ff';
    ctx.beginPath(); ctx.arc(2, 0, 5, 0, TAU); ctx.fill();
    ctx.restore();
    // shield ring
    if (s.shield > 0) {
      ctx.strokeStyle = `rgba(90, 200, 255, ${0.25 + 0.45 * (s.shield / s.shieldMax)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 8, 0, TAU); ctx.stroke();
    }
  }

  function drawAsteroid(ctx, a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    glow(ctx, 0, 0, a.radius * 1.8, 'rgba(255, 150, 80, 0.25)', 1);
    ctx.fillStyle = a.size === 'big' ? '#8a5a3b' : a.size === 'medium' ? '#9a6a44' : '#a87a52';
    ctx.strokeStyle = '#ffcf9a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < a.verts.length; i++) {
      const ang = (i / a.verts.length) * TAU;
      const r = a.radius * a.verts[i];
      i ? ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r) : ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.arc(-a.radius * 0.25, -a.radius * 0.2, a.radius * 0.22, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(a.radius * 0.3, a.radius * 0.25, a.radius * 0.16, 0, TAU); ctx.fill();
    ctx.restore();
    if (a.hp < a.maxHp) {
      const w = a.radius * 1.6;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(a.x - w / 2, a.y - a.radius - 10, w, 4);
      ctx.fillStyle = '#ffb37a';
      ctx.fillRect(a.x - w / 2, a.y - a.radius - 10, w * (a.hp / a.maxHp), 4);
    }
  }

  function drawDrone(ctx, d, s) {
    glow(ctx, d.x, d.y, 34, 'rgba(255, 60, 120, 0.35)', 1);
    ctx.save();
    ctx.translate(d.x, d.y);
    if (d.flash > 0) ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#ff4d7e';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + s.time; i ? ctx.lineTo(Math.cos(a) * d.radius, Math.sin(a) * d.radius) : ctx.moveTo(Math.cos(a) * d.radius, Math.sin(a) * d.radius); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c40e42';
    ctx.beginPath(); ctx.arc(0, 0, 2, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawCrystals(ctx, s) {
    for (const cr of s.crystals) {
      const bob = Math.sin(cr.t * 3) * 3;
      const blink = cr.life < 4 ? (Math.sin(cr.t * 10) > 0 ? 1 : 0.35) : 1;
      ctx.globalAlpha = blink;
      const col = cr.kind === 'gold' ? '#ffd23d' : '#7df9ff';
      glow(ctx, cr.x, cr.y + bob, 24, col, 0.55);
      ctx.save();
      ctx.translate(cr.x, cr.y + bob);
      ctx.rotate(Math.PI / 4 + Math.sin(cr.t * 2) * 0.3);
      ctx.fillStyle = col;
      const r = cr.value >= 3 ? 11 : 8;
      ctx.fillRect(-r / 1.4, -r / 1.4, r * 1.4, r * 1.4);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(-r / 3, -r / 3, r / 1.5, r / 1.5);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  function drawHud(ctx, s) {
    text(ctx, `SCORE ${s.score}`, 28, 34, 30, '#fff6c9', 800, 'left');
    text(ctx, `BEST ${Math.max(s.best, s.score)}`, 28, 62, 16, 'rgba(255,255,255,0.65)', 600, 'left');
    if (s.mult > 1) text(ctx, `COMBO x${s.mult.toFixed(2).replace(/\.?0+$/, '')}`, 28, 92, 22, '#ffd23d', 800, 'left');
    text(ctx, `SECTOR ${Math.max(1, s.sector)} / 5`, 640, 34, 26, '#ffffff', 800);
    // quota progress bar
    const qw = 260;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rr(ctx, 640 - qw / 2, 52, qw, 14, 7); ctx.fill();
    const frac = Math.min(1, s.collected / Math.max(1, s.quota));
    ctx.fillStyle = '#7df9ff';
    rr(ctx, 640 - qw / 2, 52, qw * frac, 14, 7); ctx.fill();
    text(ctx, `◆ ${Math.min(s.collected, s.quota)} / ${s.quota} crystals`, 640, 84, 15, '#bff6ff', 700);
    // hull + shield top-right
    text(ctx, 'HULL', 1252, 26, 15, '#ffb3ab', 700, 'right');
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rr(ctx, 1062, 36, 190, 14, 7); ctx.fill();
    const hf = Math.max(0, s.hull / s.hullMax);
    ctx.fillStyle = hf > 0.5 ? '#5dff9a' : hf > 0.25 ? '#ffd23d' : '#ff5d5d';
    rr(ctx, 1062, 36, 190 * hf, 14, 7); ctx.fill();
    text(ctx, 'SHIELD', 1252, 66, 15, '#7dd7ff', 700, 'right');
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rr(ctx, 1062, 76, 190, 10, 5); ctx.fill();
    ctx.fillStyle = '#38b6ff';
    rr(ctx, 1062, 76, 190 * Math.max(0, s.shield / s.shieldMax), 10, 5); ctx.fill();
    if (s.banner > 0 && s.mode === 'playing') {
      ctx.globalAlpha = Math.min(1, s.banner);
      text(ctx, s.bannerText, 640, 300, 44, '#bff6ff', 900);
      ctx.globalAlpha = 1;
    }
    text(ctx, 'WASD thrust · mouse aim · hold click to shoot · P pause · M mute', 640, 700, 14, 'rgba(255,255,255,0.45)', 600);
  }

  function drawWorld(ctx, s) {
    drawBackground(ctx, s);
    drawCrystals(ctx, s);
    for (const b of s.ebolts) {
      glow(ctx, b.x, b.y, 15, '#ff4d7e', 0.6);
      ctx.fillStyle = '#ff8ab0';
      ctx.beginPath(); ctx.arc(b.x, b.y, 5.5, 0, TAU); ctx.fill();
    }
    for (const b of s.bolts) {
      ctx.strokeStyle = '#aef3ff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, TAU); ctx.fill();
    }
    for (const a of s.asteroids) drawAsteroid(ctx, a);
    for (const d of s.drones) drawDrone(ctx, d, s);
    if (s.mode !== 'gameover') drawShip(ctx, s);
    for (const pt of s.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const f of s.floats) {
      ctx.globalAlpha = Math.max(0, f.life);
      text(ctx, f.text, f.x, f.y, 18, f.color, 800);
    }
    ctx.globalAlpha = 1;
    drawHud(ctx, s);
  }

  function panel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(10, 8, 32, 0.88)';
    rr(ctx, x, y, w, h, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(125, 249, 255, 0.45)';
    ctx.lineWidth = 2;
    rr(ctx, x, y, w, h, 18); ctx.stroke();
  }

  function drawTitle(ctx, s) {
    drawBackground(ctx, s);
    // decorative: ship + crystals + asteroids behind the panel
    glow(ctx, 640, 360, 200, 'rgba(125, 249, 255, 0.15)', 1);
    panel(ctx, 320, 120, 640, 480);
    text(ctx, 'A TWIN-STICK SPACE SALVAGE', 640, 172, 20, '#7df9ff', 800);
    text(ctx, 'NOVA', 640, 240, 72, '#ffffff', 900);
    text(ctx, 'SALVAGE', 640, 305, 72, '#ffd23d', 900);
    text(ctx, 'Blast the rocks. Grab the crystals. Mind the drones.', 640, 360, 18, '#e8f6ff', 600);
    text(ctx, 'Fill each sector quota to warp on — survive all 5 sectors.', 640, 387, 18, '#e8f6ff', 600);
    text(ctx, 'WASD / arrows — thrust      Mouse — aim', 640, 435, 17, '#bfe8ff', 700);
    text(ctx, 'Hold click — shoot      P — pause      M — mute', 640, 462, 17, '#bfe8ff', 700);
    text(ctx, 'Rocks split when mined. Drones hunt you. Crystals chain combos to x8.', 640, 500, 16, 'rgba(255,255,255,0.65)', 600);
    text(ctx, 'CLICK OR PRESS ENTER TO PLAY', 640, 548, 22, '#ffd23d', 900);
    if (s.best > 0) text(ctx, `Best score: ${s.best}`, 640, 580, 16, 'rgba(255,255,255,0.7)', 600);
  }

  function drawUpgrade(ctx, s) {
    drawWorld(ctx, s);
    ctx.fillStyle = 'rgba(6, 4, 20, 0.72)';
    ctx.fillRect(0, 0, 1280, 720);
    text(ctx, `SECTOR ${s.sector} COMPLETE!`, 640, 130, 40, '#bff6ff', 900);
    text(ctx, 'Choose a ship upgrade', 640, 175, 22, '#ffd23d', 700);
    const cw = 300, ch = 190, gap = 30;
    const total = cw * 3 + gap * 2;
    s._cards = [];
    s.upgradeChoices.forEach((u, i) => {
      const x = 640 - total / 2 + i * (cw + gap);
      const y = 230;
      s._cards.push({ x, y, w: cw, h: ch, index: i });
      ctx.fillStyle = 'rgba(16, 12, 48, 0.95)';
      rr(ctx, x, y, cw, ch, 16); ctx.fill();
      ctx.strokeStyle = '#7df9ff'; ctx.lineWidth = 2;
      rr(ctx, x, y, cw, ch, 16); ctx.stroke();
      text(ctx, `${i + 1}`, x + 24, y + 28, 18, '#ffd23d', 900);
      text(ctx, u.name, x + cw / 2, y + 62, 25, '#ffffff', 800);
      text(ctx, u.desc, x + cw / 2, y + 108, 18, '#bfe8ff', 600);
      text(ctx, 'click or press ' + (i + 1), x + cw / 2, y + 152, 15, 'rgba(255,255,255,0.55)', 600);
    });
    text(ctx, `Score ${s.score} · Hull ${Math.ceil(s.hull)}/${s.hullMax}`, 640, 480, 18, 'rgba(255,255,255,0.8)', 600);
  }

  function drawEnd(ctx, s, won) {
    drawBackground(ctx, s);
    panel(ctx, 330, 150, 620, 420);
    text(ctx, won ? 'ALL SECTORS SALVAGED' : 'SHIP DESTROYED', 640, 205, 22, won ? '#7df9ff' : '#ff8a80', 800);
    text(ctx, won ? 'MISSION COMPLETE!' : 'GAME OVER', 640, 275, 54, '#ffe9a8', 900);
    text(ctx, `Score  ${s.score}`, 640, 345, 30, '#ffffff', 800);
    text(ctx, `You reached sector ${s.sector}  ·  ${s.kills} rocks and drones destroyed`, 640, 388, 17, 'rgba(255,255,255,0.8)', 600);
    text(ctx, `Upgrades: ${s.upgradesTaken.length ? s.upgradesTaken.join(', ') : 'none'}`, 640, 414, 15, 'rgba(255,255,255,0.6)', 600);
    if (s.score >= s.best && s.score > 0) text(ctx, '★ NEW BEST SCORE ★', 640, 448, 20, '#ffd23d', 900);
    text(ctx, 'PRESS R OR CLICK TO PLAY AGAIN', 640, 500, 20, '#7df9ff', 800);
    text(ctx, won ? 'The nebula is yours, salvager.' : 'Tip: big rocks split — mine the small ones first when drones close in.', 640, 540, 15, 'rgba(255,255,255,0.6)', 600);
  }

  function drawPaused(ctx, s) {
    drawWorld(ctx, s);
    ctx.fillStyle = 'rgba(6, 4, 20, 0.7)';
    ctx.fillRect(0, 0, 1280, 720);
    text(ctx, 'PAUSED', 640, 340, 56, '#bff6ff', 900);
    text(ctx, 'Press P to resume', 640, 400, 20, '#ffd23d', 700);
  }

  return {
    render(ctx, s, mode, paused) {
      ctx.save();
      if (s.shake > 0) {
        const m = s.shake * 14;
        ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
      }
      if (mode === 'title') drawTitle(ctx, s);
      else if (mode === 'upgrade') drawUpgrade(ctx, s);
      else if (mode === 'victory') drawEnd(ctx, s, true);
      else if (mode === 'gameover') drawEnd(ctx, s, false);
      else if (paused) drawPaused(ctx, s);
      else drawWorld(ctx, s);
      ctx.restore();
    },
  };
}
