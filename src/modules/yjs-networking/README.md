# WebRTC Module

Real-time peer-to-peer synchronization for Aura using Yjs and WebRTC.

## Overview

This module handles all networking and persistence for the application:

- **Peer-to-peer connections** via WebRTC (no game state server needed)
- **CRDT-based state sync** using Yjs for conflict-free merging
- **Local persistence** via IndexedDB for instant restoration on reload
- **Session persistence** to maintain player identity across page reloads

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  index.ts (Application Layer)                           │
│  - Creates Y.Doc and initializes WebRTCProvider         │
│  - Uses getOrCreatePlayerId() and getOrCreatePeerId()   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  WebRTCProvider (This Module)                           │
│  - Wraps y-webrtc and y-indexeddb                       │
│  - Manages peer connections and persistence             │
│  - Handles awareness state (user presence)              │
└─────────────┬───────────────────────┬───────────────────┘
              │                       │
              ▼                       ▼
┌─────────────────────┐   ┌─────────────────────────────┐
│  y-webrtc           │   │  y-indexeddb                │
│  (Network Layer)    │   │  (Persistence Layer)        │
│                     │   │                             │
│  - WebRTC signaling │   │  - Stores Y.Doc in IndexedDB│
│  - Peer discovery   │   │  - Instant restoration      │
│  - State sync       │   │                             │
└─────────────────────┘   └─────────────────────────────┘
```

## Files

### `WebRTCProvider.ts`
Main class that orchestrates networking and persistence.

**Key responsibilities:**
- Initialize y-webrtc provider for peer connections
- Initialize y-indexeddb for local state persistence
- Set persistent peer ID to prevent "new user" on reload
- Restore and persist awareness state (user metadata)
- Emit connection status events (peer count, online/offline)

**Example usage:**
```typescript
const yDoc = new Y.Doc();
const playerId = getOrCreatePlayerId();
const peerId = getOrCreatePeerId();

const provider = new WebRTCProvider(yDoc, {
  roomName: 'mtg-abc123',
  peerId, // Optional: maintains identity across reloads
  signalingServers: ['wss://...'], // Optional: custom signaling servers
  iceServers: [{ urls: 'stun:...' }], // Optional: custom STUN/TURN
});

// Listen for connection status changes
provider.onStatusChange((status) => {
  console.log(`Connected to ${status.peersCount} peers`);
});

// Clean up on exit
provider.destroy();
```

### `persistence.ts`
Utilities for managing session persistence across page reloads.

**Key functions:**
- `getOrCreatePlayerId()` - Returns persistent player ID from localStorage
- `getOrCreatePeerId()` - Returns persistent peer ID from localStorage
- `saveAwarenessState()` / `restoreAwarenessState()` - Persist user metadata
- `setupAwarenessStatePersistence()` - Auto-save on page unload
- `clearPersistedSession()` - Reset all persisted data

**Example usage:**
```typescript
// Get or create persistent IDs
const playerId = getOrCreatePlayerId(); // "player-abc123"
const peerId = getOrCreatePeerId();     // UUID

// Save custom awareness state
saveAwarenessState({ name: 'Alice', color: '#ff0000' });

// Restore on next load
const state = restoreAwarenessState(); // { name: 'Alice', color: '#ff0000' }

// Clear all persisted data (useful for "new session" button)
clearPersistedSession();
```

### `types.ts`
TypeScript interfaces for WebRTC configuration and connection status.

**Interfaces:**
- `WebRTCConfig` - Configuration for WebRTCProvider constructor
- `ConnectionStatus` - Current peer connection state
- `AwarenessState` - User presence metadata (extensible)

## How WebRTC Works in Aura

### 1. Room-Based Connections

Users connect by sharing a room URL:
```
https://aura.example.com/?room=mtg-abc123
                                 ^^^^^^^^^^
                                 Unique room ID
```

All users with the same `room` parameter connect to each other via WebRTC.

### 2. Signaling Server

WebRTC needs a signaling server to discover peers (not for game state):

```
User A                 Signaling Server              User B
  │                           │                        │
  ├──────"Join mtg-abc123"───>│                        │
  │                           │<──"Join mtg-abc123"────┤
  │                           │                        │
  │<─────"User B is here"─────┤                        │
  ├─────"User A is here"──────>│                        │
  │                           │                        │
  │                     Direct WebRTC connection       │
  ├<────────────────────────────────────────────────>┤
  │         All game state syncs peer-to-peer         │
```

**Default signaling server:** `wss://y-webrtc-eu-production-1328.up.railway.app`

### 3. STUN/TURN Servers

STUN servers help with NAT traversal (finding your public IP):

```
User behind NAT ──> STUN Server ──> "Your public IP is X.X.X.X"
```

**Default STUN servers:**
- `stun:stun.l.google.com:19302` (Google)
- `stun:global.stun.twilio.com:3478` (Twilio)

### 4. State Synchronization

Yjs uses **CRDTs** (Conflict-free Replicated Data Types) to merge changes:

```
User A: Sets card X position to (100, 200)
User B: Sets card X position to (150, 200)  [at the same time]

Without CRDT: ❌ Conflict! Which position wins?
With CRDT:    ✅ Last-write-wins based on Lamport timestamp
```

**Example Y.Doc structure:**
```typescript
yDoc = {
  "cards": {                      // Shared battlefield
    "card-abc": { x: 100, y: 200, rotation: 90, ... },
    "card-xyz": { x: 300, y: 400, ... }
  },
  "player-alice123": {            // Per-player state
    health: 20,
    hand: [card1, card2],
    exilePile: [],
    discardPile: []
  },
  "player-bob456": {              // Other player
    health: 18,
    ...
  }
}
```

All changes to `yDoc.getMap(YDOC_CARDS_ON_BOARD)` automatically sync to all peers.

## Local Persistence (IndexedDB)

When you reload the page:

1. **Load Y.Doc from IndexedDB** (instant, even before WebRTC connects)
2. **Connect to signaling server** and discover peers
3. **Sync any missed updates** via WebRTC

This provides an **offline-first experience** where the app works even with no internet, and syncs when reconnected.

**Storage location:**
- Browser: IndexedDB database `yjs`
- Table: `yjs-<roomName>`

**To clear local state:**
```typescript
import { clearPersistedSession } from './persistence';
clearPersistedSession();
indexedDB.deleteDatabase('yjs'); // Clear Y.Doc
```

## Session Persistence

Without session persistence:
```
User loads page
  ├─> New player ID: "player-abc123"
  ├─> Connects to peers
  └─> Plays some cards

User reloads page
  ├─> New player ID: "player-xyz789"  ❌ Appears as different user!
  ├─> Reconnects to peers             ❌ Peers see new user joined
  └─> State lost                      ❌ All progress gone
```

With session persistence:
```
User loads page
  ├─> Get player ID: "player-abc123" (from localStorage)
  ├─> Get peer ID: <UUID> (from localStorage)
  ├─> Load Y.Doc from IndexedDB
  └─> Connect with persistent peer ID

User reloads page
  ├─> Same player ID: "player-abc123"  ✅ Same identity
  ├─> Same peer ID: <UUID>             ✅ No flicker in peer list
  ├─> Y.Doc restored from IndexedDB    ✅ All cards and state restored
  └─> Reconnects seamlessly            ✅ Appears as same user
```

## Testing

### Test WebRTC Connections Locally

1. Start dev server: `npm run dev`
2. Open `http://localhost:5173` in first browser window
3. Copy full URL including `?room=xxx` parameter
4. Open same URL in second window (or different browser)
5. Verify "Connected (1 peer)" status in both windows
6. Test synchronization by moving cards in one window

### Test Session Persistence

1. Open app, note the player ID in console: `Player ID: player-abc123`
2. Make some changes (draw cards, play cards, modify health)
3. Reload the page (Cmd+R or Ctrl+R)
4. Verify same player ID appears in console
5. Verify all cards and state are restored

### Test Offline Behavior

1. Open app and make changes
2. Disconnect from internet (disable WiFi)
3. Continue making changes (works offline!)
4. Reload page (state restored from IndexedDB)
5. Reconnect to internet (syncs with peers)

## Troubleshooting

### "Waiting for peers..." forever

**Possible causes:**
1. Different room names (check URL `?room=` parameter)
2. Signaling server down (check browser console for WebSocket errors)
3. Firewall blocking WebRTC (try different network)
4. STUN server unreachable (try adding TURN server)

**Fix:**
```typescript
// Add TURN server for better NAT traversal
const provider = new WebRTCProvider(yDoc, {
  roomName,
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'user',
      credential: 'pass'
    }
  ]
});
```

### State not persisting after reload

**Check:**
1. Browser has IndexedDB enabled (not in private/incognito mode)
2. localStorage is enabled
3. Console for IndexedDB errors

**Fix:**
```javascript
// In browser console, check IndexedDB
indexedDB.databases().then(dbs => console.log(dbs));
// Should see: [{ name: 'yjs', version: 1 }]
```

### Peer ID changes on every reload

**Check:**
1. localStorage is working
2. `getOrCreatePeerId()` is being called
3. Peer ID is passed to WebRTCProvider

**Fix:**
```typescript
// Verify in browser console
localStorage.getItem('aura:peerId'); // Should return UUID
```

## Resources

- [Yjs Documentation](https://docs.yjs.dev/)
- [y-webrtc GitHub](https://github.com/yjs/y-webrtc)
- [y-indexeddb GitHub](https://github.com/yjs/y-indexeddb)
- [WebRTC Specification](https://webrtc.org/)
- [Aura WEBRTC_SETUP.md](../../../docs/WEBRTC_SETUP.md) - Detailed signaling server setup

## Future Improvements

- [ ] Add awareness state for cursor positions
- [ ] Implement username/color selection UI
- [ ] Add peer presence indicators (who's online)
- [ ] Implement reconnection backoff strategy
- [ ] Add telemetry for connection quality
- [ ] Support multiple rooms per user (spectator mode)