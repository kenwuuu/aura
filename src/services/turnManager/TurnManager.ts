import * as Y from 'yjs';
import { untapAllCardsForPlayer as untapCardsForPlayer } from '../../modules/whiteboard/KeyboardHandler';

export interface TurnState {
  activePlayerId: string | null;
  playerOrder: string[];
  playersWithPriority: string[]; // Inactive players who have taken priority
}

/**
 * Manages turn order and priority system for multiplayer games
 * State is stored in Yjs for synchronization across peers
 */
export class TurnManager {
  private yTurnState: Y.Map<any>;
  private yDoc: Y.Doc;

  constructor(yDoc: Y.Doc) {
    this.yDoc = yDoc;
    this.yTurnState = yDoc.getMap('turnState');
    this.initializeState();
  }

  private initializeState(): void {
    if (!this.yTurnState.has('activePlayerId')) {
      // Initialize with null - will be set when first player passes turn
      this.yTurnState.set('activePlayerId', null);
      this.yTurnState.set('playerOrder', []);
      this.yTurnState.set('playersWithPriority', []);
    }
  }

  /**
   * Get current turn state
   */
  public getTurnState(): TurnState {
    return {
      activePlayerId: this.yTurnState.get('activePlayerId') ?? null,
      playerOrder: this.yTurnState.get('playerOrder') ?? [],
      playersWithPriority: this.yTurnState.get('playersWithPriority') ?? [],
    };
  }

  /**
   * Initialize player order (should be called when game starts)
   * Order is determined by the order players join (stored in Yjs)
   */
  public initializePlayerOrder(): void {
    const currentOrder = this.yTurnState.get('playerOrder') ?? [];
    const currentActivePlayerId = this.yTurnState.get('activePlayerId');
    
    // Get all players from Yjs
    const allPlayers: string[] = [];
    this.yDoc.share.forEach((_, key) => {
      if (key.startsWith('player-')) {
        const playerId = key.replace('player-', '');
        allPlayers.push(playerId);
      }
    });

    // If order is empty or players have changed, update it
    if (currentOrder.length === 0 || 
        allPlayers.length !== currentOrder.length ||
        !allPlayers.every(id => currentOrder.includes(id))) {
      // Sort player IDs to ensure consistent order across all peers
      const sortedPlayers = [...allPlayers].sort();
      this.yTurnState.set('playerOrder', sortedPlayers);
      
      // Preserve current active player if they're still in the game
      // Only set a new active player if there isn't one or if current active player left
      if (currentActivePlayerId && sortedPlayers.includes(currentActivePlayerId)) {
        // Keep current active player
        this.yTurnState.set('activePlayerId', currentActivePlayerId);
      } else if (!currentActivePlayerId && sortedPlayers.length > 0) {
        // No active player set, set first player as active
        this.yTurnState.set('activePlayerId', sortedPlayers[0]);
      }
      // If current active player left the game, leave activePlayerId as is (or null)
      // The turn system will need to handle this case separately
    }
  }

  /**
   * Check if a player is the active player
   */
  public isActivePlayer(playerId: string): boolean {
    const activePlayerId = this.yTurnState.get('activePlayerId');
    return activePlayerId === playerId;
  }

  /**
   * Check if a player has priority
   */
  public hasPriority(playerId: string): boolean {
    const playersWithPriority = this.yTurnState.get('playersWithPriority') ?? [];
    return playersWithPriority.includes(playerId);
  }

  /**
   * Check if a player can move cards from dock to battlefield
   * Active players can always do this, inactive players need priority
   */
  public canMoveFromDockToBattlefield(playerId: string): boolean {
    if (this.isActivePlayer(playerId)) {
      return true;
    }
    return this.hasPriority(playerId);
  }

  /**
   * Pass turn to the next player (clockwise)
   */
  public passTurn(): void {
    const state = this.getTurnState();
    
    if (state.playerOrder.length === 0) {
      console.warn('Cannot pass turn: no players in order');
      return;
    }

    // Clear all priority when turn passes
    this.yTurnState.set('playersWithPriority', []);

    if (!state.activePlayerId) {
      // No active player, set first player as active
      if (state.playerOrder.length > 0) {
        this.yTurnState.set('activePlayerId', state.playerOrder[0]);
      }
      return;
    }

    // Find current player index
    const currentIndex = state.playerOrder.indexOf(state.activePlayerId);
    if (currentIndex === -1) {
      console.warn('Active player not found in player order');
      return;
    }

    // Get next player (wrap around)
    const nextIndex = (currentIndex + 1) % state.playerOrder.length;
    const nextPlayerId = state.playerOrder[nextIndex];

    this.yTurnState.set('activePlayerId', nextPlayerId);
  }

  /**
   * Take priority (for inactive players)
   */
  public takePriority(playerId: string): void {
    if (this.isActivePlayer(playerId)) {
      console.warn('Active player cannot take priority');
      return;
    }

    const playersWithPriority = this.yTurnState.get('playersWithPriority') ?? [];
    if (!playersWithPriority.includes(playerId)) {
      this.yTurnState.set('playersWithPriority', [...playersWithPriority, playerId]);
    }
  }

  /**
   * End priority (for inactive players who have priority)
   */
  public endPriority(playerId: string): void {
    const playersWithPriority = this.yTurnState.get('playersWithPriority') ?? [];
    const updated = playersWithPriority.filter((id: string) => id !== playerId);
    this.yTurnState.set('playersWithPriority', updated);
  }

  /**
   * Subscribe to turn state changes
   */
  public onTurnStateChange(callback: (state: TurnState) => void): () => void {
    const observer = () => {
      callback(this.getTurnState());
    };

    this.yTurnState.observe(observer);

    // Return cleanup function
    return () => {
      this.yTurnState.unobserve(observer);
    };
  }

  /**
   * Get all tapped cards owned by a player
   */
  public getTappedCardsForPlayer(playerId: string, yCards: Y.Map<any>): string[] {
    const tappedCardIds: string[] = [];
    yCards.forEach((card: any, cardId: string) => {
      if (card.ownerId === playerId && card.isTapped) {
        tappedCardIds.push(cardId);
      }
    });
    return tappedCardIds;
  }

  /**
   * Untap all cards owned by a player
   */
  public untapAllCardsForPlayer(playerId: string, yCards: Y.Map<any>): void {
    untapCardsForPlayer(playerId, yCards);
  }
}

