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

## Latest state (Nov 28, 2026)

- Current build: v0.10.9, stamped Nov 28 14:04 UTC. Nudged `regionSpots` for the Burgos region (`r03`) straight up 8 px so tokens clear the **BURGOS** label without drifting left or crowding **BILBAO–BILBO**.
- Prior recent changes: Map-textured shield purification token (`assets/purification.png`), deck alignment nudges (`infDeck` +3 px, `plDeck` −7 px), 35% bright yellow region hover highlight (no border), remote cube-treatment chirp, purification and railroad supply piles smoothly gliding apart vertically, Science Triumph auto-selecting all infected cities in the chosen region, Railwayman/Sailor passenger flow fix, migrating patients following multi-stop railroad paths. Details are under "Latest" in `CHANGELOG.md`.
- Verified: Built `index.html` cleanly and verified `regionSpots(R['r03'], 2)` in Playwright.
- Open follow-ups: none required. The repo was compacted on Nov 25, 2026 (fresh history, old versions and unused boards removed).
