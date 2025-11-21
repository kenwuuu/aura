import * as Y from 'yjs';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Deck } from './modules/deck';
import { MultiPlayerBoardManager, KeyboardHandlerCallbacks } from './modules/whiteboard';
import { WebRTCProvider } from './modules/webrtc';
import { getOrCreatePlayerId, getOrCreatePeerId } from './modules/webrtc/persistence';
import { Player } from './modules/player';
import { GameResourcesDock } from './modules/gameResourcesDock';
import { WelcomeModal, HotkeysModal, HelpModal, AddCardManager, PatchNotesModal } from './components';
import { DeckManager } from './deck_manager';
import { OpponentHealthList } from './components/health/OpponentHealthList';
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
import {YSTATE_DECK_CARD_COUNT} from "./constants";
import {ReactToasterRoot} from "../ReactToasterRoot";

Sentry.init({
  environment: process.env.NODE_ENV || "development",
  dsn: "https://beb5f109e66475063b4650877bc1c6a1@o4510353682006016.ingest.de.sentry.io/4510353685610576",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    })
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

const baseUrl = "https://aura-dqp.pages.dev/?room=";

class AuraApp {
  private yDoc: Y.Doc;
  private webrtcProvider!: WebRTCProvider;
  private whiteboard!: MultiPlayerBoardManager;
  private localPlayer!: Player;
  private localDock!: GameResourcesDock;
  private opponentHealthRoot: Root | null = null;
  private tokenService!: TokenService;
  private cardPreview!: CardPreview;
  private playerId: string;
  private scryfallApiService!: ScryfallApiService;
  private roomManager: RoomManager;
  private eventHandlers: WhiteboardEventHandlers | null = null;

  constructor() {
    this.yDoc = new Y.Doc();

    // Get or create persistent player ID (survives page reloads)
    this.playerId = getOrCreatePlayerId();
    console.log('Player ID:', this.playerId);

    // Initialize room manager (handles room ID and URL)
    this.roomManager = new RoomManager();
  }

  async initialize() {
    // Get or create persistent peer ID for WebRTC
    const peerId = getOrCreatePeerId();

    // Initialize WebRTC provider with CloudFlare TURN servers
    this.webrtcProvider = await WebRTCProvider.create(this.yDoc, {
      roomName: this.roomManager.getRoomName(),
      peerId, // Pass persistent peer ID
    });

    // Initialize local player deck - restore from localStorage if available for this room
    const restoredDeck = DeckPersistenceService.restoreDeckForRoom(this.roomManager.getRoomName());
    const localDeck = restoredDeck ?? new Deck();

    // Initialize local player
    this.localPlayer = new Player(this.playerId, this.yDoc, localDeck, {
      initialHealth: 40,
    });

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
    }, this.cardPreview, this.whiteboard.getTooltipManager());

    // init toaster for alerts like "Opponent revealed deck"
    const toasterContainer = document.getElementById("toaster-root");
    if (toasterContainer) {
      const toasterRoot = createRoot(toasterContainer);
      toasterRoot.render(
        React.createElement(ReactToasterRoot)
      );
    }

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
    this.setupDiscordButton();
    this.setupHotkeyHintsModal();
    this.setupAddCardModal();
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
        DeckPersistenceService.saveDeckForRoom(this.roomManager.getRoomName(), this.localPlayer.getDeck());
      },
      onMoveToDeckBottom: (card) => {
        this.localPlayer.moveCardToDeckBottom(card);
        DeckPersistenceService.saveDeckForRoom(this.roomManager.getRoomName(), this.localPlayer.getDeck());
      },
      onMoveToGraveyard: (card) => {
        this.localPlayer.placeCardInPile(card, 'discard');
      },
      onMoveToExile: (card) => {
        this.localPlayer.placeCardInPile(card, 'exile');
      },
      onDeleteCard: (_card) => {
        // Card deletion is handled directly in KeyboardHandler via removeCard
        // This callback exists for potential future use
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
      onHideCardTooltip: () => {
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
      () => DeckPersistenceService.saveDeckForRoom(this.roomManager.getRoomName(), this.localPlayer.getDeck())
    );
    this.eventHandlers.setupEventListeners();
  }

  private setupConnectionStatus(): void {
    const statusElement = document.getElementById("connection-status");
    const roomElement = document.getElementById("room-name");
    const copySVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M9.116 17q-.691 0-1.153-.462T7.5 15.385V4.615q0-.69.463-1.153T9.116 3h7.769q.69 0 1.153.462t.462 1.153v10.77q0 .69-.462 1.152T16.884 17zm0-1h7.769q.23 0 .423-.192t.192-.423V4.615q0-.23-.192-.423T16.884 4H9.116q-.231 0-.424.192t-.192.423v10.77q0 .23.192.423t.423.192m-3 4q-.69 0-1.153-.462T4.5 18.385V6.615h1v11.77q0 .23.192.423t.423.192h8.77v1zM8.5 16V4z"/></svg>`;
    const checkSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m10.562 15.908l6.396-6.396l-.708-.708l-5.688 5.688l-2.85-2.85l-.708.708zM12.003 21q-1.866 0-3.51-.708q-1.643-.709-2.859-1.924t-1.925-2.856T3 12.003t.709-3.51Q4.417 6.85 5.63 5.634t2.857-1.925T11.997 3t3.51.709q1.643.708 2.859 1.922t1.925 2.857t.709 3.509t-.708 3.51t-1.924 2.859t-2.856 1.925t-3.509.709M12 20q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>`;

    if (roomElement) {
      roomElement.innerHTML = `COPY GAME LINK ${copySVG}`;
      roomElement.addEventListener("click", (event) => {
        event.preventDefault();
        navigator.clipboard
          .writeText(baseUrl + this.webrtcProvider.getRoomName())
          .then(() => {
            roomElement.innerHTML = `COPIED! ${checkSVG}`;
            roomElement.style.color = '#4ade80';
            setTimeout(() => {
              roomElement.innerHTML = `COPY GAME LINK ${copySVG}`;
              roomElement.style.color = '#b1b5c5';
            }, 2000);
          });
      });
    }

    this.webrtcProvider.onStatusChange((status) => {
      if (statusElement) {
        if (status.isConnected) {
          statusElement.textContent = `Connected (${status.peersCount} player${status.peersCount !== 1 ? 's' : ''})`;
          statusElement.style.color = '#4ade80';
        } else {
          statusElement.textContent = 'Waiting for players...';
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
    const newDeck = new Deck(savedDeck.cards);

    // Update the player state with deck
    this.localPlayer.loadNewDeck(newDeck).then(() => {
      // Update deck count in Yjs state
      this.localPlayer['yPlayerState'].set(YSTATE_DECK_CARD_COUNT, newDeck.getCardCount());

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

  private setupDiscordButton(): void {
    const discordRoot = document.getElementById('discord-root');
    if (!discordRoot) {
      throw new Error('Discord root not found');
    }

    const DiscordButton: React.FC = () => {
      return React.createElement(
        'button',
        {
          className: 'toolbar-button discord',
          onClick: () => window.open('https://discord.gg/PgH2gVZYKq', '_blank'),
          'aria-label': 'Join Discord Server',
        },
        React.createElement('img', {
          src: '/assets/Discord-Logo-White.svg',
          alt: 'Discord',
          style: { height: '16px' },
        })
      );
    };

    const root = createRoot(discordRoot);
    root.render(React.createElement(DiscordButton));
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
        onAddCard: (card) => this.localPlayer.placeCardInPile(card, 'hand'),
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

  public destroy(): void {
    this.whiteboard.destroy();
    this.localDock.destroy();
    if (this.opponentHealthRoot) {
      this.opponentHealthRoot.unmount();
    }
    this.webrtcProvider.destroy();
    this.cardPreview.destroy();
  }
}

// Initialize the app
const app = new AuraApp();
app.initialize().catch(error => {
  console.error('Failed to initialize app:', error);
  Sentry.captureException(error);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  app.destroy();
});