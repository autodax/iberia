# Iberia browser prototype
Play the current version at https://autodax.github.io/iberia/. It runs in any modern browser. Everything is inside that one file.

- 2-5 players, 12 roles (7 standard plus 5 expansion roles), all 15 Events (random selection per the setup table).
- Outbreak and epidemic alerts; drawn player and infection cards are shown briefly (`Menu > Alerts and card reveals > Reveal speed`: Until clicked / Slow / Normal / Fast / Off), alongside sound, volume, and card size controls. Click a reveal to skip it.
- Graphics and audio: loaded from this repo's `assets/` folder and inlined by `build.py`. Top-level files are matched by name (`cube_red.png`, `hospital_blue.png`, `research_black.png`, `purification.png`, `prevention.png`, `infection_rate.png`, `outbreak.png`, `railroad.png` for placed map tokens, `railroad-transparent.png` for supply and airborne tokens, `board.jpeg` = board). Subfolders keep their path, e.g. `assets/pawns/pawn_nurse.png`, `assets/sounds/epidemic.mp3`, `assets/icons/`, `assets/city_cards/`, `assets/infection_cards/`, `assets/event_cards/`, `assets/role_cards/`, and `assets/instruction_cards/`.
- Online play: `New > Host an online game > Create the room`, then send the room code or invite link. Guests join from their own browsers; one browser (the host) checks and orders every move, so keep the host's page open. Moves go through the configured relay server (`src/ice.json`) with PeerJS (`src/vendor/`, MIT licence) support so play works even on strict networks.
- Save/load: autosaves in the browser; Menu also exports/imports a save file. Saves from v0.8 and earlier are not compatible.

Rebuild: `python3 build.py` (sources in `src/`).
Tests:
- Unit & simulation: `node tests/engine.test.js`, `node tests/net.test.js`, `node tests/challenges.test.js`, `node tests/replaced.test.js`
- Relay: `node tests/relay.test.js`
- Browser & fuzz: `python3 tests/browser_test.py`, `python3 tests/browser_online_test.py`, `python3 tests/ui_fuzz.py` (needs Playwright + Chromium; set `CHROMIUM=/path/to/chrome` to use a specific browser)

## Reference documents
- `CHANGELOG.md`: version-by-version history of changes.
- `docs/Iberia_rulebook.pdf`: the game manual.
- `docs/Guide.pdf`: the rules summary, including the Events and Roles glossaries.
- `docs/RULINGS.md`: how the prototype interprets unclear rules.
- `docs/FOUNDING_DATES.md`: confirmed city founding dates for starting-player selection.
- `docs/SOUNDS.md`: sound cue reference.

## Making online play work on any network (relay setup)

Online play sends moves through a small relay server, so it works on phone data, school, and work networks that often block direct browser-to-browser links. The relay never reads game messages and stores nothing. A Cloudflare relay is already configured in `src/ice.json`; use the instructions below if you want to deploy your own.

### Main relay: Cloudflare (free, always on)

The code is in `relay/`. One-time setup, no tools to install (screens may look slightly different from this description):

1. Make sure this repository is public and contains the `relay` folder.
2. Open https://deploy.workers.cloudflare.com/?url=https://github.com/autodax/iberia/tree/main/relay
3. Sign in to (or create) a free Cloudflare account and follow the prompts. It asks to connect GitHub, copies the `relay` folder into a new repository on your account, and deploys it. Keep the suggested names.
4. Cloudflare shows the relay's address when it finishes, like `https://iberia-relay.yourname.workers.dev`. Copy it.
5. Put it in `src/ice.json` as `"relay_url"`, run `python3 build.py`, and commit. Everyone then uses it automatically.

The free Cloudflare plan allows 100,000 requests a day. A game move is a small fraction of one request, so a game among friends uses almost none of it.
If you host the game somewhere other than `autodax.github.io`, add that address to `ALLOWED_ORIGINS` at the top of `relay/src/index.js` and deploy again.

### Backup relay: your own computer (free, no limits)

The code is in `tools/home-relay/`. It needs only Node.js (https://nodejs.org, LTS version) and the free tunnel tool `cloudflared` (Mac: `brew install cloudflared`), which gives your computer a temporary public web address.

1. Double-click `tools/home-relay/start-home-relay.command` (Mac). On other systems run `node relay.js` and `cloudflared tunnel --url http://localhost:8787` in two windows.
2. Copy the address ending in `.trycloudflare.com` that appears in the window.
3. In the game: `Online > Relay server (advanced)`, paste it, Save.
4. Host a game and use **Copy invite link**. The link carries the address, so friends only click it.
5. Keep the window open and the computer awake while you play. The address is new every time you start it.

### Checks

`node tests/relay.test.js` plays full games through a relay. Start one first: Cloudflare version locally with `cd relay && npx wrangler dev --port 8787`, home version with `node tools/home-relay/relay.js` (set `PORT`, and `RELAY_URL=http://127.0.0.1:<port>` for the test). `RELAY_URL=... python3 tests/browser_online_test.py` runs the same through two real browser tabs.

## Card picture names

Card art lives in `assets/` and is found by name, with no lookup table:

- `city_cards/city_<city>.jpeg` and `infection_cards/infection_<city>.jpeg`, where `<city>` is the city name in lower case with accents removed and dashes for spaces (`city_a-coruna`, `infection_san-sebastian-donostia`).
- `event_cards/event_<event>.jpeg`, using the event's code name (`event_new_rails`, `event_when_plans_were_good`).
- `role_cards/role_<role>.jpeg` (`role_rural_doctor`, `role_scientist`, `role_civil_engineer`, `role_palliative_nurse`, `role_student`, `role_time_traveler`, `role_professor`).
- `city_back.png`, `infection_back.jpg`, `role_back.jpg` and `epidemia_card.jpeg` in the main `assets` folder.
