import {describe, it, expect, beforeEach, vi, afterEach} from 'vitest';
import * as Y from 'yjs';
import { KeyboardHandler, KeyboardHandlerCallbacks } from './KeyboardHandler';
import { WhiteboardCard } from './types';

describe('KeyboardHandler - Copy Offset Logic', () => {
  let yDoc: Y.Doc;
  let yCards: Y.Map<WhiteboardCard>;
  let handler: KeyboardHandler;
  let mockCallbacks: KeyboardHandlerCallbacks;
  const localPlayerId = 'player-123';

  beforeEach(() => {
    yDoc = new Y.Doc();
    yCards = yDoc.getMap('cards');

    mockCallbacks = {
      onMoveToHand: vi.fn(),
      onMoveToDeckTop: vi.fn(),
      onMoveToDeckBottom: vi.fn(),
      onMoveToGraveyard: vi.fn(),
      onMoveToExile: vi.fn(),
      onDrawCard: vi.fn(),
      onShuffleDeck: vi.fn(),
      onUntapAll: vi.fn(),
      onEndTurn: vi.fn(),
      onHideCardPreview: vi.fn(),
      onMulligan: vi.fn(),
      loseHealth: vi.fn(),
      gainHealth: vi.fn(),
    };

    handler = new KeyboardHandler(yCards, mockCallbacks, localPlayerId);
  });

  afterEach(() => {
    handler.destroy();
  });

  it('should offset first copy by 20px', () => {
    const card: WhiteboardCard = {
      id: 'card-1',
      cardNumber: 1,
      x: 100,
      y: 200,
      rotation: 0,
      isTapped: false,
      isFlipped: false,
      counters: [],
      zIndex: 1,
      ownerId: localPlayerId,
    };
    yCards.set(card.id, card);
    handler.setHoveredCard(card.id);

    // Simulate 'k' keypress
    const event = new KeyboardEvent('keydown', { key: 'k' });
    document.dispatchEvent(event);

    // Find the new card (not the original)
    const cards = Array.from(yCards.values());
    const copy = cards.find(c => c.id !== card.id);

    expect(copy).toBeDefined();
    expect(copy?.x).toBe(120); // 100 + 20
    expect(copy?.y).toBe(220); // 200 + 20
    expect(copy?.ownerId).toBe(localPlayerId); // Should be owned by local player
  });

  it('should offset second rapid copy by 40px', () => {
    const card: WhiteboardCard = {
      id: 'card-1',
      cardNumber: 1,
      x: 100,
      y: 200,
      rotation: 0,
      isTapped: false,
      isFlipped: false,
      counters: [],
      zIndex: 1,
      ownerId: localPlayerId,
    };
    yCards.set(card.id, card);
    handler.setHoveredCard(card.id);

    // First copy
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    // Second copy immediately
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    const cards = Array.from(yCards.values());
    expect(cards.length).toBe(3); // Original + 2 copies

    // Find the copies (exclude original)
    const copies = cards.filter(c => c.id !== card.id).sort((a, b) => a.x - b.x);

    expect(copies[0].x).toBe(120); // First copy: 100 + 20
    expect(copies[0].y).toBe(220);
    expect(copies[1].x).toBe(140); // Second copy: 100 + 40
    expect(copies[1].y).toBe(240);
  });

  it('should offset third rapid copy by 60px', () => {
    const card: WhiteboardCard = {
      id: 'card-1',
      cardNumber: 1,
      x: 100,
      y: 200,
      rotation: 0,
      isTapped: false,
      isFlipped: false,
      counters: [],
      zIndex: 1,
      ownerId: localPlayerId,
    };
    yCards.set(card.id, card);
    handler.setHoveredCard(card.id);

    // Three rapid copies
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    const cards = Array.from(yCards.values());
    expect(cards.length).toBe(4); // Original + 3 copies

    // Find the third copy (highest x position)
    const copies = cards.filter(c => c.id !== card.id).sort((a, b) => b.x - a.x);
    const thirdCopy = copies[0];

    expect(thirdCopy.x).toBe(160); // 100 + 60
    expect(thirdCopy.y).toBe(260); // 200 + 60
  });

  it('should reset offset after 1.5s delay', async () => {
    vi.useFakeTimers();

    const card: WhiteboardCard = {
      id: 'card-1',
      cardNumber: 1,
      x: 100,
      y: 200,
      rotation: 0,
      isTapped: false,
      isFlipped: false,
      counters: [],
      zIndex: 1,
      ownerId: localPlayerId,
    };
    yCards.set(card.id, card);
    handler.setHoveredCard(card.id);

    // First copy
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    // Wait 1.6 seconds (more than COPY_RESET_DELAY of 1.5s)
    vi.advanceTimersByTime(1600);

    // Second copy (should reset offset)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    const cards = Array.from(yCards.values());
    const copies = cards.filter(c => c.id !== card.id);

    expect(copies.length).toBe(2);

    // Both copies should have the same offset (20px) because of reset
    expect(copies[0].x).toBe(120); // First copy: 100 + 20
    expect(copies[1].x).toBe(120); // Second copy after reset: 100 + 20

    vi.useRealTimers();
  });

  it('should NOT reset offset if delay is less than 1.5s', () => {
    vi.useFakeTimers();

    const card: WhiteboardCard = {
      id: 'card-1',
      cardNumber: 1,
      x: 100,
      y: 200,
      rotation: 0,
      isTapped: false,
      isFlipped: false,
      counters: [],
      zIndex: 1,
      ownerId: localPlayerId,
    };
    yCards.set(card.id, card);
    handler.setHoveredCard(card.id);

    // First copy
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    // Wait 1.0 second (less than COPY_RESET_DELAY of 1.5s)
    vi.advanceTimersByTime(1000);

    // Second copy (should NOT reset)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    const cards = Array.from(yCards.values());
    const copies = cards.filter(c => c.id !== card.id).sort((a, b) => a.x - b.x);

    expect(copies.length).toBe(2);
    expect(copies[0].x).toBe(120); // First copy: 100 + 20
    expect(copies[1].x).toBe(140); // Second copy: 100 + 40 (no reset)

    vi.useRealTimers();
  });

  it('should reset offset when copying different card', () => {
    const card1: WhiteboardCard = {
      id: 'card-1',
      cardNumber: 1,
      x: 100,
      y: 200,
      rotation: 0,
      isTapped: false,
      isFlipped: false,
      counters: [],
      zIndex: 1,
      ownerId: localPlayerId,
    };

    const card2: WhiteboardCard = {
      id: 'card-2',
      cardNumber: 2,
      x: 300,
      y: 400,
      rotation: 0,
      isTapped: false,
      isFlipped: false,
      counters: [],
      zIndex: 2,
      ownerId: localPlayerId,
    };

    yCards.set(card1.id, card1);
    yCards.set(card2.id, card2);

    // Copy card1 twice
    handler.setHoveredCard(card1.id);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    // Copy card2 (should reset offset)
    handler.setHoveredCard(card2.id);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    const cards = Array.from(yCards.values());

    // Find card2's copy
    const card2Copy = cards.find(c => c.id !== card1.id && c.id !== card2.id && c.x > 300);

    expect(card2Copy).toBeDefined();
    expect(card2Copy?.x).toBe(320); // 300 + 20 (reset!)
    expect(card2Copy?.y).toBe(420); // 400 + 20 (reset!)
  });

  it('should preserve card properties when copying', () => {
    const card: WhiteboardCard = {
      id: 'card-1',
      cardNumber: 42,
      x: 100,
      y: 200,
      rotation: 90,
      isTapped: true,
      isFlipped: true,
      counters: [1, 2, 3],
      zIndex: 5,
      ownerId: 'opponent-456', // Different owner
    };
    yCards.set(card.id, card);
    handler.setHoveredCard(card.id);

    // Copy the card
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    const cards = Array.from(yCards.values());
    const copy = cards.find(c => c.id !== card.id);

    expect(copy).toBeDefined();
    expect(copy?.cardNumber).toBe(42);
    expect(copy?.rotation).toBe(90);
    expect(copy?.isTapped).toBe(true);
    expect(copy?.isFlipped).toBe(true);
    expect(copy?.counters).toEqual([1, 2, 3]);
    expect(copy?.ownerId).toBe(localPlayerId); // Should change to local player
    expect(copy?.x).toBe(120); // Offset applied
    expect(copy?.y).toBe(220);
  });

  it('should create unique IDs for each copy', () => {
    const card: WhiteboardCard = {
      id: 'card-1',
      cardNumber: 1,
      x: 100,
      y: 200,
      rotation: 0,
      isTapped: false,
      isFlipped: false,
      counters: [],
      zIndex: 1,
      ownerId: localPlayerId,
    };
    yCards.set(card.id, card);
    handler.setHoveredCard(card.id);

    // Create 5 copies
    for (let i = 0; i < 5; i++) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    }

    const cards = Array.from(yCards.values());
    const ids = cards.map(c => c.id);
    const uniqueIds = new Set(ids);

    expect(cards.length).toBe(6); // Original + 5 copies
    expect(uniqueIds.size).toBe(6); // All IDs should be unique
  });

  it('should copy counters array without mutation', () => {
    const card: WhiteboardCard = {
      id: 'card-1',
      cardNumber: 1,
      x: 100,
      y: 200,
      rotation: 0,
      isTapped: false,
      isFlipped: false,
      counters: [1, 2, 3],
      zIndex: 1,
      ownerId: localPlayerId,
    };
    yCards.set(card.id, card);
    handler.setHoveredCard(card.id);

    // Copy the card
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    const cards = Array.from(yCards.values());
    const copy = cards.find(c => c.id !== card.id);

    expect(copy?.counters).toEqual([1, 2, 3]);

    // Modify copy's counters - should not affect original
    copy!.counters.push(4);

    const original = cards.find(c => c.id === card.id);
    expect(original?.counters).toEqual([1, 2, 3]); // Original unchanged
  });
});