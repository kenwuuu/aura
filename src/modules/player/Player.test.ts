import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';
import { Player } from './Player';
import { Deck } from '../deck';
import { Card } from '../deck/types';
import {YDOC_CARDS_ON_BOARD} from "../../constants";

describe('Player.reset()', () => {
  let yDoc: Y.Doc;
  let player: Player;
  let deck: Deck;
  let playerId: string;

  beforeEach(() => {
    // Create a fresh Y.Doc for each test
    yDoc = new Y.Doc();
    playerId = 'test-player-123';

    // Create a deck with default initialization (60 cards, no commander)
    // This avoids the cards[99] commander logic in Deck constructor
    deck = new Deck(undefined, 10);

    // Create player with initial health of 40
    player = new Player(playerId, yDoc, deck, { initialHealth: 40 });
  });

  describe('Initial state', () => {
    it('should start with correct initial state', () => {
      const state = player.getState();
      expect(state.health).toBe(40);
      expect(state.hand).toEqual([]);
      expect(state.discardPile).toEqual([]);
      expect(state.exilePile).toEqual([]);
      expect(player.getDeck().getCardCount()).toBe(10);
    });
  });

  describe('Reset with cards in hand only', () => {
    it('should move hand cards back to deck and reset health', () => {
      // Draw 3 cards to hand
      player.drawCard();
      player.drawCard();
      player.drawCard();

      // Verify hand has 3 cards
      expect(player.getState().hand.length).toBe(3);
      expect(player.getDeck().getCardCount()).toBe(7);

      // Modify health
      player.setHealth(15);
      expect(player.getState().health).toBe(15);

      // Reset
      player.reset();

      // Verify reset state
      const state = player.getState();
      expect(state.hand).toEqual([]);
      expect(state.discardPile).toEqual([]);
      expect(state.exilePile).toEqual([]);
      expect(state.health).toBe(40); // Reset to initial
      expect(player.getDeck().getCardCount()).toBe(10); // All cards back in deck
    });
  });

  describe('Reset with cards in multiple zones', () => {
    it('should move cards from hand, discard, and exile back to deck', () => {
      // Draw 5 cards
      const card1 = player.drawCard();
      const card2 = player.drawCard();
      const card3 = player.drawCard();
      const card4 = player.drawCard();
      const card5 = player.drawCard();

      // Move some to discard (and remove from hand)
      if (card1) {
        player.placeCardInPile(card1, 'discard');
        player.removeCardFromHand(card1.id);
      }
      if (card2) {
        player.placeCardInPile(card2, 'discard');
        player.removeCardFromHand(card2.id);
      }

      // Move some to exile (and remove from hand)
      if (card3) {
        player.placeCardInPile(card3, 'exile');
        player.removeCardFromHand(card3.id);
      }

      // Keep card4 and card5 in hand
      const stateBefore = player.getState();
      expect(player.getHand().getCardCount()).toBe(2); // card4, card5
      expect(player.getDiscardPile().getCardCount()).toBe(2); // card1, card2
      expect(player.getExilePile().getCardCount()).toBe(1); // card3
      expect(player.getDeck().getCardCount()).toBe(5); // 10 - 5 drawn

      // Reset
      player.reset();

      // Verify all cards back in deck
      const stateAfter = player.getState();
      expect(player.getHand().getCards()).toEqual([]);
      expect(player.getDiscardPile().getCards()).toEqual([]);
      expect(player.getExilePile().getCards()).toEqual([]);
      expect(player.getDeck().getCardCount()).toBe(10); // All 10 cards back
    });
  });

  describe('Reset with cards on battlefield', () => {
    it('should remove player\'s cards from battlefield and return to deck', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);

      // Draw 3 cards
      const card1 = player.drawCard();
      const card2 = player.drawCard();
      const card3 = player.drawCard();

      // Play 2 cards to battlefield (simulate what Whiteboard does)
      if (card1) {
        const whiteboardCard1 = {
          ...card1,
          zIndex: 1,
          ownerId: playerId,
        };
        yCards.set(card1.id, whiteboardCard1);
        player.removeCardFromHand(card1.id);
      }

      if (card2) {
        const whiteboardCard2 = {
          ...card2,
          zIndex: 2,
          ownerId: playerId,
        };
        yCards.set(card2.id, whiteboardCard2);
        player.removeCardFromHand(card2.id);
      }

      // Verify state before reset
      expect(yCards.size).toBe(2); // 2 cards on battlefield
      expect(player.getState().hand.length).toBe(1); // card3 still in hand
      expect(player.getDeck().getCardCount()).toBe(7); // 10 - 3 drawn

      // Reset
      player.reset();

      // Verify battlefield is cleared of player's cards
      expect(yCards.size).toBe(0);

      // Verify all cards back in deck
      const state = player.getState();
      expect(state.hand).toEqual([]);
      expect(player.getDeck().getCardCount()).toBe(10);
    });

    it('should NOT remove opponent\'s cards from battlefield', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
      const opponentId = 'opponent-456';

      // Draw player's card
      const playerCard = player.drawCard();

      // Add player's card to battlefield
      if (playerCard) {
        yCards.set(playerCard.id, {
          ...playerCard,
          zIndex: 1,
          ownerId: playerId,
        });
        player.removeCardFromHand(playerCard.id);
      }

      // Add opponent's card to battlefield
      const opponentCard: Card = {
        id: 'opponent-card-1',
        cardNumber: 99,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
      };
      yCards.set(opponentCard.id, {
        ...opponentCard,
        zIndex: 2,
        ownerId: opponentId,
      });

      // Verify both cards on battlefield
      expect(yCards.size).toBe(2);

      // Reset player
      player.reset();

      // Verify only player's card removed, opponent's remains
      expect(yCards.size).toBe(1);
      expect(yCards.has('opponent-card-1')).toBe(true);
      expect(yCards.has(playerCard!.id)).toBe(false);
    });
  });

  describe('Reset with complex game state', () => {
    it('should handle full game scenario: battlefield, hand, piles, modified health', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);

      // Draw 8 cards
      const cards = Array.from({ length: 8 }, () => player.drawCard()).filter(Boolean) as Card[];

      // Play 3 to battlefield
      [cards[0], cards[1], cards[2]].forEach((card, index) => {
        yCards.set(card.id, {
          ...card,
          zIndex: index + 1,
          ownerId: playerId,
        });
        player.removeCardFromHand(card.id);
      });

      // Move 2 to discard
      player.placeCardInPile(cards[3], 'discard');
      player.removeCardFromHand(cards[3].id);

      player.placeCardInPile(cards[4], 'discard');
      player.removeCardFromHand(cards[4].id);

      // Move 1 to exile
      player.placeCardInPile(cards[5], 'exile');
      player.removeCardFromHand(cards[5].id);

      // Keep cards[6] and cards[7] in hand

      // Modify health
      player.setHealth(12);

      // Verify complex state
      const stateBefore = player.getState();
      expect(yCards.size).toBe(3); // 3 on battlefield
      expect(stateBefore.hand.length).toBe(2); // 2 in hand
      expect(stateBefore.discardPile.length).toBe(2); // 2 in discard
      expect(stateBefore.exilePile.length).toBe(1); // 1 in exile
      expect(stateBefore.health).toBe(12);
      expect(player.getDeck().getCardCount()).toBe(2); // 10 - 8 drawn

      // Reset
      player.reset();

      // Verify complete reset
      const stateAfter = player.getState();
      expect(yCards.size).toBe(0); // Battlefield cleared
      expect(stateAfter.hand).toEqual([]);
      expect(stateAfter.discardPile).toEqual([]);
      expect(stateAfter.exilePile).toEqual([]);
      expect(stateAfter.health).toBe(40); // Back to initial
      expect(player.getDeck().getCardCount()).toBe(10); // All cards back
    });
  });

  describe('Reset empty state', () => {
    it('should handle reset when no cards have been drawn', () => {
      // Don't draw any cards
      expect(player.getState().hand).toEqual([]);
      expect(player.getDeck().getCardCount()).toBe(10);

      // Reset should work without errors
      player.reset();

      // State should remain valid
      const state = player.getState();
      expect(state.hand).toEqual([]);
      expect(state.discardPile).toEqual([]);
      expect(state.exilePile).toEqual([]);
      expect(state.health).toBe(40);
      expect(player.getDeck().getCardCount()).toBe(10);
    });
  });

  describe('Deck shuffling after reset', () => {
    it('should shuffle the deck after reset', () => {
      // Draw all cards in order
      const drawnCards: Card[] = [];
      let card = player.drawCard();
      while (card) {
        drawnCards.push(card);
        card = player.drawCard();
      }

      // All cards drawn
      expect(player.getDeck().getCardCount()).toBe(0);
      expect(player.getState().hand.length).toBe(10);

      // Reset (which includes shuffle)
      player.reset();

      // Deck should have all cards back
      expect(player.getDeck().getCardCount()).toBe(10);

      // Draw cards again - order should be different (shuffled)
      // Note: There's a tiny chance they're the same, but very unlikely with 10 cards
      const redrawnCards: Card[] = [];
      card = player.drawCard();
      while (card) {
        redrawnCards.push(card);
        card = player.drawCard();
      }

      // Check that at least one card is in a different position
      // (This tests that shuffle happened, though it's probabilistic)
      const sameOrder = drawnCards.every((c, i) => c.id === redrawnCards[i].id);
      expect(sameOrder).toBe(false); // Very unlikely to be same order after shuffle
    });
  });
});

describe('Player.drawCard()', () => {
  let yDoc: Y.Doc;
  let player: Player;
  let deck: Deck;

  beforeEach(() => {
    yDoc = new Y.Doc();
    deck = new Deck(undefined, 5);
    player = new Player('test-player', yDoc, deck, { initialHealth: 40 });
  });

  it('should draw a card from deck to hand', () => {
    const card = player.drawCard();

    expect(card).not.toBeNull();
    expect(player.getState().hand.length).toBe(1);
    expect(player.getDeck().getCardCount()).toBe(4);
  });

  it('should return null when deck is empty', () => {
    // Draw all 5 cards
    player.drawCard();
    player.drawCard();
    player.drawCard();
    player.drawCard();
    player.drawCard();

    // Try to draw from empty deck
    const card = player.drawCard();
    expect(card).toBeNull();
    expect(player.getState().hand.length).toBe(5);
    expect(player.getDeck().getCardCount()).toBe(0);
  });

  it('should update Yjs state with drawn card', () => {
    const card = player.drawCard();
    const state = player.getState();

    expect(state.hand).toContainEqual(card);
  });
});

describe('Player.playCardFromHand()', () => {
  let yDoc: Y.Doc;
  let player: Player;

  beforeEach(() => {
    yDoc = new Y.Doc();
    const deck = new Deck(undefined, 5);
    player = new Player('test-player', yDoc, deck, { initialHealth: 40 });
  });

  it('should remove card from hand and return it', () => {
    const card1 = player.drawCard();
    const card2 = player.drawCard();

    if (card1) {
      const playedCard = player.removeCardFromHand(card1.id);

      expect(playedCard).toEqual(card1);
      expect(player.getState().hand.length).toBe(1);
      expect(player.getState().hand).toContainEqual(card2);
      expect(player.getState().hand).not.toContainEqual(card1);
    }
  });

  it('should return null if card not in hand', () => {
    player.drawCard();

    const playedCard = player.removeCardFromHand('non-existent-id');

    expect(playedCard).toBeNull();
    expect(player.getState().hand.length).toBe(1);
  });
});

describe('Player.moveCardToDiscard()', () => {
  let yDoc: Y.Doc;
  let player: Player;

  beforeEach(() => {
    yDoc = new Y.Doc();
    const deck = new Deck(undefined, 5);
    player = new Player('test-player', yDoc, deck, { initialHealth: 40 });
  });

  it('should add card to discard pile', () => {
    const card = player.drawCard();

    if (card) {
      player.placeCardInPile(card, 'discard');

      expect(player.getState().discardPile.length).toBe(1);
      expect(player.getState().discardPile).toContainEqual(card);
    }
  });

  it('should handle multiple cards in discard pile', () => {
    const card1 = player.drawCard();
    const card2 = player.drawCard();

    if (card1 && card2) {
      player.placeCardInPile(card1, 'discard');
      player.placeCardInPile(card2, 'discard');

      expect(player.getState().discardPile.length).toBe(2);
      expect(player.getState().discardPile).toContainEqual(card1);
      expect(player.getState().discardPile).toContainEqual(card2);
    }
  });
});

describe('Player.placeCardInPile()', () => {
  let yDoc: Y.Doc;
  let player: Player;

  beforeEach(() => {
    yDoc = new Y.Doc();
    const deck = new Deck(undefined, 5);
    player = new Player('test-player', yDoc, deck, { initialHealth: 40 });
  });

  it('should add card to exile pile', () => {
    const card = player.drawCard();

    if (card) {
      player.placeCardInPile(card, 'exile');

      expect(player.getState().exilePile.length).toBe(1);
      expect(player.getState().exilePile).toContainEqual(card);
    }
  });

  it('should handle multiple cards in exile pile', () => {
    const card1 = player.drawCard();
    const card2 = player.drawCard();

    if (card1 && card2) {
      player.placeCardInPile(card1, 'exile');
      player.placeCardInPile(card2, 'exile');

      expect(player.getState().exilePile.length).toBe(2);
      expect(player.getState().exilePile).toContainEqual(card1);
      expect(player.getState().exilePile).toContainEqual(card2);
    }
  });
});

describe('Player.setHealth()', () => {
  let yDoc: Y.Doc;
  let player: Player;

  beforeEach(() => {
    yDoc = new Y.Doc();
    const deck = new Deck(undefined, 5);
    player = new Player('test-player', yDoc, deck, { initialHealth: 40 });
  });

  it('should set health to specific value', () => {
    player.setHealth(25);
    expect(player.getState().health).toBe(25);
  });

  it('should allow setting health to 0', () => {
    player.setHealth(0);
    expect(player.getState().health).toBe(0);
  });

  it('should allow negative health', () => {
    player.setHealth(-5);
    expect(player.getState().health).toBe(-5);
  });
});

describe('Player.modifyHealth()', () => {
  let yDoc: Y.Doc;
  let player: Player;

  beforeEach(() => {
    yDoc = new Y.Doc();
    const deck = new Deck(undefined, 5);
    player = new Player('test-player', yDoc, deck, { initialHealth: 40 });
  });

  it('should increase health by positive delta', () => {
    player.modifyHealth(5);
    expect(player.getState().health).toBe(45);
  });

  it('should decrease health by negative delta', () => {
    player.modifyHealth(-10);
    expect(player.getState().health).toBe(30);
  });

  it('should handle multiple modifications', () => {
    player.modifyHealth(5);
    player.modifyHealth(-8);
    player.modifyHealth(3);

    expect(player.getState().health).toBe(40); // 40 + 5 - 8 + 3 = 40
  });
});

describe('Player.shuffleDeck()', () => {
  let yDoc: Y.Doc;
  let player: Player;

  beforeEach(() => {
    yDoc = new Y.Doc();
    const deck = new Deck(undefined, 10);
    player = new Player('test-player', yDoc, deck, { initialHealth: 40 });
  });

  it('should shuffle deck without changing card count', () => {
    const initialCount = player.getDeck().getCardCount();

    player.shuffleDeck();

    expect(player.getDeck().getCardCount()).toBe(initialCount);
  });

  it('should change card order (probabilistic test)', () => {
    // Draw all cards to record order
    const firstOrder: string[] = [];
    let card = player.drawCard();
    while (card) {
      firstOrder.push(card.id);
      card = player.drawCard();
    }

    // Reset to get cards back
    player.reset();

    // Draw again after shuffle
    const secondOrder: string[] = [];
    card = player.drawCard();
    while (card) {
      secondOrder.push(card.id);
      card = player.drawCard();
    }

    // Orders should be different (very high probability with 10 cards)
    const sameOrder = firstOrder.every((id, i) => id === secondOrder[i]);
    expect(sameOrder).toBe(false);
  });
});

describe('Player.moveCardToDeckTop()', () => {
  let yDoc: Y.Doc;
  let player: Player;

  beforeEach(() => {
    yDoc = new Y.Doc();
    const deck = new Deck(undefined, 5);
    player = new Player('test-player', yDoc, deck, { initialHealth: 40 });
  });

  it('should add card to top of deck', () => {
    const card = player.drawCard();
    const initialCount = player.getDeck().getCardCount();

    if (card) {
      player.moveCardToDeckTop(card);

      expect(player.getDeck().getCardCount()).toBe(initialCount + 1);

      // Next drawn card should be the one we put on top
      const drawnCard = player.drawCard();
      expect(drawnCard?.id).toBe(card.id);
    }
  });

  it('should update deck count in Yjs state', () => {
    const card = player.drawCard();
    const countBefore = player.getDeck().getCardCount();

    if (card) {
      player.moveCardToDeckTop(card);
      expect(player.getDeck().getCardCount()).toBe(countBefore + 1);
    }
  });
});

describe('Player.moveCardToDeckBottom()', () => {
  let yDoc: Y.Doc;
  let player: Player;

  beforeEach(() => {
    yDoc = new Y.Doc();
    const deck = new Deck(undefined, 3);
    player = new Player('test-player', yDoc, deck, { initialHealth: 40 });
  });

  it('should add card to bottom of deck', () => {
    const card = player.drawCard();
    const initialCount = player.getDeck().getCardCount();

    if (card) {
      player.moveCardToDeckBottom(card);

      expect(player.getDeck().getCardCount()).toBe(initialCount + 1);

      // Draw all remaining cards
      player.drawCard();
      player.drawCard();

      // Last drawn card should be the one we put on bottom
      const lastCard = player.drawCard();
      expect(lastCard?.id).toBe(card.id);
    }
  });

  it('should update deck count in Yjs state', () => {
    const card = player.drawCard();
    const countBefore = player.getDeck().getCardCount();

    if (card) {
      player.moveCardToDeckBottom(card);
      expect(player.getDeck().getCardCount()).toBe(countBefore + 1);
    }
  });
});

describe('Player.mulligan()', () => {
  let yDoc: Y.Doc;
  let player: Player;

  beforeEach(() => {
    yDoc = new Y.Doc();
    const deck = new Deck(undefined, 20);
    player = new Player('test-player', yDoc, deck, { initialHealth: 40 });
  });

  it('should return hand to deck, shuffle, and draw 7', () => {
    // Draw initial hand of 5
    player.drawCard();
    player.drawCard();
    player.drawCard();
    player.drawCard();
    player.drawCard();

    expect(player.getState().hand.length).toBe(5);
    expect(player.getDeck().getCardCount()).toBe(15);

    // Mulligan
    player.mulligan(7);

    expect(player.getState().hand.length).toBe(7);
    expect(player.getDeck().getCardCount()).toBe(13); // 20 - 7
  });

  it('should work with custom draw count', () => {
    // Draw 3 cards
    player.drawCard();
    player.drawCard();
    player.drawCard();

    expect(player.getState().hand.length).toBe(3);

    // Mulligan with custom count
    player.mulligan(5);

    expect(player.getState().hand.length).toBe(5);
    expect(player.getDeck().getCardCount()).toBe(15); // 20 - 5
  });

  it('should shuffle deck during mulligan', () => {
    // Draw 7 cards and record their IDs
    const firstHand: string[] = [];
    for (let i = 0; i < 7; i++) {
      const card = player.drawCard();
      if (card) firstHand.push(card.id);
    }

    // Mulligan (returns cards, shuffles, draws 7)
    player.mulligan(7);

    // Get new hand IDs
    const secondHand = player.getState().hand.map(c => c.id);

    // Hands should be different (very high probability with 20 card deck)
    const sameHand = firstHand.every((id, i) => id === secondHand[i]);
    expect(sameHand).toBe(false);
  });

  it('should clear hand before drawing new cards', () => {
    // Draw 5 cards
    for (let i = 0; i < 5; i++) {
      player.drawCard();
    }

    expect(player.getState().hand.length).toBe(5);

    // Mulligan
    player.mulligan(7);

    // Should have exactly 7 cards, not 5 + 7
    expect(player.getState().hand.length).toBe(7);
  });

  it('should update deck count correctly', () => {
    // Draw 4 cards
    for (let i = 0; i < 4; i++) {
      player.drawCard();
    }

    expect(player.getDeck().getCardCount()).toBe(16);

    // Mulligan draws 7
    player.mulligan(7);

    expect(player.getDeck().getCardCount()).toBe(13); // 20 - 7
  });
});

describe('Player.loadNewDeck()', () => {
  let yDoc: Y.Doc;
  let player: Player;

  beforeEach(() => {
    yDoc = new Y.Doc();
    const deck = new Deck(undefined, 5);
    player = new Player('test-player', yDoc, deck, { initialHealth: 40 });
  });

  it('should replace deck and draw commander', async () => {
    const newDeckCards: Card[] = Array.from({ length: 10 }, (_, i) => ({
      id: `new-card-${i}`,
      cardNumber: i + 1,
      x: 0,
      y: 0,
      rotation: 0,
      isTapped: false,
      isFlipped: false,
      counters: [],
    }));

    const newDeck = new Deck(undefined, 10);
    await player.loadNewDeck(newDeck);

    // Should draw 1 card (commander) + 7 cards = 8 total in hand, 2 remaining in deck
    expect(player.getHand().getCardCount()).toBe(8);
    expect(player.getDeck().getCardCount()).toBe(2);
  });

  it('should shuffle deck after loading', () => {
    const newDeckCards: Card[] = Array.from({ length: 15 }, (_, i) => ({
      id: `card-${i}`,
      cardNumber: i + 1,
      x: 0,
      y: 0,
      rotation: 0,
      isTapped: false,
      isFlipped: false,
      counters: [],
    }));

    const newDeck = new Deck(undefined, 15);

    // Load deck (draws commander, then shuffles)
    player.loadNewDeck(newDeck);

    // Draw all cards to check they were shuffled
    const drawnOrder: number[] = [];
    let card = player.drawCard();
    while (card) {
      drawnOrder.push(card.cardNumber);
      card = player.drawCard();
    }

    // Check if order is NOT sequential (would indicate shuffle happened)
    const isSequential = drawnOrder.every((num, i, arr) =>
      i === 0 || num === arr[i - 1] + 1 || num === arr[i - 1] - 1
    );

    // After shuffle, order should not be sequential
    expect(isSequential).toBe(false);
  });
});

describe('Player.getId()', () => {
  let yDoc: Y.Doc;
  let player: Player;

  beforeEach(() => {
    yDoc = new Y.Doc();
    const deck = new Deck(undefined, 5);
    player = new Player('test-player-123', yDoc, deck, { initialHealth: 40 });
  });

  it('should return player ID', () => {
    expect(player.getId()).toBe('test-player-123');
  });
});

describe('Player.getDeckCards()', () => {
  let yDoc: Y.Doc;
  let player: Player;

  beforeEach(() => {
    yDoc = new Y.Doc();
    const deck = new Deck(undefined, 5);
    player = new Player('test-player', yDoc, deck, { initialHealth: 40 });
  });

  it('should return all cards in deck', () => {
    const cards = player.getDeckCards();
    expect(cards.length).toBe(5);
  });

  it('should reflect changes when cards are drawn', () => {
    player.drawCard();
    player.drawCard();

    const cards = player.getDeckCards();
    expect(cards.length).toBe(3);
  });
});

describe('Player.onStateChange()', () => {
  let yDoc: Y.Doc;
  let player: Player;

  beforeEach(() => {
    yDoc = new Y.Doc();
    const deck = new Deck(undefined, 5);
    player = new Player('test-player', yDoc, deck, { initialHealth: 40 });
  });

  it('should trigger callback when state changes', () => {
    let callbackCalled = false;
    let capturedState: any = null;

    player.onStateChange((state) => {
      callbackCalled = true;
      capturedState = state;
    });

    // Trigger state change
    player.setHealth(30);

    expect(callbackCalled).toBe(true);
    expect(capturedState.health).toBe(30);
  });

  it('should trigger callback on multiple changes', () => {
    let callCount = 0;

    player.onStateChange(() => {
      callCount++;
    });

    player.setHealth(30);
    player.setHealth(25);
    player.drawCard();

    expect(callCount).toBeGreaterThanOrEqual(3);
  });
});