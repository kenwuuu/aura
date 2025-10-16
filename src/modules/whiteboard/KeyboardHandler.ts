import { WhiteboardCard } from './types';
import * as Y from 'yjs';

export interface KeyboardHandlerCallbacks {
  onMoveToHand: (card: WhiteboardCard) => void;
  onMoveToDeckTop: (card: WhiteboardCard) => void;
  onMoveToDeckBottom: (card: WhiteboardCard) => void;
  onMoveToGraveyard: (card: WhiteboardCard) => void;
  onMoveToExile: (card: WhiteboardCard) => void;
  onDrawCard: () => void;
  onShuffleDeck: () => void;
  onUntapAll: () => void;
  onEndTurn: () => void;
}

export class KeyboardHandler {
  private hoveredCardId: string | null = null;
  private yCards: Y.Map<WhiteboardCard>;
  private callbacks: KeyboardHandlerCallbacks;

  constructor(yCards: Y.Map<WhiteboardCard>, callbacks: KeyboardHandlerCallbacks) {
    this.yCards = yCards;
    this.callbacks = callbacks;
    this.attachListeners();
  }

  public setHoveredCard(cardId: string | null): void {
    this.hoveredCardId = cardId;
  }

  private attachListeners(): void {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Ignore if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = e.key.toLowerCase();
    const card = this.hoveredCardId ? this.yCards.get(this.hoveredCardId) : null;

    switch (key) {
      case ' ': // Space - Tap/Untap
        e.preventDefault();
        if (card) this.toggleTap(card);
        break;

      case 'y': // Y - Move to bottom of deck
        e.preventDefault();
        if (card) {
          this.callbacks.onMoveToDeckBottom(card);
          this.removeCard(card.id);
        }
        break;

      case 't': // T - Move to top of deck
        e.preventDefault();
        if (card) {
          this.callbacks.onMoveToDeckTop(card);
          this.removeCard(card.id);
        }
        break;

      case 'u': // U - Add counter
        e.preventDefault();
        if (card) this.addCounter(card);
        break;

      case 'c': // C - Draw card
        e.preventDefault();
        this.callbacks.onDrawCard();
        break;

      case 'x': // X - Untap all
        e.preventDefault();
        this.callbacks.onUntapAll();
        this.untapAllCards();
        break;

      case 'k': // K - Create copy
        e.preventDefault();
        if (card) this.createCopy(card);
        break;

      case 'd': // D - Move to graveyard
        e.preventDefault();
        if (card) {
          this.callbacks.onMoveToGraveyard(card);
          this.removeCard(card.id);
        }
        break;

      case 's': // S - Move to exile
        e.preventDefault();
        if (card) {
          this.callbacks.onMoveToExile(card);
          this.removeCard(card.id);
        }
        break;

      case 'v': // V - Shuffle deck
        e.preventDefault();
        this.callbacks.onShuffleDeck();
        break;

      case 'e': // E - End turn (boilerplate)
        e.preventDefault();
        this.callbacks.onEndTurn();
        console.log('End turn - not yet implemented');
        break;

      case 'f': // F - Flip card
        e.preventDefault();
        if (card) this.flipCard(card);
        break;
    }
  }

  private toggleTap(card: WhiteboardCard): void {
    const updatedCard = { ...card, isTapped: !card.isTapped };
    this.yCards.set(card.id, updatedCard);
  }

  private addCounter(card: WhiteboardCard): void {
    const updatedCard = { ...card, counters: [...card.counters, 1] };
    this.yCards.set(card.id, updatedCard);
  }

  private removeCard(cardId: string): void {
    this.yCards.delete(cardId);
  }

  private createCopy(card: WhiteboardCard): void {
    const newCard: WhiteboardCard = {
      ...card,
      id: `card-${Math.random().toString(36).substring(2, 11)}`,
      x: card.x + 20,
      y: card.y + 20,
      counters: [...card.counters],
    };
    this.yCards.set(newCard.id, newCard);
  }

  private flipCard(card: WhiteboardCard): void {
    const updatedCard = { ...card, isFlipped: !card.isFlipped };
    this.yCards.set(card.id, updatedCard);
  }

  private untapAllCards(): void {
    this.yCards.forEach((card, cardId) => {
      if (card.isTapped) {
        const updatedCard = { ...card, isTapped: false };
        this.yCards.set(cardId, updatedCard);
      }
    });
  }

  public destroy(): void {
    // Event listener cleanup if needed
  }
}