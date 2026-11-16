// Emberfall — canvas rendering. Every pixel of the game is drawn here from the
// world state: the grove, the Heart Tree, the wisp, the fiends, the HUD and
// the menus. Nothing in this file mutates the world except its own small
// cosmetic state (banner timer, ambient fireflies).
import { CONFIG } from './config.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const render = {
    banner: '',
    bannerTimer: 0,
    lastWave: 0,
    fireflies: [],
  };

  for (let i = 0; i < 46; i++) {
    render.fireflies.push({
      x: Math.random() * CONFIG.world.width,
      y: Math.random() * CONFIG.world.height,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.9,
      size: 1 + Math.random() * 2,
    });
  }

  function glowCircle(x, y, radius, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawBackground(world) {
    const w = CONFIG.world.width;
    const h = CONFIG.world.height;
    const g = ctx.createRadialGradient(640, 400, 60, 640, 400, 760);
    g.addColorStop(0, '#1d2f24');
    g.addColorStop(0.55, '#101d16');
    g.addColorStop(1, '#060b08');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Distant tree silhouettes around the rim.
    ctx.fillStyle = '#0a1410';
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const x = 640 + Math.cos(a) * 660;
      const y = 400 + Math.sin(a) * 430;
      ctx.beginPath();
      ctx.moveTo(x - 26, y + 60);
      ctx.lineTo(x, y - 90 - (i % 3) * 26);
      ctx.lineTo(x + 26, y + 60);
      ctx.closePath();
      ctx.fill();
    }

    // Fireflies drift through the grove.
    for (const f of render.fireflies) {
      f.phase += 0.016 * f.speed;
      const alpha = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(f.phase * 2));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#cfe8a0';
      ctx.beginPath();
      ctx.arc(f.x + Math.sin(f.phase) * 12, f.y + Math.cos(f.phase * 0.7) * 8, f.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Soft light pooling around the Heart Tree.
    glowCircle(CONFIG.tree.x, CONFIG.tree.y, 260, 'rgba(120,255,170,0.20)', 0.5);
  }

  function drawTree(world) {
    const t = CONFIG.tree;
    const pulse = 1 + 0.05 * Math.sin(world.time * 2.2);
    const hpFrac = world.tree.hp / CONFIG.tree.maxHp;

    // Trunk.
    ctx.strokeStyle = '#5d4126';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(t.x, t.y + 46);
    ctx.quadraticCurveTo(t.x - 8, t.y + 10, t.x, t.y - 6);
    ctx.stroke();
    ctx.strokeStyle = '#7a5a35';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y + 20);
    ctx.quadraticCurveTo(t.x - 22, t.y - 6, t.x - 30, t.y - 26);
    ctx.moveTo(t.x, t.y + 14);
    ctx.quadraticCurveTo(t.x + 22, t.y - 10, t.x + 32, t.y - 30);
    ctx.stroke();

    // Canopy: three overlapping crowns, glowing green.
    glowCircle(t.x, t.y - 34, 66 * pulse, 'rgba(110,255,160,0.55)', 0.9);
    ctx.fillStyle = '#2f9e5f';
    ctx.beginPath();
    ctx.arc(t.x - 26, t.y - 30, 30, 0, Math.PI * 2);
    ctx.arc(t.x + 26, t.y - 30, 30, 0, Math.PI * 2);
    ctx.arc(t.x, t.y - 52, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#46c47c';
    ctx.beginPath();
    ctx.arc(t.x - 12, t.y - 44, 20, 0, Math.PI * 2);
    ctx.arc(t.x + 14, t.y - 40, 17, 0, Math.PI * 2);
    ctx.fill();

    // The heart: a warm core that beats and dims as the tree weakens.
    const heartAlpha = 0.35 + 0.65 * hpFrac;
    ctx.globalAlpha = heartAlpha;
    glowCircle(t.x, t.y - 6, 26 * pulse, 'rgba(255,214,120,0.9)', 0.9);
    ctx.fillStyle = '#ffd678';
    ctx.beginPath();
    ctx.arc(t.x, t.y - 6, 9 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // HP ring around the tree.
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = hpFrac > 0.5 ? '#7dff9e' : hpFrac > 0.25 ? '#ffd23d' : '#ff5d5d';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius + 12, -Math.PI / 2, -Math.PI / 2 + hpFrac * Math.PI * 2);
    ctx.stroke();

    // Danger ring: when a fiend closes in on the tree, a red pulse warns the
    // player to look back at the grove's heart.
    let nearest = Infinity;
    for (const e of world.enemies) {
      nearest = Math.min(nearest, Math.hypot(e.x - t.x, e.y - t.y));
    }
    if (nearest < 170) {
      const pulse = 0.35 + 0.3 * Math.sin(world.time * 8);
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ff5d5d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius + 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawPlayer(world) {
    const p = world.player;
    glowCircle(p.x, p.y, 46, 'rgba(140,220,255,0.5)', 0.8);
    // Aim line, faint, so the player can see where shots go.
    ctx.strokeStyle = 'rgba(180,235,255,0.28)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 10]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.angle) * 64, p.y + Math.sin(p.angle) * 64);
    ctx.stroke();
    ctx.setLineDash([]);
    // Wisp body: a bright core with a little tail flame.
    ctx.fillStyle = '#bfefff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7dd8ff';
    ctx.beginPath();
    ctx.arc(p.x - Math.cos(p.angle) * 16, p.y - Math.sin(p.angle) * 16, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawEnemy(e, world) {
    const def = CONFIG.enemies[e.kind];
    if (e.hitFlash > 0) glowCircle(e.x, e.y, e.radius + 14, 'rgba(255,255,255,0.8)', 0.7);
    glowCircle(e.x, e.y, e.radius + 16, def.color, 0.35);
    ctx.fillStyle = def.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    if (e.kind === 'bulwark') {
      // Armoured hexagon.
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + world.time * 0.6;
        const px = e.x + Math.cos(a) * e.radius;
        const py = e.y + Math.sin(a) * e.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2a1040';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 'swift') {
      // A dart: triangle pointing at the tree.
      const a = Math.atan2(CONFIG.tree.y - e.y, CONFIG.tree.x - e.x);
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(e.radius + 6, 0);
      ctx.lineTo(-e.radius, -e.radius * 0.8);
      ctx.lineTo(-e.radius * 0.4, 0);
      ctx.lineTo(-e.radius, e.radius * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (e.kind === 'splitter') {
      // Two lobes, ready to split.
      ctx.beginPath();
      ctx.arc(e.x - e.radius * 0.45, e.y, e.radius * 0.62, 0, Math.PI * 2);
      ctx.arc(e.x + e.radius * 0.45, e.y, e.radius * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d0a14';
      ctx.beginPath();
      ctx.arc(e.x - e.radius * 0.45, e.y, 3, 0, Math.PI * 2);
      ctx.arc(e.x + e.radius * 0.45, e.y, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ember and mote: a round ember with a hot core and a flickering edge.
      const flicker = 1 + 0.12 * Math.sin(world.time * 9 + e.wobble * 3);
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * flicker, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    // Eyes: two dark dots tracking the tree.
    const a = Math.atan2(CONFIG.tree.y - e.y, CONFIG.tree.x - e.x);
    const ex = Math.cos(a) * e.radius * 0.3;
    const ey = Math.sin(a) * e.radius * 0.3;
    ctx.fillStyle = '#1c0a00';
    ctx.beginPath();
    ctx.arc(e.x + ex - 4, e.y + ey - 3, 2.4, 0, Math.PI * 2);
    ctx.arc(e.x + ex + 4, e.y + ey - 3, 2.4, 0, Math.PI * 2);
    ctx.fill();
    // Health pips for tough enemies.
    if (e.maxHp > 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < e.maxHp; i++) {
        ctx.beginPath();
        ctx.arc(e.x - (e.maxHp - 1) * 5 + i * 10, e.y - e.radius - 10, 2.6, 0, Math.PI * 2);
        ctx.fill();
        if (i >= e.hp) {
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
        }
      }
    }
  }

  function drawBullets(world) {
    for (const b of world.bullets) {
      glowCircle(b.x, b.y, 16, 'rgba(150,230,255,0.7)', 0.8);
      ctx.strokeStyle = '#dff7ff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  function drawPickups(world) {
    for (const p of world.pickups) {
      const bobY = Math.sin(p.bob) * 4;
      const blink = p.life < 2 ? (Math.sin(world.time * 12) > 0 ? 1 : 0.35) : 1;
      ctx.globalAlpha = blink;
      const colors = { rapid: '#7df9ff', spread: '#c9a7ff', mend: '#8dff9e', star: '#ffd23d' };
      const color = colors[p.kind];
      glowCircle(p.x, p.y + bobY, 26, color, 0.55);
      ctx.fillStyle = 'rgba(6,12,9,0.85)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y + bobY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const glyph = { rapid: '»', spread: '✦', mend: '+', star: '★' }[p.kind];
      ctx.fillText(glyph, p.x, p.y + bobY + 1);
      ctx.globalAlpha = 1;
    }
  }

  function drawParticles(world) {
    for (const p of world.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawFloaters(world) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of world.floaters) {
      ctx.globalAlpha = Math.max(0, f.life / f.maxLife);
      ctx.font = 'bold 17px sans-serif';
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawHud(world) {
    // Low-health warning: a red vignette pulses at the screen edges while
    // the tree is nearly gone, so the danger reads even mid-fight.
    const treeFrac = world.tree.hp / CONFIG.tree.maxHp;
    if (treeFrac < 0.3 && world.phase === 'playing') {
      const pulse = 0.1 + 0.12 * (0.5 + 0.5 * Math.sin(world.time * 6));
      const vg = ctx.createRadialGradient(640, 400, 300, 640, 400, 720);
      vg.addColorStop(0, 'rgba(255,40,40,0)');
      vg.addColorStop(1, 'rgba(255,40,40,' + pulse.toFixed(3) + ')');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, CONFIG.world.width, CONFIG.world.height);
    }
    ctx.textBaseline = 'alphabetic';
    // Top-left: score and best.
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('SCORE ' + world.score, 22, 40);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('BEST ' + Math.max(world.best, world.score), 22, 64);

    // Top-centre: wave.
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('WAVE ' + Math.max(1, world.wave), 640, 38);
    const left = world.waveState === 'spawning'
      ? world.spawnQueue.length + ' incoming'
      : world.waveState === 'between'
        ? 'next wave soon'
        : world.enemies.length + ' fiends left';
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(left, 640, 60);

    // Top-right: tree HP bar.
    ctx.textAlign = 'right';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('HEART TREE', 1258, 26);
    const barW = 190;
    const barX = 1258 - barW;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(barX, 34, barW, 14);
    const hpFrac = world.tree.hp / CONFIG.tree.maxHp;
    ctx.fillStyle = hpFrac > 0.5 ? '#7dff9e' : hpFrac > 0.25 ? '#ffd23d' : '#ff5d5d';
    ctx.fillRect(barX, 34, barW * hpFrac, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '13px sans-serif';
    ctx.fillText(world.tree.hp + ' / ' + CONFIG.tree.maxHp, 1258, 66);

    // Combo multiplier under the score.
    if (world.multiplier > 1) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd23d';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('COMBO x' + world.multiplier, 22, 96);
    }

    // Active weapon timers, bottom-left.
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px sans-serif';
    let ty = 770;
    if (world.rapidTimer > 0) {
      ctx.fillStyle = '#7df9ff';
      ctx.fillText('RAPID ' + Math.ceil(world.rapidTimer) + 's', 22, ty);
      ty -= 22;
    }
    if (world.spreadTimer > 0) {
      ctx.fillStyle = '#c9a7ff';
      ctx.fillText('SPREAD ' + Math.ceil(world.spreadTimer) + 's', 22, ty);
    }

    // Controls hint, bottom-right.
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '13px sans-serif';
    ctx.fillText('WASD move · mouse aim · hold click to shoot · P pause · M mute', 1258, 778);
  }

  function drawBanner(world) {
    if (world.wave !== render.lastWave) {
      render.lastWave = world.wave;
      if (world.wave > 0 && world.phase === 'playing') {
        render.banner = 'WAVE ' + world.wave;
        render.bannerTimer = 1.8;
      }
    }
    if (render.bannerTimer > 0) {
      render.bannerTimer -= 1 / 60;
      const alpha = Math.min(1, render.bannerTimer);
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText(render.banner, 640, 170);
      ctx.globalAlpha = 1;
    }
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = 'rgba(4,10,7,0.78)';
    ctx.strokeStyle = 'rgba(150,255,190,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 18);
    ctx.fill();
    ctx.stroke();
  }

  function drawTitle(world) {
    ctx.fillStyle = 'rgba(3,8,5,0.45)';
    ctx.fillRect(0, 0, CONFIG.world.width, CONFIG.world.height);
    panel(340, 150, 600, 500);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8dff9e';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('A TINY GUARDIAN TALE', 640, 205);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText('EMBERFALL', 640, 285);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '18px sans-serif';
    ctx.fillText('The Heart Tree is the last light in the grove.', 640, 330);
    ctx.fillText('Ember fiends crawl in from the dark to eat it.', 640, 356);
    ctx.fillText('You are the wisp that stands between them.', 640, 382);
    ctx.fillStyle = '#bfefff';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText('WASD / arrows — move      Mouse — aim', 640, 440);
    ctx.fillText('Hold click — shoot      P — pause      M — mute', 640, 468);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '15px sans-serif';
    ctx.fillText('Kills build a combo multiplier. Fiends drop pickups.', 640, 506);
    ctx.fillText('If a fiend touches the tree, the tree burns.', 640, 528);
    ctx.fillStyle = '#ffd23d';
    ctx.font = 'bold 24px sans-serif';
    const blink = 0.65 + 0.35 * Math.sin(world.time * 4);
    ctx.globalAlpha = blink;
    ctx.fillText('CLICK OR PRESS ENTER TO PLAY', 640, 592);
    ctx.globalAlpha = 1;
    if (world.best > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '15px sans-serif';
      ctx.fillText('Best score: ' + world.best, 640, 626);
    }
  }

  function drawPaused(world) {
    ctx.fillStyle = 'rgba(3,8,5,0.6)';
    ctx.fillRect(0, 0, CONFIG.world.width, CONFIG.world.height);
    panel(440, 300, 400, 180);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('PAUSED', 640, 372);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '16px sans-serif';
    ctx.fillText('Press P or Esc to keep playing', 640, 412);
    ctx.fillText('Press R to restart', 640, 440);
  }

  function drawGameOver(world) {
    ctx.fillStyle = 'rgba(10,4,4,0.55)';
    ctx.fillRect(0, 0, CONFIG.world.width, CONFIG.world.height);
    panel(340, 170, 600, 460);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8f8f';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('THE LIGHT WENT OUT', 640, 225);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 60px sans-serif';
    ctx.fillText('GAME OVER', 640, 295);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('Score  ' + world.score, 640, 360);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('You held the grove through wave ' + Math.max(1, world.wave) + '  ·  ' + world.kills + ' fiends banished', 640, 398);
    const isBest = world.score >= world.best && world.score > 0;
    if (isBest) {
      ctx.fillStyle = '#ffd23d';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('★ NEW BEST SCORE ★', 640, 436);
    } else if (world.best > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '16px sans-serif';
      ctx.fillText('Best score: ' + world.best, 640, 436);
    }
    ctx.fillStyle = '#8dff9e';
    ctx.font = 'bold 22px sans-serif';
    const blink = 0.65 + 0.35 * Math.sin(world.time * 4);
    ctx.globalAlpha = blink;
    ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', 640, 500);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '14px sans-serif';
    ctx.fillText('Tip: splitters burst into motes — clear them before they reach the tree.', 640, 556);
  }

  render.draw = function draw(world) {
    ctx.save();
    if (world.shake > 0) {
      const s = world.shake * 14;
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
    }
    drawBackground(world);
    drawTree(world);
    if (world.phase === 'playing' || world.phase === 'paused') {
      drawPickups(world);
      for (const e of world.enemies) drawEnemy(e, world);
      drawBullets(world);
      drawPlayer(world);
      drawParticles(world);
      drawFloaters(world);
      drawHud(world);
      drawBanner(world);
    }
    if (world.phase === 'title') {
      drawTitle(world);
    } else if (world.phase === 'paused') {
      drawPaused(world);
    } else if (world.phase === 'gameover') {
      drawParticles(world);
      drawFloaters(world);
      drawGameOver(world);
    }
    ctx.restore();
  };

  return render;
}
