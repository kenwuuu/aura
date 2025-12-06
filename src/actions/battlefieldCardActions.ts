/**
 * Battlefield card actions
 *
 * Centralized logic for executing actions on battlefield cards.
 * Used by both keyboard hotkeys and tooltip menu clicks.
 */

import { MultiPlayerBoardManager } from '@/modules/whiteboard/MultiPlayerBoardManager';
import { CardPreview } from '@/modules/cardPreview';
import {useGameInstance} from "@/stores/gameInstanceStore";

export function executeBattlefieldCardAction(
  action: string,
  cardId: string,
  whiteboard: MultiPlayerBoardManager,
  playerId: string,
) {
  const yCards = whiteboard['yCards'];
  const card = yCards.get(cardId);
  const cardPreview = useGameInstance.getState().cardPreview!;

  if (action === 'untapAll') {
    yCards.forEach((c, cId) => {
      if (c.ownerId === playerId && c.isTapped) {
        yCards.set(cId, { ...c, isTapped: false });
      }
    });
    return;
  }

  if (!card) return;

  switch (action) {
    case 'tap':
      yCards.set(cardId, { ...card, isTapped: !card.isTapped });
      break;
    case 'flip':
      yCards.set(cardId, { ...card, isFlipped: !card.isFlipped });
      break;
    case 'addCounter':
      yCards.set(cardId, { ...card, counters: [...card.counters, 1] });
      break;
    case 'removeCounter':
      yCards.set(cardId, { ...card, counters: [...card.counters, -1] });
      break;
    case 'copy':
      const newCard = {
        ...card,
        id: `card-${Math.random().toString(36).substring(2, 11)}`,
        ownerId: playerId,
        x: card.x + 20,
        y: card.y + 20,
        zIndex: ++whiteboard['maxZIndex'],
        counters: [...card.counters],
      };
      yCards.set(newCard.id, newCard);
      break;
    case 'delete':
      cardPreview.hide();
      whiteboard.getTooltipManager().hide();
      yCards.delete(cardId);
      break;
    case 'moveToHand':
      cardPreview.hide();
      whiteboard.getTooltipManager().hide();
      window.dispatchEvent(new CustomEvent('moveCardToHand', { detail: { card } }));
      yCards.delete(cardId);
      break;
    case 'moveToDiscard':
      cardPreview.hide();
      whiteboard.getTooltipManager().hide();
      window.dispatchEvent(new CustomEvent('moveCardToDiscard', { detail: { card } }));
      yCards.delete(cardId);
      break;
    case 'moveToExile':
      cardPreview.hide();
      whiteboard.getTooltipManager().hide();
      window.dispatchEvent(new CustomEvent('moveCardToExile', { detail: { card } }));
      yCards.delete(cardId);
      break;
    case 'moveToDeckTop':
      cardPreview.hide();
      whiteboard.getTooltipManager().hide();
      window.dispatchEvent(new CustomEvent('moveCardToDeckTop', { detail: { card } }));
      yCards.delete(cardId);
      break;
    case 'moveToDeckBottom':
      cardPreview.hide();
      whiteboard.getTooltipManager().hide();
      window.dispatchEvent(new CustomEvent('moveCardToDeckBottom', { detail: { card } }));
      yCards.delete(cardId);
      break;
  }
}