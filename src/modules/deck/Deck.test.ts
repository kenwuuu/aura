import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Deck } from './Deck';
import { Card } from './types';

describe('Deck', () => {
  describe('Constructor', () => {
    describe('with no arguments', () => {
      it('should create an empty deck when initialized with no cards', () => {
        const deck = new Deck();
        expect(deck.getCardCount()).toBe(0);
        expect(deck.getCards()).toEqual([]);
      });
    });

    describe('with numDummyCards', () => {
      it('should create deck with specified number of dummy cards', () => {
        const deck = new Deck(undefined, 10);
        expect(deck.getCardCount()).toBe(10);
      });

      it('should initialize dummy cards with sequential card numbers starting from 1', () => {
        const deck = new Deck(undefined, 5);
        const cards = deck.getCards();

        expect(cards[0].cardNumber).toBe(1);
        expect(cards[1].cardNumber).toBe(2);
        expect(cards[2].cardNumber).toBe(3);
        expect(cards[3].cardNumber).toBe(4);
        expect(cards[4].cardNumber).toBe(5);
      });

      it('should initialize dummy cards with default properties', () => {
        const deck = new Deck(undefined, 3);
        const cards = deck.getCards();

        cards.forEach((card) => {
          expect(card.x).toBe(100);
          expect(card.y).toBe(100);
          expect(card.rotation).toBe(0);
          expect(card.isTapped).toBe(false);
          expect(card.isFlipped).toBe(false);
          expect(card.counters).toEqual([]);
          expect(card.id).toMatch(/^card-/);
        });
      });

      it('should give each dummy card a unique ID', () => {
        const deck = new Deck(undefined, 10);
        const cards = deck.getCards();
        const ids = cards.map(c => c.id);
        const uniqueIds = new Set(ids);

        expect(uniqueIds.size).toBe(10);
      });

      it('should create 0 cards when numDummyCards is 0', () => {
        const deck = new Deck(undefined, 0);
        expect(deck.getCardCount()).toBe(0);
      });
    });

    describe('with provided cards array', () => {
      it('should initialize with provided cards', () => {
        const cards: Card[] = [
          { id: 'card-1', cardNumber: 1, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] },
          { id: 'card-2', cardNumber: 2, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] },
          { id: 'card-3', cardNumber: 3, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] },
        ];

        const deck = new Deck(cards);
        expect(deck.getCardCount()).toBe(3);
      });

      it('should regenerate unique IDs for all cards to prevent collisions', () => {
        const cards: Card[] = [
          { id: 'same-id', cardNumber: 1, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] },
          { id: 'same-id', cardNumber: 2, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] },
        ];

        const deck = new Deck(cards);
        const deckCards = deck.getCards();

        expect(deckCards[0].id).not.toBe('same-id');
        expect(deckCards[1].id).not.toBe('same-id');
        expect(deckCards[0].id).not.toBe(deckCards[1].id);
      });

      it('should preserve card properties except ID', () => {
        const cards: Card[] = [
          {
            id: 'old-id',
            cardNumber: 42,
            name: 'Lightning Bolt',
            x: 50,
            y: 100,
            rotation: 90,
            isTapped: true,
            isFlipped: true,
            counters: [1, 2, 3],
          },
        ];

        const deck = new Deck(cards);
        const deckCards = deck.getCards();

        expect(deckCards[0].id).not.toBe('old-id');
        expect(deckCards[0].cardNumber).toBe(42);
        expect(deckCards[0].name).toBe('Lightning Bolt');
        expect(deckCards[0].x).toBe(50);
        expect(deckCards[0].y).toBe(100);
        expect(deckCards[0].rotation).toBe(90);
        expect(deckCards[0].isTapped).toBe(true);
        expect(deckCards[0].isFlipped).toBe(true);
        expect(deckCards[0].counters).toEqual([1, 2, 3]);
      });

      it('should ignore numDummyCards when cards array is provided', () => {
        const cards: Card[] = [
          { id: 'card-1', cardNumber: 1, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] },
        ];

        const deck = new Deck(cards, 100); // numDummyCards should be ignored
        expect(deck.getCardCount()).toBe(1);
      });

      it('should use numDummyCards when cards array is empty', () => {
        const deck = new Deck([], 5);
        expect(deck.getCardCount()).toBe(5);
      });
    });
  });

  describe('findCardById()', () => {
    let deck: Deck;
    let cards: Card[];

    beforeEach(() => {
      cards = [
        { id: 'card-1', cardNumber: 1, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] },
        { id: 'card-2', cardNumber: 2, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] },
        { id: 'card-3', cardNumber: 3, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] },
      ];
      // Use cards directly but they'll get new IDs, so we need to get the deck's cards
      deck = new Deck(cards);
    });

    it('should find card by ID', () => {
      const deckCards = deck.getCards();
      const foundCard = deck.findCardById(deckCards[0].id);

      expect(foundCard).not.toBeNull();
      expect(foundCard?.cardNumber).toBe(1);
    });

    it('should return null when card ID not found', () => {
      const foundCard = deck.findCardById('non-existent-id');
      expect(foundCard).toBeNull();
    });

    it('should find cards after deck operations', () => {
      const deckCards = deck.getCards();
      const targetId = deckCards[1].id;

      deck.drawCard(); // Remove one card

      const foundCard = deck.findCardById(targetId);
      expect(foundCard).not.toBeNull();
      expect(foundCard?.cardNumber).toBe(2);
    });
  });

  describe('findCard()', () => {
    let deck: Deck;

    beforeEach(() => {
      deck = new Deck(undefined, 5);
    });

    it('should find card by card object', () => {
      const cards = deck.getCards();
      const targetCard = cards[2];

      const foundCard = deck.findCard(targetCard);
      expect(foundCard).toEqual(targetCard);
    });

    it('should return null when card not found', () => {
      const nonExistentCard: Card = {
        id: 'fake-id',
        cardNumber: 999,
        x: 0,
        y: 0,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
      };

      const foundCard = deck.findCard(nonExistentCard);
      expect(foundCard).toBeNull();
    });
  });

  describe('clearDeck()', () => {
    it('should remove all cards from deck', () => {
      const deck = new Deck(undefined, 10);
      expect(deck.getCardCount()).toBe(10);

      deck.clearDeck();

      expect(deck.getCardCount()).toBe(0);
      expect(deck.getCards()).toEqual([]);
    });

    it('should work on already empty deck', () => {
      const deck = new Deck();
      deck.clearDeck();

      expect(deck.getCardCount()).toBe(0);
    });
  });

  describe('addCardToTop()', () => {
    let deck: Deck;
    let newCard: Card;

    beforeEach(() => {
      deck = new Deck(undefined, 3);
      newCard = {
        id: 'new-card',
        cardNumber: 99,
        x: 0,
        y: 0,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
      };
    });

    it('should add card to top of deck', () => {
      const initialCount = deck.getCardCount();
      deck.addCardToTop(newCard);

      expect(deck.getCardCount()).toBe(initialCount + 1);
    });

    it('should make added card the next to be drawn', () => {
      deck.addCardToTop(newCard);

      const drawnCard = deck.drawCard();
      expect(drawnCard?.id).toBe('new-card');
      expect(drawnCard?.cardNumber).toBe(99);
    });

    it('should work on empty deck', () => {
      const emptyDeck = new Deck();
      emptyDeck.addCardToTop(newCard);

      expect(emptyDeck.getCardCount()).toBe(1);
      expect(emptyDeck.drawCard()?.id).toBe('new-card');
    });

    it('should handle multiple cards added to top in LIFO order', () => {
      const card1: Card = { id: 'c1', cardNumber: 1, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };
      const card2: Card = { id: 'c2', cardNumber: 2, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };
      const card3: Card = { id: 'c3', cardNumber: 3, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };

      deck.addCardToTop(card1);
      deck.addCardToTop(card2);
      deck.addCardToTop(card3);

      // Should draw in reverse order: c3, c2, c1
      expect(deck.drawCard()?.id).toBe('c3');
      expect(deck.drawCard()?.id).toBe('c2');
      expect(deck.drawCard()?.id).toBe('c1');
    });
  });

  describe('addCardToBottom()', () => {
    let deck: Deck;
    let newCard: Card;

    beforeEach(() => {
      deck = new Deck(undefined, 3);
      newCard = {
        id: 'new-card',
        cardNumber: 99,
        x: 0,
        y: 0,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
      };
    });

    it('should add card to bottom of deck', () => {
      const initialCount = deck.getCardCount();
      deck.addCardToBottom(newCard);

      expect(deck.getCardCount()).toBe(initialCount + 1);
    });

    it('should make added card the last to be drawn', () => {
      const emptyDeck = new Deck();
      const card1: Card = { id: 'c1', cardNumber: 1, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };

      emptyDeck.addCardToBottom(newCard);
      emptyDeck.addCardToTop(card1);

      // Draw card1 first, then newCard
      expect(emptyDeck.drawCard()?.id).toBe('c1');
      expect(emptyDeck.drawCard()?.id).toBe('new-card');
    });

    it('should work on empty deck', () => {
      const emptyDeck = new Deck();
      emptyDeck.addCardToBottom(newCard);

      expect(emptyDeck.getCardCount()).toBe(1);
      expect(emptyDeck.drawCard()?.id).toBe('new-card');
    });

    it('should handle multiple cards added to bottom', () => {
      const emptyDeck = new Deck();
      const card1: Card = { id: 'c1', cardNumber: 1, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };
      const card2: Card = { id: 'c2', cardNumber: 2, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };
      const card3: Card = { id: 'c3', cardNumber: 3, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };

      emptyDeck.addCardToBottom(card1);
      emptyDeck.addCardToBottom(card2);
      emptyDeck.addCardToBottom(card3);

      // addCardToBottom uses placeCardAtPosition(card, 0) which inserts at index 0
      // Each new card goes to position 0, pushing others forward
      // So deck order becomes: [c3, c2, c1]
      // Since we draw from end (LIFO), we draw c1, c2, c3
      expect(emptyDeck.drawCard()?.id).toBe('c1');
      expect(emptyDeck.drawCard()?.id).toBe('c2');
      expect(emptyDeck.drawCard()?.id).toBe('c3');
    });
  });

  describe('placeCardAtPosition()', () => {
    let deck: Deck;

    beforeEach(() => {
      deck = new Deck(undefined, 5);
    });

    it('should insert card at specified index', () => {
      const newCard: Card = {
        id: 'new-card',
        cardNumber: 99,
        x: 0,
        y: 0,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
      };

      deck.placeCardAtPosition(newCard, 2);

      expect(deck.getCardCount()).toBe(6);
      expect(deck.getCards()[2].id).toBe('new-card');
    });

    it('should insert at beginning when index is 0', () => {
      const newCard: Card = {
        id: 'first-card',
        cardNumber: 1,
        x: 0,
        y: 0,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
      };

      deck.placeCardAtPosition(newCard, 0);

      expect(deck.getCards()[0].id).toBe('first-card');
    });

    it('should insert at end when index is Infinity', () => {
      const newCard: Card = {
        id: 'last-card',
        cardNumber: 100,
        x: 0,
        y: 0,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
      };

      const initialCount = deck.getCardCount();
      deck.placeCardAtPosition(newCard, Infinity);

      // Should be at top of deck (last position in array for LIFO)
      expect(deck.drawCard()?.id).toBe('last-card');
    });
  });

  describe('getCards()', () => {
    it('should return a copy of the cards array', () => {
      const deck = new Deck(undefined, 5);
      const cards1 = deck.getCards();
      const cards2 = deck.getCards();

      // Should be equal but not the same reference
      expect(cards1).toEqual(cards2);
      expect(cards1).not.toBe(cards2);
    });

    it('should not allow mutation of internal deck state', () => {
      const deck = new Deck(undefined, 5);
      const cards = deck.getCards();

      // Mutate the returned array
      cards.pop();

      // Deck should still have all cards
      expect(deck.getCardCount()).toBe(5);
    });

    it('should return empty array for empty deck', () => {
      const deck = new Deck();
      expect(deck.getCards()).toEqual([]);
    });
  });

  describe('drawCard()', () => {
    let deck: Deck;

    beforeEach(() => {
      deck = new Deck(undefined, 5);
    });

    it('should draw card from top of deck (LIFO)', () => {
      const card = deck.drawCard();

      expect(card).not.toBeNull();
      expect(deck.getCardCount()).toBe(4);
    });

    it('should return null when deck is empty', () => {
      const emptyDeck = new Deck();
      const card = emptyDeck.drawCard();

      expect(card).toBeNull();
    });

    it('should draw cards in LIFO order', () => {
      const cards = deck.getCards();
      const lastCard = cards[cards.length - 1];

      const drawnCard = deck.drawCard();
      expect(drawnCard?.id).toBe(lastCard.id);
    });

    it('should handle drawing all cards', () => {
      const drawnCards: Card[] = [];
      let card = deck.drawCard();

      while (card !== null) {
        drawnCards.push(card);
        card = deck.drawCard();
      }

      expect(drawnCards.length).toBe(5);
      expect(deck.getCardCount()).toBe(0);
    });

    it('should return null on subsequent draws after empty', () => {
      // Draw all cards
      while (deck.drawCard() !== null) {}

      // Try to draw again
      expect(deck.drawCard()).toBeNull();
      expect(deck.drawCard()).toBeNull();
    });
  });

  describe('shuffleDeck()', () => {
    it('should maintain deck size', () => {
      const deck = new Deck(undefined, 20);
      const initialCount = deck.getCardCount();

      deck.shuffleDeck();

      expect(deck.getCardCount()).toBe(initialCount);
    });

    it('should maintain all card IDs', () => {
      const deck = new Deck(undefined, 20);
      const initialIds = new Set(deck.getCards().map(c => c.id));

      deck.shuffleDeck();

      const shuffledIds = new Set(deck.getCards().map(c => c.id));
      expect(shuffledIds).toEqual(initialIds);
    });

    it('should change card order (probabilistic)', () => {
      const deck = new Deck(undefined, 20);
      const initialOrder = deck.getCards().map(c => c.id);

      deck.shuffleDeck();

      const shuffledOrder = deck.getCards().map(c => c.id);

      // Very unlikely that 20 cards remain in same order after shuffle
      const sameOrder = initialOrder.every((id, i) => id === shuffledOrder[i]);
      expect(sameOrder).toBe(false);
    });

    it('should work on empty deck without error', () => {
      const deck = new Deck();

      expect(() => deck.shuffleDeck()).not.toThrow();
      expect(deck.getCardCount()).toBe(0);
    });

    it('should work on single card deck', () => {
      const deck = new Deck(undefined, 1);
      const cardId = deck.getCards()[0].id;

      deck.shuffleDeck();

      expect(deck.getCardCount()).toBe(1);
      expect(deck.getCards()[0].id).toBe(cardId);
    });

    it('should produce different orders on multiple shuffles (probabilistic)', () => {
      const deck = new Deck(undefined, 15);

      deck.shuffleDeck();
      const order1 = deck.getCards().map(c => c.id);

      deck.shuffleDeck();
      const order2 = deck.getCards().map(c => c.id);

      deck.shuffleDeck();
      const order3 = deck.getCards().map(c => c.id);

      // At least one shuffle should produce different order
      const allSame =
        order1.every((id, i) => id === order2[i]) &&
        order2.every((id, i) => id === order3[i]);

      expect(allSame).toBe(false);
    });
  });

  describe('getCardCount()', () => {
    it('should return correct count for initialized deck', () => {
      const deck = new Deck(undefined, 10);
      expect(deck.getCardCount()).toBe(10);
    });

    it('should return 0 for empty deck', () => {
      const deck = new Deck();
      expect(deck.getCardCount()).toBe(0);
    });

    it('should update when cards are drawn', () => {
      const deck = new Deck(undefined, 5);

      deck.drawCard();
      expect(deck.getCardCount()).toBe(4);

      deck.drawCard();
      expect(deck.getCardCount()).toBe(3);
    });

    it('should update when cards are added', () => {
      const deck = new Deck(undefined, 5);
      const newCard: Card = {
        id: 'new',
        cardNumber: 1,
        x: 0,
        y: 0,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
      };

      deck.addCardToTop(newCard);
      expect(deck.getCardCount()).toBe(6);
    });
  });

  describe('removeCardById()', () => {
    let deck: Deck;

    beforeEach(() => {
      deck = new Deck(undefined, 5);
    });

    it('should remove card by ID and return it', () => {
      const cards = deck.getCards();
      const targetCard = cards[2];

      const removed = deck.removeCardById(targetCard.id);

      expect(removed).toEqual(targetCard);
      expect(deck.getCardCount()).toBe(4);
    });

    it('should return null when card ID not found', () => {
      const removed = deck.removeCardById('non-existent-id');

      expect(removed).toBeNull();
      expect(deck.getCardCount()).toBe(5);
    });

    it('should actually remove card from deck', () => {
      const cards = deck.getCards();
      const targetId = cards[1].id;

      deck.removeCardById(targetId);

      const foundCard = deck.findCardById(targetId);
      expect(foundCard).toBeNull();
    });

    it('should handle removing first card', () => {
      const cards = deck.getCards();
      const firstCard = cards[0];

      const removed = deck.removeCardById(firstCard.id);

      expect(removed).toEqual(firstCard);
      expect(deck.getCardCount()).toBe(4);
    });

    it('should handle removing last card', () => {
      const cards = deck.getCards();
      const lastCard = cards[cards.length - 1];

      const removed = deck.removeCardById(lastCard.id);

      expect(removed).toEqual(lastCard);
      expect(deck.getCardCount()).toBe(4);
    });
  });

  describe('removeCard()', () => {
    let deck: Deck;

    beforeEach(() => {
      deck = new Deck(undefined, 5);
    });

    it('should remove card by card object and return it', () => {
      const cards = deck.getCards();
      const targetCard = cards[2];

      const removed = deck.removeCard(targetCard);

      expect(removed).toEqual(targetCard);
      expect(deck.getCardCount()).toBe(4);
    });

    it('should return null when card not found', () => {
      const fakeCard: Card = {
        id: 'fake-id',
        cardNumber: 999,
        x: 0,
        y: 0,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
      };

      const removed = deck.removeCard(fakeCard);

      expect(removed).toBeNull();
      expect(deck.getCardCount()).toBe(5);
    });

    it('should find card by ID even if other properties differ', () => {
      const cards = deck.getCards();
      const targetCard = { ...cards[1], name: 'Modified' };

      const removed = deck.removeCard(targetCard);

      expect(removed).not.toBeNull();
      expect(deck.getCardCount()).toBe(4);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle typical game flow: shuffle, draw hand, add back cards', () => {
      const deck = new Deck(undefined, 20);

      // Shuffle deck
      deck.shuffleDeck();

      // Draw opening hand (7 cards)
      const hand: Card[] = [];
      for (let i = 0; i < 7; i++) {
        const card = deck.drawCard();
        if (card) hand.push(card);
      }

      expect(hand.length).toBe(7);
      expect(deck.getCardCount()).toBe(13);

      // Put a card back on top
      deck.addCardToTop(hand[0]);
      expect(deck.getCardCount()).toBe(14);

      // Put a card on bottom
      deck.addCardToBottom(hand[1]);
      expect(deck.getCardCount()).toBe(15);
    });

    it('should handle scry-like operation: look at top cards, rearrange', () => {
      const deck = new Deck(undefined, 10);

      // Look at top 3 cards
      const topCards: Card[] = [];
      topCards.push(deck.drawCard()!);
      topCards.push(deck.drawCard()!);
      topCards.push(deck.drawCard()!);

      // Rearrange them (e.g., put bottom card on top)
      deck.addCardToTop(topCards[0]); // Original top
      deck.addCardToTop(topCards[1]); // Middle
      deck.addCardToTop(topCards[2]); // Bottom (now on top)

      // Draw should get the bottom card first
      const drawnCard = deck.drawCard();
      expect(drawnCard?.id).toBe(topCards[2].id);

      expect(deck.getCardCount()).toBe(9);
    });

    it('should handle mulligan: return cards, shuffle, draw new hand', () => {
      const deck = new Deck(undefined, 20);

      // Draw 7 cards
      const firstHand: Card[] = [];
      for (let i = 0; i < 7; i++) {
        const card = deck.drawCard();
        if (card) firstHand.push(card);
      }

      // Return to deck
      firstHand.forEach(card => deck.addCardToTop(card));
      expect(deck.getCardCount()).toBe(20);

      // Shuffle
      deck.shuffleDeck();

      // Draw new hand (6 for mulligan)
      const secondHand: Card[] = [];
      for (let i = 0; i < 6; i++) {
        const card = deck.drawCard();
        if (card) secondHand.push(card);
      }

      expect(secondHand.length).toBe(6);
      expect(deck.getCardCount()).toBe(14);
    });

    it('should handle edge case: draw from empty, add card, draw again', () => {
      const deck = new Deck(undefined, 1);

      // Draw only card
      const card1 = deck.drawCard();
      expect(card1).not.toBeNull();

      // Try to draw from empty
      const card2 = deck.drawCard();
      expect(card2).toBeNull();

      // Add card back
      deck.addCardToTop(card1!);

      // Should be able to draw again
      const card3 = deck.drawCard();
      expect(card3).not.toBeNull();
      expect(card3?.id).toBe(card1?.id);
    });

    it('should handle complex card movement between positions', () => {
      const deck = new Deck(undefined, 10);
      const cards = deck.getCards();
      expect(deck.getCardCount()).toBe(10);

      // Remove card from middle
      const middleCard = deck.removeCardById(cards[4].id);
      expect(deck.getCardCount()).toBe(9);

      // Put it on bottom
      deck.addCardToBottom(middleCard!);
      expect(deck.getCardCount()).toBe(10);

      // Draw all cards except last
      for (let i = 0; i < 9; i++) {
        deck.drawCard();
      }

      // Last card should be the one we moved
      const lastCard = deck.drawCard();
      expect(lastCard?.id).toBe(middleCard?.id);
    });
  });
});