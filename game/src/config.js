// Emberfall — tuning constants. One place for every number that shapes how the
// game feels, so a balance pass touches this file and nothing else.
export const CONFIG = {
  world: { width: 1280, height: 800 },
  tree: { x: 640, y: 400, radius: 46, maxHp: 100 },
  player: {
    radius: 16,
    speed: 330,
    fireInterval: 0.22,
    bulletSpeed: 720,
    bulletRadius: 6,
    bulletDamage: 1,
  },
  // Enemy types. hp is hits to kill, speed is pixels per second, score is the
  // base points for killing one, radius is its collision size.
  enemies: {
    ember: { hp: 1, speed: 52, score: 100, radius: 15, color: '#ff9a3d' },
    swift: { hp: 1, speed: 118, score: 150, radius: 11, color: '#ffd23d' },
    bulwark: { hp: 4, speed: 34, score: 300, radius: 24, color: '#c96bff' },
    splitter: { hp: 2, speed: 62, score: 200, radius: 17, color: '#ff5d73' },
    mote: { hp: 1, speed: 96, score: 50, radius: 9, color: '#ff8fb0' },
    // A fiend alive longer than this quickens, so no wave can stall.
    enrageAfter: 22,
    enrageBoost: 1.3,
  },
  // How a wave is built: count grows with the wave number, and new enemy kinds
  // join the mix as the waves go on.
  waves: {
    baseCount: 6,
    perWave: 3,
    spawnGap: 0.85,
    betweenWaves: 4.0,
  },
  pickups: {
    dropChance: 0.16,
    kinds: ['rapid', 'spread', 'mend', 'star'],
    rapidSeconds: 9,
    spreadSeconds: 9,
    mendHp: 18,
    starScore: 500,
    lifetime: 9,
  },
  combo: { window: 2.5, maxMultiplier: 8 },
  treeRegenPerWave: 6,
};
