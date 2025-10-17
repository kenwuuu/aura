import * as Y from 'yjs';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Deck } from './modules/deck';
import { Whiteboard, KeyboardHandlerCallbacks } from './modules/whiteboard';
import { WebRTCProvider } from './modules/webrtc';
import { Player } from './modules/player';
import { GameResourcesDock, OpponentHealthDisplay } from './modules/gameResourcesDock';
import { DeckManager } from './components';
import { SavedDeck } from './modules/deck/types';
import './style.css';

class AuraApp {
  private yDoc: Y.Doc;
  private webrtcProvider: WebRTCProvider;
  private whiteboard: Whiteboard;
  private localPlayer: Player;
  private localDock: GameResourcesDock;
  private opponentHealthDisplay: OpponentHealthDisplay;
  private playerId: string;

  constructor() {
    this.yDoc = new Y.Doc();

    // Generate unique player ID
    this.playerId = `player-${Math.random().toString(36).substring(2, 9)}`;

    // Get room name from URL or generate a random one
    const urlParams = new URLSearchParams(window.location.search);
    const roomName = urlParams.get('room') ?? this.generateRoomId();

    // Update URL with room name if not present
    if (!urlParams.get('room')) {
      window.history.replaceState({}, '', `?room=${roomName}`);
    }

    // Initialize WebRTC provider
    this.webrtcProvider = new WebRTCProvider(this.yDoc, {
      roomName,
    });

    // Initialize local player deck
    const localDeck = new Deck({
      initialCardCount: 60,
    });

    // Initialize local player
    this.localPlayer = new Player(this.playerId, this.yDoc, localDeck, {
      initialHealth: 20,
    });

    // Initialize whiteboard
    const whiteboardContainer = document.getElementById('whiteboard');
    if (!whiteboardContainer) {
      throw new Error('Whiteboard container not found');
    }

    this.whiteboard = new Whiteboard(whiteboardContainer, this.yDoc, {
      backgroundColor: '#1a1a1a',
      width: window.innerWidth,
      height: window.innerHeight,
      localPlayerId: this.playerId,
    });

    // Initialize local player's resource dock
    const dockContainer = document.getElementById('local-dock');
    if (!dockContainer) {
      throw new Error('Local dock container not found');
    }

    this.localDock = new GameResourcesDock(dockContainer, this.localPlayer, {
      position: 'bottom',
      playerId: this.playerId,
    });

    // Initialize opponent health display
    const opponentHealthContainer = document.getElementById('opponent-health-container');
    if (!opponentHealthContainer) {
      throw new Error('Opponent health container not found');
    }

    this.opponentHealthDisplay = new OpponentHealthDisplay(
      opponentHealthContainer,
      this.yDoc,
      this.playerId
    );

    this.setupEventListeners();
    this.setupConnectionStatus();
    this.setupKeyboardCallbacks();
    this.setupDeckManager();
  }

  private setupKeyboardCallbacks(): void {
    const callbacks: KeyboardHandlerCallbacks = {
      onMoveToHand: (card) => {
        // Remove from battlefield and add to hand
        const hand = this.localPlayer.getState().hand;
        this.localPlayer['yPlayerState'].set('hand', [...hand, card]);
      },
      onMoveToDeckTop: (card) => {
        this.localPlayer.moveCardToDeckTop(card);
      },
      onMoveToDeckBottom: (card) => {
        this.localPlayer.moveCardToDeckBottom(card);
      },
      onMoveToGraveyard: (card) => {
        this.localPlayer.moveCardToDiscard(card);
      },
      onMoveToExile: (card) => {
        this.localPlayer.moveCardToExile(card);
      },
      onDrawCard: () => {
        this.localPlayer.drawCard();
      },
      onShuffleDeck: () => {
        this.localPlayer.shuffleDeck();
      },
      onUntapAll: () => {
        console.log('Untapping all cards');
      },
      onEndTurn: () => {
        console.log('End turn - not yet implemented');
      },
    };

    this.whiteboard.setKeyboardCallbacks(callbacks);
  }

  private generateRoomId(): string {
    return `mtg-${Math.random().toString(36).substring(2, 9)}`;
  }

  private setupEventListeners(): void {
    const whiteboardContainer = document.getElementById('whiteboard');

    // Setup whiteboard as a drop zone
    if (whiteboardContainer) {
      whiteboardContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
      });

      whiteboardContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const cardId = e.dataTransfer?.getData('text/plain');
        if (!cardId) return;

        // Try to play the card from hand
        const card = this.localPlayer.playCardFromHand(cardId);
        if (card) {
          // Place card at drop position
          card.x = e.clientX - 31.5; // Center card on cursor
          card.y = e.clientY - 44;
          this.whiteboard.addCard(card, this.playerId);
        }
      });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      if (whiteboardContainer) {
        whiteboardContainer.style.width = `${window.innerWidth}px`;
        whiteboardContainer.style.height = `${window.innerHeight}px`;
      }
    });
  }

  private setupConnectionStatus(): void {
    const statusElement = document.getElementById('connection-status');
    const roomElement = document.getElementById('room-name');

    if (roomElement) {
      roomElement.textContent = `Room: ${this.webrtcProvider.getRoomName()}`;
    }

    this.webrtcProvider.onStatusChange((status) => {
      if (statusElement) {
        if (status.isConnected) {
          statusElement.textContent = `Connected (${status.peersCount} peer${status.peersCount !== 1 ? 's' : ''})`;
          statusElement.style.color = '#4ade80';
        } else {
          statusElement.textContent = 'Waiting for peers...';
          statusElement.style.color = '#facc15';
        }
      }
    });
  }

  private setupDeckManager(): void {
    const deckManagerRoot = document.getElementById('deck-manager-root');
    if (!deckManagerRoot) {
      throw new Error('Deck manager root not found');
    }

    const root = createRoot(deckManagerRoot);
    root.render(
      React.createElement(DeckManager, {
        onDeckSelected: (deck: SavedDeck) => this.loadDeck(deck),
      })
    );
  }

  private loadDeck(savedDeck: SavedDeck): void {
    console.log(`Loading deck: ${savedDeck.metadata.name} (${savedDeck.cards.length} cards)`);

    // Create a new deck with the imported cards
    const newDeck = new Deck({
      initialCardCount: savedDeck.cards.length,
    }, savedDeck.cards);

    // Update the player's deck
    this.localPlayer['deck'] = newDeck;

    // Update deck count in Yjs state
    this.localPlayer['yPlayerState'].set('deckCardCount', newDeck.getCardCount());

    console.log(`Deck "${savedDeck.metadata.name}" loaded successfully!`);
  }

  public destroy(): void {
    this.whiteboard.destroy();
    this.localDock.destroy();
    this.opponentHealthDisplay.destroy();
    this.webrtcProvider.destroy();
  }
}

// Initialize the app
const app = new AuraApp();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  app.destroy();
});