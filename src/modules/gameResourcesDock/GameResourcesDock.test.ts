import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';
import { Player } from '../player/Player';
import { Deck } from '../deck';
import { Card } from '../deck/types';

/**
 * These tests focus on the keyboard shortcuts exposed via getGameResourcesDockHoverState
 * Specifically testing pile card movements that were causing duplicate card bugs
 */
describe('GameResourcesDock - Pile Card Movements (Keyboard Shortcuts)', () => {
  let yDoc: Y.Doc;
  let player: Player;
  let deck: Deck;
  let playerId: string;
  let getDockState: () => any;

  beforeEach(() => {
    // Create a fresh Y.Doc for each test
    yDoc = new Y.Doc();
    playerId = 'test-player-123';

    // Create a deck with 10 cards
    deck = new Deck(undefined, 10);

    // Create player
    player = new Player(playerId, yDoc, deck, { initialHealth: 40 });

    // Mock the GameResourcesDock keyboard shortcuts interface
    // This simulates what setupKeyboardShortcuts() exposes on window
    getDockState = () => {
      const state = player.getState();
      return {
        hoveredHandCardId: null,
        hoveredPileType: null,
        getHandCard: (cardId: string) => {
          const hand = player.getState().hand;
          return hand.find(c => c.id === cardId) || null;
        },
        getTopPileCard: (pileType: 'deck' | 'exile' | 'discard') => {
          const state = player.getState();
          let cards: Card[] = [];
          if (pileType === 'deck') {
            cards = player.getDeckCards();
          } else if (pileType === 'exile') {
            cards = state.exilePile;
          } else if (pileType === 'discard') {
            cards = state.discardPile;
          }
          return cards.length > 0 ? cards[cards.length - 1] : null;
        },
        movePileCardToHand: (card: Card, pileType: 'deck' | 'exile' | 'discard') => {
          if (pileType === 'deck') {
            player.drawCard();
          } else {
            const state = player.getState();
            let pile: Card[] = pileType === 'exile' ? state.exilePile : state.discardPile;
            const index = pile.findIndex(c => c.id === card.id);
            if (index !== -1) {
              pile.splice(index, 1);
              player['yPlayerState'].set(pileType === 'exile' ? 'exilePile' : 'discardPile', pile);

              const hand = player.getState().hand;
              player['yPlayerState'].set('hand', [...hand, card]);
            }
          }
        },
      };
    };
  });

  describe('Moving top card from exile to hand', () => {
    it('should move exactly ONE card from exile to hand', () => {
      // Setup: Put 3 cards in exile
      const card1: Card = { id: 'card-1', cardNumber: 1, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };
      const card2: Card = { id: 'card-2', cardNumber: 2, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };
      const card3: Card = { id: 'card-3', cardNumber: 3, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };

      player.placeCardInPile(card1, 'exile');
      player.placeCardInPile(card2, 'exile');
      player.placeCardInPile(card3, 'exile');

      // Verify initial state
      let state = player.getState();
      expect(state.exilePile.length).toBe(3);
      expect(state.hand.length).toBe(0);

      // Simulate keyboard shortcut: Press 'H' while hovering exile pile
      const dockState = getDockState();
      const topCard = dockState.getTopPileCard('exile');
      expect(topCard).toBeDefined();
      expect(topCard?.id).toBe('card-3'); // Last card added is on top

      // Execute the keyboard shortcut handler
      dockState.movePileCardToHand(topCard, 'exile');

      // Verify: Exile should have 2 cards, hand should have 1 card
      state = player.getState();
      expect(state.exilePile.length).toBe(2);
      expect(state.hand.length).toBe(1);
      expect(state.hand[0].id).toBe('card-3');

      // Verify the remaining exile cards are correct
      expect(state.exilePile[0].id).toBe('card-1');
      expect(state.exilePile[1].id).toBe('card-2');
    });
  });

  describe('Moving top card from discard to hand', () => {
    it('should move exactly ONE card from discard to hand', () => {
      // Setup: Put 3 cards in discard
      const card1: Card = { id: 'card-1', cardNumber: 1, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };
      const card2: Card = { id: 'card-2', cardNumber: 2, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };
      const card3: Card = { id: 'card-3', cardNumber: 3, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };

      player.placeCardInPile(card1, 'discard');
      player.placeCardInPile(card2, 'discard');
      player.placeCardInPile(card3, 'discard');

      // Verify initial state
      let state = player.getState();
      expect(state.discardPile.length).toBe(3);
      expect(state.hand.length).toBe(0);

      // Simulate keyboard shortcut: Press 'H' while hovering discard pile
      const dockState = getDockState();
      const topCard = dockState.getTopPileCard('discard');
      expect(topCard).toBeDefined();
      expect(topCard?.id).toBe('card-3'); // Last card added is on top

      // Execute the keyboard shortcut handler
      dockState.movePileCardToHand(topCard, 'discard');

      // Verify: Discard should have 2 cards, hand should have 1 card
      state = player.getState();
      expect(state.discardPile.length).toBe(2);
      expect(state.hand.length).toBe(1);
      expect(state.hand[0].id).toBe('card-3');

      // Verify the remaining discard cards are correct
      expect(state.discardPile[0].id).toBe('card-1');
      expect(state.discardPile[1].id).toBe('card-2');
    });
  });

  describe('Moving top card from deck to hand', () => {
    it('should move exactly ONE card from deck to hand', () => {
      // Verify initial state
      let state = player.getState();
      expect(player.getDeck().getCardCount()).toBe(10);
      expect(state.hand.length).toBe(0);

      // Simulate keyboard shortcut: Press 'H' while hovering deck pile
      const dockState = getDockState();
      const topCard = dockState.getTopPileCard('deck');
      expect(topCard).toBeDefined();

      const topCardId = topCard?.id;

      // Execute the keyboard shortcut handler
      dockState.movePileCardToHand(topCard, 'deck');

      // Verify: Deck should have 9 cards, hand should have 1 card
      state = player.getState();
      expect(player.getDeck().getCardCount()).toBe(9);
      expect(state.hand.length).toBe(1);
      expect(state.hand[0].id).toBe(topCardId);
    });
  });

  describe('Multiple pile-to-hand movements', () => {
    it('should move exactly 3 cards when pressing H three times on exile pile', () => {
      // Setup: Put 5 cards in exile
      const cards: Card[] = [];
      for (let i = 1; i <= 5; i++) {
        const card: Card = { id: `card-${i}`, cardNumber: i, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false, counters: [] };
        cards.push(card);
        player.placeCardInPile(card, 'exile');
      }

      // Verify initial state
      let state = player.getState();
      expect(state.exilePile.length).toBe(5);
      expect(state.hand.length).toBe(0);

      // Simulate pressing 'H' three times
      const dockState = getDockState();

      // First press
      let topCard = dockState.getTopPileCard('exile');
      dockState.movePileCardToHand(topCard, 'exile');

      // Second press
      topCard = dockState.getTopPileCard('exile');
      dockState.movePileCardToHand(topCard, 'exile');

      // Third press
      topCard = dockState.getTopPileCard('exile');
      dockState.movePileCardToHand(topCard, 'exile');

      // Verify: Exile should have 2 cards, hand should have 3 cards
      state = player.getState();
      expect(state.exilePile.length).toBe(2);
      expect(state.hand.length).toBe(3);

      // Verify the cards moved in correct order (LIFO)
      expect(state.hand[0].id).toBe('card-5');
      expect(state.hand[1].id).toBe('card-4');
      expect(state.hand[2].id).toBe('card-3');
    });
  });
});