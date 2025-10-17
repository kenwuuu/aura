import * as Y from 'yjs';
import { Card, Deck } from '../deck';
import { PlayerState, PlayerConfig } from './types';

export class Player {
  private playerId: string;
  private yPlayerState: Y.Map<any>;
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
    this.initializeState();
  }

  private initializeState(): void {
    if (!this.yPlayerState.has('health')) {
      this.yPlayerState.set('health', this.config.initialHealth);
      this.yPlayerState.set('hand', []);
      this.yPlayerState.set('exilePile', []);
      this.yPlayerState.set('discardPile', []);
      this.yPlayerState.set('deckCardCount', this.deck.getCardCount());
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
    };
  }

  public drawCard(): Card | null {
    const card = this.deck.drawCard();
    if (!card) return null;

    const hand = this.yPlayerState.get('hand') ?? [];
    this.yPlayerState.set('hand', [...hand, card]);
    this.yPlayerState.set('deckCardCount', this.deck.getCardCount());

    return card;
  }

  public playCardFromHand(cardId: string): Card | null {
    const hand = this.yPlayerState.get('hand') ?? [];
    const cardIndex = hand.findIndex((c: Card) => c.id === cardId);

    if (cardIndex === -1) return null;

    const card = hand[cardIndex];
    const newHand = [...hand.slice(0, cardIndex), ...hand.slice(cardIndex + 1)];
    this.yPlayerState.set('hand', newHand);

    return card;
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

  public getId(): string {
    return this.playerId;
  }

  public getDeckCards(): Card[] {
    return this.deck.getCards();
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
}