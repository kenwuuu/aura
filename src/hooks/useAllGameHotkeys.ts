/**
 * Unified hook for all game hotkeys
 *
 * Replaces the repetitive individual hooks (useGlobalHotkeys, useBattlefieldCardHotkeys, etc.)
 * with a single hook that reads from the centralized hotkey configuration.
 */

import { useHotkeys } from 'react-hotkeys-hook';
import { useHotkeyStore } from '@/stores/hotkeyStore';
import { getKeyBindingsForAction } from '@/data/hotkeys';
import type {
  GlobalActions,
  BattlefieldActions,
  HandActions,
  PileActions,
  TokenActions,
} from '@/types/hotkeys';

interface UseAllGameHotkeysParams {
  globalActions: GlobalActions;
  battlefieldActions: BattlefieldActions;
  handActions: HandActions;
  pileActions: PileActions;
  tokenActions: TokenActions;
}

export function useAllGameHotkeys({
  globalActions,
  battlefieldActions,
  handActions,
  pileActions,
  tokenActions,
}: UseAllGameHotkeysParams) {
  const {
    hoveredBattlefieldCardId,
    hoveredHandCardId,
    hoveredPileType,
    hoveredTokenId,
    isModalOpen,
  } = useHotkeyStore();

  // --- Global Hotkeys (always active unless modal is open) ---

  useHotkeys(
    getKeyBindingsForAction('draw'),
    globalActions.onDraw,
    { enabled: !isModalOpen, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('shuffle'),
    globalActions.onShuffle,
    { enabled: !isModalOpen, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('mulligan'),
    globalActions.onMulligan,
    { enabled: !isModalOpen, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('gainHealth'),
    globalActions.onGainHealth,
    { enabled: !isModalOpen, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('loseHealth'),
    globalActions.onLoseHealth,
    { enabled: !isModalOpen, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('untapAll'),
    globalActions.onUntapAll,
    { enabled: !isModalOpen, preventDefault: true }
  );

  if (globalActions.onAddCard) {
    useHotkeys(
      getKeyBindingsForAction('addCard'),
      globalActions.onAddCard,
      { enabled: !isModalOpen, preventDefault: true }
    );
  }

  // --- Battlefield Card Hotkeys (active when hovering battlefield card) ---

  const battlefieldEnabled = !isModalOpen && !!hoveredBattlefieldCardId;

  useHotkeys(
    getKeyBindingsForAction('tap'),
    () => hoveredBattlefieldCardId && battlefieldActions.onTap(hoveredBattlefieldCardId),
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('flip'),
    () => hoveredBattlefieldCardId && battlefieldActions.onFlip(hoveredBattlefieldCardId),
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('addCounter'),
    () => hoveredBattlefieldCardId && battlefieldActions.onAddCounter(hoveredBattlefieldCardId),
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('removeCounter'),
    () => hoveredBattlefieldCardId && battlefieldActions.onRemoveCounter(hoveredBattlefieldCardId),
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('copy'),
    () => hoveredBattlefieldCardId && battlefieldActions.onCopy(hoveredBattlefieldCardId),
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('delete'),
    () => hoveredBattlefieldCardId && battlefieldActions.onDelete(hoveredBattlefieldCardId),
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToHand'),
    () => hoveredBattlefieldCardId && battlefieldActions.onMoveToHand(hoveredBattlefieldCardId),
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDiscard'),
    () => hoveredBattlefieldCardId && battlefieldActions.onMoveToDiscard(hoveredBattlefieldCardId),
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToExile'),
    () => hoveredBattlefieldCardId && battlefieldActions.onMoveToExile(hoveredBattlefieldCardId),
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDeckTop'),
    () => hoveredBattlefieldCardId && battlefieldActions.onMoveToDeckTop(hoveredBattlefieldCardId),
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDeckBottom'),
    () => hoveredBattlefieldCardId && battlefieldActions.onMoveToDeckBottom(hoveredBattlefieldCardId),
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  // --- Hand Card Hotkeys (active when hovering hand card) ---

  const handEnabled = !isModalOpen && !!hoveredHandCardId;

  useHotkeys(
    getKeyBindingsForAction('flip'),
    () => hoveredHandCardId && handActions.onFlip(hoveredHandCardId),
    { enabled: handEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDiscard'),
    () => hoveredHandCardId && handActions.onMoveToDiscard(hoveredHandCardId),
    { enabled: handEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToExile'),
    () => hoveredHandCardId && handActions.onMoveToExile(hoveredHandCardId),
    { enabled: handEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDeckTop'),
    () => hoveredHandCardId && handActions.onMoveToDeckTop(hoveredHandCardId),
    { enabled: handEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDeckBottom'),
    () => hoveredHandCardId && handActions.onMoveToDeckBottom(hoveredHandCardId),
    { enabled: handEnabled, preventDefault: true }
  );

  // --- Pile Hotkeys (active when hovering a pile) ---

  const pileEnabled = !isModalOpen && !!hoveredPileType;

  useHotkeys(
    getKeyBindingsForAction('moveToHand'),
    () => hoveredPileType && pileActions.onMoveToHand(hoveredPileType),
    { enabled: pileEnabled, preventDefault: true }
  );

  if (pileActions.onMoveToDiscard) {
    useHotkeys(
      getKeyBindingsForAction('moveToDiscard'),
      () => hoveredPileType && hoveredPileType !== 'discard' && pileActions.onMoveToDiscard?.(hoveredPileType),
      { enabled: pileEnabled && hoveredPileType !== 'discard', preventDefault: true }
    );
  }

  if (pileActions.onMoveToExile) {
    useHotkeys(
      getKeyBindingsForAction('moveToExile'),
      () => hoveredPileType && hoveredPileType !== 'exile' && pileActions.onMoveToExile?.(hoveredPileType),
      { enabled: pileEnabled && hoveredPileType !== 'exile', preventDefault: true }
    );
  }

  if (pileActions.onMoveToDeckTop) {
    useHotkeys(
      getKeyBindingsForAction('moveToDeckTop'),
      () => hoveredPileType && hoveredPileType !== 'deck' && pileActions.onMoveToDeckTop?.(hoveredPileType),
      { enabled: pileEnabled && hoveredPileType !== 'deck', preventDefault: true }
    );
  }

  if (pileActions.onMoveToDeckBottom) {
    useHotkeys(
      getKeyBindingsForAction('moveToDeckBottom'),
      () => hoveredPileType && hoveredPileType !== 'deck' && pileActions.onMoveToDeckBottom?.(hoveredPileType),
      { enabled: pileEnabled && hoveredPileType !== 'deck', preventDefault: true }
    );
  }

  // --- Token Hotkeys (active when hovering a keyword token) ---

  const tokenEnabled = !isModalOpen && !!hoveredTokenId;

  useHotkeys(
    getKeyBindingsForAction('tokenIncrement'),
    () => hoveredTokenId && tokenActions.onIncrement(hoveredTokenId),
    { enabled: tokenEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('tokenDecrement'),
    () => hoveredTokenId && tokenActions.onDecrement(hoveredTokenId),
    { enabled: tokenEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('tokenDelete'),
    () => hoveredTokenId && tokenActions.onDelete(hoveredTokenId),
    { enabled: tokenEnabled, preventDefault: true }
  );
}
