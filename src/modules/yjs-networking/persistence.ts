import {v4 as uuidv4} from 'uuid';

/**
 * Session Persistence Utilities
 *
 * Manages persistent identity across page reloads using browser storage:
 * - **localStorage**: Player ID, Peer ID, Awareness state
 * - **IndexedDB**: Y.Doc state (handled by y-indexeddb)
 *
 * ## Why Persistence Matters
 *
 * Without persistence, every page reload creates a "new user":
 * - ❌ New player ID → Appears as different player
 * - ❌ New peer ID → Reconnection churn in peer list
 * - ❌ Lost state → All cards, health, piles reset
 *
 * With persistence:
 * - ✅ Same player ID → Seamless reconnection
 * - ✅ Same peer ID → Stable peer identity
 * - ✅ Restored state → Cards and game state persist
 *
 * ## Usage Example
 *
 * ```typescript
 * // In index.ts
 * const playerId = getOrCreatePlayerId(); // "player-abc123" (persists)
 * const peerId = getOrCreatePeerId();     // UUID (persists)
 *
 * const provider = new WebRTCProvider(yDoc, {
 *   roomName,
 *   peerId, // Pass persistent peer ID
 * });
 * ```
 *
 * @see WebRTCProvider.ts for how these are used
 */

const STORAGE_KEYS = {
  PLAYER_ID: 'aura:playerId',
  AWARENESS_STATE: 'aura:awarenessState',
  PEER_ID: 'aura:peerId',
} as const;

export interface AwarenessState {
  name?: string;
  color?: string;
  [key: string]: unknown;
}

/**
 * Get or create a persistent player ID. Player ID is used by game logic. Peer ID is used by networking logic.
 * This ensures the same player ID is used across page reloads
 */
export function getOrCreatePlayerId(): string {
  let playerId = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);

  if (!playerId) {
    playerId = `player-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.PLAYER_ID, playerId);
  }

  return playerId;
}

/**
 * Get or create a persistent peer ID for WebRTC connections. Peer ID is used by networking logic. Player ID is used by game logic
 * This helps prevent peer identity changes on reconnection
 */
export function getOrCreatePeerId(): string {
  let peerId = localStorage.getItem(STORAGE_KEYS.PEER_ID);

  if (!peerId) {
    peerId = uuidv4();
    localStorage.setItem(STORAGE_KEYS.PEER_ID, peerId);
  }

  return peerId;
}

/**
 * Save awareness state to localStorage
 */
export function saveAwarenessState(state: AwarenessState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AWARENESS_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save awareness state:', error);
  }
}

/**
 * Restore awareness state from localStorage
 */
export function restoreAwarenessState(): AwarenessState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.AWARENESS_STATE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to restore awareness state:', error);
    return null;
  }
}

/**
 * Set up automatic awareness state persistence
 * Saves awareness state before page unload
 * @returns Cleanup function to remove the event listener
 */
export function setupAwarenessStatePersistence(getState: () => AwarenessState | null): () => void {
  const handleBeforeUnload = () => {
    const state = getState();
    if (state) {
      saveAwarenessState(state);
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

/**
 * Clear all persisted session data
 * Useful for testing or "start fresh" functionality
 */
export function clearPersistedSession(): void {
  localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
  localStorage.removeItem(STORAGE_KEYS.AWARENESS_STATE);
  localStorage.removeItem(STORAGE_KEYS.PEER_ID);
}