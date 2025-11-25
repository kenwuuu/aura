/**
 * Hotkey Store (Zustand)
 *
 * Global state management for hotkey context and hover states.
 * Eliminates window globals and enables declarative hotkey handling.
 */

import { create } from 'zustand';
import { HotkeyContext } from '@/data/hotkeys';

interface HotkeyStore {
  // Current context (what user is hovering)
  activeContext: HotkeyContext;

  // Context-specific hover state
  hoveredBattlefieldCardId: string | null;
  hoveredHandCardId: string | null;
  hoveredPileType: 'deck' | 'exile' | 'discard' | null;
  hoveredTokenId: string | null;
  hoveredPileViewerCardId: string | null;
  hoveredPileViewerContext: HotkeyContext | null;

  // Modal states (disable hotkeys when modals are open)
  isModalOpen: boolean;
  addCardModalOpen: boolean;

  // Actions
  setActiveContext: (context: HotkeyContext) => void;
  setHoveredBattlefieldCard: (cardId: string | null) => void;
  setHoveredHandCard: (cardId: string | null) => void;
  setHoveredPile: (pileType: 'deck' | 'exile' | 'discard' | null) => void;
  setHoveredToken: (tokenId: string | null) => void;
  setHoveredPileViewerCard: (cardId: string | null, context: HotkeyContext | null) => void;
  setModalOpen: (isOpen: boolean) => void;
  setAddCardModalOpen: (isOpen: boolean) => void;
  reset: () => void;
}

export const useHotkeyStore = create<HotkeyStore>((set) => ({
  activeContext: HotkeyContext.Global,
  hoveredBattlefieldCardId: null,
  hoveredHandCardId: null,
  hoveredPileType: null,
  hoveredTokenId: null,
  hoveredPileViewerCardId: null,
  hoveredPileViewerContext: null,
  isModalOpen: false,
  addCardModalOpen: false,

  setActiveContext: (context) => set({ activeContext: context }),

  setHoveredBattlefieldCard: (cardId) => {
    set({
      hoveredBattlefieldCardId: cardId,
      activeContext: cardId ? HotkeyContext.Battlefield : HotkeyContext.Global,
      // Clear other hover states
      hoveredHandCardId: null,
      hoveredPileType: null,
      hoveredTokenId: null,
      hoveredPileViewerCardId: null,
      hoveredPileViewerContext: null,
    });
  },

  setHoveredHandCard: (cardId) => {
    set({
      hoveredHandCardId: cardId,
      activeContext: cardId ? HotkeyContext.Hand : HotkeyContext.Global,
      // Clear other hover states
      hoveredBattlefieldCardId: null,
      hoveredPileType: null,
      hoveredTokenId: null,
      hoveredPileViewerCardId: null,
      hoveredPileViewerContext: null,
    });
  },

  setHoveredPile: (pileType) => {
    set({
      hoveredPileType: pileType,
      activeContext: pileType
        ? (pileType === 'deck' ? HotkeyContext.Deck
           : pileType === 'exile' ? HotkeyContext.Exile
           : HotkeyContext.Discard)
        : HotkeyContext.Global,
      // Clear other hover states
      hoveredBattlefieldCardId: null,
      hoveredHandCardId: null,
      hoveredTokenId: null,
      hoveredPileViewerCardId: null,
      hoveredPileViewerContext: null,
    });
  },

  setHoveredToken: (tokenId) => {
    set({
      hoveredTokenId: tokenId,
      activeContext: tokenId ? HotkeyContext.KeywordToken : HotkeyContext.Global,
      // Clear other hover states
      hoveredBattlefieldCardId: null,
      hoveredHandCardId: null,
      hoveredPileType: null,
      hoveredPileViewerCardId: null,
      hoveredPileViewerContext: null,
    });
  },

  setHoveredPileViewerCard: (cardId, context) => {
    set({
      hoveredPileViewerCardId: cardId,
      hoveredPileViewerContext: context,
      activeContext: cardId && context ? context : HotkeyContext.Global,
      // Clear other hover states
      hoveredBattlefieldCardId: null,
      hoveredHandCardId: null,
      hoveredPileType: null,
      hoveredTokenId: null,
    });
  },

  setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),

  setAddCardModalOpen: (isOpen) => set({ addCardModalOpen: isOpen }),

  reset: () => set({
    activeContext: HotkeyContext.Global,
    hoveredBattlefieldCardId: null,
    hoveredHandCardId: null,
    hoveredPileType: null,
    hoveredTokenId: null,
    hoveredPileViewerCardId: null,
    hoveredPileViewerContext: null,
  }),
}));
