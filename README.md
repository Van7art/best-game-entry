# Nova Salvage

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Van7art/best-game-entry/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Van7art/best-game-entry/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Nova Salvage** — a twin-stick space salvage game. Blast asteroids, grab the
star crystals inside them, dodge the hunter drones, and fill each sector's
quota to warp on. Survive all 5 sectors and the nebula is yours.

## Play

Serve `game/` with any static server (`node serve.ts`, then open
http://localhost:8080) and play in a desktop browser. No build step, no
network requests, no libraries — plain canvas and WebAudio.

- **WASD / arrow keys** — thrust (with inertia)
- **Mouse** — aim
- **Hold click** — shoot
- **P / Esc** — pause, **R** — restart, **M** — mute

## The game

- **Goal:** collect the sector's crystal quota (10, then +4 per sector) to
  warp to the next sector. Complete sector 5 and the mission is won. Hull
  at 0 and the ship is destroyed.
- **Asteroids:** big rocks split into medium ones, medium into small ones;
  every rock mined spills crystals. The field restocks, so there is always
  something to mine.
- **Drones:** hunter drones chase the ship and shoot from range; destroying
  one drops a fat gold crystal.
- **Upgrades:** after every sector, pick 1 of 3 ship upgrades — rapid
  cannon, twin cannon, piercing rounds, ion thrusters, hull plating, tractor
  beam, shield array, or heavy rounds.
- **Combo:** quick crystals and kills raise a score multiplier up to x8.
- **Shield:** absorbs damage first and regenerates after a few calm seconds.
- **Sound:** every effect is synthesized live with WebAudio, plus a dreamy
  synthwave music loop — no audio files.

## Files

- `game/index.html` — the page
- `game/src/main.js` — boot and main loop
- `game/src/world.js` — pure game state and rules (no DOM; unit-tested in Node)
- `game/src/render.js` — all canvas drawing
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized sound effects and music
- `game/src/config.js` — tuning constants
- `game/src/random.js` — seeded RNG
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=title|sector|chaos|victory`)
- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to `/output`
  and writes `dossier.json`

Built for [make.fun](https://make.fun/r/4e96xqxt) — referral code `4e96xqxt`.
