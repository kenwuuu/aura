import { create } from 'zustand';
import type { Card } from '@/modules/deck';
import type { Player } from '@/modules/player';

interface UIState {
  // Modal states
  isScryModalOpen: boolean;
  isAddCardModalOpen: boolean;

  // Modal actions
  openScryModal: () => void;
  closeScryModal: () => void;
  openAddCardModal: () => void;
  closeAddCardModal: () => void;

  // Card actions
  addCard: (player: Player, card: Card) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial modal states
  isScryModalOpen: false,
  isAddCardModalOpen: false,

  // Modal actions
  openScryModal: () => set({ isScryModalOpen: true }),
  closeScryModal: () => set({ isScryModalOpen: false }),
  openAddCardModal: () => set({ isAddCardModalOpen: true }),
  closeAddCardModal: () => set({ isAddCardModalOpen: false }),

  // Card actions
  addCard: (player: Player, card: Card) => {
    player.putCardInHand(card);
  },
}));
