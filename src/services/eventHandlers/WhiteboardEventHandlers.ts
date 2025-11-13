import * as Y from 'yjs';
import { Player } from '../../modules/player';
import { MultiPlayerBoardManager } from '../../modules/whiteboard';
import { TokenService } from '../scryfall';
import { TurnManager } from '../turnManager';
import { CARD_HEIGHT, CARD_WIDTH } from '../../constants';

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
    private onDeckChange: () => void,
    private turnManager: TurnManager
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

      // Check if player can move cards from dock to battlefield
      if (!this.turnManager.canMoveFromDockToBattlefield(this.playerId)) {
        console.warn('Cannot play card: not active player and no priority');
        alert('You must be the active player or have priority to play cards from your hand to the battlefield.');
        return;
      }

      // Try to play the card from hand
      const card = this.localPlayer.removeCardFromHand(cardId);
      if (card) {
        // Calculate board offset (board is centered on screen)
        // todo: this is incorrect, reference BoardContainerManager instead of hardcoding magic numbers
        const BOARD_WIDTH = 16 * CARD_WIDTH;
        const BOARD_HEIGHT = 6.5 * CARD_HEIGHT;
        const DOCK_HEIGHT = 160;
        const boardLeft = (window.innerWidth - BOARD_WIDTH) / 2;
        const boardTop = window.innerHeight - BOARD_HEIGHT - DOCK_HEIGHT;

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

      if (!card) return;

      // Allow any player to move any card from battlefield to zones
      const cardOwnerId = card.ownerId;

      // Remove WhiteboardCard-specific properties (zIndex, ownerId) to get base Card
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { zIndex, ownerId, ...baseCard } = card;

      // Get the owner's player state
      const yOwnerState = this.yDoc.getMap(`player-${cardOwnerId}`);

      // Add card to the appropriate pile of the card owner
      if (destination === 'hand') {
        const hand = (yOwnerState.get('hand') as any[]) ?? [];
        yOwnerState.set('hand', [...hand, baseCard]);
      } else if (destination === 'exile') {
        const exilePile = (yOwnerState.get('exilePile') as any[]) ?? [];
        yOwnerState.set('exilePile', [...exilePile, baseCard]);
      } else if (destination === 'discard') {
        const discardPile = (yOwnerState.get('discardPile') as any[]) ?? [];
        yOwnerState.set('discardPile', [...discardPile, baseCard]);
      } else if (destination === 'deck') {
        // For deck, we can't directly modify it since it's local-only
        // This would require access to the owner's Deck instance
        // For now, we'll add to exile as a fallback
        const exilePile = (yOwnerState.get('exilePile') as any[]) ?? [];
        yOwnerState.set('exilePile', [...exilePile, baseCard]);
        console.warn('Moving to deck requires owner to be local player - moved to exile instead');
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