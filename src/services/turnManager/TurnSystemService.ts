import * as Y from 'yjs';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { TurnManager } from './TurnManager';
import { TurnSystem } from '../../components/TurnSystem';

/**
 * Service that handles turn system UI setup and event handling
 * Separates turn management concerns from the main app class
 */
export class TurnSystemService {
  private turnManager: TurnManager;
  private yDoc: Y.Doc;
  private playerId: string;
  private turnSystemRoot: Root | null = null;
  private turnStateUnsubscribe: (() => void) | null = null;
  private previousActivePlayerId: string | null = null;

  constructor(turnManager: TurnManager, yDoc: Y.Doc, playerId: string) {
    this.turnManager = turnManager;
    this.yDoc = yDoc;
    this.playerId = playerId;
  }

  /**
   * Initialize player order (should be called when game starts)
   */
  public initializePlayerOrder(): void {
    // Initialize player order (will set first player as active if none exists)
    // This ensures turn system is ready from the start
    setTimeout(() => {
      this.turnManager.initializePlayerOrder();
    }, 100); // Small delay to ensure all players have joined
  }

  /**
   * Set up the turn system React component
   */
  public setupTurnSystem(): void {
    const turnSystemContainer = document.createElement('div');
    turnSystemContainer.id = 'turn-system-root';
    document.body.appendChild(turnSystemContainer);

    this.turnSystemRoot = createRoot(turnSystemContainer);
    this.turnSystemRoot.render(
      React.createElement(TurnSystem, {
        turnManager: this.turnManager,
        localPlayerId: this.playerId,
        onPassTurn: () => this.handlePassTurn(),
        onTakePriority: () => this.handleTakePriority(),
        onEndPriority: () => this.handleEndPriority(),
      })
    );
  }

  /**
   * Set up observer for turn state changes
   */
  public setupTurnStateObserver(): void {
    // Initialize with current active player if one exists
    const initialState = this.turnManager.getTurnState();
    if (initialState.activePlayerId) {
      this.previousActivePlayerId = initialState.activePlayerId;
    }

    this.turnStateUnsubscribe = this.turnManager.onTurnStateChange((state) => {
      // Check if active player changed (turn started)
      if (state.activePlayerId && state.activePlayerId !== this.previousActivePlayerId) {
        this.handleTurnStart(state.activePlayerId);
        this.previousActivePlayerId = state.activePlayerId;
      }
    });
  }

  /**
   * Handle turn start logic
   */
  private handleTurnStart(activePlayerId: string): void {
    const yCards = this.yDoc.getMap('cards');
    // TODO: Add turn start logic here (e.g., untap cards, draw card)
  }

  /**
   * Handle passing turn to the next player
   */
  private handlePassTurn(): void {
    const previousActivePlayerId = this.turnManager.getTurnState().activePlayerId;
    this.turnManager.passTurn();
    
    // Get the new active player after passing turn
    const newState = this.turnManager.getTurnState();
    if (newState.activePlayerId && newState.activePlayerId !== previousActivePlayerId) {
      // Manually trigger turn start to ensure it happens immediately
      this.handleTurnStart(newState.activePlayerId);
    }
  }

  /**
   * Handle taking priority (for inactive players)
   */
  private handleTakePriority(): void {
    this.turnManager.takePriority(this.playerId);
  }

  /**
   * Handle ending priority (for inactive players who have priority)
   */
  private handleEndPriority(): void {
    this.turnManager.endPriority(this.playerId);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.turnStateUnsubscribe) {
      this.turnStateUnsubscribe();
      this.turnStateUnsubscribe = null;
    }
    if (this.turnSystemRoot) {
      this.turnSystemRoot.unmount();
      this.turnSystemRoot = null;
    }
  }
}

