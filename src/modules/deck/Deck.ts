import { Card } from './types';

export class Deck {
  private cards: Card[] = [];

  constructor(cards?: Card[]) {
    // Use provided cards if available, otherwise initialize with blank cards
    if (cards && cards.length > 0) {
      console.log('real cards')
      // Regenerate unique IDs for all cards to prevent collisions when multiple players use the same deck
      this.cards = cards.map(card => ({
        ...card,
        id: `card-${Math.random().toString(36).substring(2, 11)}`,
      }));
    } else {
      console.log('fake cards')
      this.initializeDeckWithDummyCards(60);
    }
  }

  private initializeDeckWithDummyCards(numDummyCards: number): void {
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

  public setCards(cards: Card[]): void {
    this.cards = cards;
  }

  public addCardToTop(card: Card): void {
    this.cards.push(card);
  }

  public addCardToBottom(card: Card): void {
    this.cards.unshift(card);
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

  // Find a card by ID
  findCardById(cardId: string): Card | null {
    return this.cards.find(c => c.id === cardId) ?? null;
  }

  // Clear all cards from deck
  clear(): void {
    this.cards = [];
  }
}