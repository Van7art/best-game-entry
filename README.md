# Emberfall

[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/Van7art/best-game-entry/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Van7art/best-game-entry/reward.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Emberfall** — a tiny guardian tale. You are the wisp that guards the Heart
Tree, the last light in a dark grove. Ember fiends crawl in from the dark to
eat it; shoot them down before they reach it.

## Play

Serve `game/` with any static server (`node serve.ts`, then open
http://localhost:8080) and play in a desktop browser. No build step, no
network requests, no libraries — plain canvas and WebAudio.

- **WASD / arrow keys** — move the wisp
- **Mouse** — aim
- **Hold click** — shoot light bolts
- **P / Esc** — pause, **R** — restart, **M** — mute

## The game

- **Goal:** keep the Heart Tree alive. A fiend that touches it burns away
  part of its health; at 0 the light goes out.
- **Enemies:** embers, fast swifts, armoured bulwarks, splitters that burst
  into motes. Waves grow in size and mix as you survive them.
- **Combo:** kills in quick succession raise a score multiplier up to x8.
- **Pickups:** rapid fire, spread shot, tree mending, bonus stars.
- **Sound:** every effect is synthesized live with WebAudio — no audio files.

## Files

- `game/index.html` — the page
- `game/src/main.js` — boot and main loop
- `game/src/world.js` — pure game state and rules (no DOM; unit-tested in Node)
- `game/src/render.js` — all canvas drawing
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized sound effects
- `game/src/config.js` — tuning constants
- `game/src/random.js` — seeded RNG
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=start|play|end`)
- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to `/output`
  and writes `dossier.json`

Built for [make.fun](https://make.fun/r/4e96xqxt) — referral code `4e96xqxt`.
