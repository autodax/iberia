# Iberia project notes

Start with `AGENTS.md` (full handoff guide). This file is the decision and verification log.

## Repository

- GitHub repository: `autodax/iberia`. Playable game: <https://autodax.github.io/iberia/>.
- This local project folder contains working files and previews. Verify the current GitHub branch before preparing a release from those files.
- The repository's `python3 build.py` generates the standalone `index.html`, a versioned HTML copy, and the version index.

## Shipped decisions

- v0.10.8 introduced the toasted ochre yellow cube glow, the cube fly-in landing fix, and denser flecks in the beige railroad token fill.
- v0.10.9, commit `0c5438d70f83a66e7aaca8e6edb694bdef12a2ba`, made the on-board railroad supply and airborne tokens transparent between the timbers and rails. Placed map tokens use the denser-fleck artwork. Keep these two assets distinct.
- The transparent source PNG is `assets/railroad-transparent.png`. The placed token is `assets/railroad.png` in the GitHub repository.

## Last verification

- The v0.10.9 build and JavaScript challenge, engine, network, and replacement tests passed. Focused checks on the preview covered flight from the supply, fallback flight, and reduced motion.
- The release commit was verified on GitHub main after pushing.

## Latest state (Nov 25, 2026)

- Current build: v0.10.9, stamped Nov 25 22:12 UTC. Renamed the top-left board button from **New** to **Game** (and updated matching help/notice text; it still shows `Room <code>` during an online game) and removed the "New game" heading from the Game pop-up. The board is `assets/board_ship.jpeg` (ship drawings); the previous board is `assets/board_no_ship.jpeg`.
- Shipped since v0.10.9 was first released: Event-window warnings, stable per-colour cube groups with hover grow, purification-token flights with an aqua region flash, best-token choice by simulation, round U-turn Undo buttons, draw chime and pawn-ring cues, and compressed pile-style purification and railroad token columns. Details are under "Latest" in `CHANGELOG.md`.
- Verified: engine 205/205, net 100/100, browser 185/185 on the final run (a few browser checks are timing sensitive and can fail once on a busy machine).
- Open follow-ups: none required. The repo was compacted on Nov 25, 2026 (fresh history, old versions and unused boards removed).
