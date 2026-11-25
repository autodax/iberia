# Iberia: handoff guide for any AI (or person) taking over

This file (`AGENTS.md`) holds all the project rules and context; `CLAUDE.md` just points here. Read it first. Then skim `PROJECT_NOTES.md` (decisions and verification log), `CHANGELOG.md` (newest changes under "## Latest"), `docs/RULINGS.md` (rules interpretations) and `README.md` (features, relay setup, asset naming).

## What this is

A browser version of **Pandemic Iberia** (the Pandemic board game set in Spain and Portugal), built by Steve (GitHub `autodax`) as a single self-contained HTML page.

- Repo: `github.com/autodax/iberia`. Live game: https://autodax.github.io/iberia/ (GitHub Pages serves the repo root; allow about 10 minutes for caching).
- 2 to 5 players, 12 roles (7 rulebook roles plus 5 from an expansion), all 15 Events, local play on one screen, and **online play** between remote players.
- Main targets: Safari on an M4 MacBook Air, and iPad. Steve plays online with a remote person. Keep Safari behaviour in mind for every visual change (it differs from Chromium in SVG/CSS transforms, audio and caching).
- Current version: `UI_VERSION` in `src/ui.js` (0.10.9 at time of writing). The build time is stamped on the map in the lower left ("built Nov 25 22:12 UTC"). Steve identifies builds by that stamp.

## How Steve likes to work (important)

- Steve is **not a GitHub expert and does not read code**. Explain in plain language. Do not paste code into replies.
- For **simple choice questions** (pick one of a few options), use **buttons** (the multiple-choice question dialog) rather than plain text. Open-ended questions can still be asked in plain text.
- **Show mock-ups for visual changes and wait for him to say "push"** before pushing. For non-visual fixes he may say "go".
- **End every update report with the current build time** (the stamp shown on the map).
- Keep this `AGENTS.md` current as the project changes. Add a bullet under "## Latest" in `CHANGELOG.md` for each change (plain English, what the player sees).
- Commit messages end with the co-author and session trailer lines your tooling asks for.
- If he reports a bug with a screenshot, find the root cause rather than patching symptoms (several "doesn't work" reports were really hidden error messages, see Gotchas).

## Repository map

- `src/engine.js` (about 275 long lines): the **deterministic rules engine**. `transact(state, cmd)` copies the state, applies one command, and returns the new state plus a log and effects (`fx`) for the UI. All randomness uses a seed stored in the state, so the same state plus the same command always gives the same result. Rules errors are thrown with `requireRule`. Choices the player must make mid-command come back as a `choice` request and the UI re-submits the command with `choices`. `invariant(s)` checks state sanity (used heavily by the simulation tests). Used purification and prevention tokens return to `waterSupply` and the prevention token to the supply.
- `src/ui.js` (about 1350 long lines): everything on screen. Draws the board as SVG over the board picture, the side panel, dialogs, effects queue and sounds. Key pieces:
  - `perform(cmd)` sends a command through the engine (or the network when a guest), then renders and queues effects.
  - Effects queue: `queueFx`, `nextFx`, `fxCurrent` (alerts, card reveals, outbreak and epidemic banners, flights of cubes and tokens). `busy` and `actUntil` gate input during animations.
  - Board mode (`bmOn`): the compact board view; the side `#message` line is hidden there, so errors also use a toast and the Event dialog's inline `#eventError`.
  - Cube layout: `groupOrigin`, `cubeSpot`, `cubePos`, `layColors`, `stickyCols`. Each disease colour at a city is a stable group with its own fixed spot that only moves when a pawn arrives or leaves or cubes are added. Invisible `.cubeHit` polygons make groups easy to click; hover grow is an explicit SVG transform around each cube's centre (CSS `scale` drifted in Safari).
  - Region token layout: `regionSpots(r, n)` scores positions against city dots and labels (`layoutBase()`) and keeps the Nurse's prevention token and purification tokens close together, centred.
  - Water token flights: `waterKeepAdd`, `waterRelease`, `aquaFlash` (flat light aqua polygon inserted just above `#boardImage`, so tokens and cubes sit on top), `startWaterFlights`. A used token stays visible until the "Infection prevented" popup closes, then the region flashes and the token flies back to its own slot in the Water column.
  - Supply piles: the `PILE` settings in `drawSupply` (scatter, step, tilt) shape the purification and railroad token piles; slots that were used stay as hidden placeholders (`img.gone`) so flights land in the right place.
  - Token choice: `bestToken(cmd, choices, options)` plays out each purification-token option with the engine and keeps the one with the fewest outbreaks then cubes; ties prefer the region with the most tokens, then leftmost.
  - Draw cue: `updateDeckGlow`, `scheduleCue`, `deckCue` (deck sways, chime or heartbeat 0.9 s after the sway starts, once per wait; plays again after undo). `pawnPing` repeats the pawn ring silently every 5 s until the active player acts. `#ringUndo` is the round U-turn Undo button under the active pawn.
  - Event dialog: `openEvent`, `eventForm`, `upd()` dry-runs `transact` on every change and shows why an Event is not playable in red (with a generic "check role abilities" hint).
- `src/net.js`: online play. One browser is the **host** and runs the authority; guests send commands, the host validates and orders them and broadcasts accepted commands with a sequence number and a state checksum; a guest that falls out of sync asks for the full state. Transport is PeerJS (vendored in `src/vendor/`) with a **relay** fallback. This file knows nothing about the page; the page supplies hooks and a transport.
- `src/map.js`, `docs/iberia-map.json`: cities, regions, connections, ports, railroad-allowed routes. `src/ice.json`: relay URL and connection settings.
- `src/index.html`, `src/style.css`: page template and styles. `build.py` fills in `/*CSS*/`, `/*BOARD*/`, `/*JS*/`, `/*PEERJS*/`, `__BUILD__`.
- `relay/`: Cloudflare Worker relay (free plan). `tools/home-relay/`: run-it-yourself backup relay. Setup steps are in `README.md`.
- `assets/`: pictures and sounds, found by file name (see README, "Card picture names"). Board: `board.jpeg` is the build input and is a copy of `board_ship.jpeg` (ship drawings on the sea). `board_no_ship.jpeg` is the previous version without ships. Older experimental boards were removed from the repo. `railroad.png` (placed on the map) and `railroad-transparent.png` (supply and flying tokens) are deliberately different, keep both.
- `tests/`: see below. `docs/`: rulebook PDFs and notes (`RULINGS.md`, `FOUNDING_DATES.md`, `SOUNDS.md`).
- Not in the repo (excluded by `.gitignore`): `versions/` (build output, so old versions are no longer kept or served), `incoming/`, `backup/`, `node_modules/`, `dist/`. The generated `index.html` is committed because GitHub Pages serves it.

## Build and release

1. Edit sources in `src/` (never edit `index.html` by hand, it is generated).
2. `python3 build.py` regenerates `index.html` (also writes a local `versions/` copy that is not committed) and stamps the build time. Needs Python with Pillow.
3. Test (below). 4. Add a CHANGELOG bullet under "## Latest". 5. Commit and push to `main`; GitHub Pages deploys automatically.
- Other people or sessions also push, so `git pull --rebase` first (stash local changes if needed). If generated files conflict, rerun `python3 build.py` and `git add -A`.
- A GitHub Action (`.github/workflows/rebuild.yml`) rebuilds the game when files in `assets/` change and commits "Rebuild game from assets [skip ci]". If you push twice within seconds it can report a failure because its own push is rejected as out of date. That failure is harmless; the site deploys from your push. Just rerun `python3 build.py` if the stamp matters.
- Pages occasionally fails with a GitHub 500; an empty commit (`git commit --allow-empty`) re-triggers the deploy.
- To bump the version number, change `UI_VERSION` in `src/ui.js`.

## Tests (run before pushing)

- `node tests/engine.test.js` (205 assertions, includes 300 simulated games), `node tests/net.test.js` (100 checks), `node tests/challenges.test.js`, `node tests/replaced.test.js`.
- `python3 tests/browser_test.py` (about 185 checks, needs Playwright and Chromium; set `CHROMIUM=` to pick a browser; takes about 4 minutes, use a long timeout). Some checks (alert timing, "ship move", "several matching cards") are timing sensitive and occasionally fail once on a busy machine; rerun before assuming a real bug. `tests/browser_online_test.py`, `tests/relay.test.js` and `tests/ui_fuzz.py` cover online play and fuzzing.
- Visual changes: render screenshots with Playwright at about 1710x1040 and look at them. Scratch scripts that set up a mid-game state are handy; the page exposes `state`, `render()`, `recompute()` and `queueFx()` globals for this.

## Rules decisions and design choices worth knowing

- Rule interpretations are in `docs/RULINGS.md` (undo scope, Events, role abilities, starting player by earliest founding date). Undo is allowed for anything that reveals no hidden cards; drawing, epidemics, infections, the Scientist's peek and Begin game clear the undo history.
- Saves from v0.8 and earlier are not compatible. Autosave is in the browser's local storage; Menu can export and import a save.
- Sounds are CC0 from Kenney (see `docs/SOUNDS.md`); the turn gong (`assets/sounds/turn.mp3`) and win jingle were tuned by hand.
- Reduced-motion and "animations off" settings must always have a non-animated path (flights, flashes and sways are skipped).

## Gotchas learned the hard way

- Errors were invisible in board view because the side message line is hidden there. Any new failure path should surface via the toast or an inline message.
- Do not rely on timing alone to sequence sounds; the draw chime is intentionally a fixed delay after the deck sway starts. Waiting for "all animations idle" proved too strict and silenced it.
- Safari: avoid CSS `scale` and transform-origin tricks on SVG children; use explicit SVG `transform` around a computed centre. Re-test hover and animation changes there if you can.
- After a re-render, animation delays must use the same period as the keyframes (the deck sway jumped when the delay still used the old 2 s period).
- The board image tag is sized to the 3910x2760 coordinate frame but any board image of the same aspect ratio (for example 2448x1728) stretches correctly. City positions are fixed to the board art, so a replacement board must keep the same layout.
- A purification token is a stable slot in the Water column; the supply uses hidden placeholder slots so flights go to the right spot. Do not remove those placeholders.

## Open ideas and status

- `TODO.md` holds the author's later ideas (currently empty beyond a placeholder).
- Possible follow-ups mentioned but not decided: moving the yellow cube row up if it ever overlaps board lettering, and housekeeping of the stray files noted above.
- Last verified state: v0.10.9, build Nov 25 22:12 UTC (removed "New game" heading from Game dialog; prior full run: engine 205/205, net 100/100, browser 185/185).
- After a release or a significant decision, also record what changed, what was verified, and any open follow-up in `PROJECT_NOTES.md`.
