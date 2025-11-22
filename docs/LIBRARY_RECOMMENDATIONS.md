# Library Recommendations for Aura

## Executive Summary

Currently, Aura uses only **2 production dependencies** (Yjs + y-webrtc) and implements everything else manually using vanilla JavaScript. While this keeps the bundle size small and provides full control, it leads to:

- **Maintenance burden**: Manual DOM manipulation and event handling
- **Performance issues**: Full re-renders on state changes
- **Code complexity**: Fragmented keyboard shortcuts and hover state management
- **Missing features**: No testing, error tracking, or accessibility tools

This document evaluates well-maintained library options for each major concern in building a card game web app.

---

## 1. UI Framework (HIGHEST PRIORITY)

### Current State: Vanilla JavaScript DOM Manipulation
```typescript
// Current approach - manual DOM manipulation
private updateHandDisplay(hand: Card[]): void {
  handCards.innerHTML = ''; // Full re-render
  hand.forEach(card => {
    const cardEl = document.createElement('div');
    // ... manually create elements and attach listeners
  });
}
```

**Problems:**
- Full re-renders on every state change (O(n) complexity)
- Re-attaching event listeners on each render
- No automatic change detection
- Harder to maintain complex UI state

### Recommended: **React** with TypeScript

**Why React:**
- Industry standard with massive ecosystem
- Virtual DOM for efficient updates
- TypeScript support is excellent
- Hooks simplify state management
- Large talent pool for hiring
- Integrates with everything else on this list

**Alternative Options:**

| Library | Pros | Cons | Use Case |
|---------|------|------|----------|
| **Vue 3** | Easy learning curve, Composition API | Smaller ecosystem | If team prefers Vue |
| **Svelte** | No virtual DOM, smallest bundle | Smaller ecosystem, less mature | If bundle size critical |
| **Solid.js** | Fast, signals-based | Very small ecosystem | If performance paramount |
| **Preact** | React-like, 3KB | Missing some React features | If bundle size critical |

**Migration Strategy:**
1. Keep current vanilla implementation
2. Add React wrapper around Whiteboard component
3. Migrate one module at a time (GameResourcesDock → Whiteboard → PileViewer)
4. Use React with Yjs: `y-react` bindings

**Code Example (React + Yjs):**
```tsx
import { useYjs } from 'y-react';

function HandDisplay({ playerId }: { playerId: string }) {
  const hand = useYjs<Card[]>(YDOC_PLAYER(playerId), 'hand', []);

  return (
    <div className="hand-cards">
      {hand.map(card => (
        <CardComponent key={card.id} card={card} />
      ))}
    </div>
  );
}
```

**Estimated Effort:** 2-3 weeks for full migration

---

## 2. State Management (HIGH PRIORITY)

### Current State: Mix of Yjs, Custom Classes, and Global Functions

**Problems:**
- Fragmented hover state across 3 files
- Global function exposure via `window` object
- No centralized state tree
- Difficult to debug data flow

```typescript
// Current anti-pattern
(window as any).getGameResourcesDockHoverState = () => { ... };

// Called from different file
const dockState = (window as any).getGameResourcesDockHoverState();
```

### Recommended: **Zustand**

**Why Zustand:**
- Minimal boilerplate (< Redux)
- Works seamlessly with React
- TypeScript-first design
- No context providers needed
- Perfect for app-level state (hover, keyboard focus)

**Alternative Options:**

| Library | Pros | Cons | Use Case |
|---------|------|------|----------|
| **Redux Toolkit** | Official, powerful DevTools | More boilerplate | Complex state logic |
| **Jotai** | Atomic state, minimal | Learning curve for atoms | If you like Recoil |
| **Recoil** | Atomic state, by Facebook | Still experimental | Not recommended |
| **MobX** | Reactive, automatic tracking | Magic can be confusing | If you like Vue reactivity |

**Code Example (Zustand):**
```typescript
import { create } from 'zustand';

interface KeyboardState {
  hoveredCardId: string | null;
  hoveredPileType: 'deck' | 'exile' | 'discard' | null;
  hoveredHandCardId: string | null;
  setHoveredCard: (id: string | null) => void;
  setHoveredPile: (type: string | null) => void;
}

const useKeyboardStore = create<KeyboardState>((set) => ({
  hoveredCardId: null,
  hoveredPileType: null,
  hoveredHandCardId: null,
  setHoveredCard: (id) => set({ hoveredCardId: id }),
  setHoveredPile: (type) => set({ hoveredPileType: type }),
}));

// Usage in components
function WhiteboardCard({ card }) {
  const setHovered = useKeyboardStore(s => s.setHoveredCard);

  return (
    <div
      onMouseEnter={() => setHovered(card.id)}
      onMouseLeave={() => setHovered(null)}
    >
      {/* card UI */}
    </div>
  );
}
```

**Estimated Effort:** 1 week to centralize state

---

## 3. Keyboard Shortcuts (HIGH PRIORITY)

### Current State: 3 Different Implementations

**Problems:**
- KeyboardHandler.ts (battlefield cards)
- GameResourcesDock.ts (hand cards)
- PileViewer.ts (pile viewer modal)
- Different key handling logic in each
- Hard to see all shortcuts at once
- Conflict resolution is manual

### Recommended: **@github/hotkey**

**Why @github/hotkey:**
- Made by GitHub, battle-tested
- Declarative keyboard shortcuts
- Automatic conflict resolution
- Accessibility built-in (focus management)
- TypeScript types included

**Alternative Options:**

| Library | Pros | Cons | Use Case |
|---------|------|------|----------|
| **react-hotkeys-hook** | React-specific, hooks API | React-only | If using React |
| **tinykeys** | Tiny (< 1KB) | Limited features | If bundle size critical |
| **Mousetrap** | Simple API | Not maintained actively | Not recommended |
| **Hotkeys.js** | Lightweight, popular | Less TypeScript support | Decent alternative |

**Code Example:**
```typescript
import { install } from '@github/hotkey';

// Declarative shortcuts in HTML
<div
  data-hotkey="Space"
  data-hotkey-scope="battlefield-card"
  onClick={toggleTap}
>
  Tap/Untap
</div>

// Or programmatic
install(document.getElementById('card'), 'Space', (e) => {
  toggleTap(cardId);
});
```

**Estimated Effort:** 3-4 days to consolidate shortcuts

---

## 4. Drag and Drop (MEDIUM PRIORITY)

### Current State: HTML5 Drag API

**Problems:**
- Manual coordinate calculations
- No smooth animations
- Accessibility issues
- Mobile drag doesn't work
- Limited customization

### Recommended: **dnd-kit**

**Why dnd-kit:**
- Modern, accessibility-first
- Works on touch devices
- Smooth animations built-in
- Customizable collision detection
- Active maintenance
- TypeScript-first

**Alternative Options:**

| Library | Pros | Cons | Use Case |
|---------|------|------|----------|
| **react-beautiful-dnd** | Popular, mature | Only vertical/horizontal lists | For list reordering |
| **interact.js** | Framework-agnostic | Less React integration | If not using React |
| **react-dnd** | Flexible, backend system | Complex API | If need custom backends |

**Code Example (dnd-kit):**
```tsx
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

function DraggableCard({ card }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {/* card UI */}
    </div>
  );
}

function DroppableWhiteboard() {
  const { setNodeRef } = useDroppable({ id: 'battlefield' });
  return <div ref={setNodeRef}>{/* cards */}</div>;
}
```

**Estimated Effort:** 1 week to migrate drag/drop

---

## 5. Testing Framework (HIGH PRIORITY)

### Current State: No Tests

**Problems:**
- Manual testing only
- No regression protection
- Hard to refactor with confidence
- Synchronization bugs hard to catch

### Recommended: **Vitest**

**Why Vitest:**
- Compatible with Vite (already using)
- Jest-compatible API (easy to learn)
- Fast (uses Vite's infrastructure)
- Built-in TypeScript support
- Native ESM support

**Alternative Options:**

| Library | Pros | Cons | Use Case |
|---------|------|------|----------|
| **Jest** | Industry standard | Slower, requires config | If not using Vite |
| **Playwright** | E2E testing, cross-browser | Slower, heavier | For integration tests |
| **Cypress** | Great DX, time-travel | Only E2E, not unit tests | For E2E tests |

**Code Example (Vitest):**
```typescript
import { describe, it, expect } from 'vitest';
import { Deck } from './Deck';

describe('Deck', () => {
  it('should shuffle deck deterministically', () => {
    const deck = new Deck({ initialCardCount: 60 });
    const beforeShuffle = [...deck.getCards()];

    deck.shuffleDeck();
    const afterShuffle = deck.getCards();

    expect(afterShuffle).not.toEqual(beforeShuffle);
    expect(afterShuffle.length).toBe(60);
  });

  it('should draw card from top', () => {
    const deck = new Deck({ initialCardCount: 5 });
    const topCard = deck.getCards()[deck.getCards().length - 1];

    const drawn = deck.drawCard();

    expect(drawn).toEqual(topCard);
    expect(deck.getCardCount()).toBe(4);
  });
});
```

**Testing Strategy:**
1. **Unit tests**: Deck, Player classes
2. **Integration tests**: Yjs synchronization across clients
3. **E2E tests**: Playwright for full user flows

**Estimated Effort:** 2 weeks to add comprehensive test coverage

---

## 6. Modal Dialogs (MEDIUM PRIORITY)

### Current State: Custom Modal (PileViewer.ts)

**Problems:**
- Manual focus management
- No accessibility features (ARIA)
- Escape key handling added manually
- No backdrop click to close
- Z-index management manual

### Recommended: **Radix UI Dialog** (Headless)

**Why Radix:**
- Unstyled (keep your CSS)
- Accessibility built-in (ARIA, focus trap)
- Keyboard navigation included
- Composable primitives
- TypeScript-first

**Alternative Options:**

| Library | Pros | Cons | Use Case |
|---------|------|------|----------|
| **Headless UI** | By Tailwind team | Smaller API | If using Tailwind |
| **React Modal** | Simple, popular | Less accessible | Simple use cases |
| **reach/dialog** | Accessible, simple | Less maintained | Not recommended |

**Code Example (Radix):**
```tsx
import * as Dialog from '@radix-ui/react-dialog';

function PileViewer({ cards, open, onClose }) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="pile-viewer-modal" />
        <Dialog.Content className="pile-viewer-content">
          <Dialog.Title>Deck (Top to Bottom)</Dialog.Title>
          <Dialog.Close className="pile-viewer-close">×</Dialog.Close>

          <div className="pile-viewer-grid">
            {cards.map(card => (
              <CardInPile key={card.id} card={card} />
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

**Benefits:**
- Escape key handling automatic
- Focus trap (can't tab outside modal)
- Screen reader announcements
- Portal rendering (no z-index issues)

**Estimated Effort:** 1 day to migrate modals

---

## 7. Styling Solution (MEDIUM PRIORITY)

### Current State: Plain CSS (580 lines)

**Problems:**
- Magic numbers repeated (63px, 88px)
- Color values hardcoded throughout
- No design tokens
- Media queries manual
- No component scoping

### Recommended: **Tailwind CSS**

**Why Tailwind:**
- Utility-first approach
- No naming fatigue
- Automatic tree-shaking (smaller CSS)
- Built-in design system
- Great TypeScript IntelliSense
- Works with Vite out of box

**Alternative Options:**

| Library | Pros | Cons | Use Case |
|---------|------|------|----------|
| **CSS Modules** | Component scoping | Still writing CSS | If prefer traditional CSS |
| **Styled Components** | CSS-in-JS, dynamic | Runtime cost, larger bundle | If prefer CSS-in-JS |
| **Emotion** | Fast CSS-in-JS | Similar to Styled Components | Alternative to Styled |
| **Panda CSS** | Zero-runtime, type-safe | Newer, smaller ecosystem | If want type-safe utilities |

**Code Example (Tailwind):**
```tsx
// Before (CSS classes)
<div className="hand-card">
  <div className="card-number-badge">#{card.cardNumber}</div>
</div>

// After (Tailwind)
<div className="relative w-[63px] h-[88px] mr-1 cursor-grab transition-all hover:-translate-y-2">
  <div className="absolute top-1 left-1 bg-black/80 border-2 border-yellow-400 rounded px-2 py-1 text-xs">
    #{card.cardNumber}
  </div>
</div>
```

**Design Tokens (tailwind.config.js):**
```javascript
export default {
  theme: {
    extend: {
      colors: {
        exile: '#8b5cf6',
        discard: '#ef4444',
        deck: '#3b82f6',
        health: '#10b981',
      },
      spacing: {
        'card-width': '63px',
        'card-height': '88px',
      }
    }
  }
}
```

**Estimated Effort:** 1 week to migrate CSS

---

## 8. Animation Library (LOW PRIORITY)

### Current State: CSS Transitions

**Current animations:**
- Card hover lift (CSS `transition`)
- No tap/untap animation
- No smooth card movement
- Instant counter changes

### Recommended: **Framer Motion**

**Why Framer Motion:**
- Declarative animations
- Spring physics built-in
- Gesture support (drag, tap)
- Layout animations (automatic)
- Great TypeScript support

**Alternative Options:**

| Library | Pros | Cons | Use Case |
|---------|------|------|----------|
| **React Spring** | Physics-based | Steeper learning curve | If want realistic physics |
| **GSAP** | Most powerful | Not free for commercial | Professional animations |
| **Anime.js** | Lightweight | Less React integration | Framework-agnostic |

**Code Example (Framer Motion):**
```tsx
import { motion } from 'framer-motion';

function Card({ card, isTapped }) {
  return (
    <motion.div
      animate={{
        rotate: isTapped ? 90 : 0,
        scale: 1,
      }}
      whileHover={{ scale: 1.05 }}
      whileDrag={{ scale: 1.1, zIndex: 1000 }}
      transition={{ type: "spring", stiffness: 300 }}
      drag
      dragElastic={0.1}
    >
      {/* card content */}
    </motion.div>
  );
}

function Counter({ value }) {
  return (
    <motion.div
      key={value}
      initial={{ scale: 1.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring" }}
    >
      {value}
    </motion.div>
  );
}
```

**Estimated Effort:** 3-4 days for animations

---

## 9. State Synchronization Alternatives (LOW PRIORITY)

### Current State: Yjs + y-webrtc

**Yjs is excellent** for P2P CRDT synchronization. However, alternative approaches exist:

### Alternative: **Firebase Realtime Database**

**Pros:**
- Managed service (no signaling server)
- Built-in authentication
- Offline persistence
- Presence detection
- Security rules

**Cons:**
- Not free (usage-based pricing)
- Server-based (not P2P)
- Vendor lock-in
- Higher latency than P2P

**Use Case:** If you need:
- User accounts and authentication
- Persistent game state
- Chat and presence
- Don't need P2P (client-server is fine)

### Alternative: **Supabase Realtime**

**Pros:**
- Open source
- PostgreSQL-backed
- Built-in auth
- Self-hostable
- Row-level security

**Cons:**
- Not CRDT-based
- Server-based (not P2P)
- Requires backend infrastructure

**Use Case:** Similar to Firebase, but prefer open source

### Alternative: **Gun.js**

**Pros:**
- P2P and decentralized
- Offline-first
- Simple API

**Cons:**
- Less mature than Yjs
- Smaller ecosystem
- Eventual consistency can be tricky

**Recommendation:** **Keep Yjs**. It's perfect for this use case (P2P, CRDT, no server state).

---

## 10. Error Tracking and Monitoring (HIGH PRIORITY)

### Current State: None

**Problems:**
- No visibility into production errors
- WebRTC failures go unnoticed
- Yjs sync issues hard to debug
- No performance monitoring

### Recommended: **Sentry**

**Why Sentry:**
- Industry standard
- Excellent error grouping
- Source map support
- Performance monitoring
- Free tier for small projects

**Alternative Options:**

| Library | Pros | Cons | Use Case |
|---------|------|------|----------|
| **LogRocket** | Session replay | Expensive | If need session replay |
| **Rollbar** | Simple, affordable | Less features | Simpler needs |
| **Bugsnag** | Good React support | Smaller than Sentry | Alternative to Sentry |

**Code Example (Sentry):**
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-dsn",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
});

// Automatically catches errors
// Manual error tracking:
try {
  connectToWebRTC();
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'webrtc' },
    contexts: { room: roomName }
  });
}
```

**Estimated Effort:** 1 day to integrate

---

## 11. Form Validation (LOW PRIORITY - Not Needed Yet)

### Future Need: Room Name Input, Settings

When you add forms:

### Recommended: **Zod + React Hook Form**

**Why This Combo:**
- Zod: TypeScript-first schema validation
- React Hook Form: Minimal re-renders
- Work together seamlessly

**Code Example:**
```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const roomSchema = z.object({
  roomName: z.string().min(3).max(20),
  signalingServer: z.string().url().optional(),
});

function RoomSetup() {
  const { register, handleSubmit, errors } = useForm({
    resolver: zodResolver(roomSchema),
  });

  const onSubmit = (data) => {
    connectToRoom(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('roomName')} />
      {errors.roomName && <span>{errors.roomName.message}</span>}
    </form>
  );
}
```

---

## 12. Card Image Loading (FUTURE ENHANCEMENT)

### Future Need: Scryfall API Integration

When adding real card images:

### Recommended: **TanStack Query (React Query)**

**Why React Query:**
- Automatic caching
- Retry logic
- Loading states
- Infinite scroll support
- Image prefetching

**Code Example:**
```typescript
import { useQuery } from '@tanstack/react-query';

function CardImage({ cardName }) {
  const { data, isLoading } = useQuery({
    queryKey: ['card', cardName],
    queryFn: () => fetch(`https://api.scryfall.com/cards/named?exact=${cardName}`).then(r => r.json()),
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  if (isLoading) return <div>Loading...</div>;

  return <img src={data.image_uris.normal} alt={cardName} />;
}
```

---

## Priority Implementation Roadmap

### Phase 1: Foundation (2-3 weeks)
**Must-Have:**
1. **React** - Core UI framework
2. **Zustand** - State management
3. **Vitest** - Testing infrastructure
4. **Sentry** - Error tracking

**Outcome:** Modern development foundation

### Phase 2: Developer Experience (1-2 weeks)
**Should-Have:**
5. **@github/hotkey** - Keyboard shortcuts
6. **Tailwind CSS** - Styling system
7. **Radix UI** - Modal dialogs

**Outcome:** Better DX, maintainable codebase

### Phase 3: Polish (1 week)
**Nice-to-Have:**
8. **dnd-kit** - Drag and drop
9. **Framer Motion** - Animations

**Outcome:** Professional polish

### Phase 4: Future (When Needed)
**Optional:**
10. **React Query** - Card image loading
11. **Zod + React Hook Form** - Form validation

---

## Bundle Size Impact Analysis

### Current Production Bundle
```
dist/assets/index-[hash].js   215.39 kB │ gzip: 63.26 kB
```

### Estimated with All Recommended Libraries

| Library | Gzipped Size | Justification |
|---------|--------------|---------------|
| React + ReactDOM | ~45 KB | Essential for modern UI |
| Zustand | ~1 KB | Negligible |
| Vitest | 0 KB | Dev-only |
| @github/hotkey | ~2 KB | Tiny |
| Tailwind CSS | ~10 KB | With tree-shaking |
| Radix UI Dialog | ~5 KB | Per primitive |
| dnd-kit | ~20 KB | Worth it for features |
| Framer Motion | ~30 KB | Can lazy-load |
| Sentry | ~40 KB | Essential for production |
| **Total Estimated** | **~153 KB** | Similar to current |

**Notes:**
- Current bundle includes Yjs (large) and custom code
- With libraries, bundle size stays similar but gains:
  - Better performance (virtual DOM)
  - Less custom code to maintain
  - More features (accessibility, animations)

---

## Migration Strategy

### Option A: Big Bang Rewrite (NOT RECOMMENDED)
- Rewrite everything at once with React
- High risk, 6-8 weeks
- Downtime during migration

### Option B: Incremental Migration (RECOMMENDED)
1. **Week 1-2**: Add React, keep vanilla code
2. **Week 3**: Migrate one component (GameResourcesDock)
3. **Week 4**: Migrate Whiteboard
4. **Week 5**: Migrate PileViewer, add Zustand
5. **Week 6**: Consolidate keyboard shortcuts
6. **Week 7**: Add testing infrastructure
7. **Week 8**: Polish and optimize

**Benefits:**
- Lower risk (working app at each step)
- Learn incrementally
- Can release features during migration

### Option C: New Features Only (PRAGMATIC)
- Keep existing code as-is
- Use new libraries only for new features
- Gradually refactor hot paths

**Example:**
- Current code stays vanilla
- New "Chat" feature uses React
- New "Card Search" uses React Query
- Over time, more code becomes React

---

## Conclusion

### What to Do Now

**Immediate (This Week):**
1. Set up **Vitest** - Add first unit test
2. Add **Sentry** - Get error visibility
3. Add **Zustand** - Centralize hover state

**Short Term (This Month):**
4. Evaluate **React** migration path
5. Set up **@github/hotkey** prototype
6. Add **Tailwind CSS** to new components

**Long Term (This Quarter):**
7. Complete React migration
8. Add comprehensive test coverage
9. Implement drag-and-drop with **dnd-kit**
10. Add animations with **Framer Motion**

### Final Recommendation

**Start with the "Pragmatic" approach:**
- Don't rewrite everything
- Add libraries for new features
- Refactor hot paths when needed
- Prioritize testing and monitoring

This keeps the project moving forward while gradually modernizing the codebase.