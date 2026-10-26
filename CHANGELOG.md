# v0.9.7
- Sounds: wooden click for buttons, a heavier wooden tap for pawn moves, card slide for draws, a light tap as each cube lands, a deep thud for outbreaks, an alarm jingle for epidemics, and win/lose jingles.
- Speaker button in the header mutes or unmutes; Menu has a volume slider. Sound starts muted and the setting is remembered.
- Sounds are CC0 from Kenney (see docs/SOUNDS.md), stored in assets/sounds/ and built into index.html for offline play. Uploading a file with the same name to the repo replaces it.

# v0.9.6
- New disease cubes stay off the board until their alert is dismissed, then fly in. Infection and Epidemic cubes drop from the popup onto the city; Outbreak cubes spread out from the outbreaking city to its neighbors, one after another.
- With Card reveals set to Off, cubes appear at once with no animation (also when the system's reduce-motion setting is on).
- Built-in offline board image updated to the current repo board.

# v0.9.5
- Supply panel icons: outbreak marker, infection-rate marker, railroad and purification tokens next to their counts; cube icons with the number left of each color; research markers show which diseases are researched (greyed out until then). Hover any of them for a description.
- Rules and Guide buttons in the header open the rulebook and the rules summary PDFs in a new window.

# v0.9.4
- Undo: an Undo button appears next to Available actions whenever something can be taken back (or press Ctrl+Z / Cmd+Z). Hover over it to see what it will undo.
- Undo steps back one action at a time, and Event plays and hand-limit discards can be undone as well. It stops at the last point where hidden cards were revealed: Begin game, drawing Player cards, Epidemics, infections and the Scientist's peek.
- Removed the old Debug undo from the menu.

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
