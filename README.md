# Pandemic Iberia browser prototype v0.9.0
Open `index.html` (same as `iberia-browser-prototype-v09.html`) in any modern browser. Everything is inside that one file.

- 2-5 players, all 7 standard roles, all 15 Events (random selection per the setup table).
- Outbreak and epidemic alerts; drawn player and infection cards are shown briefly (Menu > Card reveals: Normal / Fast / Off). Click a reveal to skip it.
- Local assets: Menu > Asset folder. Pick a folder laid out as in `docs/asset-manifest.csv`; matching files replace the built-in graphics for that session. Names are case-insensitive, `_` and `-` are treated alike, any image extension works.
- Save/load: autosaves in the browser; Menu also exports/imports a save file. Saves from v0.8 and earlier are not compatible.

Rebuild: `python3 build.py` (sources in `src/`). Tests: `node tests/engine.test.js` and `python3 tests/browser_test.py` (needs Playwright + Chromium; set CHROMIUM=/path/to/chrome to use a specific browser).
