import * as Y from 'yjs';
import { Player } from '../../modules/player';
import { MultiPlayerBoardManager } from '../../modules/whiteboard';
import { TokenService } from '../scryfall';
import { CARD_HEIGHT, CARD_WIDTH } from '../../constants';
import {getBoardLeftOffset, getBoardTopOffset} from "../../modules/whiteboard/BoardContainerManager";

/**
 * Handles drag-and-drop events between the whiteboard and other game zones
 */
export class WhiteboardEventHandlers {
  constructor(
    private yDoc: Y.Doc,
    private localPlayer: Player,
    private whiteboard: MultiPlayerBoardManager,
    private tokenService: TokenService,
    private playerId: string,
    private onDeckChange: () => void
  ) {}

  /**
   * Setup all event listeners for whiteboard interactions
   */
  setupEventListeners(): void {
    this.setupDropZone();
    this.setupBattlefieldToDockDrag();
  }

  /**
   * Setup whiteboard as a drop zone for cards from hand
   */
  private setupDropZone(): void {
    const whiteboardContainer = document.getElementById('whiteboard');

    if (!whiteboardContainer) {
      console.warn('Whiteboard container not found');
      return;
    }

    whiteboardContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
    });

    whiteboardContainer.addEventListener('drop', async (e) => {
      e.preventDefault();
      const cardId = e.dataTransfer?.getData('text/plain');
      if (!cardId) return;

      // Try to play the card from hand
      const card = this.localPlayer.removeCardFromHand(cardId);
      if (card) {
        // Calculate board offset (board is centered on screen)
        // todo: reference BoardContainerManager instead of hardcoding magic numbers
        const boardLeft = getBoardLeftOffset();
        const boardTop = getBoardTopOffset();

        // Convert screen coordinates to board-relative coordinates
        // Then subtract card center offset for proper placement under cursor
        card.x = e.clientX - boardLeft - ((CARD_WIDTH / 2) * this.whiteboard.getZoomLevel());
        card.y = e.clientY - boardTop - ((CARD_HEIGHT / 2) * this.whiteboard.getZoomLevel()) - 60;
        this.whiteboard.addCard(card, this.playerId);

        // Search for and create any tokens related to card
        if (card.scryfallId) {
          const result = await this.tokenService.createTokensForCard(
            card.scryfallId,
            { x: card.x, y: card.y } // Place tokens to the right of the card
          );

          // Add tokens to battlefield
          result.tokens.forEach(token => {
            this.whiteboard.addCard(token, this.playerId);
          });

          // Log any errors
          if (result.errors.length > 0) {
            console.warn(`Token creation errors for ${card.name}:`, result.errors);
          }
        }
      }
    });
  }

  /**
   * Setup listener for cards being dragged from battlefield to dock
   */
  private setupBattlefieldToDockDrag(): void {
    window.addEventListener('moveCardFromBattlefield', ((event: CustomEvent) => {
      const { cardId, destination } = event.detail;

      // Get the card from battlefield (yCards)
      const yCards = this.yDoc.getMap('cards');
      const card = yCards.get(cardId) as any;

      if (!card || card.ownerId !== this.playerId) return;

      // Remove WhiteboardCard-specific properties (zIndex, ownerId) to get base Card
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { zIndex, ownerId, ...baseCard } = card;

      // Add card to the appropriate pile
      if (destination === 'hand') {
        this.localPlayer.putCardInHand(baseCard as any);
      } else if (destination === 'exile') {
        this.localPlayer.moveCardToExile(baseCard as any);
      } else if (destination === 'discard') {
        this.localPlayer.moveCardToDiscard(baseCard as any);
      } else if (destination === 'deck') {
        this.localPlayer.moveCardToDeckTop(baseCard as any);
        this.onDeckChange(); // Notify that deck changed
      }

      // Remove card from battlefield
      yCards.delete(cardId);
    }) as EventListener);
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    // Note: Currently event listeners are not explicitly removed
    // Consider adding cleanup logic if memory leaks become an issue
  }
}