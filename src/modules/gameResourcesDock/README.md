# GameResourcesDock Module

## Overview

The `GameResourcesDock` module manages the player's local game resources UI located at the bottom of the screen. It displays and enables interaction with:

- **Hand cards** - Cards currently in the player's hand
- **Piles** - Exile, Discard (Graveyard), and Deck
- **Health display** - Life total and custom counters

This module is responsible for:
1. Rendering the player's hand with draggable cards
2. Providing pile viewers for examining deck/exile/discard contents
3. Handling drag-and-drop interactions for card movement
4. Exposing keyboard shortcut hooks for external handlers
5. Managing hand card zoom level

## Architecture

### Class Structure

```typescript
export class GameResourcesDock {
  // Core dependencies
  private player: Player              // Player state management
  private cardPreview: CardPreview    // Shared card preview instance

  // UI Components
  private elements: {
    exile: HTMLElement
    discard: HTMLElement
    hand: HTMLElement
    deck: HTMLElement
    health: HTMLElement
  }

  // Pile Viewers (Modal dialogs)
  private deckViewer: DeckPileViewer
  private exileViewer: DeckPileViewer
  private discardViewer: DeckPileViewer

  // State tracking
  private draggedCard: { card: Card; element: HTMLElement } | null
  private hoveredHandCardId: string | null
  private hoveredPileType: 'deck' | 'exile' | 'discard' | null
  private draggedHandCardIndex: number | null  // For hand reordering
  private dropTargetIndex: number | null       // For hand reordering
  private handZoomLevel: number
}
```

### Key Concepts

#### 1. Dual Drag-and-Drop System

The module supports two drag-and-drop behaviors:

**A. Playing Cards from Hand**
- Drag a card from hand → battlefield (handled in `index.ts`)
- Drag a card from hand → exile/discard piles

**B. Reordering Hand Cards** (New Feature)
- Drag a card within the hand to reorder
- Uses `draggedHandCardIndex` and `dropTargetIndex` to track the operation
- Updates Yjs state directly via `reorderHand()`

#### 2. Hover State Exposure

The dock exposes its internal hover state globally via:
```typescript
window.getGameResourcesDockHoverState = () => { ... }
```

This allows `KeyboardHandler` (in the Whiteboard module) to:
- Detect which card in hand is hovered
- Detect which pile is hovered
- Execute card movement operations via keyboard shortcuts

**Example Usage:**
```typescript
// In KeyboardHandler
const dockState = (window as any).getGameResourcesDockHoverState();
if (dockState.hoveredHandCardId) {
  const card = dockState.getHandCard(dockState.hoveredHandCardId);
  // Move card to exile with 'S' key
  dockState.moveHandCardToExile(dockState.hoveredHandCardId);
}
```

#### 3. Pile Viewers

The `DeckPileViewer` component is used three times (deck, exile, discard) with different callbacks:

| Pile | Available Actions |
|------|-------------------|
| **Deck** | Play to Battlefield, Move to Hand |
| **Exile** | Play to Battlefield, Move to Hand, Move to Discard, Move to Deck Top/Bottom |
| **Discard** | Play to Battlefield, Move to Hand, Move to Exile, Move to Deck Top/Bottom |

Each viewer is a modal dialog that:
- Displays all cards in the pile with images
- Supports keyboard shortcuts while hovering cards
- Auto-updates when cards are moved

#### 4. Hand Zoom Controls

- Zoom level persisted in `localStorage` as `'hand-zoom'`
- Range: 0.5× to 2.5× (adjustable in 0.1× increments)
- Zoom controls positioned bottom-left of screen
- Base card dimensions: 63×88px

## File Structure

```
gameResourcesDock/
├── GameResourcesDock.ts       # Main class (this file)
├── types.ts                   # TypeScript interfaces
├── index.ts                   # Module exports
├── README.md                  # This documentation
└── components/
    ├── DeckPileViewer.tsx     # Modal for viewing piles
    ├── PileViewer.tsx         # Generic pile viewer (deprecated)
    └── index.ts               # Component exports
```

## Lifecycle

### Initialization

```typescript
const dock = new GameResourcesDock(
  containerElement,    // #local-dock div
  player,              // Player instance
  {
    position: 'bottom',
    playerId: string
  },
  cardPreview          // Shared CardPreview instance
);
```

**Constructor steps:**
1. Initialize three `DeckPileViewer` instances with appropriate callbacks
2. Load hand zoom level from localStorage
3. Render initial UI (`render()`)
4. Setup zoom controls
5. Subscribe to player state changes
6. Setup drag-drop zones (exile/discard piles)
7. Expose keyboard shortcut hooks

### Rendering Flow

```
render()
  └── creates DOM structure:
      ├── exile pile (clickable, drop zone)
      ├── discard pile (clickable, drop zone)
      ├── hand container
      │   └── hand-cards (populated by updateHandDisplay)
      ├── deck pile (clickable, has Draw button)
      └── health display (React component)

updateHandDisplay(hand: Card[])
  └── for each card in hand:
      ├── Create card element with image
      ├── Attach hover listeners (for preview & shortcuts)
      ├── Attach drag listeners (for play & reorder)
      ├── Attach drop listeners (for reorder)
      └── Append to hand-cards container
```

### State Updates

**Player state changes trigger:**
```
player.onStateChange(state => updateUI(state))
  ├── Update exile count
  ├── Update discard count
  ├── Update deck count
  ├── Re-render health component (React)
  └── updateHandDisplay(state.hand)
```

**Important:** Hand updates always do full re-render (innerHTML = ''), not incremental DOM updates.

## Drag-and-Drop Implementation

### Hand Reordering

```typescript
// @ts-nocheck
// 1. User starts dragging card #2 in hand
dragstart event
  └── set draggedHandCardIndex = 2
  └── set draggedCard = { card, element }

// 2. User hovers over card #5
dragover event on card #5
  └── check: draggedHandCardIndex !== null && !== 5
  └── set dropTargetIndex = 5
  └── add 'drop-target' class (visual indicator)

// 3. User drops
drop event on card #5
  └── reorderHand(fromIndex: 2, toIndex: 5)
      ├── hand = [...player.getState().hand]
      ├── [movedCard] = hand.splice(2, 1)  // Remove from index 2
      ├── hand.splice(5, 0, movedCard)      // Insert at index 5
      └── player.yPlayerState.set('hand', hand)  // Update Yjs

// 4. Cleanup
dragend event
  └── draggedHandCardIndex = null
  └── dropTargetIndex = null
  └── remove 'dragging' class
```

### Playing Cards (to Battlefield/Piles)

```typescript
// 1. User drags card from hand to battlefield
dragstart event
  └── e.dataTransfer.setData('text/plain', card.id)
  └── set draggedCard = { card, element }

// 2. Drop on battlefield (handled in index.ts)
drop event on #whiteboard
  └── cardId = e.dataTransfer.getData('text/plain')
  └── player.playCardFromHand(cardId)
  └── whiteboard.addCard(card, playerId)

// 3. Drop on exile/discard pile
drop event on pile
  └── if pile === 'exile': player.placeCardInPile(card, 'exile')
  └── if pile === 'discard': player.placeCardInPile(card, 'discard')
  └── player.playCardFromHand(card.id)  // Remove from hand
```

## Keyboard Shortcut Integration

The dock exposes a comprehensive API via `window.getGameResourcesDockHoverState()`:

### Hover State Getters

```typescript
{
  hoveredHandCardId: string | null,
  hoveredPileType: 'deck' | 'exile' | 'discard' | null,

  getHandCard(cardId: string): Card | null,
  getTopPileCard(pileType): Card | null
}
```

### Hand Card Actions

```typescript
{
  playHandCardToBattlefield(cardId: string): void,
  moveHandCardToDiscard(cardId: string): void,
  moveHandCardToExile(cardId: string): void,
  moveHandCardToDeckTop(cardId: string): void,
  moveHandCardToDeckBottom(cardId: string): void
}
```

### Pile Card Actions

```typescript
{
  movePileCardToBattlefield(card: Card, pileType): void,
  movePileCardToHand(card: Card, pileType): void,
  movePileCardToExile(card: Card, pileType): void,
  movePileCardToDiscard(card: Card, pileType): void,
  movePileCardToDeckTop(card: Card, pileType): void,
  movePileCardToDeckBottom(card: Card, pileType): void
}
```

## Event Flow Examples

### Example 1: Drawing a Card

```
User presses 'C' key
  ↓
KeyboardHandler.handleKeyPress('C')
  ↓
callbacks.onDrawCard() (defined in index.ts)
  ↓
player.drawCard()
  ├── deck.drawCard() → removes card from local Deck
  ├── yPlayerState.set('hand', [...hand, drawnCard])
  └── yPlayerState.set(YDOC_DECK_CARD_COUNT, deck.getCardCount())
  ↓
player.onStateChange fires
  ↓
GameResourcesDock.updateUI(newState)
  ├── Update deck count display
  └── updateHandDisplay(newState.hand) → re-renders hand with new card
```

### Example 2: Moving Hand Card to Exile (Keyboard)

```
User hovers hand card #3
  ↓
mouseenter event
  └── hoveredHandCardId = card-abc123
  └── cardPreview.show(card, event)

User presses 'S' key
  ↓
KeyboardHandler checks hover state
  ├── dockState = getGameResourcesDockHoverState()
  └── if dockState.hoveredHandCardId:
  ↓
dockState.moveHandCardToExile('card-abc123')
  ├── card = hand.find(c => c.id === 'card-abc123')
  ├── player.placeCardInPile(card, 'exile')
  │   └── yPlayerState.set('exilePile', [...exilePile, card])
  └── player.playCardFromHand('card-abc123')
      └── yPlayerState.set('hand', hand.filter(c => c.id !== id))
  ↓
player.onStateChange fires
  ↓
GameResourcesDock.updateUI(newState)
  ├── Update exile count
  └── updateHandDisplay(newState.hand) → card removed from hand
```

### Example 3: Reordering Hand

```
User drags hand card from index 1 to index 4
  ↓
dragstart on card[1]
  └── draggedHandCardIndex = 1
  └── draggedCard = { card, element }

dragover on card[4]
  └── dropTargetIndex = 4
  └── card[4].classList.add('drop-target')  // Visual feedback

drop on card[4]
  └── reorderHand(1, 4)
      ├── hand = [A, B, C, D, E]  // Before
      ├── hand.splice(1, 1) → [B], hand = [A, C, D, E]
      ├── hand.splice(4, 0, B) → hand = [A, C, D, E, B]
      └── yPlayerState.set('hand', [A, C, D, E, B])  // After
  ↓
player.onStateChange fires
  ↓
GameResourcesDock.updateUI(newState)
  └── updateHandDisplay(newState.hand) → hand re-rendered in new order
```

## Yjs State Management

### What Gets Synced

```typescript
// Player's Yjs map structure
yPlayerState = {
  health: number,
  hand: Card[],              // ✅ Synced (including order!)
  exilePile: Card[],        // ✅ Synced
  discardPile: Card[],      // ✅ Synced
  deckCardCount: number,    // ✅ Synced (count only, not contents)
  customCounters: Counter[] // ✅ Synced
}
```

### What Stays Local

- **Deck contents** - Stored in local `Deck` instance (not synced)
- **Hover state** - `hoveredHandCardId`, `hoveredPileType` (local UI state)
- **Drag state** - `draggedCard`, `draggedHandCardIndex` (local UI state)

### Synchronization Notes

- **Hand order is synced** - When you reorder your hand, opponents don't see the new order (hands are hidden in UI), but the data is technically in Yjs
- **Pile operations update Yjs immediately** - All card movements trigger `yPlayerState.set()`
- **Full array replacement** - Yjs arrays are replaced entirely, not incrementally modified (CRDTs handle merging)

## Common Patterns

### Adding a New Keyboard Shortcut for Hand Cards

1. **Add method to `getGameResourcesDockHoverState()`:**
```typescript
moveHandCardToCustomZone: (cardId: string) => {
  const hand = this.player.getHand().getCards();
  const card = hand.find(c => c.id === cardId);
  if (card) {
    // Your custom logic here
    this.player.playCardFromHand(cardId); // Remove from hand
  }
}
```

2. **Use in KeyboardHandler:**
```typescript
if (key === 'G' && dockState.hoveredHandCardId) {
  dockState.moveHandCardToCustomZone(dockState.hoveredHandCardId);
}
```

### Adding a New Pile

1. Create a new pile element in `render()`
2. Add it to `elements` object
3. Create a new `DeckPileViewer` instance in constructor
4. Add pile handlers (similar to exile/discard)
5. Update `updateUI()` to show pile count
6. Expose pile operations in `getGameResourcesDockHoverState()`

### Customizing Hand Card Rendering

Modify `updateHandDisplay()`:

```typescript
// Current: Shows image or card number badge
if (card.images?.front?.normal) {
  // Render image
} else {
  // Render fallback
}

// Add custom overlay:
const overlay = document.createElement('div');
overlay.className = 'custom-overlay';
overlay.textContent = card.customData;
cardEl.appendChild(overlay);
```

## Performance Considerations

### Full Re-renders

- `updateHandDisplay()` does `innerHTML = ''` and rebuilds all cards
- This is **acceptable** for typical hand sizes (1-10 cards)
- For hands with 50+ cards, consider incremental updates or virtualization

### Optimization Opportunities

1. **Diff-based rendering** - Only update changed cards instead of full re-render
2. **Event delegation** - Attach drag/drop listeners to container instead of each card
3. **Memoization** - Cache card elements if they haven't changed
4. **Virtual scrolling** - For very large hands (unlikely in MTG)

**Current approach chosen for:**
- Simplicity and maintainability
- Typical use case has small hand sizes
- Easy to reason about: state change → full UI refresh

## Troubleshooting

### Cards not appearing in hand

**Check:**
1. `player.getState().hand` has cards
2. `updateHandDisplay` is called
3. Card images are loaded (check Network tab)
4. Hand container exists in DOM

### Drag-and-drop not working

**Check:**
1. `cardEl.draggable = true` is set
2. Event listeners are attached
3. No CSS `pointer-events: none` on cards
4. Check browser console for errors

### Keyboard shortcuts not working for hand

**Check:**
1. Card is hovered (check `hoveredHandCardId`)
2. `getGameResourcesDockHoverState()` is exposed on window
3. KeyboardHandler is calling the method
4. Card Preview isn't interfering with hover events

### Hand reordering not syncing

**Check:**
1. `reorderHand()` is called with correct indices
2. `yPlayerState.set('hand', newHand)` is executing
3. Yjs observer is firing (check Player state change callback)
4. No errors in console during splice operations

## Related Modules

- **Player** (`../player`) - Manages player state and Yjs synchronization
- **CardPreview** (`../cardPreview`) - Shows enlarged card image on hover
- **KeyboardHandler** (`../whiteboard/KeyboardHandler.ts`) - Executes keyboard shortcuts
- **DeckPileViewer** (`./components/DeckPileViewer.tsx`) - Modal for viewing piles
- **Deck** (`../deck`) - Local deck management (not synced)

## Future Improvements

1. **React Migration** - Convert to React component for better state management
2. **Incremental Rendering** - Update only changed cards, not full re-render
3. **Gesture Support** - Pinch-to-zoom for hand cards on touch devices
4. **Hand Organization** - Group by card type, mana cost, etc.
5. **Multi-select** - Drag multiple cards at once
6. **Undo/Redo** - Revert accidental card movements
7. **Card Tooltips** - Show card details without full preview

## Testing Strategy

### Manual Testing

1. **Hand Reordering:**
   - Draw 5 cards
   - Drag first card to last position
   - Verify order changes in UI
   - Check Yjs state in console: `yDoc.getMap('player-<id>').get('hand')`

2. **Drag to Piles:**
   - Drag hand card to exile → check exile count increments
   - Drag hand card to discard → check discard count increments
   - Verify card removed from hand

3. **Keyboard Shortcuts:**
   - Hover hand card, press D → should move to discard
   - Hover hand card, press S → should move to exile
   - Hover deck, press C → should draw card

4. **Pile Viewers:**
   - Click exile pile → modal opens
   - Click card in modal → keyboard shortcuts work
   - Move card from exile to hand → modal updates

5. **Zoom:**
   - Click + button → hand cards grow
   - Click - button → hand cards shrink
   - Refresh page → zoom persists

### Automated Testing (Future)

```typescript
describe('GameResourcesDock', () => {
  it('reorders hand cards correctly', () => {
    const hand = [cardA, cardB, cardC];
    dock.reorderHand(0, 2);
    expect(player.getState().hand).toEqual([cardB, cardC, cardA]);
  });

  it('moves hand card to exile', () => {
    const handCard = player.getState().hand[0];
    dock.moveHandCardToExile(handCard.id);
    expect(player.getState().exilePile).toContain(handCard);
    expect(player.getState().hand).not.toContain(handCard);
  });
});
```

## Glossary

- **Dock** - The bottom UI bar containing hand, piles, and health
- **Pile** - A collection of cards (deck, exile, discard/graveyard)
- **Hand** - Cards currently held by the player (partially hidden from opponents)
- **Yjs Map** - CRDT data structure for synchronized state
- **Card Preview** - Enlarged view of card image on hover
- **DeckPileViewer** - Modal dialog for viewing pile contents
- **Keyboard Handler** - Module that processes keyboard shortcuts
- **Player State** - Yjs-synchronized data (health, hand, piles, counters)