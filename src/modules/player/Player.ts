import * as Y from 'yjs';
import { Card, Deck } from '../deck';
import { PlayerState, PlayerConfig, CustomCounter } from './types';
import {
  YDOC_CARDS_ON_BOARD,
  YSTATE_DISCARD_PILE,
  YSTATE_HEALTH,
  YSTATE_HAND,
  YSTATE_EXILE_PILE,
  YDOC_PLAYER,
  YSTATE_CUSTOM_COUNTERS,
  YSTATE_DECK
} from "../../constants";
import {PileType} from "../gameResourcesDock/components";
import { CardPile } from './CardPile';

export class Player {
  private playerId: string;
  private yPlayerState: Y.Map<any>;
  private yCardsOnBoard: Y.Map<any>; // Battlefield cards
  private yTokens: Y.Map<any>; // Keyword tokens on battlefield
  private config: PlayerConfig;
  private deck: CardPile;
  private hand: CardPile;
  private exile: CardPile;
  private discard: CardPile;
  private scry: CardPile;
  private piles: Record<PileType, CardPile>;

  constructor(
    playerId: string,
    yDoc: Y.Doc,
    initialDeckCards: Deck,
    config: Partial<PlayerConfig> = {}
  ) {
    this.playerId = playerId;
    this.config = {
      initialHealth: config.initialHealth ?? 40,
    };

    this.yPlayerState = yDoc.getMap(`player-${playerId}`);
    this.yCardsOnBoard = yDoc.getMap('cards'); // Store reference to battlefield
    this.yTokens = yDoc.getMap('tokens'); // Store reference to keyword tokens

    // Initialize state first so yPlayerState has the arrays
    this.initializeState(initialDeckCards);

    // Create CardPile instances that reference yPlayerState
    this.deck = new CardPile(this.yPlayerState, YSTATE_DECK);
    this.hand = new CardPile(this.yPlayerState, YSTATE_HAND);
    this.exile = new CardPile(this.yPlayerState, YSTATE_EXILE_PILE);
    this.discard = new CardPile(this.yPlayerState, YSTATE_DISCARD_PILE);
    this.scry = new CardPile(this.yPlayerState, 'scry');

    this.piles = {
      hand: this.hand,
      deck: this.deck,
      discard: this.discard,
      exile: this.exile,
      scry: this.scry,
    };
  }

  private initializeState(initialDeckCards: Deck): void {
    if (!this.yPlayerState.has(YSTATE_HEALTH)) {
      this.yPlayerState.set(YSTATE_HEALTH, this.config.initialHealth);
      this.yPlayerState.set(YSTATE_DECK, initialDeckCards.getCards());
      this.yPlayerState.set(YSTATE_HAND, []);
      this.yPlayerState.set(YSTATE_EXILE_PILE, []);
      this.yPlayerState.set(YSTATE_DISCARD_PILE, []);
      this.yPlayerState.set('scry', []);
      this.yPlayerState.set(YSTATE_CUSTOM_COUNTERS, []);
      this.yPlayerState.set('deckRevealCount', 0); // 0=hidden, -1=all, N>0=top N cards
    }
  }

  // Deprecated: CardPile now syncs directly to yPlayerState
  // Keeping for backward compatibility but it's a no-op
  public syncToYState(): void {
    // CardPile instances now sync automatically to yPlayerState
    // This method is kept for backward compatibility but does nothing
  }

  public getState(): PlayerState {
    return {
      id: this.playerId,
      health: this.yPlayerState.get(YSTATE_HEALTH) ?? this.config.initialHealth,
      hand: this.yPlayerState.get(YSTATE_HAND) ?? [],
      exilePile: this.yPlayerState.get(YSTATE_EXILE_PILE) ?? [],
      discardPile: this.yPlayerState.get(YSTATE_DISCARD_PILE) ?? [],
      deck: this.yPlayerState.get(YSTATE_DECK) ?? [],
      customCounters: this.yPlayerState.get(YSTATE_CUSTOM_COUNTERS) ?? [],
    };
  }

  public async loadNewDeck(newDeck: Deck): Promise<void> {
    // Replace deck cards with new deck
    this.deck.setCards(newDeck.getCards());

    // get cards
    const deckCards: Card[] = this.deck.getCards();

    if (deckCards.length > 0) {  // TODO: change logic based on if deck is commander or not
      // move commander to hand
      const commander: Card = deckCards[deckCards.length - 1];
      this.deck.removeCardById(commander.id);
      this.deck.addCardToTop(commander);
      this.drawCard();

      this.deck.shuffle();

      // draw 7
      for (let i = 0; i < 7; i++) {
        this.drawCard()
        await new Promise(r => setTimeout(r, 20));
      }
    }
  }

  public drawCard(): Card | null {
    const card: Card | null = this.deck.drawCard();
    if (!card) return null;

    this.hand.addCardToTop(card);
    this.syncToYState();

    return card;
  }

  // move board to hand. move hand, discard, and exile to deck. keep deck loaded. reset health
  // equivalent to resetting in IRL game
  public reset() {
    // Step 1: Move all battlefield cards owned by this player back to deck
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

    // Remove all keyword tokens owned by this player from battlefield
    this.yTokens.forEach((token: any, tokenId: string) => {
      if (token.ownerId === this.playerId) {
        this.yTokens.delete(tokenId);
      }
    });

    // Step 2: Move all cards from hand, discard, and exile back to deck
    [...battlefieldCards, ...this.hand.getCards(), ...this.discard.getCards(), ...this.exile.getCards()].forEach(card => {
      this.deck.addCardToBottom(card);
    });

    // Step 3: Clear all piles
    this.hand.clear();
    this.discard.clear();
    this.exile.clear();

    // Step 4: Reset health to initial value
    this.yPlayerState.set(YSTATE_HEALTH, this.config.initialHealth);

    // Step 5: Shuffle deck and sync
    this.deck.shuffle();
    this.syncToYState();
  }

  public removeCardFromHand(cardId: string): Card | null {
    const card: Card | null = this.hand.removeCardById(cardId);
    this.syncToYState();
    return card;
  }

  public removeCardFromPileById(cardId: string, pileType: PileType): Card | null {
    let result: Card | null = this.piles[pileType].removeCardById(cardId);
    this.syncToYState();
    return result;
  }

  public drawCardFromPile(pileType: 'deck' | 'discard' | 'exile'): Card | null {
    let result: Card | null = this.piles[pileType].drawCard();
    this.syncToYState();
    return result;
  }

  public placeCardInPile(card: Card, pileType: PileType, position: number = Infinity): void {
    // Places card on top of pile by default
    this.piles[pileType].placeCardAtPosition(card, position);
    this.syncToYState();
  }

  public setHealth(health: number): void {
    this.yPlayerState.set(YSTATE_HEALTH, health);
  }

  public modifyHealth(delta: number): void {
    const currentHealth = this.yPlayerState.get(YSTATE_HEALTH) ?? this.config.initialHealth;
    this.yPlayerState.set(YSTATE_HEALTH, currentHealth + delta);
  }

  public shuffleDeck(): void {
    this.deck.shuffle();
  }

  public mulligan(cardsToDraw: number = 7): void {
    // Move all cards from hand back to deck
    this.hand.getCards().forEach((card: Card) => {
      this.deck.addCardToBottom(card);
    });

    // Clear hand
    this.hand.clear();

    // Shuffle deck
    this.deck.shuffle();

    // Draw new hand
    for (let i: number = 0; i < cardsToDraw; i++) {
      this.drawCard();
    }
  }

  public getId(): string {
    return this.playerId;
  }

  public getDeckCards(): Card[] {
    return this.deck.getCards();
  }

  public getDeck(): CardPile {
    return this.deck;
  }

  public getHand(): CardPile {
    return this.hand;
  }

  public getExilePile(): CardPile {
    return this.exile;
  }

  public getDiscardPile(): CardPile {
    return this.discard;
  }

  public moveCardToDeckTop(card: Card): void {
    this.deck.addCardToTop(card);
    this.syncToYState();
  }

  public moveCardToDeckBottom(card: Card): void {
    this.deck.addCardToBottom(card);
    this.syncToYState();
  }

  public onStateChange(callback: (state: PlayerState) => void): void {
    this.yPlayerState.observe(() => {
      callback(this.getState());
    });
  }

  public addCustomCounter(title: string, icon: string): void {
    const counters = this.yPlayerState.get(YSTATE_CUSTOM_COUNTERS) ?? [];
    const newCounter: CustomCounter = {
      id: `counter-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title,
      icon,
      value: 0,
    };
    this.yPlayerState.set(YSTATE_CUSTOM_COUNTERS, [...counters, newCounter]);
  }

  public modifyCustomCounter(counterId: string, delta: number): void {
    const counters = this.yPlayerState.get(YSTATE_CUSTOM_COUNTERS) ?? [];
    const updatedCounters = counters.map((counter: CustomCounter) =>
      counter.id === counterId
        ? { ...counter, value: counter.value + delta }
        : counter
    );
    this.yPlayerState.set(YSTATE_CUSTOM_COUNTERS, updatedCounters);
  }

  public removeCustomCounter(counterId: string): void {
    const counters = this.yPlayerState.get(YSTATE_CUSTOM_COUNTERS) ?? [];
    const updatedCounters = counters.filter((counter: CustomCounter) => counter.id !== counterId);
    this.yPlayerState.set(YSTATE_CUSTOM_COUNTERS, updatedCounters);
  }

  public reorderHand(newOrder: Card[]): void {
    this.yPlayerState.set('hand', newOrder);
  }

  public flipHandCard(cardId: string): void {
    const hand = this.hand.getCards();
    const card = hand.find(c => c.id === cardId);
    if (card) {
      const updatedCard = { ...card, isFlipped: !card.isFlipped };
      const updatedHand = hand.map(c => c.id === cardId ? updatedCard : c);
      this.yPlayerState.set('hand', updatedHand);
    }
  }

  public getYPlayerState(): Y.Map<any> {
    return this.yPlayerState;
  }
}