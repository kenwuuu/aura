import * as Y from 'yjs';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Deck } from './modules/deck';
import { MultiPlayerBoardManager, KeyboardHandlerCallbacks } from './modules/whiteboard';
import { WebRTCProvider } from './modules/webrtc';
import { getOrCreatePlayerId, getOrCreatePeerId } from './modules/webrtc/persistence';
import { Player } from './modules/player';
import { GameResourcesDock } from './modules/gameResourcesDock';
import { DeckManager, WelcomeModal, HotkeysModal, HelpModal, AddCardManager, PatchNotesModal, TurnSystem } from './components';
import { OpponentHealthList } from './components/OpponentHealthList';
import { TurnManager } from './services/turnManager';
import { SavedDeck } from './modules/deck/types';
import { TokenService } from './services/scryfall';
import { ScryfallApiService } from './services/scryfall/ScryfallApiService';
import { CardPreview } from './modules/cardPreview';
import { DeckStorageService } from './services/deckStorage';
import { DeckPersistenceService } from './services/deckPersistence';
import { RoomManager } from './services/roomManager';
import { WhiteboardEventHandlers } from './services/eventHandlers';
import { PatchNotesService } from './services/patchNotes';
import { DEFAULT_DECK } from './data/defaultDeck';
import './style.css';

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://beb5f109e66475063b4650877bc1c6a1@o4510353682006016.ingest.de.sentry.io/4510353685610576",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.,
  // Enable logs to be sent to Sentry
  enableLogs: true,
});

class AuraApp {
  private yDoc: Y.Doc;
  private webrtcProvider: WebRTCProvider;
  private whiteboard: MultiPlayerBoardManager;
  private localPlayer: Player;
  private localDock: GameResourcesDock;
  private opponentHealthRoot: Root | null = null;
  private tokenService: TokenService;
  private cardPreview: CardPreview;
  private playerId: string;
  private scryfallApiService: ScryfallApiService;
  private roomManager: RoomManager;
  private eventHandlers: WhiteboardEventHandlers | null = null;
  private turnManager: TurnManager;
  private turnSystemRoot: Root | null = null;

  constructor() {
    this.yDoc = new Y.Doc();

    // Get or create persistent player ID (survives page reloads)
    this.playerId = getOrCreatePlayerId();
    console.log('Player ID:', this.playerId);

    // Initialize room manager (handles room ID and URL)
    this.roomManager = new RoomManager();

    // Get or create persistent peer ID for WebRTC
    const peerId = getOrCreatePeerId();

    // Initialize WebRTC provider with persistence
    this.webrtcProvider = new WebRTCProvider(this.yDoc, {
      roomName: this.roomManager.getRoomName(),
      peerId, // Pass persistent peer ID
    });

    // Initialize local player deck - restore from localStorage if available for this room
    const restoredDeck = DeckPersistenceService.restoreDeckForRoom(this.roomManager.getRoomName());
    const localDeck = restoredDeck ?? new Deck({
      initialCardCount: 60,
    });

    // Initialize local player
    this.localPlayer = new Player(this.playerId, this.yDoc, localDeck, {
      initialHealth: 40,
    });

    // Initialize turn manager
    this.turnManager = new TurnManager(this.yDoc);
    
    // Initialize player order (will set first player as active if none exists)
    // This ensures turn system is ready from the start
    setTimeout(() => {
      this.turnManager.initializePlayerOrder();
    }, 100); // Small delay to ensure all players have joined

    // Create shared card preview instance (used by both Whiteboard and GameResourcesDock)
    this.cardPreview = new CardPreview();

    // Initialize multi-player board manager
    const whiteboardContainer = document.getElementById('whiteboard');
    if (!whiteboardContainer) {
      throw new Error('Whiteboard container not found');
    }

    this.whiteboard = new MultiPlayerBoardManager(
      whiteboardContainer,
      this.yDoc,
      this.playerId,
      '#1a1a1a', // backgroundColor
      this.cardPreview
    );

    // Initialize local player's resource dock
    const dockContainer = document.getElementById('local-dock');
    if (!dockContainer) {
      throw new Error('Local dock container not found');
    }

    this.localDock = new GameResourcesDock(dockContainer, this.localPlayer, {
      position: 'bottom',
      playerId: this.playerId,
    }, this.cardPreview);

    // Initialize opponent health display with React
    const opponentHealthContainer = document.getElementById('opponent-health-container');
    if (!opponentHealthContainer) {
      throw new Error('Opponent health container not found');
    }

    this.opponentHealthRoot = createRoot(opponentHealthContainer);
    this.opponentHealthRoot.render(
      React.createElement(OpponentHealthList, {
        yDoc: this.yDoc,
        localPlayerId: this.playerId,
      })
    );

    // Initialize Scryfall API service
    this.scryfallApiService = new ScryfallApiService();

    // Initialize token service with zoom level provider
    this.tokenService = new TokenService(
      () => this.whiteboard.getZoomLevel(), // Inject zoom level getter
      this.scryfallApiService,
    );

    this.setupEventListeners();
    this.setupConnectionStatus();
    this.setupKeyboardCallbacks();
    this.setupDeckManager();
    this.setupHelpModal();
    this.setupHotkeyHintsModal();
    this.setupAddCardModal();
    this.setupTurnSystem();
    this.setupTurnStateObserver();
  }

  private setupKeyboardCallbacks(): void {
    const callbacks: KeyboardHandlerCallbacks = {
      onMoveToHand: (card) => {
        // Remove WhiteboardCard-specific properties
        const { zIndex, ownerId, ...baseCard } = card as any;
        const cardOwnerId = (card as any).ownerId;
        
        // Add to the card owner's hand
        const yOwnerState = this.yDoc.getMap(`player-${cardOwnerId}`);
        const hand = (yOwnerState.get('hand') as any[]) ?? [];
        yOwnerState.set('hand', [...hand, baseCard]);
      },
      onMoveToDeckTop: (card) => {
        // Remove WhiteboardCard-specific properties
        const { zIndex, ownerId, ...baseCard } = card as any;
        const cardOwnerId = (card as any).ownerId;
        
        // Only move to deck if it's the local player's card (deck is local-only)
        if (cardOwnerId === this.playerId) {
          this.localPlayer.moveCardToDeckTop(baseCard);
          DeckPersistenceService.saveDeckForRoom(this.roomManager.getRoomName(), this.localPlayer.getDeck());
        } else {
          // For opponent cards, move to exile instead (deck is local-only)
          const yOwnerState = this.yDoc.getMap(`player-${cardOwnerId}`);
          const exilePile = (yOwnerState.get('exilePile') as any[]) ?? [];
          yOwnerState.set('exilePile', [...exilePile, baseCard]);
        }
      },
      onMoveToDeckBottom: (card) => {
        // Remove WhiteboardCard-specific properties
        const { zIndex, ownerId, ...baseCard } = card as any;
        const cardOwnerId = (card as any).ownerId;
        
        // Only move to deck if it's the local player's card (deck is local-only)
        if (cardOwnerId === this.playerId) {
          this.localPlayer.moveCardToDeckBottom(baseCard);
          DeckPersistenceService.saveDeckForRoom(this.roomManager.getRoomName(), this.localPlayer.getDeck());
        } else {
          // For opponent cards, move to exile instead (deck is local-only)
          const yOwnerState = this.yDoc.getMap(`player-${cardOwnerId}`);
          const exilePile = (yOwnerState.get('exilePile') as any[]) ?? [];
          yOwnerState.set('exilePile', [...exilePile, baseCard]);
        }
      },
      onMoveToGraveyard: (card) => {
        // Remove WhiteboardCard-specific properties
        const { zIndex, ownerId, ...baseCard } = card as any;
        const cardOwnerId = (card as any).ownerId;
        
        // Add to the card owner's discard pile
        const yOwnerState = this.yDoc.getMap(`player-${cardOwnerId}`);
        const discardPile = (yOwnerState.get('discardPile') as any[]) ?? [];
        yOwnerState.set('discardPile', [...discardPile, baseCard]);
      },
      onMoveToExile: (card) => {
        // Remove WhiteboardCard-specific properties
        const { zIndex, ownerId, ...baseCard } = card as any;
        const cardOwnerId = (card as any).ownerId;
        
        // Add to the card owner's exile pile
        const yOwnerState = this.yDoc.getMap(`player-${cardOwnerId}`);
        const exilePile = (yOwnerState.get('exilePile') as any[]) ?? [];
        yOwnerState.set('exilePile', [...exilePile, baseCard]);
      },
      onDrawCard: () => {
        this.localPlayer.drawCard();
        DeckPersistenceService.saveDeckForRoom(this.roomManager.getRoomName(), this.localPlayer.getDeck());
      },
      onShuffleDeck: () => {
        this.localPlayer.shuffleDeck();
        DeckPersistenceService.saveDeckForRoom(this.roomManager.getRoomName(), this.localPlayer.getDeck());
      },
      onUntapAll: () => {
        console.log('Untapping all cards');
      },
      onEndTurn: () => {
        console.log('End turn - not yet implemented');
      },
      onHideCardPreview: () => {
        // Handled by Whiteboard internally
      },
      onMulligan: () => {
        const confirmed = window.confirm(
          "Mulligan? Draws 7 new cards."
        );
        if (confirmed) {
          this.localPlayer.mulligan(7);
          DeckPersistenceService.saveDeckForRoom(this.roomManager.getRoomName(), this.localPlayer.getDeck());
        }
      },
      loseHealth: () => {
        this.localPlayer.modifyHealth(-1);
      },
      gainHealth: () => {
        this.localPlayer.modifyHealth(1);
      },
    };

    this.whiteboard.setKeyboardCallbacks(callbacks);
  }

  private setupEventListeners(): void {
    // Initialize event handlers for whiteboard interactions
    this.eventHandlers = new WhiteboardEventHandlers(
      this.yDoc,
      this.localPlayer,
      this.whiteboard,
      this.tokenService,
      this.playerId,
      () => DeckPersistenceService.saveDeckForRoom(this.roomManager.getRoomName(), this.localPlayer.getDeck()),
      this.turnManager
    );
    this.eventHandlers.setupEventListeners();

    // Listen for playCard events (from dock/piles) and check turn/priority
    window.addEventListener('playCard', ((event: CustomEvent) => {
      const { card, playerId } = event.detail;
      
      // Check if player can move cards from dock to battlefield
      if (!this.turnManager.canMoveFromDockToBattlefield(playerId)) {
        console.warn('Cannot play card: not active player and no priority');
        alert('You must be the active player or have priority to play cards from your dock to the battlefield.');
        return;
      }

      // Set default position if not set (center of screen)
      if (card.x === undefined || card.y === undefined) {
        const CARD_WIDTH = 63;
        const CARD_HEIGHT = 88;
        const BOARD_WIDTH = 16 * CARD_WIDTH;
        const BOARD_HEIGHT = 6.5 * CARD_HEIGHT;
        const DOCK_HEIGHT = 160;
        const boardLeft = (window.innerWidth - BOARD_WIDTH) / 2;
        const boardTop = window.innerHeight - BOARD_HEIGHT - DOCK_HEIGHT;
        
        card.x = BOARD_WIDTH / 2;
        card.y = BOARD_HEIGHT / 2;
      }

      // Add card to battlefield
      this.whiteboard.addCard(card, playerId);

      // Search for and create any tokens related to card
      if (card.scryfallId) {
        this.tokenService.createTokensForCard(
          card.scryfallId,
          { x: card.x, y: card.y }
        ).then(result => {
          result.tokens.forEach(token => {
            this.whiteboard.addCard(token, playerId);
          });
          if (result.errors.length > 0) {
            console.warn(`Token creation errors for ${card.name}:`, result.errors);
          }
        });
      }
    }) as EventListener);
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

  private async setupDeckManager(): Promise<void> {
    const deckManagerRoot = document.getElementById('deck-manager-root');
    if (!deckManagerRoot) {
      throw new Error('Deck manager root not found');
    }

    const storage = new DeckStorageService();

    // Check if this is the user's first-ever load
    const FIRST_LOAD_KEY = 'aura-first-load-completed';
    const hasLoadedBefore = localStorage.getItem(FIRST_LOAD_KEY);

    if (!hasLoadedBefore) {
      // First load ever - add default deck if no decks exist
      const deckCount = await storage.getDeckCount();

      if (deckCount === 0) {
        await storage.saveDeck(DEFAULT_DECK);
        console.log('Default deck added on first load');
      }

      // Mark that first load is complete
      localStorage.setItem(FIRST_LOAD_KEY, 'true');
    }

    await this.loadDeckOnStart(storage);

    const root = createRoot(deckManagerRoot);
    root.render(
      React.createElement(DeckManager, {
        onDeckSelected: (deck: SavedDeck) => this.loadDeck(deck),
      })
    );

    // Setup welcome modal
    const welcomeModalRoot = document.createElement('div');
    welcomeModalRoot.id = 'welcome-modal-root';
    document.body.appendChild(welcomeModalRoot);
    const welcomeRoot = createRoot(welcomeModalRoot);
    welcomeRoot.render(React.createElement(WelcomeModal));

    // Setup patch notes modal (shows after welcome modal if there are new notes)
    this.setupPatchNotesModal();
  }

  private async loadDeckOnStart(storage: DeckStorageService) {
    // Only auto-load deck when entering a NEW room, not when reconnecting
    const isRecentRoom = this.roomManager.isRecentRoom();

    if (isRecentRoom) {
      console.log('Reconnecting to recent room - skipping auto-load to preserve game state');
      return;
    }

    // Mark this room as visited
    this.roomManager.markRoomAsVisited();
    console.log('New room detected - will auto-load deck');

    // Auto-load the first available deck on entering a new room
    const LAST_LOADED_DECK_KEY = 'aura-last-loaded-deck';
    const lastLoadedDeckId = localStorage.getItem(LAST_LOADED_DECK_KEY);

    try {
      let deckToLoad: SavedDeck | null = null;

      // Try to load the last loaded deck
      if (lastLoadedDeckId) {
        deckToLoad = await storage.getDeck(lastLoadedDeckId);
      }

      // If no last loaded deck or it doesn't exist anymore, get the first available deck
      if (!deckToLoad) {
        const allDecks = await storage.getAllDecks();
        if (allDecks.length > 0) {
          // Sort by last modified (most recent first) and take the first one
          allDecks.sort((a, b) =>
            new Date(b.metadata.lastModified).getTime() - new Date(a.metadata.lastModified).getTime()
          );
          deckToLoad = allDecks[0];
        }
      }

      // Load the deck if found
      if (deckToLoad) {
        this.loadDeck(deckToLoad);
        localStorage.setItem(LAST_LOADED_DECK_KEY, deckToLoad.metadata.id);
        console.log(`Auto-loaded deck "${deckToLoad.metadata.name}" for new room`);
      }
    } catch (error) {
      console.error('Error auto-loading deck:', error);
      // Continue without loading a deck - user can manually select one
    }
  }

  private loadDeck(savedDeck: SavedDeck): void {
    console.log(`Loading deck: ${savedDeck.metadata.name} (${savedDeck.cards.length} cards)`);

    // Reset player state: move all cards back to deck, clear piles, reset health
    this.localPlayer.reset();

    // Create a new deck with the imported cards
    const newDeck = new Deck({
      initialCardCount: savedDeck.cards.length,
    }, savedDeck.cards);

    // Update the player's deck
    this.localPlayer.loadNewDeck(newDeck).then(() => {
      // Update deck count in Yjs state
      this.localPlayer['yPlayerState'].set('deckCardCount', newDeck.getCardCount());

      // Save this as the last loaded deck for auto-loading on next visit
      localStorage.setItem('aura-last-loaded-deck', savedDeck.metadata.id);

      // Save the deck state for this room so it persists on refresh
      DeckPersistenceService.saveDeckForRoom(this.roomManager.getRoomName(), newDeck);

      console.log(`Deck "${savedDeck.metadata.name}" loaded successfully!`);
    });
  }

  private setupHelpModal(): void {
    const helpRoot = document.getElementById('help-root');
    if (!helpRoot) {
      throw new Error('Help root not found');
    }

    // Create a simple component that manages the button and modal state
    const HelpButton: React.FC = () => {
      const [isOpen, setIsOpen] = React.useState(false);

      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          'button',
          {
            className: 'toolbar-button',
            onClick: () => setIsOpen(true),
          },
          'Help'
        ),
        React.createElement(HelpModal, {
          isOpen,
          onClose: () => setIsOpen(false),
        })
      );
    };

    const root = createRoot(helpRoot);
    root.render(React.createElement(HelpButton));
  }

  private setupHotkeyHintsModal(): void {
    const hotkeysRoot = document.getElementById('hotkeys-root');
    if (!hotkeysRoot) {
      throw new Error('Hotkeys root not found');
    }

    // Create a simple component that manages the button and modal state
    const HotkeysButton: React.FC = () => {
      const [isOpen, setIsOpen] = React.useState(false);

      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          'button',
          {
            className: 'toolbar-button',
            onClick: () => setIsOpen(true),
          },
          'Hotkeys'
        ),
        React.createElement(HotkeysModal, {
          isOpen,
          onClose: () => setIsOpen(false),
        })
      );
    };

    const root = createRoot(hotkeysRoot);
    root.render(React.createElement(HotkeysButton));
  }

  private setupAddCardModal(): void {
    const addCardModalRoot = document.createElement('div');
    addCardModalRoot.id = 'add-card-modal-root';
    document.body.appendChild(addCardModalRoot);

    const root = createRoot(addCardModalRoot);
    root.render(
      React.createElement(AddCardManager, {
        scryfallApiService: this.scryfallApiService,
        onAddCard: (card) => this.localPlayer.putCardInHand(card),
      })
    );
  }

  private setupPatchNotesModal(): void {
    // Only show patch notes if there are new updates
    if (!PatchNotesService.shouldShowPatchNotes()) {
      console.log('No new patch notes to show');
      return;
    }

    const patchNotesModalRoot = document.createElement('div');
    patchNotesModalRoot.id = 'patch-notes-modal-root';
    document.body.appendChild(patchNotesModalRoot);

    // Create a component that auto-opens on mount
    const PatchNotesContainer: React.FC = () => {
      const [isOpen, setIsOpen] = React.useState(true);

      const handleClose = () => {
        setIsOpen(false);
        // Mark patch notes as seen when user closes the modal
        PatchNotesService.markPatchNotesAsSeen();
      };

      return React.createElement(PatchNotesModal, {
        isOpen,
        onClose: handleClose,
      });
    };

    const root = createRoot(patchNotesModalRoot);
    root.render(React.createElement(PatchNotesContainer));
  }

  private setupTurnSystem(): void {
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

  private setupTurnStateObserver(): void {
    // Observe turn state changes to handle turn start logic
    let previousActivePlayerId: string | null = null;
    
    // Initialize with current active player if one exists
    const initialState = this.turnManager.getTurnState();
    if (initialState.activePlayerId) {
      previousActivePlayerId = initialState.activePlayerId;
    }

    this.turnManager.onTurnStateChange((state) => {
      // Check if active player changed (turn started)
      if (state.activePlayerId && state.activePlayerId !== previousActivePlayerId) {
        this.handleTurnStart(state.activePlayerId);
        previousActivePlayerId = state.activePlayerId;
      }
    });
  }

  private handleTurnStart(activePlayerId: string): void {
    const yCards = this.yDoc.getMap('cards');

    // Untap all cards for the active player
    this.turnManager.untapAllCardsForPlayer(activePlayerId, yCards);

    // Draw a card for the active player (if it's the local player)
    if (activePlayerId === this.playerId) {
      this.localPlayer.drawCard();
      DeckPersistenceService.saveDeckForRoom(this.roomManager.getRoomName(), this.localPlayer.getDeck());
    }
  }

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

  private handleTakePriority(): void {
    this.turnManager.takePriority(this.playerId);
  }

  private handleEndPriority(): void {
    this.turnManager.endPriority(this.playerId);
  }

  public destroy(): void {
    this.whiteboard.destroy();
    this.localDock.destroy();
    if (this.opponentHealthRoot) {
      this.opponentHealthRoot.unmount();
    }
    if (this.turnSystemRoot) {
      this.turnSystemRoot.unmount();
    }
    this.webrtcProvider.destroy();
    this.cardPreview.destroy();
  }
}

// Initialize the app
const app = new AuraApp();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  app.destroy();
});