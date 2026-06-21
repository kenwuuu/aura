import * as Y from 'yjs';
import posthog from 'posthog-js';
import { Player } from '@/modules/player';
import { MultiPlayerBoardManager } from '@/modules/whiteboard';
import {TokenCreationResult, TokenService} from '../scryfall';
import {CARD_HEIGHT, CARD_WIDTH, YDOC_CARDS_ON_BOARD, YDOC_KEYWORD_TOKENS} from '@/constants';
import {getBoardLeftOffset, getBoardTopOffset} from "@/modules/whiteboard/BoardContainerManager";
import {PileType} from "@/modules/gameResourcesDock/components";
import {tokenDiameter} from "@/modules/keywordTokens/KeywordTokenFactory";
import {Card} from "@/modules/deck";

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
      // Support both 'move' (for cards) and 'copy' (for tokens)
      // Check what type of drag is happening
      const types = e.dataTransfer?.types || [];
      if (types.includes('text/x-keyword-token-template')) {
        e.dataTransfer!.dropEffect = 'copy';
      } else {
        e.dataTransfer!.dropEffect = 'move';
      }
    });

    whiteboardContainer.addEventListener('drop', async (e) => {
      e.preventDefault();

      // Check if dropping a keyword token template from the grid
      const tokenTemplateData = e.dataTransfer?.getData('text/x-keyword-token-template');
      if (tokenTemplateData) {
        try {
          const template = JSON.parse(tokenTemplateData);

          // Calculate board offset
          const boardLeft = getBoardLeftOffset();
          const boardTop = getBoardTopOffset();

          // Convert screen coordinates to board-relative, centered on cursor
          const x = e.clientX - boardLeft - ((tokenDiameter / 2) * this.whiteboard.getZoomLevel()); // 25 = half of 50px token
          const y = e.clientY - boardTop - ((tokenDiameter / 2.7) * this.whiteboard.getZoomLevel()) - 60;

          // Create new token instance from template
          const tokenId = `token-${Math.random().toString(36).substring(2, 11)}`;
          const yTokens = this.yDoc.getMap(YDOC_KEYWORD_TOKENS);

          // Get current max zIndex
          let maxZIndex = 0;
          yTokens.forEach((token: any) => {
            if (token.zIndex > maxZIndex) {
              maxZIndex = token.zIndex;
            }
          });

          const newToken = {
            id: tokenId,
            title: template.title,
            imageUrl: template.imageUrl ?? '',
            backgroundColor: template.backgroundColor,
            count: template.count,
            ownerId: this.playerId,
            x,
            y,
            zIndex: maxZIndex + 1,
            rotation: 0,
          };

          yTokens.set(tokenId, newToken);
        } catch (error) {
          console.error('Failed to create token from template:', error);
        }
        return;
      }

      // Original card drop logic
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
        posthog.capture('card_played_to_battlefield', {
          card_name: card.name,
          is_flipped: card.isFlipped,
        });

        // Search for and create any tokens related to card
        await this.createRelatedTokens(card);
      }
    });
  }

  private async createRelatedTokens(card: Card) {
    if (card.scryfallId) {
      const result: TokenCreationResult = await this.tokenService.createTokensForCard(
        card.scryfallId,
        {x: card.x, y: card.y} // Place tokens to the right of the card
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

  /**
   * Setup listener for cards being dragged from battlefield to dock
   */
  private setupBattlefieldToDockDrag(): void {
    window.addEventListener('moveCardFromBattlefield', ((event: CustomEvent) => {
      const {cardId, destination} = event.detail
      this.moveCardFromBattlefieldToPile(cardId, destination);
    }) as EventListener);
  }

  public moveCardFromBattlefieldToPile(cardId: string, destination: PileType) {
    // Get the card from battlefield (yCards)
    const yCards = this.yDoc.getMap(YDOC_CARDS_ON_BOARD);
    const card = yCards.get(cardId) as any;

    if (!card || card.ownerId !== this.playerId) return;

    // Remove WhiteboardCard-specific properties (zIndex, ownerId) to get base Card
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {zIndex, ownerId, ...baseCard} = card;

    // Add card to the appropriate pile
    if (destination === 'hand') {
      this.localPlayer.placeCardInPile(baseCard, 'hand');
    } else if (destination === 'exile') {
      this.localPlayer.placeCardInPile(baseCard as any, 'exile');
    } else if (destination === 'discard') {
      this.localPlayer.placeCardInPile(baseCard as any, 'discard');
    } else if (destination === 'deck') {
      this.localPlayer.moveCardToDeckTop(baseCard as any);
      this.onDeckChange(); // Notify that deck changed
    }

    // Remove card from battlefield
    yCards.delete(cardId);
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    // Note: Currently event listeners are not explicitly removed
    // Consider adding cleanup logic if memory leaks become an issue
  }
}