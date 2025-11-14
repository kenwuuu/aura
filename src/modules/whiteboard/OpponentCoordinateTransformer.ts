import { WhiteboardCard } from './types';
import { CARD_HEIGHT } from '../../constants';

/**
 * Pure utility class for transforming opponent card coordinates
 *
 * IMPORTANT: This only affects how WE see opponent cards on OUR screen.
 * The coordinates in Yjs are world coordinates and never change.
 *
 * Local player cards: No transformation (render as-is)
 * Opponent cards: Vertical flip (so their bottom becomes our top)
 */
export class OpponentCoordinateTransformer {
  /**
   * Transform opponent coordinates for local rendering
   *
   * @param card - The card to transform
   * @param localPlayerId - The local player's ID
   * @param boardHeight - Height of the board
   * @param zoomLevel - Current zoom level
   * @returns Transformed {x, y} coordinates
   */
  static transform(
    card: WhiteboardCard,
    localPlayerId: string,
    boardHeight: number,
    zoomLevel: number
  ): { x: number; y: number } {
    if (card.ownerId === localPlayerId) {
      // Our own cards: render at exact Yjs coordinates
      return { x: card.x, y: card.y };
    } else {
      // Opponent cards: flip Y coordinate so their board appears inverted
      // When opponent places at Y=0 (their top), it appears at bottom of our view
      // When opponent places at Y=max (their bottom), it appears at top of our view
      return {
        x: card.x,
        y: card.y
      };
    }
  }
}