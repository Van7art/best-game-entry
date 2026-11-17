// Nova Salvage — tuning constants.
export const CONFIG = {
  width: 1280,
  height: 720,
  ship: { radius: 14, thrust: 520, drag: 0.92, maxSpeed: 380, fireInterval: 0.2, boltSpeed: 720, boltDamage: 1, maxHull: 100 },
  combo: { windowSec: 3, step: 0.25, maxMult: 8 },
  sectors: { winSector: 5, quotaBase: 14, quotaStep: 6 },
  asteroids: {
    big:    { hp: 5, radius: 34, score: 80,  crystal: 2 },
    medium: { hp: 3, radius: 22, score: 50,  crystal: 1 },
    small:  { hp: 1, radius: 12, score: 30,  crystal: 1 },
  },
  drone: { hp: 3, speed: 120, radius: 13, damage: 8, score: 120, shootInterval: 2.4 },
  upgrades: [
    { id: 'rapid',   name: 'Rapid Cannon',  desc: '+25% fire rate',        apply: (p) => { p.fireInterval *= 0.8; } },
    { id: 'spread',  name: 'Twin Cannon',   desc: '+1 bolt per shot',       apply: (p) => { p.shots += 1; } },
    { id: 'pierce',  name: 'Piercing Rounds', desc: 'Bolts pierce +1 rock', apply: (p) => { p.pierce += 1; } },
    { id: 'thrust',  name: 'Ion Thrusters', desc: '+18% thrust & speed',   apply: (p) => { p.thrust *= 1.18; p.maxSpeed *= 1.1; } },
    { id: 'hull',    name: 'Hull Plating',  desc: '+30 max hull, repair 30', apply: (p, s) => { s.hullMax += 30; s.hull = Math.min(s.hullMax, s.hull + 30); } },
    { id: 'magnet',  name: 'Tractor Beam',  desc: 'Crystals fly to you',    apply: (p) => { p.magnet = true; } },
    { id: 'shield',  name: 'Shield Array',  desc: 'Shield regens faster',   apply: (p) => { p.shieldRegen += 1.5; } },
    { id: 'power',   name: 'Heavy Rounds',  desc: '+1 bolt damage',         apply: (p) => { p.damage += 1; } },
  ],
};
