/**
 * Game Instance Store
 *
 * Zustand store that holds references to the main game instances.
 * This allows hotkey handlers and other React components to access
 * game instances without prop drilling.
 */

import { create } from 'zustand';
import type { Player } from '@/modules/player';
import type { MultiPlayerBoardManager } from '@/modules/whiteboard';
import type { CardPreview } from '@/modules/cardPreview';
import type { RoomManager } from '@/services/roomManager';

interface GameInstanceStore {
  // Game instances
  player: Player | null;
  whiteboard: MultiPlayerBoardManager | null;
  cardPreview: CardPreview | null;
  playerId: string | null;
  roomManager: RoomManager | null;

  // Setters
  setPlayer: (player: Player) => void;
  setWhiteboard: (whiteboard: MultiPlayerBoardManager) => void;
  setCardPreview: (cardPreview: CardPreview) => void;
  setPlayerId: (playerId: string) => void;
  setRoomManager: (roomManager: RoomManager) => void;

  // Reset all instances (useful for cleanup)
  reset: () => void;
}

export const useGameInstance = create<GameInstanceStore>((set) => ({
  // Initial state
  player: null,
  whiteboard: null,
  cardPreview: null,
  playerId: null,
  roomManager: null,

  // Setters
  setPlayer: (player) => set({ player }),
  setWhiteboard: (whiteboard) => set({ whiteboard }),
  setCardPreview: (cardPreview) => set({ cardPreview }),
  setPlayerId: (playerId) => set({ playerId }),
  setRoomManager: (roomManager) => set({ roomManager }),

  // Reset
  reset: () => set({
    player: null,
    whiteboard: null,
    cardPreview: null,
    playerId: null,
    roomManager: null,
  }),
}));