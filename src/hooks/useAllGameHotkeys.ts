/**
 * Unified hook for all game hotkeys
 *
 * Replaces the repetitive individual hooks (useGlobalHotkeys, useBattlefieldCardHotkeys, etc.)
 * with a single hook that reads from the centralized hotkey configuration.
 *
 * This hook accesses game instances from the gameInstanceStore, eliminating the need
 * for prop drilling.
 */

import { useHotkeys } from 'react-hotkeys-hook';
import { useHotkeyStore } from '@/stores/hotkeyStore';
import { useGameInstance } from '@/stores/gameInstanceStore';
import { getKeyBindingsForAction, HotkeyContext } from '@/data/hotkeys';
import { DeckPersistenceService } from '@/services/deckPersistence';
import { executeBattlefieldCardAction } from '@/actions/battlefieldCardActions';

export function useAllGameHotkeys() {
  // Get game instances from store
  const { player, whiteboard, cardPreview, playerId, roomManager } = useGameInstance();

  // Get hover states from hotkey store
  const {
    hoveredBattlefieldCardId,
    hoveredHandCardId,
    hoveredPileType,
    hoveredTokenId,
    hoveredPileViewerCardId,
    hoveredPileViewerContext,
    isModalOpen,
    setAddCardModalOpen,
  } = useHotkeyStore();

  // Helper to save deck after modifications
  const saveDeck = () => {
    if (player && roomManager) {
      DeckPersistenceService.saveDeckForRoom(roomManager.getRoomName(), player.getDeck());
    }
  };

  // --- Global Hotkeys (always active unless modal is open) ---

  useHotkeys(
    getKeyBindingsForAction('draw'),
    () => {
      if (player) {
        player.drawCard();
        saveDeck();
      }
    },
    { enabled: !isModalOpen, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('shuffle'),
    () => {
      if (player) {
        player.shuffleDeck();
        saveDeck();
      }
    },
    { enabled: !isModalOpen, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('mulligan'),
    () => {
      if (player) {
        const confirmed = window.confirm("Mulligan? Draws 7 new cards.");
        if (confirmed) {
          player.mulligan(7);
          saveDeck();
        }
      }
    },
    { enabled: !isModalOpen, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('gainHealth'),
    () => {
      if (player) {
        player.modifyHealth(1);
      }
    },
    { enabled: !isModalOpen, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('loseHealth'),
    () => {
      if (player) {
        player.modifyHealth(-1);
      }
    },
    { enabled: !isModalOpen, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('untapAll'),
    () => {
      if (whiteboard && playerId) {
        executeBattlefieldCardAction('untapAll', '', whiteboard, playerId);
      }
    },
    { enabled: !isModalOpen, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('addCard'),
    () => {
      setAddCardModalOpen(true);
    },
    { enabled: !isModalOpen, preventDefault: true }
  );

  // --- Battlefield Card Hotkeys (active when hovering battlefield card) ---

  const battlefieldEnabled = !isModalOpen && !!hoveredBattlefieldCardId;

  useHotkeys(
    getKeyBindingsForAction('tap'),
    () => {
      if (whiteboard && playerId && hoveredBattlefieldCardId) {
        executeBattlefieldCardAction('tap', hoveredBattlefieldCardId, whiteboard, playerId);
      }
    },
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('flip'),
    () => {
      if (whiteboard && playerId && hoveredBattlefieldCardId) {
        executeBattlefieldCardAction('flip', hoveredBattlefieldCardId, whiteboard, playerId);
      }
    },
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('addCounter'),
    () => {
      if (whiteboard && playerId && hoveredBattlefieldCardId) {
        executeBattlefieldCardAction('addCounter', hoveredBattlefieldCardId, whiteboard, playerId);
      }
    },
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('removeCounter'),
    () => {
      if (whiteboard && playerId && hoveredBattlefieldCardId) {
        executeBattlefieldCardAction('removeCounter', hoveredBattlefieldCardId, whiteboard, playerId);
      }
    },
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('copy'),
    () => {
      if (whiteboard && playerId && hoveredBattlefieldCardId) {
        executeBattlefieldCardAction('copy', hoveredBattlefieldCardId, whiteboard, playerId);
      }
    },
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('delete'),
    () => {
      if (whiteboard && playerId && hoveredBattlefieldCardId) {
        executeBattlefieldCardAction('delete', hoveredBattlefieldCardId, whiteboard, playerId, cardPreview);
      }
    },
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToHand'),
    () => {
      if (whiteboard && playerId && hoveredBattlefieldCardId) {
        executeBattlefieldCardAction('moveToHand', hoveredBattlefieldCardId, whiteboard, playerId, cardPreview);
      }
    },
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDiscard'),
    () => {
      if (whiteboard && playerId && hoveredBattlefieldCardId) {
        executeBattlefieldCardAction('moveToDiscard', hoveredBattlefieldCardId, whiteboard, playerId, cardPreview);
      }
    },
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToExile'),
    () => {
      if (whiteboard && playerId && hoveredBattlefieldCardId) {
        executeBattlefieldCardAction('moveToExile', hoveredBattlefieldCardId, whiteboard, playerId, cardPreview);
      }
    },
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDeckTop'),
    () => {
      if (whiteboard && playerId && hoveredBattlefieldCardId) {
        executeBattlefieldCardAction('moveToDeckTop', hoveredBattlefieldCardId, whiteboard, playerId, cardPreview);
      }
    },
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDeckBottom'),
    () => {
      if (whiteboard && playerId && hoveredBattlefieldCardId) {
        executeBattlefieldCardAction('moveToDeckBottom', hoveredBattlefieldCardId, whiteboard, playerId, cardPreview);
      }
    },
    { enabled: battlefieldEnabled, preventDefault: true }
  );

  // --- Hand Card Hotkeys (active when hovering hand card) ---

  const handEnabled = !isModalOpen && !!hoveredHandCardId;

  useHotkeys(
    getKeyBindingsForAction('flip'),
    () => {
      if (player && cardPreview && hoveredHandCardId) {
        player.flipHandCard(hoveredHandCardId);
        player.syncToYState();
        cardPreview.hide();
      }
    },
    { enabled: handEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDiscard'),
    () => {
      if (player && cardPreview && hoveredHandCardId) {
        const hand = player.getState().hand;
        const card = hand.find(c => c.id === hoveredHandCardId);
        if (card) {
          player.removeCardFromPileById(hoveredHandCardId, 'hand');
          player.placeCardInPile(card, 'discard');
          cardPreview.hide();
        }
        player.syncToYState();
      }
    },
    { enabled: handEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToExile'),
    () => {
      if (player && cardPreview && hoveredHandCardId) {
        const hand = player.getState().hand;
        const card = hand.find(c => c.id === hoveredHandCardId);
        if (card) {
          player.removeCardFromPileById(hoveredHandCardId, 'hand');
          player.placeCardInPile(card, 'exile');
          cardPreview.hide();
        }
        player.syncToYState();
      }
    },
    { enabled: handEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDeckTop'),
    () => {
      if (player && cardPreview && hoveredHandCardId) {
        const hand = player.getState().hand;
        const card = hand.find(c => c.id === hoveredHandCardId);
        if (card) {
          player.removeCardFromPileById(hoveredHandCardId, 'hand');
          player.placeCardInPile(card, 'deck');
          cardPreview.hide();
        }
        player.syncToYState();
      }
    },
    { enabled: handEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDeckBottom'),
    () => {
      if (player && cardPreview && hoveredHandCardId) {
        const hand = player.getState().hand;
        const card = hand.find(c => c.id === hoveredHandCardId);
        if (card) {
          player.removeCardFromPileById(hoveredHandCardId, 'hand');
          player.placeCardInPile(card, 'deck', 0);
          cardPreview.hide();
        }
        player.syncToYState();
      }
    },
    { enabled: handEnabled, preventDefault: true }
  );

  // --- Pile Hotkeys (active when hovering a pile) ---

  const pileEnabled = !isModalOpen && !!hoveredPileType;

  useHotkeys(
    getKeyBindingsForAction('moveToHand'),
    () => {
      if (player && hoveredPileType) {
        const card = player.drawCardFromPile(hoveredPileType as 'deck' | 'exile' | 'discard');
        if (card) player.placeCardInPile(card, 'hand');
        player.syncToYState();
      }
    },
    { enabled: pileEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDiscard'),
    () => {
      if (player && hoveredPileType && hoveredPileType !== 'discard') {
        const card = player.drawCardFromPile(hoveredPileType as 'deck' | 'exile' | 'discard');
        if (card) player.placeCardInPile(card, 'discard');
        player.syncToYState();
      }
    },
    { enabled: pileEnabled && hoveredPileType !== 'discard', preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToExile'),
    () => {
      if (player && hoveredPileType && hoveredPileType !== 'exile') {
        const card = player.drawCardFromPile(hoveredPileType as 'deck' | 'exile' | 'discard');
        if (card) player.placeCardInPile(card, 'exile');
        player.syncToYState();
      }
    },
    { enabled: pileEnabled && hoveredPileType !== 'exile', preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDeckTop'),
    () => {
      if (player && hoveredPileType && hoveredPileType !== 'deck') {
        const card = player.drawCardFromPile(hoveredPileType as 'deck' | 'exile' | 'discard');
        if (card) player.placeCardInPile(card, 'deck');
        player.syncToYState();
      }
    },
    { enabled: pileEnabled && hoveredPileType !== 'deck', preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDeckBottom'),
    () => {
      if (player && hoveredPileType && hoveredPileType !== 'deck') {
        const card = player.drawCardFromPile(hoveredPileType as 'deck' | 'exile' | 'discard');
        if (card) player.placeCardInPile(card, 'deck', 0);
        player.syncToYState();
      }
    },
    { enabled: pileEnabled && hoveredPileType !== 'deck', preventDefault: true }
  );

  // --- Token Hotkeys (active when hovering a keyword token) ---

  const tokenEnabled = !isModalOpen && !!hoveredTokenId;

  useHotkeys(
    getKeyBindingsForAction('tokenIncrement'),
    () => {
      if (whiteboard && playerId && hoveredTokenId) {
        const yTokens = whiteboard['yTokens'];
        const token = yTokens.get(hoveredTokenId);
        if (token && token.ownerId === playerId) {
          yTokens.set(hoveredTokenId, { ...token, count: (token.count ?? 0) + 1 });
        }
      }
    },
    { enabled: tokenEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('tokenDecrement'),
    () => {
      if (whiteboard && playerId && hoveredTokenId) {
        const yTokens = whiteboard['yTokens'];
        const token = yTokens.get(hoveredTokenId);
        if (token && token.ownerId === playerId) {
          const newCount = (token.count ?? 0) - 1;
          if (newCount <= 0) {
            yTokens.delete(hoveredTokenId);
          } else {
            yTokens.set(hoveredTokenId, { ...token, count: newCount });
          }
        }
      }
    },
    { enabled: tokenEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('tokenDelete'),
    () => {
      if (whiteboard && playerId && hoveredTokenId) {
        const yTokens = whiteboard['yTokens'];
        const token = yTokens.get(hoveredTokenId);
        if (token && token.ownerId === playerId) {
          yTokens.delete(hoveredTokenId);
        }
      }
    },
    { enabled: tokenEnabled, preventDefault: true }
  );

  // --- Pile Viewer Card Hotkeys (active when hovering card in pile viewer modal) ---

  const pileViewerEnabled = isModalOpen && !!hoveredPileViewerCardId;

  useHotkeys(
    getKeyBindingsForAction('moveToHand'),
    () => {
      if (hoveredPileViewerCardId) {
        window.dispatchEvent(new CustomEvent('pileViewerCardAction', {
          detail: { action: 'moveToHand', cardId: hoveredPileViewerCardId }
        }));
      }
    },
    { enabled: pileViewerEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDiscard'),
    () => {
      if (hoveredPileViewerCardId && hoveredPileViewerContext !== HotkeyContext.Discard) {
        window.dispatchEvent(new CustomEvent('pileViewerCardAction', {
          detail: { action: 'moveToDiscard', cardId: hoveredPileViewerCardId }
        }));
      }
    },
    { enabled: pileViewerEnabled && hoveredPileViewerContext !== HotkeyContext.Discard, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToExile'),
    () => {
      if (hoveredPileViewerCardId && hoveredPileViewerContext !== HotkeyContext.Exile) {
        window.dispatchEvent(new CustomEvent('pileViewerCardAction', {
          detail: { action: 'moveToExile', cardId: hoveredPileViewerCardId }
        }));
      }
    },
    { enabled: pileViewerEnabled && hoveredPileViewerContext !== HotkeyContext.Exile, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDeckTop'),
    () => {
      if (hoveredPileViewerCardId) {
        window.dispatchEvent(new CustomEvent('pileViewerCardAction', {
          detail: { action: 'moveToDeckTop', cardId: hoveredPileViewerCardId }
        }));
      }
    },
    { enabled: pileViewerEnabled, preventDefault: true }
  );

  useHotkeys(
    getKeyBindingsForAction('moveToDeckBottom'),
    () => {
      if (hoveredPileViewerCardId) {
        window.dispatchEvent(new CustomEvent('pileViewerCardAction', {
          detail: { action: 'moveToDeckBottom', cardId: hoveredPileViewerCardId }
        }));
      }
    },
    { enabled: pileViewerEnabled, preventDefault: true }
  );
}
