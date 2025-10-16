import { Card, DeckConfig } from './types';

export class Deck {
  private config: DeckConfig;
  private cards: Card[] = [];

  constructor(config: Partial<DeckConfig> = {}) {
    this.config = {
      cardWidth: config.cardWidth ?? 63,
      cardHeight: config.cardHeight ?? 88,
      initialCardCount: config.initialCardCount ?? 60,
    };
    this.initializeDeck();
  }

  private initializeDeck(): void {
    for (let i = 0; i < this.config.initialCardCount; i++) {
      this.cards.push({
        id: `card-${i}`,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
      });
    }
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

  public getConfig(): DeckConfig {
    return { ...this.config };
  }
}