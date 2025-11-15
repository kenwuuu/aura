# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Most important - "Did Someone Already Do This?"

One of the most important skills in programming is knowing when NOT to write code. Before implementing any functionality, ask yourself two critical questions:
The Two Golden Questions
1. "Has someone else already done this?" - Check for existing libraries and tools in our package.json
2. "Have I already done this?" - Look for code duplication in your codebase using keywords, but do not expend too many tokens
reading files. Search smartly.

Do not be afraid to install popular libraries to reduce the need to write new code.

## Essential Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:5173 (auto-opens browser)
npm run build        # Type-check with tsc, then build with Vite
npm run preview      # Preview production build locally

# Type checking only
npx tsc --noEmit     # Check for TypeScript errors without building
```

## Project Overview

Aura is a **peer-to-peer Magic: The Gathering collaboration app** using WebRTC (via Yjs and y-webrtc) for real-time state synchronization. The app has no backend server for game state - all synchronization happens peer-to-peer through WebRTC data channels.

**Key Technologies:**
- **Vite** - Build tool with hot module replacement
- **TypeScript** - Type-safe code throughout
- **Yjs** - CRDT-based state synchronization library
- **y-webrtc** - WebRTC provider for Yjs (peer-to-peer networking)
- **React**

**Love Libraries:** Whenever possible, we like to use popular and well supported libraries. For example, UI
component libraries like shadcn, or helpful libraries like Tailwind CSS and GSAP. Or GitHub hotkeys.


## ⚠️ IMPORTANT: Prefer React for New Code

**When adding new features or refactoring existing code, ALWAYS prefer React over vanilla JavaScript:**

- React provides better state management and reactivity
- Eliminates manual DOM manipulation bugs
- Makes code more maintainable and testable

**Migration Strategy:**
1. New features should be written as React components
2. Gradually refactor existing modules to React
3. Use React with Yjs via `y-react` bindings
4. Keep Yjs as the single source of truth

**Example Pattern:**
```typescript
// ✅ GOOD: React component with Yjs
import { useY } from 'y-react';

function Whiteboard({ yDoc }) {
  const yCards = useY(yDoc.getMap(YDOC_CARDS_ON_BOARD));

  return (
    <div className="whiteboard">
      {Array.from(yCards.entries()).map(([id, card]) => (
        <Card key={id} card={card} />
      ))}
    </div>
  );
}

// ❌ AVOID: Vanilla JS with manual DOM updates
function updateCardElement(card) {
  const el = document.querySelector(`[data-id="${card.id}"]`);
  el.style.left = `${card.x}px`;
  // ... more manual DOM updates
}
```

## Architecture: Modular Design

The codebase is organized into **independently replaceable modules** with clear interfaces:

```
src/
├── index.ts                    # Entry point - wires everything together
├── style.css                   # Global styles (580 lines)
└── modules/
    ├── deck/                   # Local deck management (not synced)
    ├── player/                 # Per-player state (synced via Yjs)
    ├── whiteboard/             # Battlefield canvas (synced via Yjs)
    ├── gameResourcesDock/      # Bottom UI (hand, piles, life)
    └── webrtc/                 # WebRTC networking wrapper
```

### Module Communication Patterns

**1. Yjs for State Synchronization**
- Battlefield cards: `yDoc.getMap(YDOC_CARDS_ON_BOARD)` - shared across all players
- Player state: `yDoc.getMap('player-{id}')` - one per player
- Changes to any Yjs map automatically sync to all connected peers

**2. CustomEvents for Cross-Module Actions**
```typescript
// Player plays card from hand → Whiteboard needs to render it
window.dispatchEvent(new CustomEvent('playCard', {
  detail: { card, playerId }
}));
```

**3. Global Functions for Keyboard Integration**
```typescript
// GameResourcesDock exposes hover state for KeyboardHandler
(window as any).getGameResourcesDockHoverState = () => {
  return { hoveredHandCardId, hoveredPileType, /* methods */ };
};
```

**4. Callbacks for Reactive Updates**
```typescript
// Player state changes trigger UI updates
player.onStateChange((newState) => {
  // Update dock UI
});
```

## Critical Architectural Concepts

### 1. Yjs State Structure

```typescript
// Y.Doc contains multiple maps:
yDoc = {
  "cards": {                      // Shared battlefield
    "card-abc": { id, x, y, zIndex, ownerId, ... },
    "card-xyz": { ... }
  },
  "player-alice123": {            // Per-player state
    health: 20,
    hand: [card1, card2],         // Private in UI only (trust-based)
    exilePile: [],
    discardPile: [],
    deckCardCount: 53
  },
  "player-bob456": { ... }        // Other player
}
```

**Key Insight:** Everything in Yjs is visible to all peers. Privacy (like hands) is **enforced by UI convention only** - the data is technically accessible to any peer.

### 2. Local vs Synced State

| Data | Storage | Synced? | Reason |
|------|---------|---------|--------|
| Deck contents | `Deck` class (local) | ❌ No | Private to player |
| Deck count | Yjs `player-{id}.deckCardCount` | ✅ Yes | Opponents see your deck size |
| Hand | Yjs `player-{id}.hand` | ✅ Yes | *Trust-based privacy* |
| Battlefield cards | Yjs `cards` map | ✅ Yes | All players see all cards |
| Life total | Yjs `player-{id}.health` | ✅ Yes | Public information |
| Exile/Graveyard | Yjs `player-{id}.exilePile/discardPile` | ✅ Yes | Public zones |

### 3. Card Identity and Lifecycle

**Card Structure:**
```typescript
interface Card {
  id: string;           // Unique ID (e.g., "card-abc123")
  cardNumber: number;   // Persistent 1-60 number for tracking
  x: number;            // Battlefield coordinates
  y: number;
  rotation: number;     // 0 or 90 (for tapped state)
  isTapped: boolean;
  isFlipped: boolean;   // Face-down state
  counters: number[];   // Array like [1, 1, 3] representing counters
}

interface WhiteboardCard extends Card {
  zIndex: number;       // Layering (higher = on top)
  ownerId: string;      // Which player owns this card
}
```

**Lifecycle:**
1. **Deck (local)** - Card exists only in local `Deck` instance
2. **Hand (synced)** - `drawCard()` moves card from deck to `yPlayerState.hand`
3. **Battlefield (synced)** - `playCardFromHand()` removes from hand, adds to `yCards` map
4. **Piles (synced)** - Card can move to exile/discard via keyboard shortcuts

### 4. Z-Index Management

**Critical Bug Context:** There was a bug where `maxZIndex` wasn't syncing properly across peers, causing cards to disappear. The fix:

```typescript
// In Whiteboard.ts setupYjsSync()
yCards.observe((event) => {
  event.changes.keys.forEach((change, key) => {
    const card = yCards.get(key);
    if (card && card.zIndex > this.maxZIndex) {
      this.maxZIndex = card.zIndex;  // MUST sync maxZIndex from observations
    }
  });
});
```

**Important:** When adding cards, always increment zIndex:
```typescript
whiteboard.addCard(card, playerId);  // Internally sets zIndex = ++maxZIndex
```

### 5. Keyboard Shortcuts Architecture

**Three-Level Priority System:**

1. **Battlefield cards** (highest priority) - when hovering a card on the battlefield
2. **Dock cards/piles** - when hovering hand cards or piles (deck, exile, discard)
3. **Global shortcuts** - no hover required (Draw, Untap All, Shuffle)

**Implementation Split:**
- `KeyboardHandler.ts` - Handles all keyboard events, checks all three levels
- `GameResourcesDock.ts` - Exposes hover state via `window.getGameResourcesDockHoverState()`
- `PileViewer.ts` - Separate keyboard handler for modal dialogs

**Adding New Shortcuts:** See `DEVELOPER_ONBOARDING.md` section on keyboard shortcuts for examples.

### 6. Coordinate Transformation (Currently Disabled)

The original design includes coordinate transformation so each player sees their playmat at the bottom and opponents' at the top. **This is currently disabled** in `Whiteboard.ts`:

```typescript
private transformCoordinates(card: WhiteboardCard) {
  if (card.ownerId === this.config.localPlayerId) {
    return { x: card.x, y: card.y };  // Your cards: no transform
  } else {
    // DISABLED: Should mirror opponent cards
    // return { x: width - card.x, y: height - card.y };
    return { x: card.x, y: card.y };  // Currently: same position
  }
}
```

## Common Development Patterns

### Testing Multiplayer Features

**Always test with multiple browser windows:**
```bash
npm run dev
# 1. Open http://localhost:5173 in first window
# 2. Copy full URL including ?room=xxx
# 3. Open same URL in second window/tab
# 4. Check "Connected" status in both windows
# 5. Test that changes sync both ways
```

### Reading Yjs State (for debugging)

```typescript
// In browser console or code:
const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
console.table(Array.from(yCards.values()));

const yPlayer = yDoc.getMap(`player-${playerId}`);
console.log('Health:', yPlayer.get('health'));
console.log('Hand:', yPlayer.get('hand'));
```

### Updating Yjs State

```typescript
// Always update entire object (Yjs uses CRDT merging)
const card = yCards.get(cardId);
yCards.set(cardId, {
  ...card,           // Spread existing properties
  x: newX,           // Update specific property
  zIndex: ++maxZIndex
});

// For arrays in player state:
const hand = yPlayerState.get('hand') ?? [];
yPlayerState.set('hand', [...hand, newCard]);  // Create new array
```

### Adding Yjs Observers

```typescript
// Listen for changes to any map
yCards.observe((event) => {
  event.changes.keys.forEach((change, key) => {
    if (change.action === 'add') {
      const card = yCards.get(key);
      // Handle new card
    } else if (change.action === 'update') {
      const card = yCards.get(key);
      // Handle updated card
    } else if (change.action === 'delete') {
      // Handle deleted card
    }
  });
});
```

### DOM Updates Pattern

The codebase uses **full re-renders** instead of incremental updates:

```typescript
// Current pattern (simple but inefficient):
updateHandDisplay(hand: Card[]): void {
  handCards.innerHTML = '';  // Clear all
  hand.forEach(card => {
    const el = this.createCardElement(card);
    handCards.appendChild(el);  // Re-create all
  });
}
```

**Note:** This is acceptable for small hands but would benefit from React migration (see `LIBRARY_RECOMMENDATIONS.md`).

## Key Files to Understand

### `src/index.ts` (Application Entry Point)
- Creates `Y.Doc` (shared state container)
- Initializes `WebRTCProvider` (networking)
- Creates `Player` instance with local `Deck`
- Wires up `Whiteboard`, `GameResourcesDock`, and `OpponentHealthDisplay`
- Sets up keyboard callbacks connecting Player actions to KeyboardHandler

### `src/modules/whiteboard/Whiteboard.ts` (Battlefield)
- Manages `yCards` Yjs map (shared battlefield state)
- Renders cards as absolutely-positioned DOM elements
- Handles drag-and-drop with manual coordinate tracking
- Manages z-index for card layering
- Creates and destroys card DOM elements based on Yjs observations

### `src/modules/whiteboard/KeyboardHandler.ts` (Shortcuts)
- Three-level priority system (battlefield → dock → global)
- Tracks `hoveredCardId` for battlefield cards
- Queries `window.getGameResourcesDockHoverState()` for dock interactions
- Implements all keyboard shortcuts (Space, D, S, T, Y, H, U, K, F, etc.)

### `src/modules/player/Player.ts` (Player State)
- Owns local `Deck` instance (not synced)
- Manages `yPlayerState` Yjs map (synced to all peers)
- `drawCard()` - moves card from local deck to synced hand
- `playCardFromHand()` - removes from hand, dispatches `playCard` event
- Methods for moving cards to exile/discard/deck

### `src/modules/gameResourcesDock/GameResourcesDock.ts` (Bottom UI)
- Renders hand cards, piles (exile/discard/deck), and life total
- Tracks `hoveredHandCardId` and `hoveredPileType` for keyboard shortcuts
- Exposes `getGameResourcesDockHoverState()` globally
- Opens `PileViewer` modal when clicking piles
- Handles drag-and-drop from hand to battlefield or piles

### `src/modules/deck/Deck.ts` (Local Deck)
- **Not synced** - purely local state
- Initializes 60 blank cards with unique IDs and card numbers 1-60
- `drawCard()` - LIFO (pops from end of array)
- `shuffleDeck()` - Fisher-Yates shuffle
- `addCardToTop()` / `addCardToBottom()` - for returning cards to deck

## Rendering Strategy: DOM vs Canvas

### Current Approach: DOM Elements
The battlefield currently renders cards as absolutely-positioned `<div>` elements. This works but has performance limitations with 100+ cards.

### Recommended: Native Canvas API

**When refactoring the Whiteboard module, use native Canvas API:**

✅ **Use Canvas because:**
- Better performance for 60-100+ cards
- Smooth drag operations
- Easy transformations (rotate for tap)
- Keeps bundle size small (~0KB added)

❌ **Don't use Konva.js or PixiJS because:**
- **Konva** (~90KB) - Overkill for simple rectangles and text
- **PixiJS** (~400KB) - WebGL game engine, way too heavy for this use case

**Canvas Implementation Pattern:**
```typescript
class CanvasWhiteboard {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  renderCard(card: WhiteboardCard) {
    this.ctx.save();

    // Position and rotate
    this.ctx.translate(card.x, card.y);
    if (card.isTapped) {
      this.ctx.rotate(Math.PI / 2);
    }

    // Draw card rectangle
    this.ctx.fillStyle = card.isFlipped ? '#4a4a4a' : '#2d2d2d';
    this.ctx.fillRect(0, 0, 63, 88);
    this.ctx.strokeRect(0, 0, 63, 88);

    // Draw card number
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`#${card.cardNumber}`, 5, 15);

    // Draw counters
    card.counters.forEach((value, idx) => {
      // ... render counter badges
    });

    this.ctx.restore();
  }

  handleMouseDown(e: MouseEvent) {
    // Manual hit detection: check if click is inside any card rectangle
    const clickedCard = this.cards.find(card =>
      e.offsetX >= card.x && e.offsetX <= card.x + 63 &&
      e.offsetY >= card.y && e.offsetY <= card.y + 88
    );
  }
}
```

**Keep DOM for:**
- Hand cards (GameResourcesDock)
- UI controls (buttons, health display)
- Modals (PileViewer)

**Use Canvas for:**
- Battlefield cards (Whiteboard)
- Any element with frequent position updates

## Sentry
These examples should be used as guidance when configuring Sentry functionality within a project.

# Error / Exception Tracking

Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry.
Use this in try catch blocks or areas where exceptions are expected

# Tracing Examples

Spans should be created for meaningful actions within an applications like button clicks, API calls, and function calls
Ensure you are creating custom spans with meaningful names and operations
Use the `Sentry.startSpan` function to create a span
Child spans can exist within a parent span

## Custom Span instrumentation in component actions

```javascript
function TestComponent() {
  const handleTestButtonClick = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Test Button Click",
      },
      (span) => {
        const value = "some config";
        const metric = "some metric";

        // Metrics can be added to the span
        span.setAttribute("config", value);
        span.setAttribute("metric", metric);

        doSomething();
      },
    );
  };

  return (
    <button type="button" onClick={handleTestButtonClick}>
      Test Sentry
    </button>
  );
}
```

## Custom span instrumentation in API calls

```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      return data;
    },
  );
}
```

# Logs

Where logs are used, ensure Sentry is imported using `import * as Sentry from "@sentry/react"`
Enable logging in Sentry using `Sentry.init({ enableLogs: true })`
Reference the logger using `const { logger } = Sentry`
Sentry offers a consoleLoggingIntegration that can be used to log specific console error types automatically without instrumenting the individual logger calls

## Configuration

### Baseline

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://beb5f109e66475063b4650877bc1c6a1@o4510353682006016.ingest.de.sentry.io/4510353685610576",

  enableLogs: true,
});
```

### Logger Integration

```javascript
Sentry.init({
  dsn: "https://beb5f109e66475063b4650877bc1c6a1@o4510353682006016.ingest.de.sentry.io/4510353685610576",
  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
});
```

## Logger Examples

`logger.fmt` is a template literal function that should be used to bring variables into the structured logs.

```javascript
logger.trace("Starting database connection", { database: "users" });
logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info("Updated profile", { profileId: 345 });
logger.warn("Rate limit reached for endpoint", {
  endpoint: "/api/results/",
  isEnterprise: false,
});
logger.error("Failed to process payment", {
  orderId: "order_123",
  amount: 99.99,
});
logger.fatal("Database connection pool exhausted", {
  database: "users",
  activeConnections: 100,
});
```

## Known Issues and Gotchas

1. **Coordinate transformation disabled** - All players see cards at same positions (not mirrored)
2. **Trust-based privacy** - Hands are synced to all peers but hidden in UI (not secure)
3. **Opponent discovery polling** - Checks for new players every 1 second (should use Yjs observers)
4. **Full re-renders** - Hand and pile viewers re-render all elements on every change
5. **No error handling** - WebRTC connection failures and Yjs errors are not caught
6. **Magic numbers** - Card dimensions (63x88) and positions hardcoded throughout
7. **DOM rendering performance** - Battlefield uses DOM elements instead of Canvas

See `DEVELOPER_ONBOARDING.md` section "Known Issues and Gotchas" for details and fixes.

## Code Style Notes

- **TypeScript strict mode** - All types must be explicitly defined
- **No UI framework** - Pure DOM manipulation with `createElement` and event listeners
- **Event-driven** - Modules communicate via CustomEvents and callbacks
- **Yjs-first** - State changes go through Yjs, then observers update DOM
- **Modular** - Each module has `types.ts`, implementation file(s), and `index.ts` for exports

## Testing Strategy

**Manual Testing (Current):**
- Open multiple browser windows with same room URL
- Test all keyboard shortcuts
- Verify synchronization between peers
- Check console for errors

**Future:** See `LIBRARY_RECOMMENDATIONS.md` for Vitest setup recommendations.

## Additional Resources

- **README.md** - User-facing documentation with setup and gameplay instructions
- **DEVELOPER_ONBOARDING.md** - Comprehensive 1500+ line guide with code examples
- **LIBRARY_RECOMMENDATIONS.md** - Analysis of migration options (React, Zustand, testing, etc.)
- **WEBRTC_SETUP.md** - Detailed WebRTC configuration (signaling servers, STUN/TURN)

## Important: Room-Based Connections

Room names are in the URL: `?room=mtg-abc123`
- Generated automatically on first visit
- Must be shared with other players to connect
- All players in same room share same Yjs document
- WebRTC connections are peer-to-peer (no game state server)

## Deployment Notes

```bash
npm run build
# Outputs to dist/ folder
# Deploy dist/ to any static host (Netlify, Vercel, GitHub Pages, etc.)
# Ensure signaling server is accessible (default uses Railway.app deployment)
```