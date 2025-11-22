# Aura Developer Onboarding Guide

Welcome to Aura! This guide will help you understand the codebase architecture, development workflow, and key concepts for building a collaborative Magic: The Gathering web app.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Overview](#project-overview)
3. [Architecture Overview](#architecture-overview)
4. [Module Deep Dive](#module-deep-dive)
5. [State Management](#state-management)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Development Workflow](#development-workflow)
8. [Common Tasks](#common-tasks)
9. [Debugging Tips](#debugging-tips)
10. [Code Style Guide](#code-style-guide)
11. [Known Issues and Gotchas](#known-issues-and-gotchas)

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern browser (Chrome, Firefox, Edge, Safari)
- Two browser windows/tabs for testing multiplayer

### Installation

```bash
# Clone repository
git clone <repo-url>
cd aura

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Testing Multiplayer

1. Open http://localhost:5173
2. Note the room name in the URL (e.g., `?room=abc123`)
3. Open another browser window/tab with the same URL
4. Both windows should connect (check "Connected" status in toolbar)
5. Changes in one window appear in the other

---

## Project Overview

### What is Aura?

Aura is a **peer-to-peer collaborative web app** for playing Magic: The Gathering online. Key features:

- **Real-time synchronization**: Changes sync instantly between players
- **No server state**: Uses WebRTC for direct peer-to-peer connections
- **Privacy**: Your deck and hand are private (hand visible only to you)
- **Keyboard-first**: Extensive keyboard shortcuts for fast gameplay

### Technology Stack

| Concern | Technology | Purpose |
|---------|------------|---------|
| **Language** | TypeScript 5.9 | Type safety |
| **Build Tool** | Vite | Fast dev server and bundling |
| **State Sync** | Yjs + y-webrtc | CRDT-based synchronization |
| **UI** | Vanilla JavaScript | DOM manipulation (no framework) |
| **Styling** | Plain CSS | 580 lines in `src/style.css` |
| **Signaling** | WebSocket | For WebRTC connection setup |

**Note:** Currently no UI framework (React, Vue, etc.). See `LIBRARY_RECOMMENDATIONS.md` for migration plans.

---

## Architecture Overview

### High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│                     Browser Window                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │                   index.html                       │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │            AuraApp (index.ts)               │  │  │
│  │  │                                             │  │  │
│  │  │  Creates and wires up:                     │  │  │
│  │  │  - Y.Doc (shared state)                    │  │  │
│  │  │  - WebRTCProvider (networking)              │  │  │
│  │  │  - Local Player (game logic)                │  │  │
│  │  │  - Whiteboard (battlefield UI)              │  │  │
│  │  │  - GameResourcesDock (hand/piles UI)        │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ WebRTC + Yjs
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Other Player's Browser                  │
└─────────────────────────────────────────────────────────┘
```

### Module Organization

```
src/
├── index.ts                    # Application entry point
├── style.css                   # Global styles
└── modules/
    ├── deck/                   # Local deck management
    │   ├── Deck.ts             # Shuffle, draw, card storage
    │   ├── types.ts            # Card interface
    │   └── index.ts            # Public exports
    │
    ├── player/                 # Player state (synced via Yjs)
    │   ├── Player.ts           # Health, hand, piles
    │   ├── types.ts            # PlayerState interface
    │   └── index.ts            # Public exports
    │
    ├── whiteboard/             # Battlefield (synced via Yjs)
    │   ├── Whiteboard.ts       # Card rendering and drag-drop
    │   ├── KeyboardHandler.ts  # Battlefield keyboard shortcuts
    │   ├── types.ts            # WhiteboardCard interface
    │   └── index.ts            # Public exports
    │
    ├── gameResourcesDock/      # Bottom UI (hand, piles, life)
    │   ├── GameResourcesDock.ts         # Main dock component
    │   ├── PileViewer.ts                # Modal for viewing piles
    │   ├── OpponentHealthDisplay.ts     # Opponent life totals
    │   ├── types.ts                     # Configuration types
    │   └── index.ts                     # Public exports
    │
    └── webrtc/                 # WebRTC networking
        ├── WebRTCProvider.ts   # Wrapper around y-webrtc
        ├── types.ts            # WebRTC configuration
        └── index.ts            # Public exports
```

### Data Flow

```
User Action (keyboard, mouse)
         │
         ▼
┌────────────────────┐
│  Event Handler     │  (KeyboardHandler, drag event, click)
│  (DOM event)       │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Update Yjs Map    │  yCards.set(id, newCard) or
│                    │  yPlayerState.set('hand', newHand)
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Yjs propagates    │  Sends to all connected peers
│  via WebRTC        │  (automatic, handled by y-webrtc)
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Yjs observe()     │  Modules listen for changes
│  callback fires    │  whiteboard.yCards.observe(...)
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Update DOM        │  updateCardElement(card)
│                    │  element.style.left = card.x
└────────────────────┘
```

---

## Module Deep Dive

### 1. Deck Module (`src/modules/deck/`)

**Purpose:** Manages a local-only deck of cards (not synced to other players)

#### Key Concepts

- **Private state**: Deck contents never sent to other players
- **Card structure**: Each card has `id`, `cardNumber`, `x`, `y`, `rotation`, `isTapped`, `isFlipped`, `counters[]`
- **Initialization**: Creates 60 blank cards with unique IDs

#### Important Files

**`Deck.ts`**
```typescript
export class Deck {
  private cards: Card[] = [];

  // Draw from top (LIFO - last in, first out)
  public drawCard(): Card | null {
    return this.cards.pop() ?? null;
  }

  // Shuffle using Fisher-Yates algorithm
  public shuffleDeck(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  // Add to top or bottom
  public addCardToTop(card: Card): void {
    this.cards.push(card);
  }

  public addCardToBottom(card: Card): void {
    this.cards.unshift(card);
  }
}
```

**`types.ts`**
```typescript
export interface Card {
  id: string;           // Unique identifier (e.g., "card-abc123")
  cardNumber: number;   // Persistent number 1-60 for tracking
  x: number;            // Battlefield X coordinate
  y: number;            // Battlefield Y coordinate
  rotation: number;     // Rotation in degrees (0 or 90 for tapped)
  isTapped: boolean;    // Tap state
  isFlipped: boolean;   // Face-down state
  counters: number[];   // Array of counter values [1, 1, 3, ...]
}
```

#### Common Operations

```typescript
const deck = new Deck({ initialCardCount: 60 });

// Draw a card
const card = deck.drawCard();  // Returns top card or null

// Shuffle
deck.shuffleDeck();

// Put card back on top
deck.addCardToTop(card);

// Put card on bottom
deck.addCardToBottom(card);

// Get card count
const count = deck.getCardCount();  // Returns number of cards left

// Get all cards (for viewing deck)
const allCards = deck.getCards();  // Returns readonly array
```

---

### 2. Player Module (`src/modules/player/`)

**Purpose:** Manages per-player state (health, hand, piles) **synced via Yjs**

#### Key Concepts

- **Yjs storage**: State stored in `Y.Map` at key `player-{playerId}`
- **Hybrid approach**: Deck is local-only, but hand/piles are synced
- **Privacy by convention**: Hand is synced to Yjs but UI only shows your own
- **Reactive**: Changes trigger callbacks via `onStateChange()`

#### Important Files

**`Player.ts`**
```typescript
export class Player {
  private deck: Deck;
  private yPlayerState: Y.Map<any>;  // Synced state
  private playerId: string;

  // Draws card from local deck, adds to synced hand
  public drawCard(): Card | null {
    const card = this.deck.drawCard();
    if (!card) return null;

    const hand = this.yPlayerState.get('hand') ?? [];
    this.yPlayerState.set('hand', [...hand, card]);  // Syncs to all players!
    this.yPlayerState.set(YDOC_DECK_CARD_COUNT, this.deck.getCardCount());

    return card;
  }

  // Play card from hand to battlefield (dispatches event)
  public playCardFromHand(cardId: string): void {
    const hand = this.yPlayerState.get('hand') ?? [];
    const card = hand.find(c => c.id === cardId);
    if (!card) return;

    // Remove from hand
    const newHand = hand.filter(c => c.id !== cardId);
    this.yPlayerState.set('hand', newHand);

    // Dispatch event for Whiteboard to place card
    const event = new CustomEvent('playCard', {
      detail: { card, playerId: this.playerId }
    });
    window.dispatchEvent(event);
  }
}
```

**`types.ts`**
```typescript
export interface PlayerState {
  id: string;
  health: number;              // Life total (starts at 20)
  hand: Card[];                // Cards in hand (visible only to owner in UI)
  exilePile: Card[];           // Exile zone
  discardPile: Card[];         // Graveyard
  deckCardCount: number;       // Number of cards left in deck (for opponent visibility)
}

export interface PlayerConfig {
  playerId: string;
  yDoc: Y.Doc;  // Shared Yjs document
}
```

#### Yjs State Structure

```typescript
// In Y.Doc, each player has a map:
const yDoc = new Y.Doc();
const yPlayerState = yDoc.getMap(YDOC_PLAYER(playerId));

// Structure:
{
  "player-abc123": {
    health: 20,
    hand: [{ id: "card-1", ... }, { id: "card-2", ... }],
    exilePile: [],
    discardPile: [],
    deckCardCount: 53
  },
  "player-xyz789": {
    // Other player's state
  }
}
```

#### Common Operations

```typescript
// Get current state
const state = player.getState();
console.log(state.health, state.hand.length);

// Draw cards
player.drawCard();

// Modify health
player.modifyHealth(-3);  // Take 3 damage
player.modifyHealth(5);   // Gain 5 life

// Play card from hand
player.playCardFromHand(cardId);  // Removes from hand, dispatches event

// Move cards to piles
player.placeCardInPile(card, 'discard');
player.placeCardInPile(card, 'exile');
player.moveCardToDeckTop(card);
player.moveCardToDeckBottom(card);

// Listen for state changes
player.onStateChange((newState) => {
  console.log('Health:', newState.health);
  console.log('Hand size:', newState.hand.length);
});
```

---

### 3. Whiteboard Module (`src/modules/whiteboard/`)

**Purpose:** Battlefield canvas where cards are played, moved, and interacted with

#### Key Concepts

- **Yjs storage**: All battlefield cards stored in `Y.Map` called `cards`
- **WhiteboardCard**: Extends `Card` with `zIndex` and `ownerId`
- **Coordinate system**: Absolute pixel coordinates (x, y)
- **Z-index**: Higher = on top (increments with each new card)
- **Drag-and-drop**: Native HTML5 drag API with manual coordinate tracking

#### Important Files

**`Whiteboard.ts`**
```typescript
export class Whiteboard {
  private yCards: Y.Map<WhiteboardCard>;
  private keyboardHandler: KeyboardHandler;
  private maxZIndex: number = 0;

  // Render a card as HTML element
  private createCardElement(card: WhiteboardCard): HTMLElement {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.dataset.cardId = card.id;
    cardEl.draggable = true;

    // Position with absolute coordinates
    cardEl.style.left = `${card.x}px`;
    cardEl.style.top = `${card.y}px`;
    cardEl.style.zIndex = card.zIndex.toString();

    // Tap state (rotation)
    if (card.isTapped) {
      cardEl.style.transform = 'rotate(90deg)';
    }

    // Flip state (face-down)
    if (card.isFlipped) {
      cardEl.classList.add('flipped');
    }

    // Counters
    if (card.counters.length > 0) {
      const countersEl = this.createCountersElement(card);
      cardEl.appendChild(countersEl);
    }

    // Drag handlers
    cardEl.addEventListener('mousedown', (e) => this.handleMouseDown(e, card));
    cardEl.addEventListener('mouseenter', () => this.keyboardHandler.setHoveredCard(card.id));
    cardEl.addEventListener('mouseleave', () => this.keyboardHandler.setHoveredCard(null));

    return cardEl;
  }

  // Handle drag-and-drop
  private handleMouseDown(e: MouseEvent, card: WhiteboardCard): void {
    const startX = e.clientX;
    const startY = e.clientY;
    const startCardX = card.x;
    const startCardY = card.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      // Update position (brings to front with maxZIndex + 1)
      this.yCards.set(card.id, {
        ...card,
        x: startCardX + dx,
        y: startCardY + dy,
        zIndex: ++this.maxZIndex,
      });
    };

    // ... attach/detach listeners
  }
}
```

**`KeyboardHandler.ts`**
```typescript
export class KeyboardHandler {
  private hoveredCardId: string | null = null;

  private handleKeyDown(e: KeyboardEvent): void {
    const card = this.hoveredCardId ? this.yCards.get(this.hoveredCardId) : null;

    switch (e.key.toLowerCase()) {
      case ' ':  // Space - Tap/Untap
        this.toggleTap(card);
        break;
      case 'd':  // D - Move to graveyard
        this.callbacks.onMoveToGraveyard(card);
        this.yCards.delete(card.id);  // Remove from battlefield
        break;
      // ... other shortcuts
    }
  }
}
```

**`types.ts`**
```typescript
export interface WhiteboardCard extends Card {
  zIndex: number;    // For layering (higher = on top)
  ownerId: string;   // Player who owns this card
}

export interface WhiteboardConfig {
  backgroundColor: string;  // Usually '#1a1a1a'
  width: number;            // Canvas width
  height: number;           // Canvas height
  localPlayerId: string;    // For coordinate transformation
}
```

#### Common Operations

```typescript
// Add card to battlefield (usually via playCard event)
window.addEventListener('playCard', (e: CustomEvent) => {
  const { card, playerId } = e.detail;
  whiteboard.addCard(card, playerId);  // Places at default position
});

// Cards automatically sync via Yjs
// When you drag a card, it updates in Yjs and appears for opponent

// Keyboard shortcuts (when hovering card):
// - Space: Tap/Untap
// - D: Move to graveyard
// - S: Move to exile
// - T: Move to top of deck
// - Y: Move to bottom of deck
// - H: Move to hand
// - U: Add counter
// - K: Create copy
// - F: Flip face-down/up
```

---

### 4. GameResourcesDock Module (`src/modules/gameResourcesDock/`)

**Purpose:** Bottom UI showing hand, deck, piles, and life total

#### Key Concepts

- **Layout**: Left to right: Exile, Discard, Hand, Deck, Life
- **Drag targets**: Can drag cards from hand to exile/discard
- **Click interactions**: Click pile to view contents, click +/- to modify life
- **Keyboard integration**: Tracks hover state for keyboard shortcuts

#### Important Files

**`GameResourcesDock.ts`**
```typescript
export class GameResourcesDock {
  private player: Player;
  private pileViewer: PileViewer;
  private hoveredHandCardId: string | null = null;
  private hoveredPileType: 'deck' | 'exile' | 'discard' | null = null;

  // Render hand (re-renders on every change)
  private updateHandDisplay(hand: Card[]): void {
    const handCards = this.elements.hand.querySelector('.hand-cards');
    handCards.innerHTML = '';  // Clear all cards

    hand.forEach((card) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'hand-card';
      cardEl.draggable = true;

      // Track hover for keyboard shortcuts
      cardEl.addEventListener('mouseenter', () => {
        this.hoveredHandCardId = card.id;
      });

      // Drag to battlefield or piles
      cardEl.addEventListener('dragstart', (e) => {
        this.draggedCard = { card, element: cardEl };
      });

      handCards.appendChild(cardEl);
    });
  }

  // Click pile to view contents
  private viewPile(pileType: 'deck' | 'exile' | 'discard'): void {
    const cards = this.getCardsForPile(pileType);
    this.pileViewer.show(cards, pileType);
  }
}
```

**`PileViewer.ts`** - Modal for viewing pile contents
```typescript
export class PileViewer {
  // Show pile in modal
  public show(cards: Card[], pileType: PileType): void {
    const modal = this.createModal(cards, pileType);
    document.body.appendChild(modal);

    // Keyboard shortcuts work inside modal
    // - Z: Play card to battlefield
    // - H: Move card to hand
    // - D: Move to graveyard
    // - S: Move to exile
    // - Escape: Close modal
  }
}
```

**`OpponentHealthDisplay.ts`** - Opponent life totals in top-right
```typescript
export class OpponentHealthDisplay {
  // Polls for new players every 1 second
  private setupObservers(): void {
    const checkForPlayers = () => {
      this.yDoc.share.forEach((value, key) => {
        if (key.startsWith('player-') && key !== `player-${this.localPlayerId}`) {
          const playerId = key.replace('player-', '');
          this.createOpponentHealthElement(playerId);
        }
      });
    };

    setInterval(checkForPlayers, 1000);  // Poll every second
  }
}
```

#### Common Operations

```typescript
// Hand operations (automatic via Player state changes)
// Dock listens to player.onStateChange() and re-renders

// Click pile to view
// User clicks exile pile → viewPile('exile') → PileViewer opens

// Drag from hand to battlefield
// User drags hand card → drop on whiteboard → playCardFromHand()

// Drag from hand to pile
// User drags hand card → drop on exile/discard → placeCardInPile()
```

---

### 5. WebRTC Module (`src/modules/webrtc/`)

**Purpose:** Peer-to-peer connection layer using WebRTC and Yjs

#### Key Concepts

- **y-webrtc**: Library that handles WebRTC connections for Yjs
- **Signaling server**: WebSocket server for initial connection setup
- **STUN/TURN servers**: Help establish connections through NAT/firewalls
- **Room-based**: Players in same room name connect automatically

#### Important Files

**`WebRTCProvider.ts`**
```typescript
import { WebrtcProvider } from 'y-webrtc';

export class WebRTCProvider {
  private provider: WebrtcProvider;

  constructor(yDoc: Y.Doc, config: WebRTCConfig) {
    this.provider = new WebrtcProvider(config.roomName, yDoc, {
      signaling: config.signalingServers,
      iceServers: config.iceServers,
    });

    // Listen for connection status
    this.provider.on('status', ({ connected }) => {
      this.config.onStatusChange?.({
        isConnected: connected,
        peersCount: this.provider.room?.provider?.peers?.size ?? 0,
      });
    });
  }
}
```

**`types.ts`**
```typescript
export interface WebRTCConfig {
  roomName: string;                    // Room identifier (from URL param)
  signalingServers?: string[];         // WebSocket URLs for signaling
  iceServers?: RTCIceServer[];         // STUN/TURN server config
  onStatusChange?: (status: ConnectionStatus) => void;
}
```

#### Default Configuration

```typescript
// Default signaling server (Railway.app deployment)
const DEFAULT_SIGNALING = [
  'wss://aura-signaling-production.up.railway.app'
];

// Default STUN servers (for NAT traversal)
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' }
];
```

#### Connection Flow

```
1. Browser loads with ?room=abc123
2. Creates Y.Doc
3. Creates WebRTCProvider(roomName="abc123", yDoc)
4. Connects to signaling server via WebSocket
5. Signaling server broadcasts "new peer in room abc123"
6. Other peers receive message and initiate WebRTC handshake
7. STUN servers help establish direct P2P connection
8. Once connected, Yjs syncs state over WebRTC data channel
```

---

## State Management

### What Gets Synced vs What Stays Local

| Data | Storage | Synced? | Why |
|------|---------|---------|-----|
| **Battlefield cards** | `yDoc.getMap(YDOC_CARDS_ON_BOARD)` | ✓ Yes | All players see all cards |
| **Your hand** | `yDoc.getMap(YDOC_PLAYER(id)).hand` | ✓ Yes | *Trust-based privacy* |
| **Your deck** | `Deck` class (local) | ✗ No | **Private** to you |
| **Deck count** | `yDoc.getMap(YDOC_PLAYER(id)).deckCardCount` | ✓ Yes | Opponents see your deck size |
| **Life total** | `yDoc.getMap(YDOC_PLAYER(id)).health` | ✓ Yes | All players see all life |
| **Exile/Graveyard** | `yDoc.getMap(YDOC_PLAYER(id)).exilePile` | ✓ Yes | Public zones |

### Privacy Considerations

**Current Security Model: Trust-Based**

- All data stored in Yjs is visible to all peers
- Hand is synced but UI only shows your own
- A malicious client could inspect Yjs and see opponent hands
- **Not suitable for untrusted players**

**Future Improvements:**
- Server-side validation for competitive play
- Encrypted hand storage
- Cryptographic deck shuffling

### Yjs Observability

```typescript
// Listen for changes to any Yjs map
const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);

yCards.observe((event) => {
  event.changes.keys.forEach((change, key) => {
    if (change.action === 'add') {
      const card = yCards.get(key);
      console.log('Card added:', card);
    } else if (change.action === 'update') {
      const card = yCards.get(key);
      console.log('Card updated:', card);
    } else if (change.action === 'delete') {
      console.log('Card deleted:', key);
    }
  });
});
```

### Common Yjs Operations

```typescript
// Get a map from the document
const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
const yPlayerState = yDoc.getMap(YDOC_PLAYER(playerId));

// Set a value (triggers sync to all peers)
yCards.set('card-abc123', {
  id: 'card-abc123',
  x: 100,
  y: 200,
  // ... other fields
});

// Get a value
const card = yCards.get('card-abc123');

// Delete a value
yCards.delete('card-abc123');

// Get all keys
const allCardIds = Array.from(yCards.keys());

// Iterate all entries
yCards.forEach((card, cardId) => {
  console.log(cardId, card);
});
```

---

## Keyboard Shortcuts

### Complete Shortcut Reference

#### Battlefield Cards (hover card on battlefield)
- **Space**: Tap/Untap
- **H**: Move to hand
- **T**: Move to top of deck
- **Y**: Move to bottom of deck
- **D**: Move to graveyard
- **S**: Move to exile
- **U**: Add counter (+1/+1)
- **K**: Create copy (duplicate at offset position)
- **F**: Flip face-down/face-up

#### Hand Cards (hover card in hand)
- **Z**: Play to battlefield
- **T**: Move to top of deck
- **Y**: Move to bottom of deck
- **D**: Move to graveyard
- **S**: Move to exile

#### Piles (hover deck/exile/discard)
- **Z**: Play top card to battlefield
- **H**: Move top card to hand
- **T**: Move top card to top of deck *(skipped if already hovering deck)*
- **Y**: Move top card to bottom of deck *(skipped if already hovering deck)*
- **D**: Move top card to discard *(skipped if already hovering discard)*
- **S**: Move top card to exile *(skipped if already hovering exile)*

#### Global Shortcuts (no hover required)
- **C**: Draw card
- **X**: Untap all your cards
- **V**: Shuffle your deck
- **E**: End turn *(placeholder, not implemented)*

### Keyboard Implementation Architecture

**Problem:** Shortcuts are split across 3 files:
1. `KeyboardHandler.ts` - Battlefield cards
2. `GameResourcesDock.ts` - Exposes hover state via global function
3. `PileViewer.ts` - Shortcuts inside modal

**How It Works:**

```typescript
// 1. GameResourcesDock exposes hover state globally
(window as any).getGameResourcesDockHoverState = () => {
  return {
    hoveredHandCardId: this.hoveredHandCardId,
    hoveredPileType: this.hoveredPileType,
    getHandCard: (cardId) => { ... },
    moveHandCardToDiscard: (cardId) => { ... },
    // ... other methods
  };
};

// 2. KeyboardHandler checks multiple sources
private handleKeyDown(e: KeyboardEvent): void {
  const battlefieldCard = this.yCards.get(this.hoveredCardId);
  const dockState = (window as any).getGameResourcesDockHoverState();

  // Priority:
  // 1. Battlefield card (if hovering)
  // 2. Dock card/pile (if hovering hand or pile)
  // 3. Global shortcuts (no hover)

  if (battlefieldCard) {
    this.handleBattlefieldCardShortcuts(key, battlefieldCard, e);
  } else if (dockState?.hoveredHandCardId || dockState?.hoveredPileType) {
    this.handleDockShortcuts(key, dockState, e);
  } else {
    this.handleGlobalShortcuts(key, e);
  }
}
```

### Adding New Shortcuts

**Example: Add "R" to reveal top card of deck**

1. **Add method to GameResourcesDock.ts:**
```typescript
// Inside setupKeyboardShortcuts()
revealTopCard: () => {
  const deckCards = this.player.getDeckCards();
  if (deckCards.length > 0) {
    const topCard = deckCards[deckCards.length - 1];
    alert(`Top card: #${topCard.cardNumber}`);
  }
}
```

2. **Add keyboard handler in KeyboardHandler.ts:**
```typescript
// Inside handleDockShortcuts() pile section
case 'r': // R - Reveal top card
  if (pileType === 'deck') {
    e.preventDefault();
    dockState.revealTopCard();
  }
  break;
```

---

## Development Workflow

### Starting Development

```bash
# Install dependencies (first time only)
npm install

# Start dev server (auto-opens browser)
npm run dev

# Server runs at http://localhost:5173
```

### Testing Changes

**Single Player Testing:**
1. Make code changes
2. Vite auto-reloads browser
3. Test functionality

**Multiplayer Testing:**
1. Open first browser window at http://localhost:5173
2. Copy the full URL (includes `?room=...`)
3. Open second browser window/tab with same URL
4. Check "Connected" status in both windows
5. Test synchronization

**Testing with Different Browsers:**
```bash
# Option 1: Use different browser profiles
# Chrome: --user-data-dir=/tmp/chrome-test

# Option 2: Use private/incognito windows
# Cmd+Shift+N (Chrome/Edge) or Cmd+Shift+P (Firefox)

# Option 3: Use different browsers entirely
# Chrome + Firefox, Chrome + Safari, etc.
```

### Building for Production

```bash
# Type-check and build
npm run build

# Output goes to dist/ folder
# dist/index.html
# dist/assets/index-[hash].js
# dist/assets/index-[hash].css

# Preview production build locally
npm run preview
```

### Development Tips

**Hot Module Replacement (HMR):**
- Vite supports HMR for CSS changes
- TypeScript changes require full page reload
- Yjs state persists across reloads (keeps connection)

**Browser DevTools:**
- Use Chrome/Firefox DevTools Console for debugging
- Check Network tab for WebRTC connection status
- Use Application tab to inspect local storage (Yjs uses IndexedDB)

**Common Development Commands:**
```bash
# Check TypeScript errors
npx tsc --noEmit

# Format code (if using Prettier)
npx prettier --write "src/**/*.{ts,css}"

# Check bundle size
npm run build
ls -lh dist/assets/
```

---

## Common Tasks

### Adding a New Card Property

**Example: Add "power" and "toughness" to cards**

1. **Update type definition** (`src/modules/deck/types.ts`):
```typescript
export interface Card {
  // ... existing fields
  power?: number;      // e.g., 3
  toughness?: number;  // e.g., 3
}
```

2. **Initialize in Deck** (`src/modules/deck/Deck.ts`):
```typescript
private initializeDeck(): void {
  for (let i = 0; i < this.config.initialCardCount; i++) {
    this.cards.push({
      // ... existing fields
      power: undefined,      // No P/T for blank cards
      toughness: undefined,
    });
  }
}
```

3. **Display in UI** (`src/modules/whiteboard/Whiteboard.ts`):
```typescript
private createCardElement(card: WhiteboardCard): HTMLElement {
  const cardEl = document.createElement('div');
  // ... existing code

  // Add P/T display if present
  if (card.power !== undefined && card.toughness !== undefined) {
    const ptEl = document.createElement('div');
    ptEl.className = 'card-pt';
    ptEl.textContent = `${card.power}/${card.toughness}`;
    cardEl.appendChild(ptEl);
  }

  return cardEl;
}
```

4. **Add styles** (`src/style.css`):
```css
.card-pt {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}
```

### Adding a New Zone (e.g., Command Zone)

1. **Update PlayerState type** (`src/modules/player/types.ts`):
```typescript
export interface PlayerState {
  // ... existing fields
  commandZone: Card[];  // Add new zone
}
```

2. **Initialize in Player** (`src/modules/player/Player.ts`):
```typescript
constructor(config: PlayerConfig) {
  // ... existing code
  this.yPlayerState.set('commandZone', []);  // Initialize empty
}
```

3. **Add methods** (`src/modules/player/Player.ts`):
```typescript
public moveCardToCommandZone(card: Card): void {
  const commandZone = this.yPlayerState.get('commandZone') ?? [];
  this.yPlayerState.set('commandZone', [...commandZone, card]);
}

public getCommandZone(): Card[] {
  return this.yPlayerState.get('commandZone') ?? [];
}
```

4. **Add UI** (`src/modules/gameResourcesDock/GameResourcesDock.ts`):
```typescript
private createCommandZoneElement(): HTMLElement {
  const commandZone = document.createElement('div');
  commandZone.className = 'resource-pile command-zone-pile';
  // ... similar to other piles
  return commandZone;
}
```

5. **Add styles** (`src/style.css`):
```css
.command-zone-pile {
  background-color: #1a1a1a;
  border: 2px solid #f59e0b; /* Orange for command zone */
  color: #f59e0b;
}
```

### Understanding Card Flow: Hand to Battlefield

**How cards move from GameResourcesDock to Whiteboard**

This section documents the complete flow of dragging a card from hand onto the battlefield.

#### Step 1: Drag Start (GameResourcesDock.ts:326-341)

When a player starts dragging a card from their hand:

```typescript
// In updateHandDisplay(), each hand card gets drag event listeners
cardEl.addEventListener('dragstart', (e) => {
  this.cardPreview.hide();  // Hide preview to prevent visual bug
  this.draggedCard = { card, element: cardEl };
  cardEl.classList.add('dragging');

  // Center the drag image under cursor for accurate drop positioning
  const rect = cardEl.getBoundingClientRect();
  const offsetX = rect.width / 2;
  const offsetY = rect.height / 2;
  e.dataTransfer!.setDragImage(cardEl, offsetX, offsetY);

  e.dataTransfer!.effectAllowed = 'move';
  e.dataTransfer!.setData('text/plain', card.id); // Pass card ID via drag data
});
```

**Key details:**
- `this.draggedCard` stores reference to card being dragged (local to GameResourcesDock)
- Drag image is centered under cursor so drop position is accurate
- Only the `card.id` is transferred via `dataTransfer` (not the full card object)

#### Step 2: Drop on Whiteboard (index.ts:184-215)

The whiteboard container listens for drop events:

```typescript
// In setupEventListeners()
whiteboardContainer.addEventListener('drop', async (e) => {
  e.preventDefault();
  const cardId = e.dataTransfer?.getData('text/plain');
  if (!cardId) return;

  // Try to play the card from hand (removes from hand, returns card object)
  const card = this.localPlayer.playCardFromHand(cardId);
  if (card) {
    // Position card at drop location (subtract half-width/height for centering)
    card.x = e.clientX - ((CARD_WIDTH / 2) * this.whiteboard.getZoomLevel());
    card.y = e.clientY - ((CARD_HEIGHT / 2) * this.whiteboard.getZoomLevel()) - 60;
    this.whiteboard.addCard(card, this.playerId);

    // Token creation (optional, if card has associated tokens)
    if (card.scryfallId) {
      const result = await this.tokenService.createTokensForCard(
        card.scryfallId,
        { x: card.x, y: card.y }
      );
      result.tokens.forEach(token => {
        this.whiteboard.addCard(token, this.playerId);
      });
    }
  }
});
```

**Key details:**
- `e.clientX` and `e.clientY` are the mouse coordinates at drop time
- Card position is adjusted by subtracting half the card dimensions (accounts for centered drag image)
- The `- 60` in the Y coordinate accounts for the dock height at bottom of screen
- Zoom level affects positioning (cards are larger when zoomed in)

#### Step 3: Remove from Hand (Player.ts:119-130)

`playCardFromHand()` removes the card from the synced hand state:

```typescript
public playCardFromHand(cardId: string): Card | null {
  const hand = this.yPlayerState.get('hand') ?? [];
  const cardIndex = hand.findIndex((c: Card) => c.id === cardId);

  if (cardIndex === -1) return null;

  const card = hand[cardIndex];
  const newHand = [...hand.slice(0, cardIndex), ...hand.slice(cardIndex + 1)];
  this.yPlayerState.set('hand', newHand); // Update Yjs state (syncs to all peers)

  return card;
}
```

**Key details:**
- Creates new array without the card (immutable update pattern)
- Setting `yPlayerState.set('hand', newHand)` triggers Yjs observer
- Observer in GameResourcesDock updates UI to remove card from hand display
- Returns the card object so caller can add it to battlefield

#### Step 4: Add to Battlefield (Whiteboard.ts:104-112)

`addCard()` adds the card to the shared battlefield state:

```typescript
public addCard(card: Card, ownerId: string): void {
  const whiteboardCard: WhiteboardCard = {
    ...card,              // Spread all Card properties
    zIndex: ++this.maxZIndex,  // Increment and assign z-index (newest card on top)
    ownerId,              // Track which player owns this card
  };

  this.yCards.set(card.id, whiteboardCard); // Add to shared Yjs map
}
```

**Key details:**
- Converts `Card` to `WhiteboardCard` by adding `zIndex` and `ownerId`
- `++this.maxZIndex` ensures this card appears on top of all others
- Setting `yCards.set()` triggers Yjs observer in all connected peers
- Observer calls `updateCardElement()` to render the card

#### Step 5: Render on Battlefield (Whiteboard.ts:76-102)

The Yjs observer detects the new card and renders it:

```typescript
// In setupYjsSync()
this.yCards.observe((event) => {
  event.changes.keys.forEach((change, key) => {
    if (change.action === 'add' || change.action === 'update') {
      const card = this.yCards.get(key);
      if (card) {
        // Sync maxZIndex across peers (critical for z-ordering)
        if (card.zIndex > this.maxZIndex) {
          this.maxZIndex = card.zIndex;
        }
        this.updateCardElement(card); // Create or update DOM element
      }
    } else if (change.action === 'delete') {
      this.removeCardElement(key);
    }
  });
});
```

**Key details:**
- Observer fires on ALL peers when card is added
- `maxZIndex` is synchronized from observed cards (prevents z-index conflicts)
- `updateCardElement()` creates a new DOM element if one doesn't exist
- All players see the same card at the same position

#### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User drags card from hand                                    │
│    GameResourcesDock.ts:326 (dragstart event)                   │
│    - Stores draggedCard reference                               │
│    - Sets dataTransfer with card.id                             │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. User drops card on whiteboard                                │
│    index.ts:184 (drop event on whiteboard container)            │
│    - Reads card.id from dataTransfer                            │
│    - Calculates drop position (e.clientX, e.clientY)            │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Remove card from hand                                        │
│    Player.ts:119 (playCardFromHand)                             │
│    - Finds card in hand array                                   │
│    - Creates new hand array without card                        │
│    - Updates yPlayerState.set('hand', newHand)                  │
│    - Returns card object                                        │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Add card to battlefield                                      │
│    Whiteboard.ts:104 (addCard)                                  │
│    - Converts Card → WhiteboardCard                             │
│    - Assigns card.x, card.y (from drop event)                   │
│    - Assigns zIndex = ++maxZIndex                               │
│    - Assigns ownerId                                            │
│    - Updates yCards.set(card.id, whiteboardCard)                │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Render card on battlefield (ALL PEERS)                       │
│    Whiteboard.ts:78 (yCards.observe)                            │
│    - Observer detects 'add' action                              │
│    - Syncs maxZIndex from card.zIndex                           │
│    - Calls updateCardElement(card)                              │
│    - Creates DOM element at card.x, card.y                      │
└─────────────────────────────────────────────────────────────────┘
```

#### Alternative Entry Points

Cards can also enter the battlefield from:

1. **Piles (exile/discard)** - via `handlePileCardToBattlefield()` in GameResourcesDock.ts:369
   - Removes card from pile array in `yPlayerState`
   - Dispatches `playCard` CustomEvent with card data
   - Event listener in `index.ts` (not shown) would call `whiteboard.addCard()`

2. **Deck** - via keyboard shortcuts or pile viewer
   - Draws card using `player.drawCard()` (moves to hand)
   - OR directly plays to battlefield via `movePileCardToBattlefield()` (GameResourcesDock.ts:549)

3. **Keyboard shortcut (Space)** - when hovering hand card
   - Calls `playHandCardToBattlefield()` exposed by GameResourcesDock (line 510)
   - Same flow as drag-and-drop but position is centered on screen

### Adding a New Keyboard Shortcut

**Example: Add "G" to show graveyard**

1. **Add action method** (`src/modules/gameResourcesDock/GameResourcesDock.ts`):
```typescript
// Inside setupKeyboardShortcuts()
showGraveyard: () => {
  this.viewPile('discard');  // Open discard pile viewer
}
```

2. **Add keyboard case** (`src/modules/whiteboard/KeyboardHandler.ts`):
```typescript
// Inside handleKeyDown() global shortcuts section
case 'g': // G - Show graveyard
  e.preventDefault();
  const getDockState = (window as any).getGameResourcesDockHoverState;
  const dockState = getDockState ? getDockState() : null;
  if (dockState) {
    dockState.showGraveyard();
  }
  break;
```

3. **Update README** (`README.md`):
```markdown
- **G**: View graveyard
```

### Debugging Yjs Synchronization Issues

**Problem: Changes not syncing between players**

1. **Check connection status:**
```typescript
// In browser console
console.log(webrtcProvider.provider.connected);
console.log(webrtcProvider.provider.room?.peers?.size);
```

2. **Log Yjs operations:**
```typescript
yDoc.on('update', (update) => {
  console.log('Yjs update:', update);
});
```

3. **Inspect Yjs state:**
```typescript
// In browser console
const yCards = window.yDoc.getMap(YDOC_CARDS_ON_BOARD);
console.log('All cards:', Array.from(yCards.entries()));
```

4. **Check for errors:**
- Open Browser DevTools Console
- Look for red error messages
- Check Network tab for failed WebSocket connections

**Problem: Cards disappearing**

This was a **maxZIndex bug** (fixed in past commits). If it happens again:

1. **Check zIndex sync:**
```typescript
// In Whiteboard.ts setupYjsSync()
yCards.observe((event) => {
  event.changes.keys.forEach((change, key) => {
    const card = yCards.get(key);
    if (card && card.zIndex > this.maxZIndex) {
      this.maxZIndex = card.zIndex;  // Must update maxZIndex!
    }
  });
});
```

---

## Debugging Tips

### Inspecting Yjs State

**Browser Console Utilities:**

```javascript
// Get the Yjs document (if exposed globally)
const yDoc = window.yDoc;

// View all cards on battlefield
const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
console.table(Array.from(yCards.values()));

// View player state
const yPlayer = yDoc.getMap(YDOC_PlAYER(playerId));  // Replace with actual ID
console.log('Health:', yPlayer.get(YSTATE_HEALTH));
console.log('Hand:', yPlayer.get('hand'));
console.log('Deck count:', yPlayer.get(YSTATE_DECK_CARD_COUNT));

// View all players
yDoc.share.forEach((value, key) => {
   if (key.startsWith('player-')) {
      console.log(key, value.toJSON());
   }
});
```

### Logging Best Practices

**Add debug logging:**
```typescript
// Use console.group for cleaner logs
console.group('Player Action');
console.log('Action:', 'drawCard');
console.log('Card:', card);
console.log('New hand size:', newHand.length);
console.groupEnd();
```

**Conditional logging:**
```typescript
const DEBUG = false;  // Set to true for debug logs

if (DEBUG) {
  console.log('Yjs update:', card);
}
```

### Common Issues and Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Not syncing** | Changes don't appear for opponent | Check WebRTC connection status |
| **Cards disappearing** | Cards vanish after drawing | Check maxZIndex syncing in observe() |
| **Keyboard shortcuts not working** | Keys do nothing | Check hover state tracking |
| **Hand not updating** | Hand doesn't refresh visually | Check onStateChange callback |
| **Modal won't close** | Can't close pile viewer | Check Escape key handler |
| **Drag doesn't work** | Can't drag cards | Check draggable attribute |
| **Performance slow** | Laggy with many cards | Consider Canvas rendering |

---

## Code Style Guide

### TypeScript Conventions

**Naming:**
```typescript
// Classes: PascalCase
class GameResourcesDock { }

// Interfaces: PascalCase with 'I' prefix optional
interface Card { }
interface PlayerState { }

// Functions/methods: camelCase
function drawCard() { }
private updateHandDisplay() { }

// Constants: UPPER_SNAKE_CASE
const DEFAULT_SIGNALING_SERVER = '...';

// Private fields: camelCase with leading underscore optional
private hoveredCardId: string | null;
```

**File Organization:**
```typescript
// 1. Imports
import * as Y from 'yjs';
import { Card } from '../deck';

// 2. Interfaces/Types
export interface WhiteboardConfig { }

// 3. Constants
const CARD_WIDTH = 63;
const CARD_HEIGHT = 88;

// 4. Class
export class Whiteboard {
  // 4a. Private fields
  private yCards: Y.Map<WhiteboardCard>;

  // 4b. Constructor
  constructor(config: WhiteboardConfig) { }

  // 4c. Public methods
  public addCard(card: Card): void { }

  // 4d. Private methods
  private createCardElement(card: Card): HTMLElement { }
}
```

### CSS Conventions

**Class Naming (BEM-like):**
```css
/* Block */
.game-resources-dock { }

/* Element */
.game-resources-dock__pile { }
.game-resources-dock__health { }

/* Modifier */
.game-resources-dock--hidden { }

/* Shortened version used in codebase: */
.resource-pile { }
.hand-card { }
.pile-viewer-modal { }
```

**Color Variables (Future Enhancement):**
```css
/* Consider switching to CSS variables */
:root {
  --color-exile: #8b5cf6;
  --color-discard: #ef4444;
  --color-deck: #3b82f6;
  --color-health: #10b981;
  --card-width: 63px;
  --card-height: 88px;
}

.exile-pile {
  border-color: var(--color-exile);
  color: var(--color-exile);
}
```

### Comment Style

**File Headers:**
```typescript
/**
 * Whiteboard.ts
 *
 * Manages the battlefield canvas where cards are played and interacted with.
 * Handles card rendering, drag-and-drop, and synchronization via Yjs.
 */
```

**Method Comments:**
```typescript
/**
 * Draws a card from the top of the deck and adds it to the hand.
 * Updates both local deck state and synced hand state in Yjs.
 *
 * @returns The drawn card, or null if deck is empty
 */
public drawCard(): Card | null {
  // Implementation
}
```

**Inline Comments:**
```typescript
// GOOD: Explain WHY, not WHAT
// Fisher-Yates shuffle ensures uniform distribution
for (let i = this.cards.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
}

// BAD: Just describes the code
// Loop through cards and swap them randomly
```

---

## Known Issues and Gotchas

### 1. Coordinate Transformation Disabled

**File:** `src/modules/whiteboard/Whiteboard.ts`

**Issue:** The coordinate transformation that should mirror opponent cards is currently disabled:

```typescript
private transformCoordinates(card: WhiteboardCard): { x: number; y: number } {
  if (card.ownerId === this.config.localPlayerId) {
    return { x: card.x, y: card.y };
  } else {
    return {
      x: card.x,  // Should be: width - card.x
      y: card.y,  // Should be: height - card.y
    };
  }
}
```

**Impact:** Cards appear at same position for all players (not mirrored)

**Fix:** Uncomment the transformation or implement proper mirroring

---

### 2. Trust-Based Privacy

**Issue:** Hand is synced to all players via Yjs but hidden in UI

**Impact:** Malicious client can inspect Yjs state and see opponent hands

**Mitigation:** Currently acceptable for trusted friends, not for competitive play

**Future Fix:** Implement server-side validation or encrypted hand storage

---

### 3. Polling-Based Opponent Discovery

**File:** `src/modules/gameResourcesDock/OpponentHealthDisplay.ts`

**Issue:** Polls every 1 second for new players instead of using Yjs observers

```typescript
setInterval(checkForPlayers, 1000);  // Inefficient
```

**Impact:** 1-second latency to see new opponents join

**Fix:** Use Yjs document observers:
```typescript
yDoc.on('update', () => {
  checkForPlayers();  // Reactive, instant
});
```

---

### 4. Hand Re-render Performance

**File:** `src/modules/gameResourcesDock/GameResourcesDock.ts`

**Issue:** Full hand re-render on every card change

```typescript
handCards.innerHTML = '';  // Deletes all DOM elements
hand.forEach(card => {
  // Re-creates all elements and event listeners
});
```

**Impact:** Performance degrades with large hands (10+ cards)

**Fix:** Incremental DOM updates or migrate to React

---

### 5. Magic Numbers Throughout

**Issue:** Hardcoded values scattered in code

```typescript
// Card dimensions
const width = 63;   // Should be CARD_WIDTH constant
const height = 88;  // Should be CARD_HEIGHT constant

// Default positions
x: 100,  // Should be named constant
y: 100,
```

**Fix:** Extract to constants file:
```typescript
// src/constants.ts
export const CARD_WIDTH = 63;
export const CARD_HEIGHT = 88;
export const DEFAULT_CARD_X = 100;
export const DEFAULT_CARD_Y = 100;
```

---

### 6. Error Handling Missing

**Issue:** No try-catch blocks for WebRTC failures or Yjs errors

**Impact:** Silent failures, hard to debug

**Fix:** Add error boundaries:
```typescript
try {
  webrtcProvider = new WebRTCProvider(yDoc, config);
} catch (error) {
  console.error('Failed to connect:', error);
  alert('Connection failed. Please check your network.');
}
```

---

### 7. No Testing Infrastructure

**Issue:** No unit tests, integration tests, or E2E tests

**Impact:** Regressions go unnoticed, hard to refactor confidently

**Fix:** See `LIBRARY_RECOMMENDATIONS.md` for Vitest setup

---

## Next Steps

### Recommended First Tasks for New Developers

1. **Fix a small bug** (e.g., opponent health polling → observers)
2. **Add a small feature** (e.g., "R" shortcut to reveal top card)
3. **Write your first test** (e.g., Deck.shuffleDeck() test)
4. **Improve documentation** (e.g., add JSDoc comments)

### Learning Resources

**Yjs Documentation:**
- https://docs.yjs.dev/
- CRDT concepts: https://crdt.tech/

**WebRTC Basics:**
- https://webrtc.org/getting-started/overview
- MDN WebRTC API: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API

**TypeScript:**
- https://www.typescriptlang.org/docs/

**Vite:**
- https://vitejs.dev/guide/

---

## Getting Help

**Debugging Checklist:**
1. Check browser console for errors
2. Verify WebRTC connection status
3. Inspect Yjs state in console
4. Test with single player first
5. Test with multiple browsers

**Common Questions:**

**Q: How do I add a new card property?**
A: Update `Card` interface, initialize in `Deck.ts`, display in `Whiteboard.ts`

**Q: Why isn't my keyboard shortcut working?**
A: Check hover state tracking and ensure key isn't already used

**Q: How do I test multiplayer?**
A: Open two browser windows with same room URL

**Q: Can I use a different signaling server?**
A: Yes, update `DEFAULT_SIGNALING` in `WebRTCProvider.ts`

**Q: How do I deploy this?**
A: Build with `npm run build`, deploy `dist/` folder to static host (Netlify, Vercel, etc.)

---

Welcome to the team! If you have questions, feel free to ask or check the `LIBRARY_RECOMMENDATIONS.md` for improvement ideas.