## 2025 December 5

### Changes
- Remove restrictions on manipulating opponent cards. We want to provide just a 
smooth, fast tabletop, not a rules engine.

---

## 2025 December 4

### Features
- Increase max zoom for hand. Cards now overlap at higher zoom levels 
- Add card preview to card pile windows
- Add hand count to dock, will make it clickable in the future

### Changes
- Began testing network fix for large groups
- Improve help/patch notes text formatting

### Bug Fixes
- Cards in hand now align to the top of the card when zoomed all the way in.
- Tooltips no longer show up after dragging a card.
- Card language now defaults English when importing by set code & collector number. Fixes French issue 🇫🇷🥖
- Hide tooltip after using a hotkey in a card pile window

---

## 2025 December 2

### Beta Test
Some players have been having issues with larger groups. If this happens to you,
try making a game with this link instead: https://y-websocket-test.aura-dqp.pages.dev/

---

## 2025 November 30

### Changes
- Added a lot of automated quality checks and tests that run before 
deploying a new patch.
- Centralize hotkey logic to clear a path towards adding custom hotkeys.

### Bug Fixes
- Fix interactive tooltip when viewing card piles.
- Fix "Copy Game Link" using old URL. Now copies link directly from browser instead of generating it.
- Fix card duplication when closing Scry with cards still in the window.

---

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

