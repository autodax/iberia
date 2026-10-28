# Pandemic Iberia browser prototype v0.10.3
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


## Making online play work on any network (relay setup)

Online play sends messages through a tiny free relay server on Cloudflare (the code is in `relay/`). It works on any network, including phone data, school and work networks, which often block direct browser-to-browser links.

One-time setup (about 10 minutes, no tools to install):

1. Make sure this repository is public and contains the `relay` folder.
2. Open this link: https://deploy.workers.cloudflare.com/?url=https://github.com/autodax/iberia/tree/main/relay
3. Sign in to (or create) a free Cloudflare account and follow the prompts. It asks to connect your GitHub account, makes a copy of the `relay` folder as a new repository on your account, and deploys it. Keep the suggested names.
4. When it finishes, Cloudflare shows the relay's address, like `https://iberia-relay.yourname.workers.dev`. Copy it.
5. Put it in `src/ice.json` as `"relay_url"`, run `python3 build.py`, and commit. Everyone then uses the relay automatically.
   (For a quick test without rebuilding, open Online > Relay server on every device and paste the address. Everyone in a game must use the same relay.)

If you host the game somewhere other than `autodax.github.io`, add that address to `ALLOWED_ORIGINS` at the top of `relay/src/index.js` and deploy again, otherwise the relay refuses the connection.

Cost: the free Cloudflare plan allows 100,000 requests a day, and each game move is a small fraction of one, so a game among friends uses almost none of it.

Checks: `node tests/relay.test.js` plays full games through the real relay, started locally with `cd relay && npx wrangler dev --port 8787`.
