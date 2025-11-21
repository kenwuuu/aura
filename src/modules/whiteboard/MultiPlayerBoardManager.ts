import { Card } from '../deck';
import {CARD_HEIGHT, CARD_WIDTH, DEFAULT_CARD_BACK, YDOC_CARDS_ON_BOARD} from '../../constants';
import { WhiteboardCard, DragState } from './types';
import { KeyboardHandler, KeyboardHandlerCallbacks } from './KeyboardHandler';
import { CardPreview } from '../cardPreview';
import { TooltipManager } from './TooltipManager';
import { ZoomController } from './ZoomController';
import { BoardContainerManager, BOARD_HEIGHT } from './BoardContainerManager';
import * as Y from 'yjs';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { CardCounter } from '../../components';
import {OpponentCoordinateTransformer} from "./OpponentCoordinateTransformer";
import {HotkeyContext} from "../../data/hotkeys";
import { KeywordToken } from '@/modules/keywordTokens/types';
import { KeywordTokenFactory } from '@/modules/keywordTokens/KeywordTokenFactory';

const DEFAULT_OPPONENT_OPACITY = 1.0;
const FOCUSED_OPACITY = 1.0;

export class MultiPlayerBoardManager {
  private boardContainerManager: BoardContainerManager;
  private cards: Map<string, WhiteboardCard> = new Map();
  private tokens: Map<string, KeywordToken> = new Map();
  private dragState: DragState = { cardId: null, offsetX: 0, offsetY: 0 };
  private yCards: Y.Map<WhiteboardCard>;
  private yTokens: Y.Map<KeywordToken>;
  private yDoc: Y.Doc;
  private maxZIndex: number = 0;
  private keyboardHandler: KeyboardHandler;
  private zoomController: ZoomController;
  private cardPreview: CardPreview;
  private localPlayerId: string;
  private tooltipManager: TooltipManager;
  // Track mouse movement to distinguish clicks from drags
  private mousePosition: { x: number; y: number; } | null = null;
  private readonly DRAG_THRESHOLD = 5; // pixels
  private isDragging: boolean = false;
  private mouseDownPosition: { x: number; y: number } | null = null; // Position at mousedown for drag detection

  // Token hover tracking
  private hoveredTokenId: string | null = null;

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
    this.yDoc = yDoc;
    this.localPlayerId = localPlayerId;
    this.cardPreview = cardPreview;

    this.yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
    this.yTokens = yDoc.getMap('tokens');

    // Initialize BoardContainerManager
    this.boardContainerManager = new BoardContainerManager(
      container,
      localPlayerId,
      backgroundColor,
      this.useOverlay
    );

    // Initialize zoom controller
    this.zoomController = new ZoomController();

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
        onDeleteCard: () => {},
        onDrawCard: () => {},
        onShuffleDeck: () => {},
        onUntapAll: () => {},
        onEndTurn: () => {},
        onHideCardPreview: () => this.cardPreview.hide(),
        onHideCardTooltip: () => this.tooltipManager.hide(),
        onMulligan: () => {},
        loseHealth: () => {},
        gainHealth: () => {},
      },
      this.localPlayerId
    );

    // Initialize tooltip manager with hotkey click handler
    this.tooltipManager = new TooltipManager();
    this.tooltipManager.setup((hotkey, cardId) => {
      // Execute the hotkey action for the specified card
      this.keyboardHandler.executeHotkey(hotkey.key, cardId);
    });
  }

  public setKeyboardCallbacks(callbacks: KeyboardHandlerCallbacks): void {
    // Clean up old keyboard handler before creating new one
    this.keyboardHandler.destroy();
    this.keyboardHandler = new KeyboardHandler(
      this.yCards,
      {
        ...callbacks,
        onHideCardPreview: () => this.cardPreview.hide(),
        onHideCardTooltip: () => this.tooltipManager.hide(),
      },
      this.localPlayerId
    );
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
            this.boardContainerManager.ensureContainer(card.ownerId);

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
      this.boardContainerManager.ensureContainer(card.ownerId);

      this.updateCardElement(card);
    });

    // Observe token changes from other clients
    this.yTokens.observe((event) => {
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add' || change.action === 'update') {
          const token = this.yTokens.get(key);
          if (token) {
            // Update maxZIndex if this token has a higher zIndex
            if (token.zIndex > this.maxZIndex) {
              this.maxZIndex = token.zIndex;
            }

            // Ensure player container exists
            this.boardContainerManager.ensureContainer(token.ownerId);

            this.updateTokenElement(token);
          }
        } else if (change.action === 'delete') {
          this.removeTokenElement(key);
        }
      });
    });

    // Load existing tokens and find max zIndex
    this.yTokens.forEach((token) => {
      if (token.zIndex > this.maxZIndex) {
        this.maxZIndex = token.zIndex;
      }

      // Ensure player container exists
      this.boardContainerManager.ensureContainer(token.ownerId);

      this.updateTokenElement(token);
    });

    // Monitor for new players joining
    this.monitorPlayers();
  }

  private monitorPlayers(): void {
    const checkForNewPlayers = () => {
      this.yDoc.share.forEach((value, key) => {
        if (key.startsWith('player-') && key !== `player-${this.localPlayerId}`) {
          const playerId = key.replace('player-', '');
          const container = this.boardContainerManager.getContainer(playerId);
          if (!container) {
            console.log('New opponent detected:', playerId);
            this.boardContainerManager.createBoardContainer(playerId, false);
          }
        }
      });
    };

    // Check initially
    checkForNewPlayers();

    // Check periodically for new players
    setInterval(checkForNewPlayers, 1000);
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
      for (const [playerId] of this.boardContainerManager.getAllContainers()) {
        if (playerId !== this.localPlayerId) {
          opaqueOpponentId = playerId;
          break;
        }
      }
    }

    // Apply opacity to all opponent containers
    this.boardContainerManager.getAllContainers().forEach((container, playerId) => {
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

  private updateCardElement(card: WhiteboardCard): void {
    this.cards.set(card.id, card);

    const container = this.boardContainerManager.getContainer(card.ownerId);
    if (!container) {
      console.warn(`No board container found for player ${card.ownerId}`);
      return;
    }

    let cardElement = container.querySelector(
      `[data-card-id="${card.id}"]`
    ) as HTMLElement;

    // place card
    if (!cardElement) {
      cardElement = this.createCardElement(card);
      container.appendChild(cardElement);
    } else {
      // Update image when flip state changes
      const existingImg = cardElement.querySelector('img');
      const shouldHaveImage = card.isFlipped
        ? (card.images?.back?.normal || DEFAULT_CARD_BACK)
        : card.images?.front?.normal;

      if (existingImg && shouldHaveImage) {
        // Update existing image
        existingImg.src = shouldHaveImage;
        existingImg.alt = card.isFlipped ? 'Card Back' : (card.name || `Card #${card.cardNumber}`);
      } else if (!existingImg && shouldHaveImage) {
        // Need to add image (was fallback, now has image)
        cardElement.innerHTML = ''; // Clear fallback content

        const img = document.createElement('img');
        img.src = shouldHaveImage;
        img.alt = card.isFlipped ? 'Card Back' : (card.name || `Card #${card.cardNumber}`);
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.pointerEvents = 'none';
        cardElement.appendChild(img);

        const badge = document.createElement('div');
        badge.className = 'card-number-badge-battlefield';
        badge.textContent = `#${card.cardNumber}`;
        cardElement.appendChild(badge);

        cardElement.style.border = '2px solid #4a4a4a';
        cardElement.style.borderRadius = '8px';
        cardElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
        cardElement.style.backgroundColor = '';
      } else if (existingImg && !shouldHaveImage) {
        // Need to remove image (had image, now fallback)
        cardElement.innerHTML = '';

        cardElement.style.backgroundColor = card.isFlipped ? '#4a4a4a' : '#2d2d2d';
        cardElement.style.border = '2px solid #4a4a4a';
        cardElement.style.borderRadius = '8px';
        cardElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';

        const badge = document.createElement('div');
        badge.className = 'card-number-badge-battlefield';
        badge.textContent = `#${card.cardNumber}`;
        cardElement.appendChild(badge);
      } else {
        // No image, just update background color
        cardElement.style.backgroundColor = card.isFlipped ? '#4a4a4a' : '#2d2d2d';
      }

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
    const cardElement = document.createElement('div');
    cardElement.dataset.cardId = card.id;
    cardElement.className = 'card';
    cardElement.style.position = 'absolute';
    // Apply zoom to set initial size
    this.zoomController.applyZoomToCard(cardElement);
    cardElement.style.cursor = 'grab';
    cardElement.style.userSelect = 'none';
    cardElement.style.overflow = 'hidden';
    cardElement.style.pointerEvents = 'auto';  // Enable pointer events so opponents can hover cards

    // Determine which image to show
    let imageSrc: string | null;

    if (card.isFlipped) {
      // Card is flipped - show back side
      imageSrc = card.images?.back?.normal || DEFAULT_CARD_BACK;
    } else {
      // Card is face-up - show front side
      imageSrc = card.images?.front?.normal || null;
    }

    if (imageSrc) {
      // Show card image (front, back, or default back)
      cardElement.style.border = '2px solid #4a4a4a';
      cardElement.style.borderRadius = '8px';
      cardElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';

      const img = document.createElement('img');
      img.src = imageSrc;
      img.alt = card.isFlipped ? 'Card Back' : (card.name || `Card #${card.cardNumber}`);
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
      // Fallback: show colored div with card number (no image available)
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

    // Enable hover for card preview
    cardElement.addEventListener('mouseenter', (e: MouseEvent) => {
      this.keyboardHandler.setHoveredCard(card.id);
      // Get latest card state from Yjs to avoid stale closures
      const latestCard = this.yCards.get(card.id) || card;
      this.cardPreview.show(latestCard);

      // Show tooltip menu on hover for local player's cards (delayed)
      if (card.ownerId === this.localPlayerId) {
        this.tooltipManager.showOnHover(card.id, HotkeyContext.Battlefield);
      }
    });

    cardElement.addEventListener('mousemove', (e: MouseEvent) => {
      this.tooltipManager.setMouseLocation(e.clientX, e.clientY);
      this.cardPreview.updatePosition(e);
      this.mousePosition = { x: e.clientX, y: e.clientY };
    });

    cardElement.addEventListener('mouseleave', () => {
      this.keyboardHandler.setHoveredCard(null);
      this.cardPreview.hide();
      this.tooltipManager.hideOnLeave();
    });

    // Handle click for tooltip menu (distinguish from drag)
    cardElement.addEventListener('click', (e: MouseEvent) => {
      // Only show menu if this was a click (not a drag) and it's the same card
      if (this.mousePosition) {
        const dx = Math.abs(e.clientX - this.mousePosition.x);
        const dy = Math.abs(e.clientY - this.mousePosition.y);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If mouse moved less than threshold and wasn't dragging, treat as click
        if (distance < this.DRAG_THRESHOLD && !this.isDragging && card.ownerId === this.localPlayerId) {
          // Show tooltip menu
          this.tooltipManager.show(card.id, HotkeyContext.Battlefield, e.clientX, e.clientY);
        }
      }
      // Always clear drag state after click handler
      this.mousePosition = null;
      this.isDragging = false;
    });

    cardElement.addEventListener('mousedown', (e) => {
      // Store mouse down position to detect drags
      this.mousePosition = { x: e.clientX, y: e.clientY };
      this.isDragging = false;
      this.onMouseDown(e, card.id);
    });

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
      React.createElement(CardCounter, {
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
    const { x, y } = OpponentCoordinateTransformer.transform(card, this.localPlayerId, BOARD_HEIGHT, this.zoomController.getZoomLevel());
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.transform = `rotate(${card.rotation}deg) ${card.isTapped ? 'rotate(90deg)' : ''}`;
    element.style.zIndex = card.zIndex.toString();
  }

  private removeCardElement(cardId: string): void {
    const card = this.cards.get(cardId);
    if (!card) return;

    this.cards.delete(cardId);

    const container = this.boardContainerManager.getContainer(card.ownerId);
    if (!container) return;

    const cardElement = container.querySelector(`[data-card-id="${cardId}"]`);
    if (cardElement) {
      cardElement.remove();
    }
  }

  // Token rendering methods
  private updateTokenElement(token: KeywordToken): void {
    this.tokens.set(token.id, token);

    const container = this.boardContainerManager.getContainer(token.ownerId);
    if (!container) {
      console.warn(`No board container found for player ${token.ownerId}`);
      return;
    }

    let tokenElement = container.querySelector(
      `[data-token-id="${token.id}"]`
    ) as HTMLElement;

    if (!tokenElement) {
      tokenElement = this.createTokenElement(token);
      container.appendChild(tokenElement);
    } else {
      // Update count display using factory method
      KeywordTokenFactory.updateCount(tokenElement, token.count);

      // Update background color if changed
      const background = tokenElement.querySelector('.token-background') as HTMLElement;
      if (background) {
        background.style.backgroundColor = token.backgroundColor;
      }
    }

    this.updateTokenPosition(tokenElement, token);
  }

  private createTokenElement(token: KeywordToken): HTMLElement {
    const tokenElement = KeywordTokenFactory.createTokenElement(token, {
      mode: 'board',
      onMouseEnter: (e: MouseEvent, tokenId: string) => {
        this.hoveredTokenId = tokenId;
        this.tooltipManager.show(tokenId, HotkeyContext.KeywordToken, e.clientX, e.clientY, false, token.title);
      },
      onMouseMove: (e: MouseEvent, tokenId: string) => {
        this.tooltipManager.setMouseLocation(e.clientX, e.clientY);
        this.mousePosition = { x: e.clientX, y: e.clientY };

        // Detect dragging - only start drag state once threshold is crossed
        if (this.mouseDownPosition && !this.isDragging) {
          const dx = e.clientX - this.mouseDownPosition.x;
          const dy = e.clientY - this.mouseDownPosition.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > this.DRAG_THRESHOLD) {
            this.isDragging = true;
            this.onTokenMouseDown(e, tokenId);
          }
        }
      },
      onMouseLeave: (tokenId: string) => {
        if (this.hoveredTokenId === tokenId) {
          this.hoveredTokenId = null;
          this.tooltipManager.hide();
        }
      },
      onMouseDown: (e: MouseEvent, tokenId: string) => {
        // Record starting position for drag detection but don't start drag yet
        this.mouseDownPosition = { x: e.clientX, y: e.clientY };
        this.isDragging = false;

        if (this.hoveredTokenId === tokenId) {
          // this.hoveredTokenId = null;
          // this.tooltipManager.hide();
        }
      },
      onMouseUp: (e: MouseEvent, tokenId: string) => {
        if (!this.mouseDownPosition) return;

        if (!this.isDragging && token.ownerId === this.localPlayerId && e.button === 0) {
          // It was a click, not a drag (left button only)
          e.stopPropagation();
          this.modifyTokenCount(tokenId, 1);
        }

        // Reset
        this.mouseDownPosition = null;
        this.isDragging = false;
      },
      onContextMenu: (e: MouseEvent, tokenId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (token.ownerId === this.localPlayerId) {
          this.modifyTokenCount(tokenId, -1);
        }
      },
    });

    return tokenElement;
  }

  private updateTokenPosition(element: HTMLElement, token: KeywordToken): void {
    // Tokens don't rotate, so we can use a simpler transform
    const transformable = {
      ...token,
      rotation: 0,
      isTapped: false,
      cardNumber: 0,
      isFlipped: false,
      counters: []
    };
    const { x, y } = OpponentCoordinateTransformer.transform(transformable, this.localPlayerId, BOARD_HEIGHT, this.zoomController.getZoomLevel());
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.zIndex = token.zIndex.toString();
  }

  private removeTokenElement(tokenId: string): void {
    const token = this.tokens.get(tokenId);
    if (!token) return;

    this.tokens.delete(tokenId);

    const container = this.boardContainerManager.getContainer(token.ownerId);
    if (!container) return;

    const tokenElement = container.querySelector(`[data-token-id="${tokenId}"]`);
    if (tokenElement) {
      tokenElement.remove();
    }
  }

  private modifyTokenCount(tokenId: string, delta: number): void {
    const token = this.yTokens.get(tokenId);
    if (!token) return;

    // Default to 1 if count is undefined
    const currentCount = token.count ?? 0;
    const newCount = currentCount + delta;
    const updatedToken = { ...token, count: newCount };
    this.yTokens.set(tokenId, updatedToken);
  }

  private onTokenMouseDown(e: MouseEvent, tokenId: string): void {
    e.preventDefault();

    // get token. return if we don't own it
    const token = this.tokens.get(tokenId);
    if (!token || token.ownerId !== this.localPlayerId) return;

    // hide tooltip
    this.tooltipManager.hide();

    // set drag state
    this.dragState = {
      cardId: tokenId,  // Reuse cardId field for tokens
      offsetX: e.clientX - token.x,
      offsetY: e.clientY - token.y,
    };

    // Bring token to front
    const updatedToken = { ...token, zIndex: ++this.maxZIndex };
    this.yTokens.set(tokenId, updatedToken);

    const container = this.boardContainerManager.getContainer(token.ownerId);
    if (!container) return;

    const tokenElement = container.querySelector(
      `[data-token-id="${tokenId}"]`
    ) as HTMLElement;
    if (tokenElement) {
      tokenElement.style.cursor = 'grabbing';
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

    const container = this.boardContainerManager.getContainer(card.ownerId);
    if (!container) return;

    const cardElement = container.querySelector(
      `[data-card-id="${cardId}"]`
    ) as HTMLElement;
    if (cardElement) {
      cardElement.style.cursor = 'grabbing';
    }
  }

  private getElementUnderMouse(x: number, y: number): Element | null {
    // Get the element at the mouse position
    return document.elementFromPoint(x, y);
  }

  private findPileType(element: Element | null): 'hand' | 'exile' | 'discard' | 'deck' | null {
    if (!element) return null;

    // Walk up the DOM tree to find a pile element
    let current = element as HTMLElement | null;
    while (current) {
      const pileType = current.dataset?.pileType;
      if (pileType === 'exile' || pileType === 'discard' || pileType === 'deck') {
        return pileType as 'exile' | 'discard' | 'deck';
      }
      // Check if we're over the hand container
      if (current.classList.contains('hand-container') || current.classList.contains('hand-cards')) {
        return 'hand';
      }
      current = current.parentElement;
    }
    return null;
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.dragState.cardId) return;

    this.tooltipManager.hide()

    // Check if dragging a card or token
    const card = this.cards.get(this.dragState.cardId);
    const token = this.tokens.get(this.dragState.cardId);

    if (card && card.ownerId === this.localPlayerId) {
      // Dragging a card
      if (this.mousePosition && !this.isDragging) {
        const dx = Math.abs(e.clientX - this.mousePosition.x);
        const dy = Math.abs(e.clientY - this.mousePosition.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= this.DRAG_THRESHOLD) {
          this.isDragging = true;
        }
      }

      const x = e.clientX - this.dragState.offsetX;
      const y = e.clientY - this.dragState.offsetY;

      const updatedCard = { ...card, x, y };
      this.yCards.set(this.dragState.cardId, updatedCard);
    } else if (token && token.ownerId === this.localPlayerId) {
      // Dragging a token
      if (this.mousePosition && !this.isDragging) {
        const dx = Math.abs(e.clientX - this.mousePosition.x);
        const dy = Math.abs(e.clientY - this.mousePosition.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= this.DRAG_THRESHOLD) {
          this.isDragging = true;
        }
      }

      const x = e.clientX - this.dragState.offsetX;
      const y = e.clientY - this.dragState.offsetY;

      const updatedToken = { ...token, x, y };
      this.yTokens.set(this.dragState.cardId, updatedToken);
    }
  }

  private onMouseUp(e?: MouseEvent): void {
    if (this.dragState.cardId) {
      const card = this.cards.get(this.dragState.cardId);
      const token = this.tokens.get(this.dragState.cardId);

      if (card && card.ownerId === this.localPlayerId) {
        // Check if mouse is over a dock pile
        if (e) {
          const elementUnderMouse = this.getElementUnderMouse(e.clientX, e.clientY);
          const pileType = this.findPileType(elementUnderMouse);

          if (pileType) {
            // Dispatch event to move card from battlefield to pile
            const event = new CustomEvent('moveCardFromBattlefield', {
              detail: {
                cardId: this.dragState.cardId,
                destination: pileType
              }
            });
            window.dispatchEvent(event);

            // Clear drag state and return early (card will be removed from battlefield)
            this.dragState = { cardId: null, offsetX: 0, offsetY: 0 };
            this.mousePosition = null;
            this.isDragging = false;
            return;
          }
        }

        // Normal case: just dragging around the battlefield
        const container = this.boardContainerManager.getContainer(card.ownerId);
        if (container) {
          const cardElement = container.querySelector(
            `[data-card-id="${this.dragState.cardId}"]`
          ) as HTMLElement;
          if (cardElement) {
            cardElement.style.cursor = 'grab';
          }
        }
      } else if (token && token.ownerId === this.localPlayerId) {
        // Tokens just dragged around battlefield, restore cursor
        const container = this.boardContainerManager.getContainer(token.ownerId);
        if (container) {
          const tokenElement = container.querySelector(
            `[data-token-id="${this.dragState.cardId}"]`
          ) as HTMLElement;
          if (tokenElement) {
            tokenElement.style.cursor = 'grab';
          }
        }
      }
    }

    this.dragState = { cardId: null, offsetX: 0, offsetY: 0 };

    // If we were dragging, clear the mousePosition immediately
    // Otherwise, let the click handler clear it (so it can detect clicks)
    if (this.isDragging || !this.mousePosition) {
      this.mousePosition = null;
      this.isDragging = false;
    }
    // If not dragging and mousePosition exists, the click handler will clear it
  }

  private attachEventListeners(): void {
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    window.addEventListener('resize', () => this.boardContainerManager.recenterAll());

    // Token keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.hoveredTokenId) {
        const token = this.tokens.get(this.hoveredTokenId);
        if (token && token.ownerId === this.localPlayerId) {
          switch(e.key) {
            case 'ArrowUp':
              e.preventDefault();
              this.modifyTokenCount(this.hoveredTokenId, 1);
              break;
            case 'ArrowDown':
              e.preventDefault();
              this.modifyTokenCount(this.hoveredTokenId, -1);
              break;
            case 'Backspace':
            case 'Delete':
              e.preventDefault();
              this.yTokens.delete(this.hoveredTokenId);
              break;
          }
        }
      }
    });
  }

  private setupZoomControls(): void {
    // Setup zoom controller UI
    this.zoomController.setupControls();

    // Register callback to update all card sizes when zoom changes
    this.zoomController.onZoomChange(() => {
      this.cards.forEach((card) => {
        const container = this.boardContainerManager.getContainer(card.ownerId);
        if (!container) return;

        const cardElement = container.querySelector(
          `[data-card-id="${card.id}"]`
        ) as HTMLElement;
        if (cardElement) {
          this.zoomController.applyZoomToCard(cardElement);
        }
      });
    });
  }

  public getZoomLevel() {
    return this.zoomController.getZoomLevel();
  }

  public getTooltipManager(): TooltipManager {
    return this.tooltipManager;
  }

  public destroy(): void {
    this.cards.clear();
    this.tokens.clear();
    this.boardContainerManager.destroy();
    this.zoomController.destroy();
    this.tooltipManager.destroy();
  }
}