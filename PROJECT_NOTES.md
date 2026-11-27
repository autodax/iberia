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

## Latest state (Nov 27, 2026)

- Current build: v0.10.9, stamped Nov 27 15:35 UTC. Replaced the expanding pawn rings with a tall double-hop jump animation (start of turn, 5-second idle reminder, Spacebar, and compass rose tap), using explicit SVG translate + subtle ground shadow for Safari.
- Prior recent changes: Removed active-pawn glow, shorter/quieter turn chime, surrounding-map blend under placed railroad tokens, repo cleanup (unused boards and old versions removed), renamed **New** to **Game**, removed "New game" heading, switched to `assets/board_ship.jpeg`. Details are under "Latest" in `CHANGELOG.md`.
- Verified: engine 205/205, net 100/100, challenges 35/35, replaced PASS, plus Playwright verification of Spacebar and active-pawn jump animation with zero errors.
- Open follow-ups: none required. The repo was compacted on Nov 25, 2026 (fresh history, old versions and unused boards removed).
