# Pandemic Iberia browser prototype v0.10.0
Play the current version at https://autodax.github.io/iberia/. Every version stays playable at https://autodax.github.io/iberia/versions/ in any modern browser. Everything is inside that one file.

- 2-5 players, all 7 standard roles, all 15 Events (random selection per the setup table).
- Outbreak and epidemic alerts; drawn player and infection cards are shown briefly (Menu > Card reveals: Normal / Fast / Off). Click a reveal to skip it.
- Graphics: loaded from this repo's `assets/` folder by default. Top-level files are matched by name (`cube_red.png` -> cube, `hospital_blue.png`, `research_black.png`, `purification.png`, `prevention.png`, `infection_rate.png`, `outbreak.png`, `railroad.png`, `board.jpeg` = board). Subfolders keep their path, e.g. `assets/pawns/pawn_nurse.png`, `assets/cards/epidemic.png`, `assets/alerts/outbreak.png`, `assets/audio/epidemic.mp3`.
- Local override: Menu > Asset folder. Pick a folder laid out as in `docs/asset-manifest.csv`; matching files replace the built-in graphics for that session. Names are case-insensitive, `_` and `-` are treated alike, any image extension works.
- Online play (v0.10): Online button > Host a new game, then send the room code or invite link. Guests join from their own browsers; one browser (the host) checks and orders every move, so keep the host's page open. Browsers connect directly through PeerJS (MIT licence, built into the page from `src/vendor/`; it uses PeerJS's free public connection service to introduce browsers to each other). If a guest cannot connect from a strict network, a relay (TURN) server would be needed; see `src/net.js`.
- Save/load: autosaves in the browser; Menu also exports/imports a save file. Saves from v0.8 and earlier are not compatible.

Rebuild: `python3 build.py` (sources in `src/`). Tests: `node tests/engine.test.js`, `node tests/net.test.js`, `python3 tests/browser_test.py` and `python3 tests/browser_online_test.py` (needs Playwright + Chromium; set CHROMIUM=/path/to/chrome to use a specific browser).

## Reference documents
- `docs/Iberia_rulebook.pdf`: the game manual.
- `docs/Guide.pdf`: the rules summary, including the Events and Roles glossaries.
- `docs/RULINGS.md`: how the prototype interprets unclear rules.
