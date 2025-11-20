import { Card } from './types';

export class Deck {
  private cards: Card[] = [];

  constructor(cards?: Card[], numDummyCards?: number) {
    // Use provided cards if available, otherwise initialize with blank cards
    if (cards && cards.length > 0) {
      // Regenerate unique IDs for all cards to prevent collisions when multiple players use the same deck
      this.cards = cards.map(card => ({
        ...card,
        id: `card-${Math.random().toString(36).substring(2, 11)}`,
      }));
    } else {
      this.initializeDeckWithDummyCards(numDummyCards);
    }
  }

  private initializeDeckWithDummyCards(numDummyCards: number = 0): void {
    for (let i = 0; i < numDummyCards; i++) {
      this.cards.push({
        id: `card-${Math.random().toString(36).substring(2, 11)}`,
        cardNumber: i + 1, // Start from 1
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
      });
    }
  }

  public findCardById(cardId: string): Card | null {
    return this.cards.find(c => c.id === cardId) ?? null;
  }

  public findCard(card: Card): Card | null {
    return this.cards.find(c => c.id === card.id) ?? null;
  }

  public setCardsDO_NOT_USE(cards: Card[]): void {
    // DO NOT USE THIS FUNCTION. THIS IS AN ANTIPATTERN
    // THIS IS REQUIRED FOR SCRY TO FUNCTION. WE WILL REFACTOR LATER
    this.cards = cards;
  }

  public clearDeck(): void {
    this.cards = [];
  }

  public addCardToTop(card: Card): void {
    this.placeCardAtPosition(card, Infinity);
  }

  public addCardToBottom(card: Card): void {
    this.placeCardAtPosition(card, 0);
  }

  public placeCardAtPosition(card: Card, index: number): void {
    this.cards.splice(index, 0, card);
  }

  public getCards(): Card[] {
    return [...this.cards];
  }

  public drawCard(): Card | null {
    return this.cards.pop() ?? null;
  }

  public shuffleDeck(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  public getCardCount(): number {
    return this.cards.length;
  }

  removeCardById(cardId: string): Card | null {
    const index = this.cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
      return this.cards.splice(index, 1)[0];
    }
    return null;
  }

  // Remove a specific card object from deck
  removeCard(card: Card): Card | null {
    const index = this.cards.findIndex(c => c.id === card.id);
    if (index !== -1) {
      return this.cards.splice(index, 1)[0];
    }
    return null;
  }

  // Clear all cards from deck
  clear(): void {
    this.cards = [];
  }
}