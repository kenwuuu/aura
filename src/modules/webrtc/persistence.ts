/**
 * Persistence utilities for managing player identity and awareness state across sessions
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
 * Get or create a persistent player ID
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
 * Get or create a persistent peer ID for WebRTC connections
 * This helps prevent peer identity changes on reconnection
 */
export function getOrCreatePeerId(): string {
  let peerId = localStorage.getItem(STORAGE_KEYS.PEER_ID);

  if (!peerId) {
    peerId = crypto.randomUUID();
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
 */
export function setupAwarenessStatePersistence(getState: () => AwarenessState | null): void {
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