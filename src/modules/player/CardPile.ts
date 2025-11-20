import * as Y from 'yjs';
import { Card } from '../deck';

/**
 * CardPile represents a zone of cards in MTG (deck, hand, exile, discard, etc.)
 *
 * This class encapsulates all pile-related operations and syncs with Yjs for
 * peer-to-peer state synchronization. Each pile is stored as an array in the
 * player's Yjs state map.
 *
 * Architecture:
 * - Cards are stored in BOTTOM-TO-TOP order (index 0 = bottom, last index = top)
 * - Drawing/popping happens from the END of the array (LIFO)
 * - Syncs automatically to yPlayerState when modified
 */
export class CardPile {
  private yPlayerState: Y.Map<any>;
  private yStateKey: string;

  /**
   * @param yPlayerState - The Yjs map for the player's state
   * @param yStateKey - The key in yPlayerState where this pile is stored (e.g., 'hand', 'deck')
   */
  constructor(yPlayerState: Y.Map<any>, yStateKey: string) {
    this.yPlayerState = yPlayerState;
    this.yStateKey = yStateKey;
  }

  /**
   * Get all cards in the pile (returns a copy to prevent external mutations)
   */
  public getCards(): Card[] {
    const cards = this.yPlayerState.get(this.yStateKey);
    return cards ? [...cards] : [];
  }

  /**
   * Get the number of cards in this pile
   */
  public getCardCount(): number {
    return this.getCards().length;
  }

  /**
   * Find a card by its ID
   */
  public findCardById(cardId: string): Card | null {
    const cards = this.getCards();
    return cards.find(c => c.id === cardId) ?? null;
  }

  /**
   * Add a card to the top of the pile (end of array)
   */
  public addCardToTop(card: Card): void {
    this.placeCardAtPosition(card, Infinity);
  }

  /**
   * Add a card to the bottom of the pile (start of array)
   */
  public addCardToBottom(card: Card): void {
    this.placeCardAtPosition(card, 0);
  }

  /**
   * Place a card at a specific position in the pile
   * @param card - The card to place
   * @param position - Index position (0 = bottom, Infinity = top)
   */
  public placeCardAtPosition(card: Card, position: number): void {
    const cards = this.getCards();
    cards.splice(position, 0, card);
    this.yPlayerState.set(this.yStateKey, cards);
  }

  /**
   * Draw a card from the top of the pile (pop from end)
   * Returns null if pile is empty
   */
  public drawCard(): Card | null {
    const cards = this.getCards();
    if (cards.length === 0) return null;

    const drawnCard = cards.pop()!;
    this.yPlayerState.set(this.yStateKey, cards);
    return drawnCard;
  }

  /**
   * Remove a specific card by its ID
   * Returns the removed card, or null if not found
   */
  public removeCardById(cardId: string): Card | null {
    const cards = this.getCards();
    const index = cards.findIndex(c => c.id === cardId);

    if (index === -1) return null;

    const [removedCard] = cards.splice(index, 1);
    this.yPlayerState.set(this.yStateKey, cards);
    return removedCard;
  }

  /**
   * Remove a specific card object
   * Returns the removed card, or null if not found
   */
  public removeCard(card: Card): Card | null {
    return this.removeCardById(card.id);
  }

  /**
   * Clear all cards from the pile
   */
  public clear(): void {
    this.yPlayerState.set(this.yStateKey, []);
  }

  /**
   * Shuffle the pile using Fisher-Yates algorithm
   */
  public shuffle(): void {
    const cards = this.getCards();

    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    this.yPlayerState.set(this.yStateKey, cards);
  }

  /**
   * Replace all cards in the pile (used for bulk operations like mulligan)
   * @param cards - The new array of cards
   */
  public setCards(cards: Card[]): void {
    this.yPlayerState.set(this.yStateKey, [...cards]);
  }

  /**
   * Get a specific card by index (0 = bottom, length-1 = top)
   */
  public getCardAt(index: number): Card | null {
    const cards = this.getCards();
    return cards[index] ?? null;
  }

  /**
   * Get the top card without removing it
   */
  public peekTop(): Card | null {
    const cards = this.getCards();
    return cards[cards.length - 1] ?? null;
  }

  /**
   * Get the bottom card without removing it
   */
  public peekBottom(): Card | null {
    const cards = this.getCards();
    return cards[0] ?? null;
  }
}