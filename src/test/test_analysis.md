Testing Patterns Analysis Report

Patterns Discovered in Aura Test Suite

1. Test Organization Pattern

describe('ClassName', () => {
describe('methodName()', () => {
describe('specific scenario', () => {
it('should do specific thing', () => {
// test
});
});
});
});

Analysis: ✅ Good Practice
- Clear hierarchical organization
- Easy to navigate and understand test structure
- Good for test output readability
- Follows AAA pattern implicitly (Arrange, Act, Assert)

  ---
2. BeforeEach Setup Pattern

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
    });
});

Analysis: ✅ Good Practice
- Fresh state for each test (prevents test pollution)
- DRY principle for common setup
- Tests are isolated and can run in any order

  ---
3. Magic Numbers in Tests

beforeEach(() => {
yDoc = new Y.Doc();
deck = new Deck(undefined, 5); // Magic number 5
player = new Player('test-player', yDoc, deck, { initialHealth: 40 }); // Magic 40
});

it('should draw a card from deck to hand', () => {
const card = player.drawCard();
expect(card).not.toBeNull();
expect(player.getState().hand.length).toBe(1);
expect(player.getDeck().getCardCount()).toBe(4); // 5 - 1 = 4
});

Analysis: ⚠️ Mixed - Context Dependent

When it's OK:
- When the specific value is part of what's being tested
- When descriptive variable names would add noise
- Simple arithmetic where the relationship is obvious

When it's problematic:
- Would benefit from named constants for semantic meaning:

const INITIAL_DECK_SIZE = 5;
const STARTING_HEALTH = 40;
const COMMANDER_DECK_SIZE = 100;

beforeEach(() => {
deck = new Deck(undefined, INITIAL_DECK_SIZE);
player = new Player('test-player', yDoc, deck, { initialHealth: STARTING_HEALTH });
});

Recommendation: For frequently used values across multiple tests, use named constants. For
one-off values, inline is fine.

  ---
4. Probabilistic Tests for Randomness

it('should change card order (probabilistic)', () => {
const deck = new Deck(undefined, 20);
const initialOrder = deck.getCards().map(c => c.id);

    deck.shuffleDeck();

    const shuffledOrder = deck.getCards().map(c => c.id);

    // Very unlikely that 20 cards remain in same order after shuffle
    const sameOrder = initialOrder.every((id, i) => id === shuffledOrder[i]);
    expect(sameOrder).toBe(false);
});

Analysis: ⚠️ Problematic - Flaky Tests

Problems:
1. Non-deterministic: Can fail randomly (even if extremely unlikely)
2. No control over randomness: Can't reproduce failures
3. False sense of security: Passing doesn't prove correctness
4. CI/CD risk: Could cause pipeline failures

Better Approach:

import { vi } from 'vitest';

it('should shuffle deck using Fisher-Yates algorithm', () => {
const deck = new Deck(undefined, 5);

    // Spy on Math.random to control randomness
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValueOnce(0.5)
             .mockReturnValueOnce(0.3)
             .mockReturnValueOnce(0.7)
             .mockReturnValueOnce(0.1);

    deck.shuffleDeck();

    // Verify Math.random was called correct number of times
    expect(randomSpy).toHaveBeenCalledTimes(4); // n-1 for Fisher-Yates

    randomSpy.mockRestore();
});

Or test invariants instead:

it('should maintain all cards after shuffle', () => {
const deck = new Deck(undefined, 20);
const initialIds = new Set(deck.getCards().map(c => c.id));

    deck.shuffleDeck();

    const shuffledIds = new Set(deck.getCards().map(c => c.id));
    expect(shuffledIds).toEqual(initialIds); // All cards still present
    expect(deck.getCardCount()).toBe(20); // Count unchanged
});

Verdict: ❌ Bad Practice - Replace with deterministic tests or test invariants

  ---
5. Nullable Chain Optional Chaining Overuse

it('should draw a card from deck to hand', () => {
const card = player.drawCard();
expect(card).not.toBeNull();
expect(player.getState().hand.length).toBe(1);
expect(player.getDeck().getCardCount()).toBe(4);
});

it('should make added card the next to be drawn', () => {
deck.addCardToTop(newCard);

    const drawnCard = deck.drawCard();
    expect(drawnCard?.id).toBe('new-card'); // Using optional chaining
    expect(drawnCard?.cardNumber).toBe(99);
});

Analysis: ⚠️ Inconsistent Pattern

Problems:
1. If drawnCard is null, test passes with undefined === 'new-card' (false), but error message
   is unclear
2. Hides the actual problem (null when expecting object)
3. Inconsistent with earlier assertion pattern

Better Approach:

it('should make added card the next to be drawn', () => {
deck.addCardToTop(newCard);

    const drawnCard = deck.drawCard();

    // Be explicit about expectations
    expect(drawnCard).not.toBeNull();
    expect(drawnCard!.id).toBe('new-card'); // Non-null assertion after verification
    expect(drawnCard!.cardNumber).toBe(99);
});

Or even better:

it('should make added card the next to be drawn', () => {
deck.addCardToTop(newCard);

    const drawnCard = deck.drawCard();

    expect(drawnCard).toEqual({
      id: 'new-card',
      cardNumber: 99,
      x: 0,
      y: 0,
      rotation: 0,
      isTapped: false,
      isFlipped: false,
      counters: []
    });
});

Verdict: ⚠️ Needs Improvement - Be explicit about null expectations

  ---
6. Testing Implementation Details vs Behavior

it('should change card order (probabilistic test)', () => {
// Tests that order changed (implementation detail)
const sameOrder = initialOrder.every((id, i) => id === shuffledOrder[i]);
expect(sameOrder).toBe(false);
});

vs

it('should maintain all card IDs', () => {
// Tests behavior: all cards still present (contract)
const shuffledIds = new Set(deck.getCards().map(c => c.id));
expect(shuffledIds).toEqual(initialIds);
});

Analysis: ✅ Mixed - Both Patterns Present

The test suite does have good examples of testing behavior/contracts:
- "should maintain deck size after shuffle"
- "should maintain all card IDs after shuffle"

Recommendation: Focus more on contracts/behavior, less on implementation

  ---
7. Test Data Creation Pattern

const cards: Card[] = [
{ id: 'card-1', cardNumber: 1, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false,
counters: [] },
{ id: 'card-2', cardNumber: 2, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false,
counters: [] },
{ id: 'card-3', cardNumber: 3, x: 0, y: 0, rotation: 0, isTapped: false, isFlipped: false,
counters: [] },
];

Analysis: ❌ Unsustainable - High Maintenance Burden

Problems:
1. Verbose: Card objects have 7+ required fields
2. Brittle: If Card interface changes, breaks many tests
3. Noise: Hard to see what's important in the test
4. Copy-paste errors: Easy to accidentally use wrong values

Better Approach - Test Builder Pattern:

// test/helpers/builders.ts
class CardBuilder {
private card: Card = {
id: 'test-card',
cardNumber: 1,
x: 0,
y: 0,
rotation: 0,
isTapped: false,
isFlipped: false,
counters: []
};

    withId(id: string): this {
      this.card.id = id;
      return this;
    }

    withCardNumber(num: number): this {
      this.card.cardNumber = num;
      return this;
    }

    tapped(): this {
      this.card.isTapped = true;
      return this;
    }

    withCounters(...counters: number[]): this {
      this.card.counters = counters;
      return this;
    }

    build(): Card {
      return { ...this.card };
    }
}

export const aCard = () => new CardBuilder();

// In tests:
const card1 = aCard().withId('c1').withCardNumber(1).build();
const card2 = aCard().withId('c2').tapped().build();
const card3 = aCard().withCounters(1, 1, 3).build();

Or Factory Pattern:

// test/helpers/factories.ts
export const createCard = (overrides?: Partial<Card>): Card => ({
id: 'test-card',
cardNumber: 1,
x: 0,
y: 0,
rotation: 0,
isTapped: false,
isFlipped: false,
counters: [],
...overrides
});

// In tests:
const card1 = createCard({ id: 'c1', cardNumber: 1 });
const card2 = createCard({ id: 'c2', isTapped: true });
const tappedCard = createCard({ isTapped: true });

Verdict: ❌ Bad Practice - Needs test helpers/builders

  ---
8. Yjs Testing Pattern

describe('Reset with cards on battlefield', () => {
it('should remove player\'s cards from battlefield and return to deck', () => {
const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);

      // Draw 3 cards
      const card1 = player.drawCard();

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

      // Verify state before reset
      expect(yCards.size).toBe(2);

      // Reset
      player.reset();

      // Verify battlefield is cleared
      expect(yCards.size).toBe(0);
    });
});

Analysis: ✅ Good Practice

Strengths:
1. Tests integration with Yjs (CRDT library)
2. Verifies synchronization behavior
3. Tests real-world usage patterns
4. Doesn't mock Yjs (tests with real library)

Minor improvement:

// Could extract Yjs setup helper
const setupYjsEnvironment = () => {
const yDoc = new Y.Doc();
const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
const playerId = 'test-player-123';
return { yDoc, yCards, playerId };
};

Verdict: ✅ Good Practice

  ---
9. Over-Testing Trivial Getters

describe('Player.getId()', () => {
it('should return player ID', () => {
expect(player.getId()).toBe('test-player-123');
});
});

describe('Player.getCardCount()', () => {
it('should return correct count for initialized deck', () => {
const deck = new Deck(undefined, 10);
expect(deck.getCardCount()).toBe(10);
});
});

Analysis: ⚠️ Questionable Value

Arguments against:
- Trivial getters rarely break
- If they break, other tests will fail anyway
- Low ROI (return on investment)
- Maintenance burden

Arguments for:
- Documentation value
- Catches accidental changes
- Fast to write and run
- Part of public API contract

Recommendation: ⚠️ Low Priority - Test if it's part of critical public API, skip for obvious
getters

  ---
10. Integration Scenarios Section

describe('Integration scenarios', () => {
it('should handle typical game flow: shuffle, draw hand, add back cards', () => {
const deck = new Deck(undefined, 20);
deck.shuffleDeck();

      const hand: Card[] = [];
      for (let i = 0; i < 7; i++) {
        const card = deck.drawCard();
        if (card) hand.push(card);
      }

      expect(hand.length).toBe(7);
      expect(deck.getCardCount()).toBe(13);

      deck.addCardToTop(hand[0]);
      expect(deck.getCardCount()).toBe(14);
    });

    it('should handle scry-like operation: look at top cards, rearrange', () => {
      // Tests realistic scry scenario
    });

    it('should handle mulligan: return cards, shuffle, draw new hand', () => {
      // Tests realistic mulligan scenario
    });
});

Analysis: ✅ Excellent Practice

Strengths:
1. Tests real workflows: Not just isolated units
2. Documentation: Shows how API is meant to be used
3. Catches integration bugs: Tests interactions between methods
4. User perspective: Tests from caller's viewpoint
5. Regression protection: Guards against breaking common use cases

Verdict: ✅ Best Practice - More of this!

  ---
Summary of Issues Found

❌ Critical Issues (Fix Immediately)

1. Probabilistic shuffle tests - Replace with deterministic tests or invariant checks
2. Verbose test data creation - Add test builders/factories

⚠️ Should Improve

3. Inconsistent null handling - Be explicit about null expectations
4. Magic numbers - Use named constants for semantic values
5. Testing trivial getters - Reduce coverage of obvious methods

✅ Good Practices to Continue

6. Integration scenarios - Excellent real-world testing
7. BeforeEach isolation - Proper test isolation
8. Yjs integration testing - Tests with real dependencies
9. Descriptive test organization - Clear hierarchy

  ---
Recommended Test Helpers to Add

// test/helpers/builders.ts
export class CardBuilder {
// ... (as shown above)
}

export class DeckBuilder {
private numCards: number = 60;
private cards?: Card[];

    withCards(cards: Card[]): this {
      this.cards = cards;
      return this;
    }

    withSize(size: number): this {
      this.numCards = size;
      return this;
    }

    build(): Deck {
      return new Deck(this.cards, this.numCards);
    }
}

export const aDeck = () => new DeckBuilder();
export const aCard = () => new CardBuilder();

// Usage:
const deck = aDeck().withSize(20).build();
const tappedCard = aCard().tapped().withCounters(1, 1).build();

  ---
Test Quality Metrics

| Metric          | Score | Notes                                  |
  |-----------------|-------|----------------------------------------|
| Organization    | 9/10  | Excellent structure                    |
| Isolation       | 9/10  | Good use of beforeEach                 |
| Readability     | 6/10  | Verbose card creation hurts            |
| Maintainability | 5/10  | High brittleness due to inline objects |
| Determinism     | 6/10  | Probabilistic tests are risky          |
| Coverage        | 8/10  | Good coverage of edge cases            |
| Integration     | 9/10  | Excellent real-world scenarios         |

Overall: 7.4/10 - Good foundation, needs refactoring for maintainability

  ---
Action Items (Priority Order)

1. HIGH: Create test builders/factories for Card and Deck
2. HIGH: Replace probabilistic shuffle tests with deterministic versions
3. MEDIUM: Add named constants for common test values
4. MEDIUM: Standardize null-checking patterns
5. LOW: Consider reducing trivial getter tests
6. LOW: Extract common Yjs setup to helpers
