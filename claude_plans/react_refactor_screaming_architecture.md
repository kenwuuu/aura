# React Refactoring Plan: Screaming Architecture

## Overview

This plan outlines the refactoring of Aura from vanilla JavaScript/TypeScript to React, following **Uncle Bob's Screaming Architecture** principle. The folder structure will reflect **domain concepts** (whiteboard, deck, hand, card, pile) rather than technical layers (components, services, utils).

---

## Screaming Architecture Principle

> "The architecture should scream about the use cases of the application, not about the frameworks it uses."

### ❌ Current Anti-Pattern (Technical Organization)
```
src/
├── components/         # What kind of components? What do they do?
├── services/          # What services? What domain?
├── modules/           # Too generic
└── utils/             # Junk drawer
```

### ✅ Target Structure (Domain Organization)
```
src/
├── whiteboard/        # Everything about the battlefield
├── deck/              # Deck management and storage
├── hand/              # Hand rendering and interactions
├── pile/              # Graveyard, exile, deck viewer
├── card/              # Card models, preview, counter UI
├── player/            # Player state and health
├── network/           # WebRTC peer-to-peer sync
├── keyboard/          # Global keyboard shortcuts
└── app/               # Root app initialization
```

When a new developer opens this codebase, they should immediately understand it's a card game with a **whiteboard**, **deck**, **hand**, **piles**, and **player** mechanics.

---

## Current Files Requiring React Refactoring

### Priority Classification

| Priority | Files | Lines | Impact |
|----------|-------|-------|--------|
| **HIGH** | 3 files | ~700 lines | Performance bottlenecks, heavy DOM manipulation |
| **MEDIUM** | 3 files | ~432 lines | State management, code maintainability |
| **LOW** | 2 files | ~289 lines | Nice-to-have, minor improvements |

---

## Migration Plan by Domain

### 1. Whiteboard Domain 🎯 **HIGH PRIORITY**

**Files to Refactor:**
- `src/modules/whiteboard/Whiteboard.ts` (250+ lines)
- `src/modules/whiteboard/KeyboardHandler.ts` (200+ lines)
- `src/modules/whiteboard/types.ts`

**Target Structure:**
```
src/whiteboard/
├── components/
│   ├── WhiteboardCanvas.tsx          # Canvas-based battlefield renderer
│   ├── WhiteboardControls.tsx        # Zoom, debug controls
│   └── DraggableCard.tsx             # Card drag overlay (if needed)
├── hooks/
│   ├── useWhiteboardSync.ts          # Yjs sync logic
│   ├── useCardDrag.ts                # Drag-and-drop state
│   ├── useKeyboardHandler.ts         # Keyboard shortcuts hook
│   └── useZoom.ts                    # Zoom controls
├── canvas/
│   ├── CardRenderer.ts               # Canvas rendering utilities
│   └── HitDetection.ts               # Mouse-to-card collision detection
├── types.ts
└── index.ts
```

**Rationale:**
- **Current Issues:**
  - DOM-based rendering performs poorly with 60+ cards
  - Manual DOM element creation/destruction
  - Full re-renders on every Yjs change
  - Coordinate transformation disabled
- **React Benefits:**
  - Use Canvas API with React hooks for better performance
  - `useWhiteboardSync` hook to observe Yjs `yCards` map
  - `useCardDrag` hook to replace manual drag state tracking
  - `useKeyboardHandler` hook to replace class-based keyboard handling
- **Screaming Architecture:**
  - Folder name `whiteboard/` immediately tells you "this is the battlefield"
  - Subfolders `components/`, `hooks/`, `canvas/` show technical implementation details

---

### 2. Hand Domain 🎯 **HIGH PRIORITY**

**Files to Refactor:**
- `src/modules/gameResourcesDock/GameResourcesDock.ts` (250+ lines)
  - **Hand rendering logic** (lines 1-120)
  - Hand hover tracking
  - Hand zoom controls

**Target Structure:**
```
src/hand/
├── components/
│   ├── HandContainer.tsx             # Hand card rendering
│   ├── HandCard.tsx                  # Individual card component
│   ├── HandZoomControls.tsx          # Zoom in/out buttons
│   └── HandDropZone.tsx              # Drag-drop target
├── hooks/
│   ├── useHandSync.ts                # Yjs player.hand observer
│   ├── useHandHover.ts               # Hover state tracking
│   └── useHandZoom.ts                # Zoom level persistence
├── types.ts
└── index.ts
```

**Rationale:**
- **Current Issues:**
  - Full re-renders on every hand change (recreates all DOM elements)
  - Manual element creation with `createElement`
  - Inefficient with 60 cards in hand
- **React Benefits:**
  - Virtual DOM diffing for efficient updates
  - `HandCard` component memoization
  - `useHandSync` hook to observe Yjs `player.hand`
  - Clean component hierarchy
- **Screaming Architecture:**
  - `hand/` folder screams "this is where hand logic lives"
  - Separates hand from generic "game resources dock"

---

### 3. Pile Domain 🎯 **HIGH PRIORITY**

**Files to Refactor:**
- `src/modules/gameResourcesDock/PileViewer.ts` (200+ lines)
- `src/modules/gameResourcesDock/GameResourcesDock.ts` (pile buttons section)

**Target Structure:**
```
src/pile/
├── components/
│   ├── PileButton.tsx                # Deck/Exile/Discard pile buttons
│   ├── PileViewerModal.tsx           # Modal for viewing pile contents
│   ├── PileCard.tsx                  # Card in pile viewer
│   └── PileSearch.tsx                # Search pile functionality
├── hooks/
│   ├── usePileSync.ts                # Yjs pile observers
│   ├── usePileKeyboard.ts            # Modal keyboard shortcuts
│   └── usePileViewer.ts              # Modal state management
├── types.ts
└── index.ts
```

**Rationale:**
- **Current Issues:**
  - Manual modal DOM creation/destruction
  - Keyboard handler attached/removed manually
  - Full re-renders of pile cards
- **React Benefits:**
  - React Portal for modal rendering
  - `usePileViewer` hook for modal open/close state
  - `usePileKeyboard` hook for keyboard shortcuts in modal context
  - Memoized `PileCard` components
- **Screaming Architecture:**
  - `pile/` folder screams "graveyard, exile, deck viewers"
  - Clear separation from hand and whiteboard

---

### 4. Player Domain 🎯 **MEDIUM PRIORITY**

**Files to Refactor:**
- `src/modules/player/Player.ts` (118 lines)
- `src/modules/gameResourcesDock/OpponentHealthDisplay.ts` (114 lines)

**Target Structure:**
```
src/player/
├── components/
│   ├── PlayerHealthDisplay.tsx       # Local player health
│   ├── OpponentHealthList.tsx        # All opponents' health
│   └── OpponentHealthItem.tsx        # Single opponent health
├── hooks/
│   ├── usePlayerState.ts             # Yjs player state observer
│   ├── usePlayerActions.ts           # drawCard, playCard, etc.
│   └── useOpponents.ts               # Opponent discovery via Yjs
├── context/
│   └── PlayerContext.tsx             # Global player state provider
├── types.ts
└── index.ts
```

**Rationale:**
- **Current Issues:**
  - Callback-based reactivity (not hooks)
  - OpponentHealthDisplay polls every 1 second for new players (inefficient)
  - Manual DOM element creation for opponent health
- **React Benefits:**
  - `PlayerContext` provides global player state via React Context
  - `usePlayerState` hook for local player state
  - `useOpponents` hook replaces polling with Yjs observers
  - `usePlayerActions` hook for card movement actions
- **Screaming Architecture:**
  - `player/` folder screams "player state and health"
  - Separates player logic from UI concerns

---

### 5. Card Domain 🎯 **MEDIUM PRIORITY**

**Files to Refactor:**
- `src/modules/cardPreview/CardPreview.ts` (89 lines)
- `src/components/Counter.tsx` (already React ✅)

**Target Structure:**
```
src/card/
├── components/
│   ├── CardPreview.tsx               # Large card image popup
│   ├── Counter.tsx                   # ✅ Already migrated
│   └── CounterList.tsx               # Multiple counters on card
├── hooks/
│   ├── useCardPreview.ts             # Show/hide preview logic
│   └── useCardImages.ts              # Scryfall image loading
├── types.ts
└── index.ts
```

**Rationale:**
- **Current Issues:**
  - `CardPreview.ts` is vanilla DOM utility class
  - `Counter.tsx` already React but lives in generic `components/`
- **React Benefits:**
  - `useCardPreview` hook for preview state
  - `useCardImages` hook for lazy image loading
  - Memoization for counter rendering
- **Screaming Architecture:**
  - `card/` folder screams "card-related UI"
  - Consolidates card preview and counter logic

---

### 6. Deck Domain 🎯 **LOW PRIORITY**

**Files to Refactor:**
- `src/modules/deck/Deck.ts` (75 lines) - **Keep as-is or use Zustand**
- `src/components/DeckManager.tsx` (already React ✅)
- `src/components/DeckImportModal.tsx` (already React ✅)
- `src/components/DeckSelectionModal.tsx` (already React ✅)

**Target Structure:**
```
src/deck/
├── components/
│   ├── DeckManager.tsx               # ✅ Already migrated
│   ├── DeckImportModal.tsx           # ✅ Already migrated
│   └── DeckSelectionModal.tsx        # ✅ Already migrated
├── stores/
│   └── deckStore.ts                  # Zustand store (optional)
├── services/
│   ├── DeckImporter.ts
│   ├── MtgTextListDeckImporter.ts
│   ├── DeckStorageService.ts
│   └── ScryfallApiService.ts
├── types.ts
└── index.ts
```

**Rationale:**
- **Current Issues:**
  - `Deck.ts` is pure logic (no UI)
  - React components already exist but live in generic `components/`
- **React Benefits:**
  - Optional: Replace `Deck.ts` with Zustand store for reactive deck state
  - Consolidate deck-related components under `deck/` domain
- **Screaming Architecture:**
  - `deck/` folder screams "deck management and import"
  - Services stay in `services/` subfolder (technical detail)

---

### 7. Network Domain 🎯 **LOW PRIORITY**

**Files to Refactor:**
- `src/modules/webrtc/WebRTCProvider.ts` (79 lines) - **Keep as-is**
- `src/modules/webrtc/types.ts`

**Target Structure:**
```
src/network/
├── providers/
│   └── WebRTCProvider.ts             # Yjs + y-webrtc wrapper
├── hooks/
│   └── useConnectionStatus.ts        # Connection status observer
├── types.ts
└── index.ts
```

**Rationale:**
- **Current Issues:**
  - Pure wrapper class, no UI rendering
  - No React needed
- **React Benefits:**
  - Optional: `useConnectionStatus` hook for connection status UI
- **Screaming Architecture:**
  - `network/` folder screams "peer-to-peer networking"
  - More domain-focused than generic `webrtc/`

---

### 8. Keyboard Domain 🎯 **MEDIUM PRIORITY**

**Files to Refactor:**
- `src/modules/whiteboard/KeyboardHandler.ts` (200+ lines)

**Target Structure:**
```
src/keyboard/
├── hooks/
│   ├── useKeyboardShortcuts.ts       # Global keyboard hook
│   ├── useWhiteboardKeys.ts          # Whiteboard-specific keys
│   ├── useHandKeys.ts                # Hand-specific keys
│   └── usePileKeys.ts                # Pile modal keys
├── types.ts
└── index.ts
```

**Rationale:**
- **Current Issues:**
  - Three-level priority system hardcoded in single class
  - Global event listener with manual cleanup
  - Tightly coupled to whiteboard
- **React Benefits:**
  - Composable hooks for different keyboard contexts
  - Automatic cleanup with `useEffect`
  - Easier to test keyboard logic
- **Screaming Architecture:**
  - `keyboard/` folder screams "keyboard shortcuts system"
  - Separates keyboard concerns from whiteboard/hand/pile

---

### 9. App Domain 🎯 **LOW PRIORITY**

**Files to Refactor:**
- `src/index.ts` (235 lines) - **Entry point**

**Target Structure:**
```
src/app/
├── components/
│   └── AuraApp.tsx                   # Root React component
├── providers/
│   ├── YjsProvider.tsx               # Yjs document provider
│   ├── WebRTCProvider.tsx            # WebRTC connection provider
│   └── PlayerProvider.tsx            # Player context provider
├── hooks/
│   └── useAppInit.ts                 # App initialization logic
└── index.tsx                         # New entry point
```

**Rationale:**
- **Current Issues:**
  - Single 235-line file wires everything together
  - Manual cleanup with `window.onbeforeunload`
- **React Benefits:**
  - Provider composition pattern for Yjs, WebRTC, Player
  - Automatic cleanup with React lifecycle
  - `useAppInit` hook for initialization logic
- **Screaming Architecture:**
  - `app/` folder is the root orchestrator
  - Clear separation of providers and initialization

---

## Migration Phases

### Phase 1: High Priority (Performance) - **~4 weeks**

1. **Whiteboard → React + Canvas** (2 weeks)
   - Migrate `Whiteboard.ts` to `WhiteboardCanvas.tsx`
   - Implement Canvas rendering with React hooks
   - Extract keyboard handling to `useKeyboardHandler` hook
   - Test with 60+ cards for performance improvements

2. **Hand → React Components** (1 week)
   - Extract hand logic from `GameResourcesDock.ts`
   - Create `HandContainer.tsx` and `HandCard.tsx`
   - Implement memoization for card rendering
   - Test with 60 cards in hand

3. **Pile → React Modal** (1 week)
   - Migrate `PileViewer.ts` to `PileViewerModal.tsx`
   - Use React Portal for modal rendering
   - Extract pile buttons from `GameResourcesDock.ts`

**Deliverables:**
- ✅ Whiteboard renders 60+ cards smoothly with Canvas
- ✅ Hand rendering uses virtual DOM diffing
- ✅ Pile viewer is a proper React modal
- ✅ All features work identically to vanilla version

---

### Phase 2: Medium Priority (Maintainability) - **~3 weeks**

4. **Player → React Context** (1 week)
   - Migrate `Player.ts` to `PlayerContext.tsx`
   - Create `usePlayerState` and `usePlayerActions` hooks
   - Migrate `OpponentHealthDisplay.ts` to React
   - Replace polling with Yjs observers

5. **Card → React Components** (1 week)
   - Migrate `CardPreview.ts` to `CardPreview.tsx`
   - Consolidate `Counter.tsx` under `card/` domain
   - Create `useCardPreview` hook

6. **Keyboard → React Hooks** (1 week)
   - Extract keyboard logic from `KeyboardHandler.ts`
   - Create composable hooks: `useWhiteboardKeys`, `useHandKeys`, `usePileKeys`
   - Test all keyboard shortcuts work identically

**Deliverables:**
- ✅ Player state managed via React Context
- ✅ Opponent discovery uses Yjs observers (no polling)
- ✅ Keyboard shortcuts use React hooks
- ✅ Code is more maintainable and testable

---

### Phase 3: Low Priority (Polish) - **~2 weeks**

7. **Deck → Consolidate** (1 week)
   - Move existing React components to `deck/` domain
   - Optionally replace `Deck.ts` with Zustand store
   - Keep services under `deck/services/`

8. **Network → Consolidate** (3 days)
   - Move `WebRTCProvider.ts` to `network/` domain
   - Create `useConnectionStatus` hook (optional)

9. **App → React Root** (4 days)
   - Migrate `index.ts` to `AuraApp.tsx`
   - Set up provider composition
   - Test full app initialization

**Deliverables:**
- ✅ All code follows Screaming Architecture
- ✅ Folder structure reflects domain concepts
- ✅ Entry point is clean React root

---

## Before/After Comparison

### Before (Technical Organization)
```
src/
├── modules/
│   ├── deck/                  # What kind of deck?
│   ├── player/                # Generic
│   ├── whiteboard/            # Hidden in modules
│   ├── gameResourcesDock/     # What resources?
│   └── webrtc/                # Implementation detail
├── components/
│   ├── Counter.tsx            # Counter for what?
│   ├── DeckManager.tsx        # Hidden in components
│   └── ...
└── services/
    └── ...                    # Junk drawer
```

### After (Domain Organization)
```
src/
├── whiteboard/                # 🎯 Battlefield!
│   ├── components/
│   ├── hooks/
│   └── canvas/
├── hand/                      # 🎯 Hand cards!
│   ├── components/
│   └── hooks/
├── pile/                      # 🎯 Graveyards/Exile!
│   ├── components/
│   └── hooks/
├── card/                      # 🎯 Card UI!
│   ├── components/
│   └── hooks/
├── player/                    # 🎯 Player state!
│   ├── components/
│   ├── hooks/
│   └── context/
├── deck/                      # 🎯 Deck management!
│   ├── components/
│   └── services/
├── network/                   # 🎯 Peer-to-peer!
│   └── providers/
├── keyboard/                  # 🎯 Shortcuts!
│   └── hooks/
└── app/                       # 🎯 Root app!
    ├── components/
    └── providers/
```

**New Developer Experience:**
- ❌ Before: "Where do I find the battlefield rendering?" → Search through `modules/`
- ✅ After: "Where do I find the battlefield rendering?" → `src/whiteboard/`

---

## Key Architectural Decisions

### 1. Yjs Remains Single Source of Truth
- React components **observe** Yjs maps
- React components **dispatch** updates to Yjs
- No local React state for synced data (hand, battlefield, health)

### 2. Hooks for Yjs Synchronization
```typescript
// Example: useHandSync hook
function useHandSync(yDoc: Y.Doc, playerId: string) {
  const [hand, setHand] = useState<Card[]>([]);

  useEffect(() => {
    const yPlayer = yDoc.getMap(`player-${playerId}`);

    const observer = () => {
      setHand(yPlayer.get('hand') ?? []);
    };

    yPlayer.observe(observer);
    observer(); // Initial load

    return () => yPlayer.unobserve(observer);
  }, [yDoc, playerId]);

  return hand;
}
```

### 3. Canvas API for Whiteboard
- Use native Canvas API (not Konva.js or PixiJS)
- React manages Canvas lifecycle via `useRef`
- Manual hit detection for card selection
- Better performance than DOM rendering

### 4. React Context for Player State
- `PlayerProvider` wraps entire app
- All components access player via `usePlayerState()` hook
- Replaces callback-based `Player.onStateChange()` pattern

### 5. Memoization for Performance
- Memoize `HandCard`, `PileCard`, `OpponentHealthItem` components
- Prevent unnecessary re-renders
- Use `React.memo()` and `useMemo()` hooks

---

## Testing Strategy

### Unit Tests (with Vitest)
- Test hooks in isolation (`useHandSync`, `usePlayerState`)
- Test Yjs synchronization logic
- Test keyboard shortcut handlers

### Integration Tests
- Test whiteboard rendering with 60+ cards
- Test hand updates when cards are drawn/played
- Test pile viewer modal interactions

### Manual Testing
- Open multiple browser windows
- Verify all keyboard shortcuts work
- Verify synchronization between peers
- Check performance with full deck (60 cards)

---

## Files NOT Requiring React Refactoring

**Keep as-is (pure logic, no UI):**
- `src/modules/deck/Deck.ts` - Pure TypeScript class
- `src/modules/webrtc/WebRTCProvider.ts` - Wrapper class
- `src/services/*` - API services and utilities
- `src/modules/deck/types.ts` - Type definitions
- `src/modules/player/types.ts` - Type definitions
- `src/modules/whiteboard/types.ts` - Type definitions

**Rationale:** These files have no UI rendering logic and can remain as utility classes/services.

---

## Success Criteria

✅ **Performance:**
- Whiteboard handles 60+ cards at 60fps
- Hand rendering is instant (no lag with 60 cards)

✅ **Feature Parity:**
- All keyboard shortcuts work identically
- All drag-drop operations work identically
- All multiplayer synchronization works identically

✅ **Code Quality:**
- All components follow Screaming Architecture
- Folder structure reflects domain concepts
- No more than 150 lines per component
- All hooks tested in isolation

✅ **Developer Experience:**
- New developer can find battlefield code in `src/whiteboard/`
- New developer can find hand code in `src/hand/`
- No confusion about where to add new features

---

## Next Steps

1. **Review this plan** with the team
2. **Create feature branch** `react-refactor-screaming-architecture`
3. **Start Phase 1** with whiteboard migration
4. **Iterate** and gather feedback after each phase

---

## References

- [Screaming Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
- [React Hooks Documentation](https://react.dev/reference/react)
- [Yjs Documentation](https://docs.yjs.dev/)
- [CLAUDE.md](../CLAUDE.md) - Current architecture overview
- [DEVELOPER_ONBOARDING.md](../DEVELOPER_ONBOARDING.md) - Detailed code walkthrough