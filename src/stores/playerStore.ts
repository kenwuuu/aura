/**
 * Player Store (Zustand)
 *
 * Global state management for player-related data.
 * Eliminates prop drilling by providing direct access to yPlayerState anywhere in the app.
 */

import { create } from 'zustand';
import * as Y from 'yjs';

interface PlayerStore {
  // Yjs map containing all player state (deck, hand, exile, discard, health, etc.)
  yPlayerState: Y.Map<any> | null;

  // Yjs document for accessing all shared state
  yDoc: Y.Doc | null;

  // Local player ID
  playerId: string | null;

  // Set the yPlayerState reference (called once during app initialization)
  setYPlayerState: (state: Y.Map<any>) => void;

  // Set the yDoc reference (called once during app initialization)
  setYDoc: (doc: Y.Doc) => void;

  // Set the playerId (called once during app initialization)
  setPlayerId: (id: string) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  yPlayerState: null,
  yDoc: null,
  playerId: null,
  setYPlayerState: (yPlayerState) => set({ yPlayerState }),
  setYDoc: (yDoc) => set({ yDoc }),
  setPlayerId: (playerId) => set({ playerId }),
}));
