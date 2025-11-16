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

export class Player {
  private playerId: string;
  private yPlayerState: Y.Map<any>;
  private yCardsOnBoard: Y.Map<any>; // Battlefield cards
  private deck: Deck;
  private hand: Deck;
  private exile: Deck;
  private discard: Deck;
  private config: PlayerConfig;

  constructor(
    playerId: string,
    yDoc: Y.Doc,
    deck: Deck,
    config: Partial<PlayerConfig> = {}
  ) {
    this.playerId = playerId;
    this.deck = deck;
    this.hand = new Deck([]);
    this.exile = new Deck([]);
    this.discard = new Deck([]);
    this.config = {
      initialHealth: config.initialHealth ?? 40,
    };

    this.yPlayerState = yDoc.getMap(YDOC_PLAYER(playerId));
    this.yCardsOnBoard = yDoc.getMap(YDOC_CARDS_ON_BOARD); // Store reference to battlefield
    this.initializeState();
  }

  private initializeState(): void {
    if (!this.yPlayerState.has(YSTATE_HEALTH)) {
      this.yPlayerState.set(YSTATE_HEALTH, this.config.initialHealth);
      this.yPlayerState.set(YSTATE_DECK, this.deck.getCards());
      this.yPlayerState.set(YSTATE_HAND, []);
      this.yPlayerState.set(YSTATE_EXILE_PILE, []);
      this.yPlayerState.set(YSTATE_DISCARD_PILE, []);
      this.yPlayerState.set(YSTATE_CUSTOM_COUNTERS, []);
    }
  }

  // Sync local Deck instances to yPlayerState
  public syncToYState(): void {
    this.yPlayerState.set(YSTATE_DECK, this.deck.getCards());
    this.yPlayerState.set(YSTATE_HAND, this.hand.getCards());
    this.yPlayerState.set(YSTATE_EXILE_PILE, this.exile.getCards());
    this.yPlayerState.set(YSTATE_DISCARD_PILE, this.discard.getCards());
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
    this.deck.shuffleDeck();
    this.syncToYState();
  }

  public removeCardFromHand(cardId: string): Card | null {
    const card = this.hand.removeCard(cardId);
    if (card) {
      this.syncToYState();
    }
    return card;
  }

  public drawCardFromPile(pile: PileType) {
    switch (pile) {
      case "deck":
        return this.deck.drawCard();
      case "discard":
        return this.discard.drawCard();
      case "exile":
        return this.exile.drawCard();
    }
  }

  public putCardInHand(card: Card) {
    this.hand.addCardToTop(card);
    this.syncToYState();
  }

  public moveCardToDiscard(card: Card): void {
    this.discard.addCardToTop(card);
    this.syncToYState();
  }

  public moveCardToExile(card: Card): void {
    this.exile.addCardToTop(card);
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
    this.deck.shuffleDeck();
  }

  public mulligan(cardsToDraw: number = 7): void {
    // Move all cards from hand back to deck
    this.hand.getCards().forEach((card: Card) => {
      this.deck.addCardToBottom(card);
    });

    // Clear hand
    this.hand.clear();

    // Shuffle deck
    this.deck.shuffleDeck();

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

  public getHand(): Deck {
    return this.hand;
  }

  public getExilePile(): Deck {
    return this.exile;
  }

  public getDiscardPile(): Deck {
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
}