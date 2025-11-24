/**
 * Composable Game Hotkey Hooks
 *
 * These hooks use react-hotkeys-hook for declarative keyboard handling.
 * Each hook is scoped to a specific context (battlefield, hand, pile, etc.)
 * and automatically enables/disables based on Zustand hover state.
 */

import { useHotkeys } from 'react-hotkeys-hook';
import { useHotkeyStore } from '@/stores/hotkeyStore';
import { getKeyBindingsForAction } from '@/data/hotkeys';

/**
 * Global hotkeys (always active unless modal is open)
 */
export function useGlobalHotkeys(actions: {
  onDraw: () => void;
  onShuffle: () => void;
  onMulligan: () => void;
  onGainHealth: () => void;
  onLoseHealth: () => void;
  onUntapAll: () => void;
  onAddCard?: () => void;
}) {
  const isModalOpen = useHotkeyStore(state => state.isModalOpen);
  const enabled = !isModalOpen;

  useHotkeys(getKeyBindingsForAction('draw'), actions.onDraw, {
    enabled,
    preventDefault: true,
  });

  useHotkeys(getKeyBindingsForAction('shuffle'), actions.onShuffle, {
    enabled,
    preventDefault: true,
  });

  useHotkeys(getKeyBindingsForAction('mulligan'), actions.onMulligan, {
    enabled,
    preventDefault: true,
  });

  useHotkeys(getKeyBindingsForAction('gainHealth'), actions.onGainHealth, {
    enabled,
    preventDefault: true,
  });

  useHotkeys(getKeyBindingsForAction('loseHealth'), actions.onLoseHealth, {
    enabled,
    preventDefault: true,
  });

  useHotkeys(getKeyBindingsForAction('untapAll'), actions.onUntapAll, {
    enabled,
    preventDefault: true,
  });

  if (actions.onAddCard) {
    useHotkeys(getKeyBindingsForAction('addCard'), actions.onAddCard, {
      enabled,
      preventDefault: true,
    });
  }
}

/**
 * Battlefield card hotkeys (active when hovering a battlefield card)
 */
export function useBattlefieldCardHotkeys(
  cardId: string | null,
  actions: {
    onTap: (cardId: string) => void;
    onFlip: (cardId: string) => void;
    onAddCounter: (cardId: string) => void;
    onRemoveCounter: (cardId: string) => void;
    onCopy: (cardId: string) => void;
    onDelete: (cardId: string) => void;
    onMoveToHand: (cardId: string) => void;
    onMoveToDiscard: (cardId: string) => void;
    onMoveToExile: (cardId: string) => void;
    onMoveToDeckTop: (cardId: string) => void;
    onMoveToDeckBottom: (cardId: string) => void;
  }
) {
  const hoveredCardId = useHotkeyStore(state => state.hoveredBattlefieldCardId);
  const isModalOpen = useHotkeyStore(state => state.isModalOpen);
  const enabled = !isModalOpen && hoveredCardId === cardId && cardId !== null;

  useHotkeys('space', () => hoveredCardId && actions.onTap(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('f', () => hoveredCardId && actions.onFlip(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('u', () => hoveredCardId && actions.onAddCounter(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('i', () => hoveredCardId && actions.onRemoveCounter(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('k', () => hoveredCardId && actions.onCopy(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('backspace', () => hoveredCardId && actions.onDelete(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('h', () => hoveredCardId && actions.onMoveToHand(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('d', () => hoveredCardId && actions.onMoveToDiscard(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('s', () => hoveredCardId && actions.onMoveToExile(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('t', () => hoveredCardId && actions.onMoveToDeckTop(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('y', () => hoveredCardId && actions.onMoveToDeckBottom(hoveredCardId), {
    enabled,
    preventDefault: true,
  });
}

/**
 * Hand card hotkeys (active when hovering a hand card)
 */
export function useHandCardHotkeys(
  cardId: string | null,
  actions: {
    onFlip: (cardId: string) => void;
    onMoveToDiscard: (cardId: string) => void;
    onMoveToExile: (cardId: string) => void;
    onMoveToDeckTop: (cardId: string) => void;
    onMoveToDeckBottom: (cardId: string) => void;
  }
) {
  const hoveredCardId = useHotkeyStore(state => state.hoveredHandCardId);
  const isModalOpen = useHotkeyStore(state => state.isModalOpen);
  const enabled = !isModalOpen && hoveredCardId === cardId && cardId !== null;

  useHotkeys('f', () => hoveredCardId && actions.onFlip(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('d', () => hoveredCardId && actions.onMoveToDiscard(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('s', () => hoveredCardId && actions.onMoveToExile(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('t', () => hoveredCardId && actions.onMoveToDeckTop(hoveredCardId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('y', () => hoveredCardId && actions.onMoveToDeckBottom(hoveredCardId), {
    enabled,
    preventDefault: true,
  });
}

/**
 * Pile hotkeys (active when hovering a pile)
 * These hotkeys operate on the top card of the hovered pile
 */
export function usePileHotkeys(
  pileType: 'deck' | 'exile' | 'discard' | null,
  actions: {
    onMoveToHand: (pileType: string) => void;
    onMoveToDiscard?: (pileType: string) => void;
    onMoveToExile?: (pileType: string) => void;
    onMoveToDeckTop?: (pileType: string) => void;
    onMoveToDeckBottom?: (pileType: string) => void;
  }
) {
  const hoveredPile = useHotkeyStore(state => state.hoveredPileType);
  const isModalOpen = useHotkeyStore(state => state.isModalOpen);
  const enabled = !isModalOpen && hoveredPile === pileType && pileType !== null;

  useHotkeys('h', () => hoveredPile && actions.onMoveToHand(hoveredPile), {
    enabled,
    preventDefault: true,
  });

  // Only allow moving to discard if not already in discard pile
  if (actions.onMoveToDiscard) {
    useHotkeys('d', () => hoveredPile && hoveredPile !== 'discard' && actions.onMoveToDiscard?.(hoveredPile), {
      enabled: enabled && hoveredPile !== 'discard',
      preventDefault: true,
    });
  }

  // Only allow moving to exile if not already in exile pile
  if (actions.onMoveToExile) {
    useHotkeys('s', () => hoveredPile && hoveredPile !== 'exile' && actions.onMoveToExile?.(hoveredPile), {
      enabled: enabled && hoveredPile !== 'exile',
      preventDefault: true,
    });
  }

  // Only allow moving to deck top if not already in deck
  if (actions.onMoveToDeckTop) {
    useHotkeys('t', () => hoveredPile && hoveredPile !== 'deck' && actions.onMoveToDeckTop?.(hoveredPile), {
      enabled: enabled && hoveredPile !== 'deck',
      preventDefault: true,
    });
  }

  // Only allow moving to deck bottom if not already in deck
  if (actions.onMoveToDeckBottom) {
    useHotkeys('y', () => hoveredPile && hoveredPile !== 'deck' && actions.onMoveToDeckBottom?.(hoveredPile), {
      enabled: enabled && hoveredPile !== 'deck',
      preventDefault: true,
    });
  }
}

/**
 * Token hotkeys (active when hovering a keyword token)
 */
export function useTokenHotkeys(
  tokenId: string | null,
  actions: {
    onIncrement: (tokenId: string) => void;
    onDecrement: (tokenId: string) => void;
    onDelete: (tokenId: string) => void;
  }
) {
  const hoveredTokenId = useHotkeyStore(state => state.hoveredTokenId);
  const isModalOpen = useHotkeyStore(state => state.isModalOpen);
  const enabled = !isModalOpen && hoveredTokenId === tokenId && tokenId !== null;

  useHotkeys('arrowup', () => hoveredTokenId && actions.onIncrement(hoveredTokenId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('arrowdown', () => hoveredTokenId && actions.onDecrement(hoveredTokenId), {
    enabled,
    preventDefault: true,
  });

  useHotkeys('backspace', () => hoveredTokenId && actions.onDelete(hoveredTokenId), {
    enabled,
    preventDefault: true,
  });
}
