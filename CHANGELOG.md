## Latest
- Card size slider recalibrated: 100% = size of the cards in the side panel, 200% = twice that; role/Event previews show just the card.
- Moving: bigger click targets around each destination city and on its printed name; the ring now only fades (no size change).
- Reachable cities glow bright yellow and pulse; University Professor card art replaced again (brighter).
- Board cube counters are darker and more muted with a subtle wood grain; remaining blue-green highlights (turn pulse, water-by ring, notice edge) are now gold.
- New role-card art and pawn colours for the five extra characters (Civil Engineer grey, Palliative Care Nurse lilac, Student purple, Time Traveler orange, University Professor gold); base-role pawn colours now match the printed cards.
- Clicking an Event card now enlarges it (with its effect written out and a "Play this Event" button) instead of playing it straight away.
- Two optional challenges from the rulebook, chosen in the New game dialog and in the online lobby: Influx of Patients (hospitals draw patients; overrun hospitals; 6 purification tokens at the start; a new hospital frees its 2 tokens and clears its color from the city) and Historical Diseases (Malaria, Typhus, Cholera, Yellow fever, any combination).
- Researched banner celebrates with the disease name, spinning microscope, golden rays and confetti; new chime.
- Rewind to the start of any turn from the log; online, any player can ask and everyone connected must agree.
- Civil Engineer can treat cubes in either connected city.
- Actions left shown beside the active player's name in the side panel (number on the pawn removed).
- All 48 city cards, 15 events, 7 roles re-made from the new photos with white balance from the paper; three reminder cards added, opened by clicking the ship on the board.

# v0.10.7
- Events now use the map in the new layout: New Rails and Ring Railroads (click railway lines), Hospital Founding, Ships Arrive, Travel Day and Night, Government Mobilization, Overseas Migration and Science Triumph (click cities). The side panel says what to click and how many.
- Red rings flash at a city before an outbreak; the active pawn pings in its colour at the start of a turn.
- Wide windows (Mac): board-first layout. The board fills the window height; the active player's hand is an overlapped column of card thumbnails on the left, the other players' hands are thumbnails on the right (hover shows the full card). Actions appear in a ring around your pawn (click the pawn to show or hide); End actions and Undo are in the ring. Rules/Guide/Log/Online/Menu sit on the board's top edge, cube counts under the infection discard, and rail/water supply show when hovering a token. Cities with three cubes glow (pulsing, blurred) under the cube pile, and the active pawn glows. Narrower windows keep the sidebar layout.

- No phrase starts with a numeral any more: "Actions left: 3", "Cities: 9 · Cubes: 18", "Chain of 3 outbreaks", and so on. The yellow microscope sits 6 px further right.
- The active player's box is outlined in their pawn color, and "actions left" appears only once the new turn has started (after the turn chime).
- The Time Traveller sees the next infection cards as thumbnails of the real cards, side by side across the full width of the panel. The marker alert label fits its text and is centered.
- The board is bigger: the buttons, version number and game info moved into the green strip under the board, and the side panel is a little narrower. Nothing was made smaller.
- The "turn" row is gone: the number of actions left is shown in the active hand's title.
- The sidebar shows the active player first: hand and available actions together in one dark green box, with the other players dimmed below. Cards in the Time Traveller's "Infection cards this turn" row have more room.
- Researching a disease plays a short fanfare and the microscope flies in like a cube. When the infection-rate or outbreak marker moves, rings and a label appear around it with a dramatic hit.
- The Time Traveller's start-of-turn draw now appears after the "Time Traveller's turn" banner, not before it.
- Railroads and the Civil Engineer no longer add their own lines to the map; the printed lines are used.
- A chain reaction of outbreaks shows one popup (with the whole chain) instead of one per city. Pawn and railroad animations, like the cube animations, start only after the popups are gone.
- Railroads and the Civil Engineer now follow the curved printed connections (Barcelona–Girona, Madrid–Ciudad Real, Cartagena–Almería and others), and the railroad token sits in the middle of the line.
- New railroads fly in like cubes and land with a soft steam-engine chuffing sound. A leftover second-track choice no longer draws a stray dashed turquoise line between distant cities.
- "End actions", "Resolve Epidemic" and "Infect next city" wait until the popups on screen have finished, so cards are always drawn before infections are shown.
- A popup tells the player when their hand is over the limit and how many cards to discard.
- The infection-rate and outbreak markers are bigger and cover their symbols.
- The card-draw sound is a short, soft flick instead of a long "shhh".
- Infection popups show "Infect <city>" above the card, in large letters, like the card-draw popup.
- Players pick their own starting city (from their starting hand) during setup. The host only starts the game and has no special authority in play: undo needs no approval, and every action must come from the seat's own player.
- The turn chime plays only for the player whose turn starts. Players are always shown by name and role, never by number.
- Choices such as Overseas Migration show cubes in the right number and color; highlighted cities show their color. Purify Water is chosen on the map. The purification token is centered in its region with a water-drop sound.
- Card draw popup shows who drew, above the cards. The epidemic popup times out like the others. The top discard is dimmed. Sounds are louder and keep working after the browser pauses audio.
- Pawns travel along their ship, carriage or train route. The active player has a dark green border and the others are dimmed. The blue microscope sits 3 px further right. Move markers line up with city circles.
- "End actions and draw two cards" is spelled out and asks for confirmation if actions are left. The Scientist's look at the next three cards can no longer be undone.
- Save buttons are now Save Game, Restore Game and Restore Last Game. The last game is kept in this browser's local storage.
- Cloudflare relay: a returning host now replaces its own stale connection instead of being refused (redeploy the worker to get this).

# v0.10.6

- Five expansion roles added (12 roles in total; the random role choice now draws from all of them):
  - Civil Engineer: the pawn stands on a connection between two cities and counts as being in both (you choose the city for each action). Carriage/Boat moves to a neighbouring connection, and railroads can only be built on the connection you stand on.
  - Palliative Care Nurse: carries 1 disease cube along whenever she moves (asked each time); "Attract cubes" pulls 1 cube from each connected city (extras beyond 3 are treated); "Treat all at hospital" removes every cube of the hospital's color.
  - Student: when another player builds a railroad, places a purification token or treats a cube near her, a matching token/cube lands on her card and she may take 1 free move. On her turn she places those tokens (or returns a cube to treat that color) for free.
  - Time Traveller: draws his 2 Player cards at the start of his turn and the Infection cards for the end of the turn are laid out face up; "Look & swap" lets him swap one of the next 2 deck cards with a visible one; hand limit 9.
  - University Professor: once per turn draws a random unused Event onto his role card; he needs a matching-color City card near him to play any Event; Events he plays leave the game.
- New pawn pictures for the five roles, and the role card pictures were renamed to match the usual pattern (role_civil_engineer, role_palliative_nurse, role_student, role_time_traveler, role_professor).

# v0.10.5

- The numbers on the pawns are gone.
- Science Triumph: you now click the region on the map instead of picking from a long list of buttons.
- New wooden-house hospital tokens (larger on the board), and the microscopes were recolored with a darker border. Cubes, hospitals, microscopes and the colored card stripes now all use the same four colors.
- Calmer side panel: darker beige panel, mid-beige player boxes, lighter soft-edged buttons and cards, and far fewer lines. The active player keeps a thick red outline.
- Card picture files were renamed to match the game's own names (for example city_ciudad-real, infection_bilbao-bilbo, event_government_mobilization, role_rural_doctor), and the special-case spellings were removed from the code. If you add new card art, name it the same way.
- Cards in each hand are sorted by color, the color you hold most of first (Events last, oldest city first within a color).
- The turn change now waits a little longer, then shows a short "<role>'s turn" popup with the bell.
- Softer, less hissy card-draw sound.
- A soft bell plays when a new turn begins (after the infection animation and pause).
- Sound files are now fetched with a version tag so a changed sound is not hidden by the browser's old copy.
- The next player's turn now waits until the last infection animation (cubes landing) has finished, then a short pause. Until then the previous player stays highlighted and actions are locked.
- Quieter, papery card-draw sound and a duller cube-drop sound.
- Menu has a Card size slider for hover and drawn-card popups.
- Fixed: after a connection drop, a guest could come back as a second, new player while the old entry kept their seat. The host then controlled both players and the guest controlled nothing. Some browsers (private windows, some phones) cannot remember the guest's ID. The ID is now also kept in memory for the whole visit, and if it is lost anyway, a guest who rejoins with the same name as one player who is away is treated as that player.
- A guest can now click "Take over" in the Online dialog on a seat whose player is away. A seat held by a connected player still cannot be taken.
- A guest who controls no seat sees a message telling them to open Online and take one.
- Roles are now random in every new game, in the offline menu and in a new online room (you can still pick roles by hand).
- Players are named by their role, plus the name typed in the Online window when playing online (for example "Sam · Sailor"). "Player 1" and "Player 2" are gone, since the first player is not always player 1.
- The active player now has a red outline, and the turn pulse is gone.
- Hover over a card in a hand to see the full card. Click a player's name to see their role card (click anywhere to close it).
- The Infection and Player decks on the board now show your card backs with the number of cards left, and the discard piles show the top card.
- Cubes now show as pictures on the action buttons (Treat disease, destination cities, Rural Doctor's extra cube) instead of color names and counts.
- Click a cube on the map in your own city to treat it (the Rural Doctor then picks the extra cube as before).
- The cube and research rows in the summary are lined up on the right, and the prevention token sits in the middle of its region and is a little larger.
- Undo now works online: the player whose turn it is asks, and the host agrees. The host can undo without asking.
- Your card artwork is now used in the popups: city cards when a player draws, infection cards when cities are infected, and event cards. Pictures load only when shown, so the page still opens quickly. File names with typos (cuidad-real, bibao-bilbo, santiage-de-compostela) are handled, no renaming needed. The new Epidemic card is shown alongside the city's infection card when an epidemic happens.

# v0.10.4

- The game now uses the deployed Cloudflare relay (https://iberia-relayer.sdeban.workers.dev) by default, so online play works on phone data and strict networks without any setup. The backup relay for your own computer still works: paste its address under Online > Relay server, and the invite link carries it to friends.

# v0.10.3

- Online play can now go through a relay server instead of direct browser-to-browser links, so it works on phone data, school and work networks. Two interchangeable relays are included: a Cloudflare Worker in `relay/` (free, always on) and a backup for your own computer in `tools/home-relay/` (Node.js only, with a double-click launcher). Setup steps are in the README. The relay never reads game messages and stores nothing.
- New "Relay server (advanced)" box in the Online dialog (replaces the Metered settings), and "Test my connection" now checks that the relay can be reached.
- Invite links carry a non-default relay address, so friends can join through your home relay by just clicking the link.
- If the host's connection to the relay drops, it reconnects by itself and the guests rejoin with their seats.
- Direct browser-to-browser links remain as a fallback when no relay address is set.
- New: tests/relay.test.js plays full games through a real relay, and tests/browser_online_test.py can run through one (set RELAY_URL).

# v0.10.2

- Online play over the internet: added relay (TURN) support. Phone data and many home, work and school networks block direct connections between browsers, which showed up as "Connecting…" followed by "No room found". The page now also tries a free shared relay, and uses your own free Metered relay if configured.
- New "Test my connection" button in the Online dialog reports what the current network can do, and a "Relay settings" box for entering a Metered app name and API key (kept only in that browser).
- The error for a room that exists but cannot be reached is now distinct from "No room found".
- To build the relay settings into the page for everyone, fill in src/ice.json (see README).

# v0.10.1

- Removed the "Player's turn" banner. It could appear on top of the infection card popups. Card popups now always run their full course on their own. When they finish, the new active player's hand is highlighted instead.

# v0.10.0

- Online play. Menu bar → Online: one player hosts and shares a five-character room code (or an invite link); everyone else joins from their own browser. The game runs directly between browsers, with no game server and no account.
- Lobby: the host picks players, epidemics and roles, and seats are claimed by guests or assigned by the host. Seats nobody takes are played by the host.
- Only the player who controls a seat can act for it: the active player's actions, that seat's discards, and that seat's Events. Everyone sees the whole board and every card reveal. Card transfers and passenger rides ask the other seat's player to agree.
- Host-authoritative and in sync: the host checks and orders every move. Because the engine is deterministic, only moves are sent. A checksum after each move catches any difference, and a player who falls out of step gets a fresh copy of the game automatically.
- Reconnecting: a player who refreshes or loses connection keeps their seat. If the host refreshes, "Resume hosting" in the Online dialog reopens the same room and game with the same code. If a player drops out, the host can act for their seat.
- Online games do not touch your local autosave. Leaving a room keeps the board as a local game. Undo and loading saves are off while in a room.
- The PeerJS connection library is built into the page (src/vendor/peerjs.min.js, MIT licence), so nothing is downloaded when you open Online.
- New: src/net.js, tests/net.test.js (host and guests over a fake network), tests/browser_online_test.py (two browser tabs).

# v0.9.21

- Black cubes: removed the white outline; the soft highlight stays.
- Research markers now sit on the microscope silhouettes below the disease circles, sized to fit, with no background circle.
- Infected cities list: wider color edge on each city, matching the cards in hand.
- Buttons instead of dropdown menus everywhere (actions, starting cities, first player, event cards, roles, players, epidemics, reveal speed). City buttons carry their color edge; long lists scroll inside the panel so the page still fits.
- Fewer clicks: once nothing is left to choose, the action happens straight away. For example, one click on a destination moves the pawn, one click on a card discards it for Ship or Purify water, and actions with only one possible outcome (such as Build hospital) happen when chosen. Undo is available. Clicking a ringed city on the map for a train trip also moves at once.

# v0.9.20

- Outbreak fix: during a chain reaction the outbreak counter and track marker now advance one outbreak at a time instead of jumping to the final total, cubes fly from the city that is spreading them, and chained outbreaks resolve in rulebook order (each outbreak places all its cubes before the next one starts).
- Card selection before an action (Ship, Purify water, Research) is less crowded: larger cards with more spacing, and selected cards are outlined and checked.
- Black cubes have highlights and edges so they stand out on the board; red cubes are less bright.
- The log is indented: turn headers, then the events in each turn, with outbreaks and prevented infections indented under the infection that caused them.
- Move by clicking the map: with no action chosen, cities the active pawn can reach are ringed; clicking one moves by carriage or boat at once (Undo is available), or opens Train or Ship with that city selected.
- Nurse prevention token (and other region or city choices) can be chosen by clicking a highlighted region on the map; the choice panel moves to the side so the board stays visible.

# v0.9.19

- Chain reaction alert: when one outbreak sets off others, each one is shown with a red Chain reaction banner, which city spread it, and the full chain with the current outbreak highlighted.
- Turn change: a "Player N's turn" alert with the pawn appears when the active player changes, the active hand glows, and the action panel heading shows whose turn it is and how many actions are left.
- Travel destination dropdowns list cities from most to fewest cubes (ties keep the usual order) and show each city's cube count.
- The infected cities list is grouped by color, most cubes first within each color.
- Wider color edge on cards in each hand.
- Slower cube drop animation.

# v0.9.18

- Founding dates updated to the values confirmed from the physical City cards; the date list is now in date order with the research notes removed.

# v0.9.17

- Founding dates for all 48 cities. 13 are read from cards pictured in the rulebook and 35 were researched, mostly from Wikipedia (see docs/FOUNDING_DATES.md).
- The first player is now preselected: whoever holds the oldest city goes first, as the rulebook says. Each option shows that player's oldest city and date; ties and overrides stay a manual choice.
- City card tooltips show the founding date.
- The city dropdown in the action panel is larger, with more space before the button below it.

# v0.9.16

- New Infected cities list in the right panel, between the actions and the supply. It shows every city with cubes, most cubes first, with a cube icon for each cube and a pawn icon for each player holding that city's card.
- The list fills the open space and scrolls inside itself on small screens, so the page still fits without scrolling. Cubes appear in the list as they land on the board.

# v0.9.15

- Pieces no longer cover printed city names. Each city's name area was measured, and cubes, hospitals, water and prevention tokens, and railroads are placed in the nearest clear spot.
- Pawns stay on their city but stand slightly lower when the name is printed directly above it.
- Cubes also avoid pawns and neighbouring city circles.

# v0.9.14
- New high-resolution board photo: assets/board.jpeg (3910 x 2760) replaces img0.jpeg, which is no longer used. It is built into index.html at full size, and loaded from the repo by default.
- The photo was placed by matching it to the previous board (median error under 1 px, including a 0.06 degree rotation). Cities, routes, regions, rate track and research circles line up; the outbreak track positions were re-measured on the new photo (3-6 px further right).

# v0.9.13
- Infection-rate marker, research markers and outbreak marker re-measured on the current board, so each sits centered on its printed symbol. The rate spaces were about 4 px low; the red and blue research circles were 8-13 px off; the lower outbreak spaces about 2 px.

# v0.9.12
- Card reveals default to Fast.
- Menu settings (reveal speed, show regions, show city names, sound on/off and volume) are saved with the game: in Export save files and in the autosave, and loading or resuming a game brings them back. They are also remembered between visits.

# v0.9.11
- Every game is now shuffled differently. The page and Menu → New game used a fixed shuffle seed ("iberia-test-1"), so the same hands, starting cities and Events came up each time. A random seed is now chosen for each game.
- The seed box in Menu → New game is optional: leave it blank for a random game, or type a seed to replay a deal. The current seed is shown in the footer.

# v0.9.10
- Prevented infections are now announced. When a purification token or the Nurse's prevention token stops a cube, the popup for that infection, epidemic or outbreak lists each protected city and what protected it (with how many purification tokens were used and how many are left in that region).
- After the popup closes, each protected city flashes on the board with the token that saved it, with a soft chime.
- These notices appear even when Card reveals is set to Off, so a save is never missed. Log entries now name the region's cities instead of its code.

# v0.9.9
- Removed the click sound on buttons so it no longer overlaps the other sounds. Moves, card draws, cube landings, outbreaks, epidemics and win/lose keep their sounds.

# v0.9.8
- Realigned the board picture with the updated assets/img0.jpeg (the new picture is about 1.4% smaller in frame and shifted right and down). Cities, routes, regions, tracks and pieces now sit on the printed board again; city markers are centered within about 1-2 pixels.
- The board frame is cropped to the picture so there is no empty margin. The placement is BOARD_FIT in src/ui.js.

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
