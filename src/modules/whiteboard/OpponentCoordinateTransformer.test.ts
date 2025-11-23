import { describe, it, expect } from 'vitest';
import { OpponentCoordinateTransformer } from './OpponentCoordinateTransformer';
import { WhiteboardCard } from './types';
import { CARD_HEIGHT } from '../../constants';

// skip these tests because we're currently not transforming coords
describe.skip('OpponentCoordinateTransformer', () => {
  const localPlayerId = 'player-123';
  const opponentId = 'player-456';
  const boardHeight = 572; // 6.5 * 88
  const defaultZoom = 1;

  const createCard = (overrides: Partial<WhiteboardCard> = {}): WhiteboardCard => ({
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
    ...overrides,
  });

  describe('Local player cards', () => {
    it('should not transform local player card coordinates', () => {
      const card = createCard({ ownerId: localPlayerId, x: 100, y: 200 });
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('should return exact Yjs coordinates for local player at origin', () => {
      const card = createCard({ ownerId: localPlayerId, x: 0, y: 0 });
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('should return exact Yjs coordinates for local player at max position', () => {
      const card = createCard({ ownerId: localPlayerId, x: 1000, y: 500 });
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      expect(result).toEqual({ x: 1000, y: 500 });
    });
  });

  describe('Opponent cards', () => {
    it('should transform opponent Y coordinate (vertical flip)', () => {
      const card = createCard({ ownerId: opponentId, x: 100, y: 200 });
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      // Y should be: boardHeight - y - (CARD_HEIGHT * zoom) - 300
      const expectedY = boardHeight - 200 - (CARD_HEIGHT * defaultZoom) - 300;
      expect(result.x).toBe(100); // X unchanged
      expect(result.y).toBe(expectedY);
    });

    it('should NOT transform opponent X coordinate', () => {
      const card = createCard({ ownerId: opponentId, x: 500, y: 200 });
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      expect(result.x).toBe(500); // X should remain unchanged
    });

    it('should flip opponent card at Y=0 to bottom of view', () => {
      const card = createCard({ ownerId: opponentId, x: 100, y: 0 });
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      // Y=0 for opponent (their top) should appear transformed
      const expectedY = boardHeight - 0 - (CARD_HEIGHT * defaultZoom) - 300;
      expect(result.y).toBe(expectedY);
      // The -300 offset means it won't necessarily be in bottom half, just verify it's transformed
      expect(result.y).not.toBe(0);
    });

    it('should flip opponent card at high Y to top of view', () => {
      const card = createCard({ ownerId: opponentId, x: 100, y: 400 });
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      // High Y for opponent (their bottom) should appear at top of our view
      const expectedY = boardHeight - 400 - (CARD_HEIGHT * defaultZoom) - 300;
      expect(result.y).toBe(expectedY);
      expect(result.y).toBeLessThan(boardHeight / 2); // Should be in top half
    });
  });

  describe('Zoom level handling', () => {
    it('should account for zoom when transforming opponent cards', () => {
      const card = createCard({ ownerId: opponentId, x: 100, y: 200 });
      const zoomLevel = 1.5;
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        zoomLevel
      );

      // Y should factor in zoomed card height
      const expectedY = boardHeight - 200 - (CARD_HEIGHT * zoomLevel) - 300;
      expect(result.y).toBe(expectedY);
    });

    it('should handle zoom < 1 correctly', () => {
      const card = createCard({ ownerId: opponentId, x: 100, y: 200 });
      const zoomLevel = 0.5;
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        zoomLevel
      );

      const expectedY = boardHeight - 200 - (CARD_HEIGHT * zoomLevel) - 300;
      expect(result.y).toBe(expectedY);
    });

    it('should handle zoom > 1 correctly', () => {
      const card = createCard({ ownerId: opponentId, x: 100, y: 200 });
      const zoomLevel = 2.5;
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        zoomLevel
      );

      const expectedY = boardHeight - 200 - (CARD_HEIGHT * zoomLevel) - 300;
      expect(result.y).toBe(expectedY);
    });

    it('should not affect local player cards regardless of zoom', () => {
      const card = createCard({ ownerId: localPlayerId, x: 100, y: 200 });
      const result1 = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        0.5
      );
      const result2 = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        2.5
      );

      expect(result1).toEqual({ x: 100, y: 200 });
      expect(result2).toEqual({ x: 100, y: 200 });
    });
  });

  describe('Board height variations', () => {
    it('should handle different board heights correctly', () => {
      const card = createCard({ ownerId: opponentId, x: 100, y: 200 });
      const customBoardHeight = 1000;
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        customBoardHeight,
        defaultZoom
      );

      const expectedY = customBoardHeight - 200 - (CARD_HEIGHT * defaultZoom) - 300;
      expect(result.y).toBe(expectedY);
    });

    it('should work with smaller board height', () => {
      const card = createCard({ ownerId: opponentId, x: 100, y: 50 });
      const smallBoardHeight = 300;
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        smallBoardHeight,
        defaultZoom
      );

      const expectedY = smallBoardHeight - 50 - (CARD_HEIGHT * defaultZoom) - 300;
      expect(result.y).toBe(expectedY);
    });
  });

  describe('Pure function behavior', () => {
    it('should not mutate the input card', () => {
      const card = createCard({ ownerId: opponentId, x: 100, y: 200 });
      const originalCard = { ...card };

      OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      expect(card).toEqual(originalCard);
    });

    it('should return consistent results for same inputs', () => {
      const card = createCard({ ownerId: opponentId, x: 100, y: 200 });

      const result1 = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );
      const result2 = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      expect(result1).toEqual(result2);
    });

    it('should return new object each time (not mutate returned object)', () => {
      const card = createCard({ ownerId: opponentId, x: 100, y: 200 });

      const result1 = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );
      const result2 = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      expect(result1).not.toBe(result2); // Different object references
      expect(result1).toEqual(result2); // But same values
    });
  });

  describe('Edge cases', () => {
    it('should handle negative coordinates', () => {
      const card = createCard({ ownerId: opponentId, x: -50, y: -100 });
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      expect(result.x).toBe(-50); // X unchanged
      const expectedY = boardHeight - (-100) - (CARD_HEIGHT * defaultZoom) - 300;
      expect(result.y).toBe(expectedY);
    });

    it('should handle very large coordinates', () => {
      const card = createCard({ ownerId: opponentId, x: 10000, y: 5000 });
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      expect(result.x).toBe(10000);
      const expectedY = boardHeight - 5000 - (CARD_HEIGHT * defaultZoom) - 300;
      expect(result.y).toBe(expectedY);
    });

    it('should handle zero zoom (edge case)', () => {
      const card = createCard({ ownerId: opponentId, x: 100, y: 200 });
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        0
      );

      const expectedY = boardHeight - 200 - (CARD_HEIGHT * 0) - 300;
      expect(result.y).toBe(expectedY);
    });

    it('should handle decimal coordinates', () => {
      const card = createCard({ ownerId: opponentId, x: 123.456, y: 789.123 });
      const result = OpponentCoordinateTransformer.transform(
        card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      expect(result.x).toBe(123.456);
      const expectedY = boardHeight - 789.123 - (CARD_HEIGHT * defaultZoom) - 300;
      expect(result.y).toBeCloseTo(expectedY, 10);
    });
  });

  describe('Multiple opponents', () => {
    it('should transform all non-local players the same way', () => {
      const opponent1Card = createCard({ ownerId: 'opponent-1', x: 100, y: 200 });
      const opponent2Card = createCard({ ownerId: 'opponent-2', x: 100, y: 200 });

      const result1 = OpponentCoordinateTransformer.transform(
        opponent1Card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );
      const result2 = OpponentCoordinateTransformer.transform(
        opponent2Card,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      expect(result1).toEqual(result2);
    });

    it('should distinguish local player from any opponent', () => {
      const localCard = createCard({ ownerId: localPlayerId, x: 100, y: 200 });
      const opponentCard = createCard({ ownerId: 'any-opponent', x: 100, y: 200 });

      const localResult = OpponentCoordinateTransformer.transform(
        localCard,
        localPlayerId,
        boardHeight,
        defaultZoom
      );
      const opponentResult = OpponentCoordinateTransformer.transform(
        opponentCard,
        localPlayerId,
        boardHeight,
        defaultZoom
      );

      expect(localResult.x).toBe(opponentResult.x); // X same
      expect(localResult.y).not.toBe(opponentResult.y); // Y different
    });
  });
});