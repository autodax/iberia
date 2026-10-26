# v0.9.3
- Layout: the board fills the full height on the left; hands, actions and supplies are all in the right-hand column. The board is about 40% larger at 1366x768.
- Larger hand text (card names and player titles), with more room for full city names. Text scales up again on large screens.
- Outbreak, Epidemic and game-end alerts stay until you click Continue (or press Enter, Space or Escape).
- Card reveals last about twice as long, show a countdown bar, and can be clicked away at any time. Menu > Card reveals adds Slow (default) and Until clicked.
- In 4-5 player games on smaller screens, the hands list scrolls and keeps the active player in view.

# v0.9.2
- 3D pawns for all 7 roles (assets/pawns/), lit and angled to match the cube and hospital art; used on the board and in the hand panels.
- Pawns drawn slightly larger, with more space between pawns sharing a city.
- tools/render_pawns.py regenerates the pawn images (numpy + Pillow).
- Built-in fallback graphics now include subfolders of assets/.

# v0.9.1
- Graphics now load from the `assets/` folder of the GitHub repo by default. Add or replace a file there and the game uses it on next load, no rebuild needed. A local folder (Menu) still overrides; copies built into the HTML are the offline fallback.
- New built-in artwork: disease cubes, hospitals, research markers (microscopes), infection-rate, outbreak, prevention, purification and railroad tokens.
- Cubes are drawn one per cube; research markers sit on a parchment disc so they stand out on the vials.
- v0.9.0 saves still load.
- Every version is kept playable under versions/ (see versions/index.html).
- Added the game manual and guide to docs/ and checked the rules against the guide.

# v0.9.0
- Added Railwayman, Politician, Rural Doctor, Royal Academy Scientist and Nurse roles (all 7 standard roles).
- Added the remaining 11 Events; Events are drawn at random per player count (2p 4, 3p 5, 4p 6, 5p 8). Unused Events are kept aside for the future Professor role.
- 2-5 players with correct starting hand sizes.
- Epidemic and outbreak alerts, card-draw reveals, optional sounds.
- Local asset folder loader.
- Hands-above-board layout re-fits for 2-5 players with no page scrolling (tested at 1024x768 through 1920x1080).
- Tests: 98 engine assertions plus 300 simulated games; 54 browser checks.
