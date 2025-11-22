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

  // Set the yPlayerState reference (called once during app initialization)
  setYPlayerState: (state: Y.Map<any>) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  yPlayerState: null,
  setYPlayerState: (yPlayerState) => set({ yPlayerState }),
}));
