## 2025 November 30

### Changes
- Added a lot of automated quality checks and tests that run before 
deploying a new patch.
- Centralize hotkey logic to clear a path towards adding custom hotkeys.

### Bug Fixes
- Fixed "Copy Game Link" using old URL. Now just copies directly from browser.
- Fix card duplication when closing Scry with cards still in the window.

## 2025 November 24

### Features
- You can now move cards to top and bottom of deck using hotkeys while viewing your deck.

### Changes
- Bought a domain, aura0.app
- Changed how hotkeys work

---

## 2025 November 23

### Features
- Card text is now searchable when searching a card pile.
- Hand cards now align to top of card when zooming in.
- Enemy cards now show copy/clone tooltip.

### Changes
- Moved blue label on hand cards down to show mana cost when zoomed in.
- Consolidate popup/modal window styling.
- Fix windows that were clipping under the dock.
- Simplify deck logic.
- Improve automated testing.

---

## 2025 November 22

### Features
- Cards can be rearranged when scrying. Remaining cards will be put in order
onto top of deck when window is closed. First card will be on top.

---

## 2025 November 21

### Features
- Typing to search deck now automatically reveals all

### Changes
- Made deck import a little more resilient when entering bad set codes
- Changed how decks are handled in the code. Moving cards should be faster

---

## 2025 November 20

### Features
- Add "Copy Game Link" button

### Changes
- Change how deck viewers work. Opening deck and revealing cards are now much faster.

---

## 2025 November 19

### Features
- Add ability to import cards by set, example: `1 Rhystic Study (WOT) 71`
- Add keyword tokens and mana tokens

### Bug fixes
- Fix tooltip disappearing after hovering a card on board

---

## 2025 November 18

### Features
- Add keyword tokens

### Changes
- Move add card and scry actions into a dock menu

---

## 2025 November 17 - Daily patch 4

### Features
- Language support: Add ability to import cards in any language that Scryfall supports. Import as usual, e.g.: 
`1 Anillo solar`, `1 Sonnenring`, `1 Anneau solaire`
- Alert opponents when players reveal any cards in their deck

### Changes
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