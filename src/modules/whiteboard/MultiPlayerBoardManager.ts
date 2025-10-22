import { Card } from '../deck';
import { CARD_HEIGHT, CARD_WIDTH } from '../../constants';
import { WhiteboardCard, DragState } from './types';
import { KeyboardHandler, KeyboardHandlerCallbacks } from './KeyboardHandler';
import { CardPreview } from '../cardPreview';
import * as Y from 'yjs';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Counter } from '../../components';

// Board Layout Constants
const BOARD_WIDTH_IN_CARDS = 16;
const BOARD_HEIGHT_IN_CARDS = 6.5;
const DOCK_HEIGHT = 160; // Height of bottom UI dock

const BOARD_WIDTH = BOARD_WIDTH_IN_CARDS * CARD_WIDTH;
const BOARD_HEIGHT = BOARD_HEIGHT_IN_CARDS * CARD_HEIGHT;

const DEFAULT_OPPONENT_OPACITY = 0.25;
const FOCUSED_OPACITY = 1.0;

interface BoardDimensions {
  width: number;
  height: number;
}

export class MultiPlayerBoardManager {
  private mainContainer: HTMLElement;
  private playerContainers: Map<string, HTMLElement> = new Map();
  private cards: Map<string, WhiteboardCard> = new Map();
  private dragState: DragState = { cardId: null, offsetX: 0, offsetY: 0 };
  private yCards: Y.Map<WhiteboardCard>;
  private yDoc: Y.Doc;
  private maxZIndex: number = 0;
  private keyboardHandler: KeyboardHandler;
  private keyboardCallbacks?: KeyboardHandlerCallbacks;
  private zoomLevel: number = 1;
  private zoomControls?: HTMLElement;
  private cardPreview: CardPreview;
  private localPlayerId: string;
  private backgroundColor: string;

  // Opponent opacity state management
  private pinnedOpponentId: string | null = null;
  private hoveredOpponentId: string | null = null;
  private opponentCount: number = 0;

  // Configuration for overlay vs underlay (easy to debug/change)
  private useOverlay: boolean = true; // true = overlay, false = underlay

  constructor(
    container: HTMLElement,
    yDoc: Y.Doc,
    localPlayerId: string,
    backgroundColor: string,
    cardPreview: CardPreview
  ) {
    this.mainContainer = container;
    this.yDoc = yDoc;
    this.localPlayerId = localPlayerId;
    this.backgroundColor = backgroundColor;
    this.cardPreview = cardPreview;

    this.yCards = yDoc.getMap('cards');
    this.zoomLevel = parseFloat(localStorage.getItem('whiteboard-zoom') || '1');

    this.setupMainContainer();
    this.setupZoomControls();
    this.setupYjsSync();
    this.attachEventListeners();
    this.setupOpponentHoverListener();

    // Initialize keyboard handler with empty callbacks (will be set by app)
    this.keyboardHandler = new KeyboardHandler(
      this.yCards,
      {
        onMoveToHand: () => {},
        onMoveToDeckTop: () => {},
        onMoveToDeckBottom: () => {},
        onMoveToGraveyard: () => {},
        onMoveToExile: () => {},
        onDrawCard: () => {},
        onShuffleDeck: () => {},
        onUntapAll: () => {},
        onEndTurn: () => {},
        onHideCardPreview: () => this.cardPreview.hide(),
        onMulligan: () => {},
        loseHealth: () => {},
        gainHealth: () => {},
      },
      this.localPlayerId
    );

    // Create initial container for local player
    this.createPlayerContainer(this.localPlayerId, true);
  }

  public setKeyboardCallbacks(callbacks: KeyboardHandlerCallbacks): void {
    this.keyboardCallbacks = callbacks;
    // Clean up old keyboard handler before creating new one
    this.keyboardHandler.destroy();
    this.keyboardHandler = new KeyboardHandler(
      this.yCards,
      {
        ...callbacks,
        onHideCardPreview: () => this.cardPreview.hide(),
      },
      this.localPlayerId
    );
  }

  private setupMainContainer(): void {
    this.mainContainer.style.backgroundColor = this.backgroundColor;
    this.mainContainer.style.width = `${window.innerWidth}px`;
    this.mainContainer.style.height = `${window.innerHeight}px`;
    this.mainContainer.style.position = 'relative';
    this.mainContainer.style.overflow = 'hidden';
  }

  /**
   * Creates a board container for a player
   * All boards are positioned at the same screen location for overlay effect
   */
  private createPlayerContainer(playerId: string, isLocal: boolean): HTMLElement {
    // Check if container already exists
    if (this.playerContainers.has(playerId)) {
      return this.playerContainers.get(playerId)!;
    }

    const container = document.createElement('div');
    container.className = isLocal ? 'player-board player-board-local' : 'player-board player-board-opponent';
    container.dataset.playerId = playerId;
    container.style.position = 'absolute';
    container.style.width = `${BOARD_WIDTH}px`;
    container.style.height = `${BOARD_HEIGHT}px`;
    // Opponent containers: pointer-events none on container, but will enable on cards
    // Local container: pointer-events auto for full interaction
    container.style.pointerEvents = isLocal ? 'auto' : 'none';
    container.style.transition = 'opacity 0.3s ease';

    // Calculate centered position (same for all boards)
    const left = (window.innerWidth - BOARD_WIDTH) / 2;
    const top = window.innerHeight - BOARD_HEIGHT - DOCK_HEIGHT;

    container.style.left = `${left}px`;
    container.style.top = `${top}px`;

    if (isLocal) {
      // Local player: full opacity, normal z-index
      container.style.opacity = FOCUSED_OPACITY.toString();
      container.style.zIndex = '10';
    } else {
      // Opponent: low opacity by default
      container.style.opacity = DEFAULT_OPPONENT_OPACITY.toString();

      // Set z-index based on overlay/underlay preference
      container.style.zIndex = this.useOverlay ? '15' : '5';
    }

    this.mainContainer.appendChild(container);
    this.playerContainers.set(playerId, container);

    console.log(`Created ${isLocal ? 'local' : 'opponent'} player container for ${playerId}`);
    return container;
  }

  private setupYjsSync(): void {
    // Observe changes from other clients
    this.yCards.observe((event) => {
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add' || change.action === 'update') {
          const card = this.yCards.get(key);
          if (card) {
            // Update maxZIndex if this card has a higher zIndex
            if (card.zIndex > this.maxZIndex) {
              this.maxZIndex = card.zIndex;
            }

            // Ensure player container exists
            this.ensurePlayerContainer(card.ownerId);

            this.updateCardElement(card);
          }
        } else if (change.action === 'delete') {
          this.removeCardElement(key);
        }
      });
    });

    // Load existing cards and find max zIndex
    this.yCards.forEach((card) => {
      if (card.zIndex > this.maxZIndex) {
        this.maxZIndex = card.zIndex;
      }

      // Ensure player container exists
      this.ensurePlayerContainer(card.ownerId);

      this.updateCardElement(card);
    });

    // Monitor for new players joining
    this.monitorPlayers();
  }

  private monitorPlayers(): void {
    const checkForNewPlayers = () => {
      this.yDoc.share.forEach((value, key) => {
        if (key.startsWith('player-') && key !== `player-${this.localPlayerId}`) {
          const playerId = key.replace('player-', '');
          if (!this.playerContainers.has(playerId)) {
            console.log('New opponent detected:', playerId);
            this.createPlayerContainer(playerId, false);
          }
        }
      });
    };

    // Check initially
    checkForNewPlayers();

    // Check periodically for new players
    setInterval(checkForNewPlayers, 1000);
  }

  private ensurePlayerContainer(playerId: string): void {
    if (!this.playerContainers.has(playerId)) {
      const isLocal = playerId === this.localPlayerId;
      this.createPlayerContainer(playerId, isLocal);
    }
  }

  private setupOpponentHoverListener(): void {
    // Listen for hover events from HealthDisplay components
    window.addEventListener('opponentBoardHover', ((event: CustomEvent) => {
      const { playerId, isHovered } = event.detail;

      if (isHovered) {
        this.hoveredOpponentId = playerId;
      } else {
        // Only clear if this was the hovered opponent
        if (this.hoveredOpponentId === playerId) {
          this.hoveredOpponentId = null;
        }
      }

      this.updateOpponentOpacity();
    }) as EventListener);

    // Listen for pin/click events from HealthDisplay components
    window.addEventListener('opponentBoardPin', ((event: CustomEvent) => {
      const { playerId } = event.detail;

      // Toggle pin: if already pinned, unpin; otherwise pin this opponent
      if (this.pinnedOpponentId === playerId) {
        this.pinnedOpponentId = null;
      } else {
        this.pinnedOpponentId = playerId;
      }

      this.updateOpponentOpacity();
    }) as EventListener);

    // Listen for opponent count changes from OpponentHealthList
    window.addEventListener('opponentCountChanged', ((event: CustomEvent) => {
      const { opponentCount } = event.detail;
      this.opponentCount = opponentCount;
      this.updateOpponentOpacity();
    }) as EventListener);
  }

  /**
   * Update opacity for all opponent boards based on current state
   * Priority: hover > pinned > single opponent default > all dimmed
   */
  private updateOpponentOpacity(): void {
    // Determine which opponent should be shown with full opacity
    let opaqueOpponentId: string | null = null;

    // Priority 1: Hovering someone gets temporary opacity
    if (this.hoveredOpponentId) {
      opaqueOpponentId = this.hoveredOpponentId;
    }
    // Priority 2: Pinned opponent stays opaque
    else if (this.pinnedOpponentId) {
      opaqueOpponentId = this.pinnedOpponentId;
    }
    // Priority 3: If there's only one opponent, show them by default
    else if (this.opponentCount === 1) {
      // Find the single opponent ID
      for (const [playerId] of this.playerContainers) {
        if (playerId !== this.localPlayerId) {
          opaqueOpponentId = playerId;
          break;
        }
      }
    }

    // Apply opacity to all opponent containers
    this.playerContainers.forEach((container, playerId) => {
      if (playerId === this.localPlayerId) {
        // Local player always at full opacity
        container.style.opacity = FOCUSED_OPACITY.toString();
      } else {
        // Opponent opacity based on whether they should be visible
        if (playerId === opaqueOpponentId) {
          container.style.opacity = FOCUSED_OPACITY.toString();
        } else {
          container.style.opacity = DEFAULT_OPPONENT_OPACITY.toString();
        }
      }
    });
  }

  public addCard(card: Card, ownerId: string): void {
    const whiteboardCard: WhiteboardCard = {
      ...card,
      zIndex: ++this.maxZIndex,
      ownerId,
    };

    this.yCards.set(card.id, whiteboardCard);
  }

  /**
   * Transform opponent coordinates for local rendering
   *
   * IMPORTANT: This only affects how WE see opponent cards on OUR screen.
   * The coordinates in Yjs are world coordinates and never change.
   *
   * Local player cards: No transformation (render as-is)
   * Opponent cards: Vertical flip (so their bottom becomes our top)
   */
  private transformCoordinatesForOpponent(card: WhiteboardCard): { x: number; y: number } {
    if (card.ownerId === this.localPlayerId) {
      // Our own cards: render at exact Yjs coordinates
      return { x: card.x, y: card.y };
    } else {
      // Opponent cards: flip Y coordinate so their board appears inverted
      // When opponent places at Y=0 (their top), it appears at bottom of our view
      // When opponent places at Y=max (their bottom), it appears at top of our view
      return {
        x: card.x,
        y: BOARD_HEIGHT - card.y - (CARD_HEIGHT * this.zoomLevel) - 300
      };
    }
  }

  private updateCardElement(card: WhiteboardCard): void {
    this.cards.set(card.id, card);

    const container = this.playerContainers.get(card.ownerId);
    if (!container) {
      console.warn(`No container found for player ${card.ownerId}`);
      return;
    }

    let cardElement = container.querySelector(
      `[data-card-id="${card.id}"]`
    ) as HTMLElement;

    if (!cardElement) {
      cardElement = this.createCardElement(card);
      container.appendChild(cardElement);
    } else {
      // Update existing card (for counters, flip state, etc.)
      cardElement.style.backgroundColor = card.isFlipped ? '#4a4a4a' : '#2d2d2d';

      // Update counters
      const existingCounters = cardElement.querySelector('.card-counters');
      if (existingCounters) {
        existingCounters.remove();
      }

      if (card.counters && card.counters.length > 0) {
        const countersContainer = document.createElement('div');
        countersContainer.className = 'card-counters';
        card.counters.forEach((counterValue, index) => {
          const counter = this.createCounterElement(card, index, counterValue);
          countersContainer.appendChild(counter);
        });
        cardElement.appendChild(countersContainer);
      }
    }

    this.updateCardPosition(cardElement, card);
  }

  private createCardElement(card: WhiteboardCard): HTMLElement {
    const width = CARD_WIDTH * this.zoomLevel;
    const height = CARD_HEIGHT * this.zoomLevel;

    const cardElement = document.createElement('div');
    cardElement.dataset.cardId = card.id;
    cardElement.className = 'card';
    cardElement.style.position = 'absolute';
    cardElement.style.width = `${width}px`;
    cardElement.style.height = `${height}px`;
    cardElement.style.cursor = 'grab';
    cardElement.style.userSelect = 'none';
    cardElement.style.overflow = 'hidden';
    cardElement.style.pointerEvents = 'auto';  // Enable pointer events so opponents can hover cards

    // Check if card has image and is not flipped
    if (card.images?.front?.normal && !card.isFlipped) {
      cardElement.style.border = '2px solid #4a4a4a';
      cardElement.style.borderRadius = '8px';
      cardElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';

      const img = document.createElement('img');
      img.src = card.images.front.normal;
      img.alt = card.name || `Card #${card.cardNumber}`;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.pointerEvents = 'none';  // disable events on img so cursor targets card instead of img
      cardElement.appendChild(img);

      // Add card number badge overlay on image
      const badge = document.createElement('div');
      badge.className = 'card-number-badge-battlefield';
      badge.textContent = `#${card.cardNumber}`;
      cardElement.appendChild(badge);
    } else {
      // Fallback: show colored div with card number
      cardElement.style.backgroundColor = card.isFlipped ? '#4a4a4a' : '#2d2d2d';
      cardElement.style.border = '2px solid #4a4a4a';
      cardElement.style.borderRadius = '8px';
      cardElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';

      const badge = document.createElement('div');
      badge.className = 'card-number-badge-battlefield';
      badge.textContent = `#${card.cardNumber}`;
      cardElement.appendChild(badge);
    }

    // Add counters container
    if (card.counters && card.counters.length > 0) {
      const countersContainer = document.createElement('div');
      countersContainer.className = 'card-counters';
      card.counters.forEach((counterValue, index) => {
        const counter = this.createCounterElement(card, index, counterValue);
        countersContainer.appendChild(counter);
      });
      cardElement.appendChild(countersContainer);
    }

    // Enable hover for all cards (for card preview and keyboard shortcuts)
    cardElement.addEventListener('mouseenter', (e: MouseEvent) => {
      this.keyboardHandler.setHoveredCard(card.id);
      this.cardPreview.show(card, e);
    });

    cardElement.addEventListener('mousemove', (e: MouseEvent) => {
      this.cardPreview.updatePosition(e);
    });

    cardElement.addEventListener('mouseleave', () => {
      this.keyboardHandler.setHoveredCard(null);
      this.cardPreview.hide();
    });

    cardElement.addEventListener('mousedown', (e) => this.onMouseDown(e, card.id));

    return cardElement;
  }

  private createCounterElement(
    card: WhiteboardCard,
    index: number,
    value: number
  ): HTMLElement {
    const counterContainer = document.createElement('div');

    // Render React Counter component
    const root = createRoot(counterContainer);
    root.render(
      React.createElement(Counter, {
        value,
        index,
        onIncrement: () => this.modifyCounter(card.id, index, 1),
        onDecrement: () => this.modifyCounter(card.id, index, -1),
      })
    );

    return counterContainer;
  }

  private modifyCounter(cardId: string, index: number, delta: number): void {
    // Get the latest card from Yjs to avoid stale closures
    const card = this.yCards.get(cardId);
    if (!card) return;

    const updatedCounters = [...card.counters];
    updatedCounters[index] = updatedCounters[index] + delta;

    // Remove counter if it reaches 0
    if (updatedCounters[index] === 0) {
      updatedCounters.splice(index, 1);
    }

    const updatedCard = { ...card, counters: updatedCounters };
    this.yCards.set(cardId, updatedCard);
  }

  private updateCardPosition(element: HTMLElement, card: WhiteboardCard): void {
    const { x, y } = this.transformCoordinatesForOpponent(card);
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.transform = `rotate(${card.rotation}deg) ${card.isTapped ? 'rotate(90deg)' : ''}`;
    element.style.zIndex = card.zIndex.toString();
  }

  private removeCardElement(cardId: string): void {
    const card = this.cards.get(cardId);
    if (!card) return;

    this.cards.delete(cardId);

    const container = this.playerContainers.get(card.ownerId);
    if (!container) return;

    const cardElement = container.querySelector(`[data-card-id="${cardId}"]`);
    if (cardElement) {
      cardElement.remove();
    }
  }

  private onMouseDown(e: MouseEvent, cardId: string): void {
    e.preventDefault();
    const card = this.cards.get(cardId);
    if (!card || card.ownerId !== this.localPlayerId) return;

    this.dragState = {
      cardId,
      offsetX: e.clientX - card.x,
      offsetY: e.clientY - card.y,
    };

    // Bring card to front
    const updatedCard = { ...card, zIndex: ++this.maxZIndex };
    this.yCards.set(cardId, updatedCard);

    const container = this.playerContainers.get(card.ownerId);
    if (!container) return;

    const cardElement = container.querySelector(
      `[data-card-id="${cardId}"]`
    ) as HTMLElement;
    if (cardElement) {
      cardElement.style.cursor = 'grabbing';
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.dragState.cardId) return;

    const card = this.cards.get(this.dragState.cardId);
    if (!card || card.ownerId !== this.localPlayerId) return;

    const x = e.clientX - this.dragState.offsetX;
    const y = e.clientY - this.dragState.offsetY;

    const updatedCard = { ...card, x, y };
    this.yCards.set(this.dragState.cardId, updatedCard);
  }

  private onMouseUp(): void {
    if (this.dragState.cardId) {
      const card = this.cards.get(this.dragState.cardId);
      if (card && card.ownerId === this.localPlayerId) {
        const container = this.playerContainers.get(card.ownerId);
        if (container) {
          const cardElement = container.querySelector(
            `[data-card-id="${this.dragState.cardId}"]`
          ) as HTMLElement;
          if (cardElement) {
            cardElement.style.cursor = 'grab';
          }
        }
      }
    }

    this.dragState = { cardId: null, offsetX: 0, offsetY: 0 };
  }

  private attachEventListeners(): void {
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', () => this.onMouseUp());
    window.addEventListener('resize', () => this.recenterAllBoards());
  }

  /**
   * Recenter all player board containers based on current window dimensions
   */
  private recenterAllBoards(): void {
    const left = (window.innerWidth - BOARD_WIDTH) / 2;
    const top = window.innerHeight - BOARD_HEIGHT - DOCK_HEIGHT;

    this.playerContainers.forEach((container) => {
      container.style.left = `${left}px`;
      container.style.top = `${top}px`;
    });

    // Also update main container dimensions
    this.mainContainer.style.width = `${window.innerWidth}px`;
    this.mainContainer.style.height = `${window.innerHeight}px`;
  }

  public tapCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (!card) return;

    const updatedCard = { ...card, isTapped: !card.isTapped };
    this.yCards.set(cardId, updatedCard);
  }

  private setupZoomControls(): void {
    const controls = document.createElement('div');
    controls.className = 'zoom-controls';
    controls.style.position = 'fixed';
    controls.style.bottom = '200px';
    controls.style.right = '20px';
    controls.style.zIndex = '1000';
    controls.style.display = 'flex';
    controls.style.flexDirection = 'column';
    controls.style.gap = '8px';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'zoom-button';
    zoomInBtn.textContent = '+';
    zoomInBtn.title = 'Zoom In Cards';
    zoomInBtn.onclick = () => this.adjustZoom(0.1);

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'zoom-button';
    zoomOutBtn.textContent = '−';
    zoomOutBtn.title = 'Zoom Out Cards';
    zoomOutBtn.onclick = () => this.adjustZoom(-0.1);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'zoom-button zoom-display';
    resetBtn.textContent = `${this.zoomLevel.toFixed(1)}×`;
    resetBtn.title = 'Reset Zoom';
    resetBtn.onclick = () => this.setZoom(1);

    controls.appendChild(zoomInBtn);
    controls.appendChild(resetBtn);
    controls.appendChild(zoomOutBtn);

    document.body.appendChild(controls);
    this.zoomControls = controls;
  }

  private adjustZoom(delta: number): void {
    const newZoom = Math.max(0.5, Math.min(2.5, this.zoomLevel + delta));
    this.setZoom(newZoom);
  }

  public getZoomLevel() {
    return this.zoomLevel;
  }

  private setZoom(zoom: number): void {
    this.zoomLevel = zoom;
    localStorage.setItem('whiteboard-zoom', zoom.toString());

    // Update the display button text
    if (this.zoomControls) {
      const displayBtn = this.zoomControls.querySelector('.zoom-display');
      if (displayBtn) {
        displayBtn.textContent = `${this.zoomLevel.toFixed(1)}×`;
      }
    }

    // Update all card sizes
    this.cards.forEach((card) => {
      const container = this.playerContainers.get(card.ownerId);
      if (!container) return;

      const cardElement = container.querySelector(
        `[data-card-id="${card.id}"]`
      ) as HTMLElement;
      if (cardElement) {
        this.applyZoomToCard(cardElement);
      }
    });
  }

  private applyZoomToCard(cardElement: HTMLElement): void {
    const baseWidth = 63;
    const baseHeight = 88;
    const width = baseWidth * this.zoomLevel;
    const height = baseHeight * this.zoomLevel;

    cardElement.style.width = `${width}px`;
    cardElement.style.height = `${height}px`;
  }

  public destroy(): void {
    this.cards.clear();
    this.playerContainers.forEach((container) => container.remove());
    this.playerContainers.clear();
    if (this.zoomControls) {
      this.zoomControls.remove();
    }
  }
}