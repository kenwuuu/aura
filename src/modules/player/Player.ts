import * as Y from 'yjs';
import { Card, Deck } from '../deck';
import { PlayerState, PlayerConfig, CustomCounter } from './types';

export class Player {
  private playerId: string;
  private yPlayerState: Y.Map<any>;
  private yCardsOnBoard: Y.Map<any>; // Battlefield cards
  private deck: Deck;
  private config: PlayerConfig;

  constructor(
    playerId: string,
    yDoc: Y.Doc,
    deck: Deck,
    config: Partial<PlayerConfig> = {}
  ) {
    this.playerId = playerId;
    this.deck = deck;
    this.config = {
      initialHealth: config.initialHealth ?? 40,
    };

    this.yPlayerState = yDoc.getMap(`player-${playerId}`);
    this.yCardsOnBoard = yDoc.getMap('cards'); // Store reference to battlefield
    this.initializeState();
  }

  private initializeState(): void {
    if (!this.yPlayerState.has('health')) {
      this.yPlayerState.set('health', this.config.initialHealth);
      this.yPlayerState.set('hand', []);
      this.yPlayerState.set('exilePile', []);
      this.yPlayerState.set('discardPile', []);
      this.yPlayerState.set('deckCardCount', this.deck.getCardCount());
      this.yPlayerState.set('customCounters', []);
    }
  }

  public getState(): PlayerState {
    return {
      id: this.playerId,
      health: this.yPlayerState.get('health') ?? this.config.initialHealth,
      hand: this.yPlayerState.get('hand') ?? [],
      exilePile: this.yPlayerState.get('exilePile') ?? [],
      discardPile: this.yPlayerState.get('discardPile') ?? [],
      deckCardCount: this.yPlayerState.get('deckCardCount') ?? 0,
      customCounters: this.yPlayerState.get('customCounters') ?? [],
    };
  }

  public async loadNewDeck(newDeck: Deck): Promise<void> {
    // assign deck
    this.deck = newDeck;

    // get cards
    const deckCards = this.deck.getCards();

    if (deckCards.length > 0) {  // TODO: change logic based on if deck is commander or not
      // move commander to hand
      const commander = deckCards[deckCards.length - 1];
      this.deck.removeCard(commander.id);
      this.deck.addCardToTop(commander);
      this.drawCard();

      this.deck.shuffleDeck();

      // draw 7
      for (let i = 0; i < 7; i++) {
        this.drawCard()
        await new Promise(r => setTimeout(r, 20));
      }
    }
  }

  public drawCard(): Card | null {
    const card = this.deck.drawCard();
    if (!card) return null;

    this.putCardInHand(card);
    this.yPlayerState.set('deckCardCount', this.deck.getCardCount());

    return card;
  }

  // move board to hand. move hand, discard, and exile to deck. keep deck loaded. reset health
  // equivalent to resetting in IRL game
  public reset() {
    // Step 1: Move all battlefield cards owned by this player to hand
    const battlefieldCards: Card[] = [];
    this.yCardsOnBoard.forEach((card: any, cardId: string) => {
      if (card.ownerId === this.playerId) {
        // Remove WhiteboardCard-specific properties (zIndex, ownerId) to get base Card
        const { zIndex, ownerId, ...baseCard } = card;
        battlefieldCards.push(baseCard as Card);
        // Remove from battlefield
        this.yCardsOnBoard.delete(cardId);
      }
    });

    // Step 2: Get all cards from hand, discard, and exile
    const hand = this.yPlayerState.get('hand') ?? [];
    const discardPile = this.yPlayerState.get('discardPile') ?? [];
    const exilePile = this.yPlayerState.get('exilePile') ?? [];

    // Step 3: Move all cards (battlefield + hand + discard + exile) back to deck
    [...battlefieldCards, ...hand, ...discardPile, ...exilePile].forEach(card => {
      this.deck.addCardToBottom(card);
    });

    // Step 4: Clear all piles in synced state
    this.yPlayerState.set('hand', []);
    this.yPlayerState.set('discardPile', []);
    this.yPlayerState.set('exilePile', []);

    // Step 5: Reset health to initial value
    this.yPlayerState.set('health', this.config.initialHealth);

    // Step 6: Update deck count and shuffle
    this.yPlayerState.set('deckCardCount', this.deck.getCardCount());
    this.deck.shuffleDeck();
  }

  public removeCardFromHand(cardId: string): Card | null {
    const hand = this.yPlayerState.get('hand') ?? [];
    const cardIndex = hand.findIndex((c: Card) => c.id === cardId);

    if (cardIndex === -1) return null;

    const card = hand[cardIndex];
    const newHand = [...hand.slice(0, cardIndex), ...hand.slice(cardIndex + 1)];
    this.yPlayerState.set('hand', newHand);

    return card;
  }

  public putCardInHand(card: Card) {
    const hand = this.yPlayerState.get('hand') ?? [];
    this.yPlayerState.set('hand', [...hand, card]);
  }

  public moveCardToDiscard(card: Card): void {
    const discardPile = this.yPlayerState.get('discardPile') ?? [];
    this.yPlayerState.set('discardPile', [...discardPile, card]);
  }

  public moveCardToExile(card: Card): void {
    const exilePile = this.yPlayerState.get('exilePile') ?? [];
    this.yPlayerState.set('exilePile', [...exilePile, card]);
  }

  public setHealth(health: number): void {
    this.yPlayerState.set('health', health);
  }

  public modifyHealth(delta: number): void {
    const currentHealth = this.yPlayerState.get('health') ?? this.config.initialHealth;
    this.yPlayerState.set('health', currentHealth + delta);
  }

  public shuffleDeck(): void {
    this.deck.shuffleDeck();
  }

  public mulligan(cardsToDraw: number = 7): void {
    // Move all cards from hand back to deck
    const hand = this.yPlayerState.get('hand') ?? [];
    hand.forEach((card: Card) => {
      this.deck.addCardToBottom(card);
    });

    // Clear hand in synced state
    this.yPlayerState.set('hand', []);

    // Shuffle deck
    this.deck.shuffleDeck();

    // Update deck count
    this.yPlayerState.set('deckCardCount', this.deck.getCardCount());

    // Draw new hand
    for (let i = 0; i < cardsToDraw; i++) {
      this.drawCard();
    }
  }

  public getId(): string {
    return this.playerId;
  }

  public getDeckCards(): Card[] {
    return this.deck.getCards();
  }

  public getDeck(): Deck {
    return this.deck;
  }
  
  public moveCardToDeckTop(card: Card): void {
    this.deck.addCardToTop(card);
    this.yPlayerState.set('deckCardCount', this.deck.getCardCount());
  }

  public moveCardToDeckBottom(card: Card): void {
    this.deck.addCardToBottom(card);
    this.yPlayerState.set('deckCardCount', this.deck.getCardCount());
  }

  public onStateChange(callback: (state: PlayerState) => void): void {
    this.yPlayerState.observe(() => {
      callback(this.getState());
    });
  }

  public addCustomCounter(title: string, icon: string): void {
    const counters = this.yPlayerState.get('customCounters') ?? [];
    const newCounter: CustomCounter = {
      id: `counter-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title,
      icon,
      value: 0,
    };
    this.yPlayerState.set('customCounters', [...counters, newCounter]);
  }

  public modifyCustomCounter(counterId: string, delta: number): void {
    const counters = this.yPlayerState.get('customCounters') ?? [];
    const updatedCounters = counters.map((counter: CustomCounter) =>
      counter.id === counterId
        ? { ...counter, value: counter.value + delta }
        : counter
    );
    this.yPlayerState.set('customCounters', updatedCounters);
  }

  public removeCustomCounter(counterId: string): void {
    const counters = this.yPlayerState.get('customCounters') ?? [];
    const updatedCounters = counters.filter((counter: CustomCounter) => counter.id !== counterId);
    this.yPlayerState.set('customCounters', updatedCounters);
  }
}