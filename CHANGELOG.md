## Latest
- Nudged tokens in the Burgos region straight up slightly so they clear the **BURGOS** label without crowding **BILBAO–BILBO**.
- Replaced the purification token with a parchment shield (with subtle map-line texture) framing the stippled cyan droplet.
- Nudged the Infection deck slightly right and the Player deck left so both line up cleanly with their placeholders on the board.
- Hovering over a region you can place a purification token in now highlights it in a clearer 35% bright yellow (no border).
- The cube-treatment chirp now plays for remote players too (as well as when treating via role actions like Treat all at hospital or the Student's held cube).
- The purification-token and railroad-token piles now smoothly glide apart vertically as tokens are taken (keeping their horizontal placement unchanged), making the remaining count easier to see at a glance, and gently compress back when a purification token returns.
- Fixed taking a passenger by train (or by ship as the Sailor): clicking a destination city now only asks once whether to bring a passenger, without popping up a stray action box or asking for the destination again; the Railwayman can also bring a passenger on a 1-stop railroad move.
- Migrating patients (Influx of Patients) that travel by train now follow the railroad route through intermediate cities instead of moving in a straight line.
- Science Triumph now automatically selects one cube from every infected city in the chosen region (without asking you to click each city); if a city has more than one disease color, you can switch which color to remove right in the Event window.
- Changed the version and build stamp on the map to a darker antique olive green matching the surrounding sea palette, with a softer halo.
- Hovering over a player's role name now previews their role card in the centre of the board (just like hovering over cards in hand); clicking still pins it open.
- Replaced the expanding rings around pawns with a tall double-hop jump animation (at the start of a turn, as the idle turn reminder, and for all pawns when pressing Spacebar or tapping the compass rose).
- Removed the pulsing colored glow under the active pawn (the ring animation and the small yellow base ring now show whose turn it is).
- The turn-change chime is shorter (about 2.8 seconds instead of 3.6) and a little quieter.
- Placed railroad tokens now show a soft blend of the surrounding map between the rails and timbers (with the dark road line underneath removed), instead of a fixed beige paper fill.
- Repo cleanup: removed unused older board pictures and the old-versions page (versions/) from the repo; docs updated.
- Removed the "New game" heading at the top of the Game pop-up window.
- Renamed the **New** button on the board bar to **Game** (along with the in-game instructions that refer to it); during an online game it still shows the room code.
- The map is now the board with the ship drawings (board_ship.jpeg); the previous board is kept as assets/board_no_ship.jpeg.
- The purification-token and railroad-token columns are now loose, overlapping piles (more tilt and scatter, packed close together) instead of tidy rows; the purification pile sits slightly further left. Used-up slots stay in place (hidden) so tokens fly back to the right spot.
- The aqua flash when a purification token is used is now a flat, lighter tint with no blur or border, drawn just above the map so tokens, cities and cubes sit on top of it.
- Fixed the Undo button in the Infection phase showing garbled "Undo discard" text; it is now the same round arrow button.
- When a purification token can protect a city from more than one region, the game plays every option through (so chains of outbreaks are weighed) and keeps the one with the fewest outbreaks and cubes; when the outcomes are equal it takes the token from the region with the most tokens.
- Undo buttons (on the pawn ring and in the side panel) are now a small round button with a curly back arrow instead of the word; hovering still names the action.
- The draw chime now plays a fixed 0.9 seconds after the deck starts to sway (instead of waiting on other animations, which kept it from playing), and plays again each time the deck starts waiting again, for example after undoing actions.
- The draw chime now also waits for tokens that are still flying in (purification tokens, rails) to land and for their landing sounds to finish; before, it only waited for the flights to start.
- The "<player>'s turn" popup is gone (the ring animation on the active pawn shows whose turn it is). The turn gong is one third quieter and fades about 20% faster.
- The draw-a-card chime (and the Infection heartbeat) now waits until other sounds and animations, such as purification tokens flying back, have finished.
- Fixed the cube hover grow: in Safari the group drifted away and snapped back; each cube now grows around its own centre.
- Cubes no longer jump from one side of a city to the other as you treat them. Each disease colour at a city is its own group with its own fixed spot (groups can sit on different sides of the city), and it moves only when a pawn arrives or leaves or more cubes are added. Clicking anywhere in an invisible area around a group treats a cube of that colour, and the group's cubes grow slightly when you hover it.
- A purification token that protects a city now stays on the map while the "Infection prevented" popup is showing. When the popup is gone its region flashes a soft, blurred aqua and the token flies back to the Water column (skipped with animations off or reduced motion).
- The Nurse's prevention token and a region's purification tokens now sit close together side by side, centred on the region, instead of the prevention token pushing the water far to one side.
- Purification tokens now sit nearer the middle of their region (they were pushed to the edge by city names); only city dots and the prevention token strongly move them, and name labels only slightly.
- The deck sway no longer jumps when the board redraws (its timing was still based on the old 2-second sway). While it is a player's turn and they have not taken an action yet, the pawn rings repeat every 5 seconds, silently.
- Drawing cue: the chime or heartbeat now plays once when the deck starts waiting (no repeat every 15 seconds), and the deck sways less (about 8 px instead of 20) and more slowly (3 s per sway).
- Every Event window now checks the Event as you fill it in and shows, in red, why it is not ready or would be refused, with a reminder to check role abilities.
- The University Professor's Event window now warns up front when no City card matches the color of a city in an adjacent region (the card's own rule), instead of failing after you press Play.
- Errors were invisible in the board view (the side message line is hidden there), so a refused action or Event looked like it did nothing. Errors now also show as a pop-up near the bottom of the screen, and a failed Play Event shows the reason inside the Event window.
- The deck to draw from now slides gently back and forth (about 20 px, smooth, 2-second cycle, no pause) instead of rocking.
- Playing an Event while another step or question is still in progress now says so instead of doing nothing.
- "Start a new game?" is no longer asked when no game has been started yet (for example right after loading). When it is asked, the "export a save first" sentence is now smaller text below the buttons.
- Undo is back directly below the active pawn (above End). Click the pawn to hide the Undo/End buttons if they ever cover something, and click it again to bring them back.
- Test fixes: the "overrun from an infection card", "ship move" and "several matching cards" browser checks now wait for what they test instead of fixed delays.
- The Victory and Defeat banners no longer repeat the word in the line under the title ("All four diseases researched").
- Fix: an Epidemic drawn from the Player deck no longer asks which purification token to spend; the best token is chosen automatically, as for infections.
- Fix: the victory banner no longer pops, pulses or shimmers when reduced motion is on.
- Role pickers: roles added to the original game are a lighter beige so the 7 rule-book roles stand out. The online seat picker now shows every role at once (no Change button), like the local one.
- Decks that should be drawn from now rock non-stop until drawn from (the sound still repeats only every 15 seconds).
- The glow under the active pawn now waits for the pawn to arrive instead of appearing at the destination first.
- On-board Undo / Undo discard now sits beside the End button instead of above it, so it no longer covers cubes.
- The deck that should be drawn from keeps its jiggle rhythm even when the board repaints (it used to restart and could seem to stop).
- Victory: new angelic sound (harp run, choir-like chord, celesta sparkles), gold shining banner, fireworks and confetti.
- In v0.10.9, the on-board railroad supply and flying tokens show just the timbers and rails. The denser-fleck paper fill appears at landing.
- When a draw puts a player over the hand limit, only one sound plays (the warning sound, when the cards arrive) instead of two card sounds plus the warning.
- Flying cubes now ease to a stop over the last stretch of their flight, so the last frame shown is right at the landing spot (before, the last frame could stop a few pixels short and the cube then appeared to jump into place).
- Cube fly-in smoothness: a flying cube is now moved frame by frame by its own position (no CSS transform), so its last frame is exactly where the landed cube is drawn and it lands with no pause or sideways nudge. Groups of cubes that have to move (a neighbouring city gained cubes, a pawn came or went) now slide to their new place instead of jumping a few pixels.
- v0.10.8 warms the yellow cube glow to toasted ochre and adds denser flecks to the railroad token's beige paper fill.
- Flying cubes now arrive at their final board positions. Each cube becomes visible on the board when its flight ends.
- Replaced the parchment-backed railroad token with Sepia timber artwork at the same in-game size. Beige fills the gaps between the outermost wooden ties. The gaps at both rail ends and around the protruding ties are transparent. The original is backed up at `backup/railroad-original.png`.
- The waiting deck's rocking is half as wide (about 4° instead of 7.5°) and repeats, with its sound, every 17 seconds instead of every 10 (15 seconds of rest instead of 8). Speed of the rock is unchanged.
- Cubes now land exactly where they stay. While cubes are flying in, a city's group is laid out as it will finally be, so landing no longer makes the cubes shift or jump.
- Cubes sit closer to their city when there are only one or two of a colour. The closest cube is about the same distance whether there is one, two or three, and the group shifts away from the city as more are added (or when a pawn comes or goes).
- Purification token choices during infections and outbreaks are now made automatically: the game tries every option and uses the token that leads to the fewest outbreaks, then the fewest cubes on the board. No more question.
- When a purification question comes up in the middle of an outbreak chain, the whole infection (card, cubes, outbreak) now plays first if every token choice would lead to the same board, and then you are asked which token to use up. If the choice would change the outcome, the card and its cubes play first and the question follows.
- Fixed the real cause of the dead Infection deck click: when the next card needed a purification-token choice, the same click that drew the card also hit the map and cancelled the question instantly ("Cancelled — nothing changed"). Clicks in the first moment after a region question opens are now ignored.
- Fixed: clicking the Infection deck (or Player deck) could do nothing when the hidden turn button had been left switched off by an earlier repaint. The deck click now re-enables it.

- Fixed the cards sliding into the hand: a pale vertical strip appeared where the sliding card tucks under the cards below it (the cut-out was 12 px wider than the cards). The 'unusable card' fold-away sizes were also updated for the new, shorter cards.

- Replaced the purification token with an upright cyan droplet on a transparent background, keeping the same display size and the slight rotation in the supply column. The original round token is backed up at `assets/purification-original.png`.

- Moved the railroad token column 6 px to the right, away from the purification token column.

- Purify Water: when both tokens go to the same region, each one now flies in separately, one after the other (before, only the second flew).

- The slight jitter of the cubes and tokens on the board is now different in every game (it follows the game's seed, so it stays the same for the whole game).

- Moved the yellow rings on Gijón and San Sebastián-Donostia down and to the right so they sit on the printed city circles.

- Outbreaks: the cube that overflows a full city now flies out of the end of its colour row (it was starting from behind the cards). (The cubes that spread to neighbouring cities still erupt from the outbreak city.)

- Removed the slow rotation of three-cube groups. Purification tokens in a region now show as a small stack of tokens, offset so each is visible, instead of a number. Cube icons in the card lists (such as the swap dialog) now have a gap after the city name and line up with the text.

- Fixed the cube rows showing the final count too early (during outbreaks and on the first infection card of a turn): a row now drops only as each cube takes off, and each cube of a group starts from its own slot. Removed the ghost cubes and ghost tokens. The card preview on hover now appears in the centre of the board.

- Board counters redesigned: the cube number counters are replaced by one row of 24 cubes per colour, and the water and railroad counters by two overlapping columns of tokens (with a faint shadow and a little random tilt). Used ones stay as faint ghosts. Cubes, railroads and purification tokens now fly in from the last one in their row or column. The Infection deck and discard no longer show a count, and the Player deck count pulses red at 10 or fewer cards. (Uses the new, larger-margin board.jpeg.)

- City and event cards: removed the pale frame from the art (cards now match the picture's shape and are zoomed 7%), in the hand, other players' fans, trays, the drawn cards over the deck and the infection card as it slides to its pile.
- The heartbeat (Infection deck) and chime (Player deck) now repeat every time the waiting deck jiggles again, until a card is picked.
- Removed the yellow glow and outline from drawn player cards and the drawn infection card.

- New cubes fly in from their cube counters (not from behind the infection card), and a counter only drops when its cube takes off.
- Removed the blurry glow from selected or pickable city cards in a hand and from the drawn infection card (the plain outlines stay).

- Black and yellow cubes only get their glow once they have landed, not while flying in.

- The deck to click (Player deck or Infection deck) now jiggles in place instead of glowing: it tilts 7.5 degrees each way once (2 seconds), then waits 8 seconds before repeating.

- The train horn also plays when a player moves one city along a built railroad (the game counted these short hops as carriage moves, so they stayed silent).

- Newly built railroads fly in from the Railroad tokens counter and land with a low clank (assets/sounds/clank.mp3). The train horn plays only when a player rides the train to a new city.

- When an epidemic puts 3 cubes on a city protected by purification tokens, the question 'which token protects it?' is asked once per cube and now says 'cube 1 of 3', 'cube 2 of 3' and so on, so it no longer looks like a loop.

- Travelling by train plays a new two-toot train horn (assets/sounds/train.mp3); the old choo-choo is still used when a railroad is built.

- The glow around black and yellow cubes is about half as strong again (it looked too prominent after being widened).

- The glow around black and yellow cubes fades out more gradually (wider gradient).

- Yellow cubes on the board get a faint dark glow (same strength as the cream glow on black cubes).

- Groups of three same-colour cubes turn slowly in the plane of the map (about 12 seconds a turn); they ease back to rest while the active pawn is in that city, and keep turning for other pawns.

- Black cubes are true black again (removed the lightening); a lone cube now sits closer to its city (the first cube slot counts most when choosing the spot).

- Removed the pulsing red glow around groups of three cubes (a new way to highlight them may come later).

- The cream glow around black cubes is 50% more transparent.

- Cubes keep a little clear space around city names (Cádiz's cubes no longer crowd its name).

- Cubes sit closer to their own city: the layout now penalises any cube that is nearer a neighbouring city than its own, still keeping clear of pawns, tracks and names. The spot also no longer depends on how many cubes are there right now.
- Black cubes: the glow is now cream (the light map colour) and built into the cube's own filter, so it shows in Safari and in every city. San Sebastián's cubes sit just below its name, clear of the infection-rate numbers.
- Cubes keep a fixed spot at each city: every colour has room for three cubes and they fill those slots in order, so treating or adding a cube never moves the others. The cubes only shift when a pawn arrives at or leaves the city.
- Black cubes on the map have a small white glow so they stand out against dark parts of the map.
- Tapping or clicking the compass rose on the board now plays the pawn reveal animation, same as the space bar (for the iPad).
- Time Traveler: the hover preview of an infection card is larger (about the same visual weight as a city card preview).
- New game, step 3 (local games): every player's role list starts open, so there's no need to press Change first.
- The scaled interface is now the default for everyone, with no address suffix needed. Add ?scale=0 to the address to switch back to the old fixed-size layout (remembered by that browser; ?scale=1 turns scaling back on).
- Fixed: a card sliding into the hand was cut off (only its top half showed). It is now whole over the board and tucks under the cards below as it settles into the stack.
- Fixed: drawn cards slid in and then jumped into place; they now land exactly in their spot.
- Drawn cards now slide into the hand over the board instead of appearing from under it (the sliding card is drawn above everything, then settles into the hand).
- Scaled interface: the buttons beside the pawn (Undo, End actions, the action ring) scale too; card previews sit centred vertically; the side panel is drawn above the board so cards slide into the hand over it.
- Scaled interface: thinner margins around the board and side panel; the side panel no longer gets too wide on wide windows (the board and panel are centred instead); setup questions (Nurse token, Civil Engineer track) open just left of the side panel, level with the city you clicked.
- Trial: scaled interface. Add ?scale=1 to the address to turn it on (?scale=0 turns it off; the choice is remembered). The side panel, dialogs, alerts and card previews keep their MacBook proportions and shrink or grow as a whole, so smaller screens such as an iPad look like a smaller Mac.
- iPad: Safari no longer enlarges the text in the side panel and dialogs; the New game and Settings windows are more compact on smaller screens.
- Online: a Nurse or Civil Engineer seat no longer gets its starting question while everyone is still in the waiting room (it closed the New game window).
- New game wizard: once you open a player's role list it stays open while you try roles (the ability updates as you click), until you press Next. The Next buttons just say Next, and the host's invite button says "Everyone's here".
- Online "Seats and roles" now uses the same boxes as local play: pawn and role, the list of roles, the ability below, and who plays the seat. Number of players and Epidemics are buttons.
- Civil Engineer: when choosing which connection to stand on, the possible tracks glow and pulse on the map (instead of highlighting the other city).
- The New game window is now a step-by-step wizard, like the start screen: 1 How to play (this device, host online, join online, or save/restore), 2 Players (or Invite your players, with the room code and who has joined), 3 Roles, 4 Difficulty and challenges, 5 Start. Finished steps fold into a one-line summary with a Change link.
- Roles: each player's role sits in a box with its pawn and full ability; "Change" opens the list of roles. In the folded summary, click a role name to read its ability.
- The heartbeat now plays each time the Infection deck lights up for the next Infection card, not only for the first.
- The deck glow, the draw bell and the heartbeat now wait until all other sounds and animations (railroad tokens dropping, Epidemic cubes, cards sliding in, pawns moving) have finished, plus half a second.
- Railwayman: hovering the optional second track now shows its ghost railroad, like the first one.
- New sound: a small clock-tower bell (quick double strike) when the Player deck starts to glow, i.e. when your actions are used up and it is time to draw.
- Heartbeat plays the moment the Infection deck starts to glow at the start of the infection step. The deck glow (and so the heartbeat) now waits until drawn cards have finished sliding into the hand and any Epidemic cubes have landed.
- The heartbeat now plays one second after the drawn cards finish sliding into the hand (or when the infection step starts after an Epidemic).
- New sound: a recorded heartbeat when the infection step of each turn begins.
- Pawns step aside when they would cover most of a short railroad (for example Santiago de Compostela – A Coruña), so the track stays easy to click. Only about a dozen cities are affected.
- While choosing a card for an action (e.g. Purify Water), Event cards now tuck away with the other cards that can't be used, so only the usable cards show.
- Status card shows "Discarding" with progress (0 of 2, 1 of 2 …) while a hand is over the limit.
- Purification: the whole region is clickable again, and the clickable strip along each railroad is wider (36 instead of 28), so clicks near a track still place the track.
- Status card switches to "Drawing cards" as soon as your actions are used up (and back to "Actions" if you Undo).
- Status card wording shortened: "Actions · 2 of 4", "Drawing cards · 2 cards", "Infecting · 1 of 3", "Patients moving · To hospitals", "Epidemic! · Rate rises".
- The green "End actions and draw cards" / "Infect next city" button by the pawn is gone when drawing is the only thing left (the glowing deck does that job). Undo stays by the pawn.
- The "Too many cards" hand-limit note now sits on top of the Player deck and discard pile.
- Fixed: the Player deck now reliably lights up as soon as you can draw (it sometimes stayed dark after the last action's animation).
- Safari: the little click when treating a cube no longer creates a second sound engine that was never shut down. That leftover engine is the likely reason a reloaded page went silent until Safari was restarted.
- Fixed: clicking the glowing Player or Infection deck now actually draws (the deck pictures were ignoring clicks).
- The deck you need next glows with a pulsing gold outline: the Player deck when your actions are used up, the Infection deck during the infection step. You can click the deck itself to draw (same as the Continue button).
- Hand limit: the "over the hand limit, discard N cards" alert no longer blocks your hand. Clicking an Event (to play it) or a card (to discard it) closes the alert and carries on.
- One More Day: the status card now counts the extra actions correctly (for example "0 of 2 used" when played after drawing).
- Hospital overrun from an Infection card or Epidemic: you now see the card, the cube arriving and the "Hospital overrun" alert first, and only then get asked where the patients go. The patients then slide out.
- Sailor (by ship) and Railwayman (by train): when another pawn is in your city, moving now asks "Go alone" or "Take ...", so the passenger option is no longer skipped when you click a city directly. On one device there is no extra "do you agree" question.
- Purification: only a small spot in the middle of each region is clickable, so it no longer gets in the way of placing railroad tracks.
- Choosing a region (Purify Water and similar): clicking anywhere on the map outside the shaded regions now cancels, no Cancel button needed.
- Status card background is now the same cream as the cube counters; the active player's box is a few shades darker so the card stands out.
- Colors now show in the order red, blue, black, yellow: cube counters, research row, the city list, and the cards in each hand (same-color cards stay together).
- "Pick historical diseases at random" now uses a fair shuffle (the old method slightly favored some diseases).
- Infection cubes no longer fly in from the middle of the screen when you click through before the infection card is shown; they come from the infection pile.
- Hand limit: the request to discard (and the warning sound) now waits until the newly dealt cards have landed in the hand, instead of appearing while they are still flying in.
- Hospital overrun caused by an Infection card now asks the same question as patient moves: flee automatically (least crowded cities) or choose each city yourself.
- Influx of Patients: when patients are about to move, one prompt offers two buttons: move them all automatically (picking the least crowded cities) or choose the cities yourself.
- Hospital overrun: the fleeing patients now slide out of the hospital city to their new cities, instead of flying in from the middle of the screen.
- The status card no longer names the city being infected (the card and animation already show it).
- A status card at the top of the active player's box says what is happening (Taking actions, Drawing cards, Infecting cities, Patients on the move, Epidemic!), with small progress pips. It replaces the "Actions left" line.
- Influx of Patients: removed the "Patient on the Move" alert; patient cubes now simply slide in a straight line to their new cities.
- Influx of Patients: a patient cube now visibly flies from its old city to the new one (instead of just appearing there) after the "Patient on the Move" alert.
- Influx of Patients description no longer mentions pieces stuck under hospitals: it now says 2 purification tokens per hospital color stay locked until that hospital is built.
- Plainer wording for the Influx of Patients description (what happens to the 2 purification tokens under each hospital, and what building a hospital does).
- New window: "This device only" and "Play with others online" are now two big buttons; the chosen one is dark.
- Challenges box (New window and online lobby): headings are bigger than the choices, and each challenge (Influx of Patients, Cholera, Typhus, Yellow fever, Malaria) now shows its description under its name instead of only in a tooltip.
- Removed the second epidemic sound; only the boom when the infection-rate marker advances remains.
- The next 8 cards of the player deck and of the infection deck are loaded and decoded ahead of time, so card pictures are ready when a card appears.
- Hover ring has no fill: same outline as the pulsing available-city ring, steady while hovering.
- Disease cubes now sit as close as possible to their own city and always closer to their own city than to a neighbouring one (A Coruña/Santiago/Vigo no longer share ambiguous cubes). Placement uses each cube's real position, so two-cube rows no longer get treated as three-cube pyramids.
- Hover ring now matches the reachable-city ring (smaller) and sits under the pawn and its glow.
- Hovering cubes (or a city) now shows only the simple yellow ring on the city (blue for yellow cities): no box around the cubes.
- Cube placement searches a finer grid for the closest spot that avoids text, railroad tracks and the city circle.
- Hovering a city's cubes (or the city) draws a simple ring on the city and a thin outline around its cubes: yellow, or blue for yellow cities. No glow.
- Disease cubes sit closer to their city where there is room, still avoiding railroad tracks and city names.
- Pawn rings are now fully opaque pawn color (the black edge no longer tints them).
- Disease cubes now avoid railroad tracks when there is room (Santiago de Compostela's cubes sit to the left of the city).
- Disease cubes now keep clear of the city circle and its highlight ring (checked for every city; Santander's three cubes used to sit under the ring).
- Infection cubes are kept off the city circle and its highlight ring (checked for every city; Santander, Gijón, Santiago de Compostela and Lisboa were overlapping).
- Pawn rings are the pawn's color with a black border.
- The top bar now has "New" and "Settings". New is one window for starting a game: choose "This device only" or "Play with others online", with save/restore at the bottom. Settings holds reveal speed, sound, card size and the guide link.
- Random roles no longer repeat the previous game's roles (local and online) when enough other roles exist.
- New "Leave out of random picks" list in the menu: tick roles you never want drawn at random (you can still pick them by hand; ignored if fewer than 5 would remain). The online host's random roles respect it too.
- Railroad click area is a few pixels wider, so it wins over the purification region when you click near a track.

- Fixed: the drawn city cards' slide-in from the left was being skipped after the reveal; they now slide in as intended.

- The role cards' ability text now appears under each role choice in the Game menu (and next to each seat in the online lobby), so you can read what a role does while choosing, including the roles that aren't in the rule book.

- Pawns no longer block clicks: a railroad (or other board click) next to a pawn can be clicked right through the pawn, e.g. building north from Santiago de Compostela with a pawn standing there.

- City-card draw is now: reveal over the piles (2 s), fade out, then the original slide-in from the left into the hand, with a gap just one card-strip tall opening for each new card. The flying-in-from-the-pile step is gone.

- Drawn city cards now slide into gaps: as they leave the piles the hand spreads apart (the other cards glide aside), the drawn cards start their slide further to the left, land in the empty slots, and no longer replay the old slide-in at the end.

- Railroad tokens realigned to the printed connection lines: Málaga–Almería, Gijón–Santander, Salamanca–Cáceres, Toledo–Cáceres, Madrid–Salamanca, Madrid–Toledo, Valladolid–Madrid, Porto–Coimbra and Coimbra–Cáceres were measured against the board art and nudged onto the line.

- The dashed guide line for the infection cube fly-in is gone; the cube just flies from the card edge to the city.

- Remaining-cube counters pulse red (cream to red and back every 2 seconds) once a color has fewer than 10 cubes left.

- The infection card you just drew no longer shows dimmed on the discard pile before the animated card lands; the pile keeps showing the previous card until the new one arrives.

- Protected infections no longer repeat the sound and the shield animation at the city after the badge; the badge on the card (with its single sound) is now the only notice.

- Sailing by ship (anyone but the Sailor): if you hold exactly one City card of the destination's color, you now get a warning naming the card that will be discarded, with Yes/No. If you hold several, the hint tells you to choose which card to discard.

- Fixed: when an infection overflows a city, the outbreak banner and sound no longer cut in before the cause. A cube now flies from the infection card to the city first (with the dotted path), and the outbreak starts when it lands.

- Fixed: the city-card draw animation was flying to the wrong hand box (an idle player's box below the active hand). Cards now land exactly on their real slot in the active hand.

- City-card draws are now one continuous motion: each card arcs from its pile to the point where the old slide-in starts, then glides straight into its slot in the hand (same size as the hand card), and the real card takes its place with no jump.

- Epidemics now use the same animation as infections: the infection card flies to the discard pile with an "Epidemic! Infection rate: N" badge on it, then the 3 cubes arc out of the card.

- City-card draws: the cards no longer shrink; each flies to just beside the spot where it will sit in the hand, and the old slide-in animation finishes the move. The dotted path (and the cubes) for an infection now start at the edge of the infection card instead of its center.

- Protected cities use the new infection animation too: the card flies to the discard pile and a small "Infection prevented" badge (with the token used) sits on the card, under the city name, for about three seconds before the card dims.

- New city-card draw: no more center pop-up. The two drawn cards appear face up over the player deck and the discard pile for about two seconds (longer at Slow), then fly into the active player's hand, which lights up briefly. An epidemic card shows over the pile the same way and fades, then the epidemic banner plays as before. Plays for every player in a network game. At the start of a turn the turn banner still comes first.

- New infection draw: no more center pop-up. The infection card flies from the infection deck to the discard pile, then the cube(s) arc out of that card to the city, with a dotted gold path and a ring around the city; afterwards the card fades to its dimmed look. Plays for every player in a network game. Protected-city, epidemic and outbreak banners are unchanged.

- At the start of a turn, the "<role>'s turn" banner now shows first, then a short pause, then the cards drawn (they used to appear together).

- iPad / narrow screens: the other players' hands now squeeze their overlapping cards together to fit instead of running off the right edge.

- The turn announcement, the "<role> is deciding" notice, and choice/approval boxes now appear in the middle of the board instead of at the top or side. Card reveals and outbreak/epidemic banners were already centered. Event windows and the small alerts next to a pawn stay where they were.

- Fixed: the Government Mobilization Event window (and any tall Event window) could run off the bottom of the screen so the Play Event button was out of reach. The form now scrolls inside the window and the button always stays visible.

- Outbreak banners now count down and dismiss themselves like card draws, with no Continue button (the Defeat/Victory banner and the Off reveal speed still wait for a click).

- Online: while one player answers a question or fills in an Event popup, everyone else sees a notice at the top of their screen, "<role> is deciding: ...", with a short description. It disappears when the decision is made.

- Railroad tokens on Porto–Lisboa and Lisboa–Albufeira moved onto the printed lines.

- Online: when a drawn infection (or epidemic) card is protected by purification tokens, the other players now see the card and the protection right away, instead of waiting until the token has been chosen.

- The Event card kept on the University Professor's role card now zooms on hover for the active player too.

- Cube clusters in neighbouring cities no longer pile onto each other; the later city moves its cubes to another side (or above/below), still avoiding names and other pieces.

- Log entries write blue, black, red and yellow in lower case.

- Press the space bar to make every pawn on the board pulse the same way pawns do when the turn changes. It only happens on your own screen (including in online games) and is ignored while a window is open or a button or field has focus.

- Barcelona–Girona railroad token moved 2 map pixels to the right.

- Cartagena–Alicante railroad token moved 6 map pixels to the right.

- Railroad tokens now sit on the printed line of their connection (and follow its tilt, including curved lines) for 63 connections; the flying-in animation lands in the same spot. Cartagena–Alicante is nudged a little to the left.

- Outbreak chains: the cube that triggers a later outbreak now lands in that city before the city's outbreak rings and cubes start, so events happen in order.

- Online: new "Host a saved game…" button in the Online window. Choose a file made with Save Game and it starts a new room (new code) at the saved position; guests join and take open seats. How-to added to the Online instructions.

- Online games also preselect each player's starting city (most cubes), and the pick can still be changed. Windows closed to show a question (Menu, Log, Online) now reopen after it is answered.

- At setup, each local player's starting city is preselected: the City card in their hand whose city has the most cubes (they can still change it).

- New-game section of the Menu has a "Use only the rule book's 7 base roles" checkbox (off by default); it limits Random roles and the role pickers.
- Top buttons are now Menu, Log, Online, Rules (in that order); the Guide link moved to a Help section at the bottom of the Menu. The Display and Graphics sections were removed from the Menu.

- Black cubes now stay black while they fly into place (the shading lightened them to grey in flight); the shading returns when they land.

- Questions and approvals asked from inside the Menu, Log or Online window now close that window first, so the question appears on top right away instead of sitting dimmed behind it.

- Light text on dark buttons is now always the same cream (the ring's End actions and Confirm buttons and the action tooltips were white).

- Large green buttons (Begin game, Confirm, Continue, chosen action buttons) are a darker green (#3d5a4b) with cream text.

- The page background and the frame around the board are now olive (#aaa474, averaged from your swatch); the side panel stays cream.

- Hover zoom on the Time Traveler's infection cards is half its previous size.

- Hospitals sit a little further from their city circle and are drawn on top of the pulsing ring.

- Cube clusters sit a few units further from the city circles.

- One or two cubes sit close to their city again (the pyramid box was pushing them lower, under the action buttons).

- Cube clusters are now a tight pyramid: one cube alone, two side by side, three as two on the bottom with one on top (different colours sit side by side).

- Board pieces look the same in Brave/Chrome as in Safari: removed the two CSS filters Safari ignores (the red-cube darkening and the pawn badge shadow).

- Browser tab title is now "Iberia board game".

- Role action buttons describe the action instead of naming the role: "Give Valladolid card", "Swap Valladolid card" (current city), "Look at top 3 cards", "Add water to adjacent region".

- New sound when a hospital is founded or moved: a low wooden thunk followed by a bell note (assets/sounds/hospital.mp3).

- The pulsing rings on available cities now just fade from transparent to opaque and back (3 s cycle), with no glow or blur.

- Politician swap discard pile is sorted by colour, most outbreak-prone colour first (most cities with 3 cubes, then 2 cubes, then most cubes on the board).

- Politician swap discard pile and the Player-deck peek use the gently shrunk card copies (no more shimmering/moire); the discard-pile cards zoom on hover.

- Chain reactions: a cube flies from the outbreak city into the full city it sets off, and is absorbed there without adding to the cubes shown.

- The "other cards not usable here" note under the hand wraps as "N other card(s)" / "not usable here".

- All 48 infection card pictures adjusted: contrast +10%, saturation −10%. The originals are kept in `backup/infection_cards_original/`.

- City highlight rings re-centred on the city markers of the current board (40 of 48 cities adjusted by up to ~2.5 map units).

- City highlight rings are solid instead of dashed (checked all 48 against the board image: centred to within about 0.2 map units).

- Map highlights are back to yellow (the green was too hard to see); yellow cities get blue highlight rings so they don't blend in.

- Hidden hand cards now slide out of the way (and slide back); hovering the small infection cards in the Time Traveler's hand shows them enlarged.

- While picking a card for an action, cards that can't be used are hidden and the usable ones close up (a note says how many are hidden) instead of being dimmed. Event cards stay visible.

- Alert titles (Epidemic, Outbreak, Hospital Overrun, Chain Reaction…) are title case and centred; text is larger in the Menu, Log and Online windows; other players' hands are back to full colour (the muted look stays for non-pickable hand cards and discard piles).

- One shared de-emphasis for dimmed hand cards, other players' idle hands and the discard piles: less colour and contrast, and tinted toward what they sit on (light yellow in the side panel, yellow-green under the city discard, brown under the infection discard), always fully opaque. Idle hands were not being dimmed at all in board view; fixed.
- New board picture with clearer, larger city names (the original is kept as assets/board_original_backup.jpeg).
- Board picture updated again.
- Board picture updated once more.
- The board picture is now always the one built into the page, so a stale cached copy from the repo can no longer replace it after a moment.
- "Disease researched" banner: text is centred and in title case (for example "Yellow fever researched!") instead of all capitals.
- While picking cards for an action (such as Purify Water), Event cards in your hand are no longer greyed out (they can be played at any time), and the other cards are shown lighter and desaturated rather than see-through (same for other players' idle hands and the discard piles on the board).
- The board picture now reloads fresh after each update (it could show the new board briefly, then an older cached copy).
- Politician Swap: the discard-pile choices are small cards again (they had grown huge and run off the screen).
- Starting choices buttons are shorter vertically (same font); hover-to-zoom is back on the active player's cards.
- Starting choices buttons tightened further, font slightly smaller.
- Event windows: removed the redundant "Pick on the map" button while the map is already waiting for clicks; the instruction is highlighted instead.
- Other event windows: Ships Arrive gets a numbered "Who travels there?" step, Government Mobilization buttons read "Move to…", player and card choices wrap side by side so windows are shorter.
- Event windows now open just left of the side bar (still draggable).
- Rural Doctor: after clicking a cube there is now an "Also treat most infected" button (picks the nearby city with the most cubes); you can still click any nearby city on the map to choose a specific one.
- Choice boxes (play or discard a card, confirmations, other pick lists) now open just left of the side bar (draggable) instead of the middle of the board.
- Hospital tokens can no longer be placed off the edge of the board; the version and build time are back on the map (medium green, bottom edge beside the microscopes).
- Cubes now keep clear of the Civil Engineer's pawn when she stands on a connection near their city.
- Palliative Care Nurse buttons now show the colour of the hospital she is at (treat all) and the colour of the most numerous cubes in connected cities (attract).
- Menu: you can type a name for the saved game file (remembered; the turn number is added). Blank keeps the old automatic name.
- On narrower screens (iPad) the side panel shrinks automatically (down to 111 px, only as much as needed) so the board gets more of the height.
- Card size slider (Menu) now goes up to 300%; big cards are capped to fit the window height.
- The active pawn now sits on top of the turn-change rings and of the coloured lines to its buttons.
- Version and build time on the map is now two small lines pinned to the board and scaling with it, clear of the microscopes.
- Starting choices buttons tightened further, font slightly smaller.

- The Starting choices panel is now a numbered list of steps in larger type: 1, 2… pick each player's starting city, then 'Who goes first?', then 'Begin game'. All the options are the same size and the chosen one is dark green with a check mark.

- Safari sound after a reload: the page now releases its audio engine and the silent 'keep-alive' audio when it is reloaded or closed, and starts them fresh when it comes back (a fix for sound staying dead until Safari is restarted). Not testable outside Safari, so please report whether it helps.

- The research fanfare now plays together with the celebration popup (not later, when the microscope token lands).
- The click-through test (tests/ui_fuzz.py) now discards cards, uses dropdowns/tick boxes in Event windows, and reports why a game is stuck.

- The buttons under the pawn now move out of the way of the cities/regions offered by a second map pick (for example the Civil Engineer choosing the other end of his connection).
- Removed the small red labels for the infection-rate and outbreak markers advancing; the ring animation and sound remain.

- Removed the hover tooltips (the little text boxes that appear after hovering a while). The text is kept for screen readers.
- When a choice is about a cube colour (e.g. the Palliative Care Nurse bringing a cube along), the options are now cube pictures instead of words.
- The UI test runner (tests/ui_fuzz.py) is more reliable: it reloads the page for each game and handles pop-up choices correctly.

- New Palliative Care Nurse role card image.

- The version and build time moved off the map into the Menu (top of the Game menu).

- Added tests/ui_fuzz.py: plays whole games on the real page by clicking buttons and map spots at random, checking the rules after every move (usage: `python3 tests/ui_fuzz.py 25 SEED out.json`).
- Railroads on connections that are not allowed (e.g. from an older cached page or old rewind data) are now removed when a saved/rewound game loads. The board's version label now shows the build time so you can tell whether your page is current.

- Event windows streamlined: every step now happens in the one floating window. Science Triumph picks its region on the map inside the window (no popup that closes it); choosing which cube to remove (Science Triumph, Overseas Migration) now shows coloured cube buttons right in the window, plus chips showing the cubes chosen. The separate "do they agree?" popup is replaced by a line in the window and an "Everyone agrees — Play Event" button. Hospital Founding plays as soon as you click the city; Good Season, One More Day and Second Chance play immediately with no extra window.
- Removed the ✥ handle: drag any floating window from anywhere that isn't a button (the cursor becomes a hand).

- Fixed: the floating Event window no longer closes when you drag it or click its padding.

- Event windows now float over the map (bottom-left, movable with the ✥ handle) instead of covering the side panel. Purify Water is one step in that window: click up to 2 regions on the map (selected ones are outlined), then Play Event. No side panel, no extra popups.

- Floating windows (action buttons under the pawn, map-pick and event popups) are now movable: drag the small ✥ handle on the corner, or click it to send the window to the next corner of the board.

- Fixed Research disease: when you hold more than 5 cards of the colour, 5 are now preselected so Confirm is enabled (tap cards to change the pick). The research ring icon now matches the disease colour, and the disabled Confirm is easier to see.
- The play-or-discard question for an Event card shows the card (readable) again.
- Map-input boxes now sit as close to the pawn as possible without covering anything you need to click (highlighted regions and cities), joined to the pawn by a line. Cancel/confirm-only boxes shrink to a pair of ring-style buttons.
- Popups that close by themselves no longer have a green Continue button (click anywhere to dismiss); popups that wait for you, like outbreaks, keep it.
- Event card alerts are smaller with less padding; the box under the pawn moves out of the way of highlighted cities and regions.
- Event map-pick prompts (Science Triumph, Purify Water) now show the Event card and sit in a board corner away from the choices instead of over the middle of the map.
- iPad/touch: tapping a city a second time now completes the move (the larger tap areas I added earlier were cancelling the first tap).
- The Event card kept on the University Professor card now appears in his hand as a normal card (still not counted toward the hand limit); drawn cards make a soft draw sound as they slide in.
- Cube-drop animations (e.g. the 3 cubes after an Epidemic) now finish before the next popup opens, instead of playing behind it.
- Fixed the slide-in of drawn cards (a second redraw was cancelling it); infection card popups are 20% smaller.
- Other players' small hand cards no longer shimmer (moire): they use a gently shrunk copy of the card picture.
- Drawn cards now appear in your hand after the draw popup closes, sliding in from the left.
- Water-token and railroad-token counters on the board under the blue cube; hover counts on those tokens removed.
- Instruction cards: back to the original pictures, now shown larger.
- Sound after reloading a saved game in Safari: the audio engine is now only created on a real tap or click, and is rebuilt if Safari leaves it stuck.
- Instruction cards (actions 1, 2 and the Play card) cleaned up: paper texture flattened so the text is easier to read.
- The "play it now, or discard it" question for Event cards now appears as an alert by the active pawn.
- Map-pick questions (which water token, which city for the Student, etc.) now appear as a centred alert by the active pawn with only a Cancel button; you choose on the map.
- Fixed the pulsing rings under the pawn at the start of a turn, which a cube animation could wipe out.
- Discard alerts are centred, the old hand-limit popup is gone in board mode, treating a cube makes a tiny click, and the card/cube count badges are cream.
- Action options now appear in a small card under the active pawn instead of the side panel (e.g. the Rural Doctor "also treat a nearby city" choice, Treat/Cancel buttons), and a "Too many cards: discard N" message appears by the pawn when a hand is over the limit.
- One More Day can now be played at the start of the infection step (e.g. when over the hand limit after drawing): 2 extra actions, then the same infection step continues without drawing again. City cards rebuilt from the original photos at higher resolution.
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
