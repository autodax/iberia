# Pandemic Iberia browser prototype v0.9.0
Play the current version at https://autodax.github.io/iberia/. Every version stays playable at https://autodax.github.io/iberia/versions/ in any modern browser. Everything is inside that one file.

- 2-5 players, all 7 standard roles, all 15 Events (random selection per the setup table).
- Outbreak and epidemic alerts; drawn player and infection cards are shown briefly (Menu > Card reveals: Normal / Fast / Off). Click a reveal to skip it.
- Graphics: loaded from this repo's `assets/` folder by default. Top-level files are matched by name (`cube_red.png` -> cube, `hospital_blue.png`, `research_black.png`, `purification.png`, `prevention.png`, `infection_rate.png`, `outbreak.png`, `railroad.png`, `img0.jpeg` = board). Subfolders keep their path, e.g. `assets/pawns/pawn_nurse.png`, `assets/cards/epidemic.png`, `assets/alerts/outbreak.png`, `assets/audio/epidemic.mp3`.
- Local override: Menu > Asset folder. Pick a folder laid out as in `docs/asset-manifest.csv`; matching files replace the built-in graphics for that session. Names are case-insensitive, `_` and `-` are treated alike, any image extension works.
- Save/load: autosaves in the browser; Menu also exports/imports a save file. Saves from v0.8 and earlier are not compatible.

Rebuild: `python3 build.py` (sources in `src/`). Tests: `node tests/engine.test.js` and `python3 tests/browser_test.py` (needs Playwright + Chromium; set CHROMIUM=/path/to/chrome to use a specific browser).

## Reference documents
- `docs/Iberia_rulebook.pdf`: the game manual.
- `docs/Guide.pdf`: the rules summary, including the Events and Roles glossaries.
- `docs/RULINGS.md`: how the prototype interprets unclear rules.
