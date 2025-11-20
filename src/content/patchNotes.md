## 2025 November 19

### Feature
- Add ability to import cards by set, example: `1 Rhystic Study (WOT) 71`

### Bug fixes
- Fix tooltip disappearing after hovering a card on board

---

## 2025 November 17 - Daily patch 4

### Feature
- Language support: Add ability to import cards in any language that Scryfall supports. Import as usual, e.g.: 
`1 Anillo solar`, `1 Sonnenring`, `1 Anneau solaire`
- Alert opponents when players reveal any cards in their deck

### Change
- Put player ID on health displays

### Major bug fix
- Fix network issue where users would see 'Connected' but not see opponent HP or cards
    - People who turned off VPNs and firewalls and ad blockers should be able to turn them back on now

### Bug fixes
- Make rearranging hand less laggy by throttling animation

---

## 2025 November 16

### Features
- Add scry and surveil
- Add ability to rearrange hand by dragging and dropping

### Bug fixes
- Fix functional reprint imports. Cards like `Doric, Nature's Warden` which are reprints of another card, `Casal, 
Lurkwood Pathfinder`, are now imported correctly

---

## 2025 November 15

### Changes
- Clear rooms and hands that are older than 12 hours from storage

### Bug fixes
- Fix battlefield card tooltip rendering to not jump around.
- Make battlefield card tooltip show up in a more predictable location when hovering a card.
- Hide battlefield card tooltip when dragging card 

---

## 2025 November 14

### Features
- Cards are now hidden by default when viewing your deck
- Add interactive tooltips when inside deck viewer
- Drawing a card will scroll hand to end
- Life total is now editable: click and type!

### Bug fixes
- Ignore system keys when capturing hotkeys
- Fix 'Delete card' tooltip spacing
- Display correct deck viewer hotkeys
- Turn cursor into hand when hovering card piles

---

## 2025 November 13 - Night

### Features
- Add ability to delete battlefield card using backspace hotkey

### Changes
- Add Discord server invite to menu bar

## 2025 November 13

### Features
- Improve board positioning by removing inverted boards
- Add lines to split board into 4 'playmats'
- Made card tooltip interactive, try clicking it!

### Bug fixes
- Fix a bug with the default Krenko deck where identical cards could be controlled by another player that owned one.

---

## 2025 November 12

### Bug fixes
- Prevent opponents from manipulating your cards. Only allow cloning.

---

## 2025 November 11

### Features
- Add ability to drag battlefield cards to exile/discard/hand/deck
- Add hotkey to add any card to hand
- Add a default Krenko deck
- Load deck on open. Draw 7 cards on deck load
- Allow flipping of cards in hand
- Add health hotkey tooltip
- Add patch notes lol

### Bug fixes
- Persist deck on page refresh
- Fix Player Counter modal clipping through top and bottom of screen