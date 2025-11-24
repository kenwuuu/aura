import {Player, PlayerState} from '../player';
import {GameResourcesDockConfig} from './types';
import {Card, Deck} from '../deck';
import { PileViewer, PileType } from './components';
import { CardPreview } from '../cardPreview';
import React from 'react';
import {createRoot, Root} from 'react-dom/client';
import {HealthDisplay} from '@/components/health/HealthDisplay';
import {HotkeyTooltip} from '@/components';
import {HotkeyContext} from '@/data/hotkeys';
import {ScryModal} from '@/components/ScryModal';
import { ControlsMenu } from '@/components/controls/ControlsMenu';
import { TooltipManager } from '../whiteboard/TooltipManager';
import { TooltipProvider } from '@/contexts/TooltipContext';
import { HandCardsContainer } from './HandCardsContainer';

export class GameResourcesDock {
  private container: HTMLElement;
  private player: Player;
  private config: GameResourcesDockConfig;
  private deckViewer: PileViewer;
  private scryViewer: PileViewer;
  private exileViewer: PileViewer;
  private discardViewer: PileViewer;
  private elements: {
    exile: HTMLElement;
    discard: HTMLElement;
    hand: HTMLElement;
    controls: HTMLElement;
    deck: HTMLElement;
    health: HTMLElement;
  } | null = null;
  private draggedCard: { card: Card; element: HTMLElement } | null = null;
  private hoveredHandCardId: string | null = null;
  private hoveredResource: 'deck' | 'exile' | 'discard' | 'health' | null = null;
  private handZoomLevel: number = 1;
  private zoomControls?: HTMLElement;
  private cardPreview: CardPreview;
  private healthRoot: Root | null = null;
  private controlsRoot: Root | null = null;
  private handRoot: Root | null = null;
  private controlsTooltipManager: TooltipManager | undefined;
  private tooltipRoot: Root | null = null;
  private tooltipContainer: HTMLElement | null = null;
  private scryModalRoot: Root | null = null;
  private scryModalContainer: HTMLElement | null = null;
  private isScryModalOpen: boolean = false;
  private scriedCards: Deck = new Deck([]);
  private currentMouseX: number = 0;
  private currentMouseY: number = 0;
  private isMouseDown: boolean = false;
  private isModalOpen: boolean = false;
  private _dragState: { mode: string; draggedElement: HTMLDivElement; startIndex: number; } | undefined;
  private preloadedPiles: Set<'deck' | 'exile' | 'discard'> = new Set();

  constructor(
    container: HTMLElement,
    player: Player,
    config: GameResourcesDockConfig,
    cardPreview: CardPreview,
    controlsTooltipManager?: TooltipManager
  ) {
    this.container = container;
    this.player = player;
    this.config = config;
    this.controlsTooltipManager = controlsTooltipManager;

    // Initialize all pile viewers with appropriate callbacks
    // yPlayerState is now accessed via Zustand store - no prop drilling needed!
    this.deckViewer = new PileViewer({
      onPlayToBattlefield: (card) => this.handlePileViewerCardToBattlefield(card, 'deck'),
      onMoveToHand: (card) => this.handlePileViewerCardToHand(card, 'deck'),
      onMoveToDiscard: (card) => this.handlePileViewerCardToDiscard(card, 'deck'),
      onMoveToExile: (card) => this.handlePileViewerCardToExile(card, 'deck'),
      onMoveToDeckTop: (card) => this.handlePileViewerCardToDeckTop(card, 'deck'),
      onMoveToDeckBottom: (card) => this.handlePileViewerCardToDeckBottom(card, 'deck'),
    });

    this.scryViewer = new PileViewer({
      onMoveToDiscard: (card) => this.handlePileViewerCardToDiscard(card, 'scry'),
      onMoveToDeckTop: (card) => this.handlePileViewerCardToDeckTop(card, 'scry'),
      onMoveToDeckBottom: (card) => this.handlePileViewerCardToDeckBottom(card, 'scry'),
    });

    this.exileViewer = new PileViewer({
      onPlayToBattlefield: (card) => this.handlePileViewerCardToBattlefield(card, 'exile'),
      onMoveToHand: (card) => this.handlePileViewerCardToHand(card, 'exile'),
      onMoveToDiscard: (card) => this.handlePileViewerCardToDiscard(card, 'exile'),
      onMoveToDeckTop: (card) => this.handlePileViewerCardToDeckTop(card, 'exile'),
      onMoveToDeckBottom: (card) => this.handlePileViewerCardToDeckBottom(card, 'exile'),
    });

    this.discardViewer = new PileViewer({
      onPlayToBattlefield: (card) => this.handlePileViewerCardToBattlefield(card, 'discard'),
      onMoveToHand: (card) => this.handlePileViewerCardToHand(card, 'discard'),
      onMoveToExile: (card) => this.handlePileViewerCardToExile(card, 'discard'),
      onMoveToDeckTop: (card) => this.handlePileViewerCardToDeckTop(card, 'discard'),
      onMoveToDeckBottom: (card) => this.handlePileViewerCardToDeckBottom(card, 'discard'),
    });

    this.handZoomLevel = parseFloat(localStorage.getItem('hand-zoom') || '1');
    this.cardPreview = cardPreview;

    this.render();
    this.setupZoomControls();
    this.setupEventListeners();
    this.setupDragDropZones();
    this.setupKeyboardShortcuts();
    this.setupTooltip();
  }

  private setupTooltip(): void {
    // Create tooltip container
    this.tooltipContainer = document.createElement('div');
    this.tooltipContainer.className = 'hotkey-tooltip-container';
    document.body.appendChild(this.tooltipContainer);
    this.tooltipRoot = createRoot(this.tooltipContainer);

    // Setup mouse move listener to track cursor position
    document.addEventListener('mousemove', (e: MouseEvent) => {
      this.currentMouseX = e.clientX;
      this.currentMouseY = e.clientY;
      this.updateHotkeyTooltip();
    });

    // Track mouse down/up to hide tooltip during dragging
    document.addEventListener('mousedown', () => {
      this.isMouseDown = true;
      this.updateHotkeyTooltip();
    });

    document.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      this.updateHotkeyTooltip();
    });
  }

  private updateHotkeyTooltip(): void {
    if (!this.tooltipRoot) return;

    // Hide hotkey tooltip when modal is open
    if (this.isModalOpen) {
      this.tooltipRoot.render(null);
      return;
    }

    // Determine which context to show based on hover state
    let context: HotkeyContext | null = null;

    if (this.hoveredHandCardId) {
      context = 'hand';
    } else if (this.hoveredResource) {
      context = this.hoveredResource as HotkeyContext;
    }

    // Render tooltip or hide it
    if (context) {
      this.tooltipRoot.render(
        React.createElement(HotkeyTooltip, {
          context,
          mouseX: this.currentMouseX,
          mouseY: this.currentMouseY,
          isMouseDown: this.isMouseDown,
        })
      );
    } else {
      this.tooltipRoot.render(null);
    }
  }

  private render(): void {
    this.container.className = `game-resources-dock ${this.config.position}`;

    const exile = this.createPileElement('exile', 'Exile');
    const discard = this.createPileElement('discard', 'Discard');
    const hand = this.createHandElement();
    const controls = this.createControlsElement();
    const deck = this.createDeckElement();
    const health = this.createHealthElement();

    this.container.appendChild(exile);
    this.container.appendChild(discard);
    this.container.appendChild(hand);
    this.container.appendChild(controls);
    this.container.appendChild(deck);
    this.container.appendChild(health);

    this.elements = { exile, discard, hand, controls, deck, health };
  }

  private createPileElement(type: string, label: string): HTMLElement {
    const pile = document.createElement('div');
    pile.className = `resource-pile ${type}-pile`;
    pile.dataset.pileType = type;

    const labelEl = document.createElement('div');
    labelEl.className = 'pile-label';
    labelEl.textContent = label;

    const count = document.createElement('div');
    count.className = 'pile-count';
    count.dataset.pile = type;
    count.textContent = '0';

    pile.appendChild(labelEl);
    pile.appendChild(count);

    // Hover tracking for keyboard shortcuts and tooltip
    pile.addEventListener('mouseenter', () => {
      this.hoveredResource = type as 'deck' | 'exile' | 'discard' | 'health';
      this.hoveredHandCardId = null;
      this.updateHotkeyTooltip();
      // Pre-load images on hover
      this.preloadPileImages(type as 'deck' | 'exile' | 'discard');
    });

    pile.addEventListener('mouseleave', () => {
      this.hoveredResource = null;
      this.updateHotkeyTooltip();
    });

    // Click to view pile
    pile.onclick = () => this.viewPile(type as 'exile' | 'discard');

    return pile;
  }

  private createHandElement(): HTMLElement {
    const hand = document.createElement('div');

    // Mount React component for hand cards
    this.handRoot = createRoot(hand);
    this.renderHandComponent();

    return hand;
  }

  private renderHandComponent(): void {
    if (!this.handRoot) return;

    this.handRoot.render(
      React.createElement(HandCardsContainer, {
        yPlayerState: this.player.getYPlayerState(),
        playerId: this.config.playerId,
        zoomLevel: this.handZoomLevel,
        cardPreview: this.cardPreview,
        onHoveredCardChange: (cardId) => {
          this.hoveredHandCardId = cardId;
          if (cardId) {
            this.hoveredResource = null;
          }
          this.updateHotkeyTooltip();
        },
        onDraggedCardChange: (draggedCard) => {
          this.draggedCard = draggedCard;
        },
        onDragStateChange: (dragState) => {
          this._dragState = dragState;
        },
        onHandReorder: (reorderedHand) => {
          this.player.reorderHand(reorderedHand);
        },
        adjustHandZoom: (delta: number): void => {
          this.adjustHandZoom(delta)
        }
      })
    );
  }

  private createDeckElement(): HTMLElement {
    const deck = document.createElement('div');
    deck.className = 'resource-pile deck-pile';
    deck.dataset.pileType = 'deck';

    const labelEl = document.createElement('div');
    labelEl.className = 'pile-label';
    labelEl.textContent = 'Deck';

    const count = document.createElement('div');
    count.className = 'pile-count';
    count.dataset.pile = 'deck';
    count.textContent = '60';

    const drawButton = document.createElement('button');
    drawButton.className = 'draw-button';
    drawButton.textContent = 'Draw';
    drawButton.onclick = (e) => {
      e.stopPropagation();
      this.player.drawCard();
    };

    deck.appendChild(labelEl);
    deck.appendChild(count);
    deck.appendChild(drawButton);

    // Add hover event listeners for keyboard shortcuts
    deck.addEventListener('mouseenter', () => {
      this.hoveredResource = 'deck';
      this.hoveredHandCardId = null;
      // Pre-load images on hover
      // this.preloadPileImages('deck');
    });

    deck.addEventListener('mouseleave', () => {
      this.hoveredResource = null;
    });

    // Click deck to view it (with search and sort)
    deck.onclick = (e) => {
      if (e.target !== drawButton) {
        this.viewPile('deck');
      }
    };

    return deck;
  }

  private createControlsElement(): HTMLElement {
    const controlsElement = document.createElement('div');

    this.controlsRoot = createRoot(controlsElement);
    this.renderControlsComponent();

    return controlsElement;
  }

  private renderControlsComponent(): void {
    if (!this.controlsRoot) return;

    this.controlsRoot.render(
      React.createElement(
        TooltipProvider,
        { value: this.controlsTooltipManager ?? null },
        React.createElement(ControlsMenu, {
          onScry: () => this.openScryModal(),
          onAddCard: () => {
            // Trigger the AddCardManager by simulating the 'a' key press
            const event = new KeyboardEvent('keydown', { key: 'a' });
            document.dispatchEvent(event);
          }
        })
      )
    );
  }

  private createHealthElement(): HTMLElement {
    const healthElement = document.createElement('div');

    this.healthRoot = createRoot(healthElement);
    this.renderHealthComponent();

    // Add hover event listeners for keyboard shortcuts
    healthElement.addEventListener('mouseenter', () => {
      this.hoveredResource = 'health';
      this.hoveredHandCardId = null;
    });

    healthElement.addEventListener('mouseleave', () => {
      this.hoveredResource = null;
    });

    return healthElement;
  }

  private renderHealthComponent(): void {
    if (!this.healthRoot) return;

    const state = this.player.getState();
    this.healthRoot.render(
      React.createElement(HealthDisplay, {
        label: this.player.getId().slice(0, 9),
        health: state.health,
        onModifyHealth: (delta: number) => this.player.modifyHealth(delta),
        variant: 'local',
        customCounters: state.customCounters,
        onAddCounter: (title: string, icon: string) => this.player.addCustomCounter(title, icon),
        onModifyCounter: (counterId: string, delta: number) => this.player.modifyCustomCounter(counterId, delta),
        onRemoveCounter: (counterId: string) => this.player.removeCustomCounter(counterId)
      })
    );
  }

  private setupEventListeners(): void {
    this.player.onStateChange((state) => {
      this.updateUI(state);
    });

    // Listen for modal open/close events to hide tooltip
    window.addEventListener('modalOpen', () => {
      this.isModalOpen = true;
      this.updateHotkeyTooltip();
    });

    window.addEventListener('modalClosed', () => {
      this.isModalOpen = false;
      this.updateHotkeyTooltip();
    });

    window.addEventListener('scryViewer closing', () => {
      this.replaceRemainingScriedCards();
    });

    // Initial update
    this.updateUI(this.player.getState());
  }

  private setupDragDropZones(): void {
    if (!this.elements) return;

    // Setup drop zones for exile, discard, and deck
    [this.elements.exile, this.elements.discard, this.elements.deck].forEach((pile) => {
      pile.addEventListener('dragover', (e) => {
        e.preventDefault();
        pile.classList.add('drag-over');
      });

      pile.addEventListener('dragleave', () => {
        pile.classList.remove('drag-over');
      });

      pile.addEventListener('drop', (e) => {
        e.preventDefault();
        pile.classList.remove('drag-over');

        if (!this.draggedCard) return;

        function isPileType(value: string): value is PileType {
          return ['deck', 'exile', 'discard', 'hand', 'scry'].includes(value);
        }

        const pileType = pile.dataset.pileType;
        if (pileType && isPileType(pileType)) this.player.placeCardInPile(this.draggedCard.card, pileType);

        this.player.removeCardFromHand(this.draggedCard.card.id);
        this.draggedCard = null;
      });
    });
  }

  private updateUI(state: PlayerState): void {
    if (!this.elements) return;

    // Update pile counts
    const exileCount = this.elements.exile.querySelector('.pile-count');
    if (exileCount) exileCount.textContent = state.exilePile.length.toString();

    const discardCount = this.elements.discard.querySelector('.pile-count');
    if (discardCount) discardCount.textContent = state.discardPile.length.toString();

    const deckCount = this.elements.deck.querySelector('.pile-count');
    if (deckCount) deckCount.textContent = state.deck.length.toString();

    // Update health React component
    this.renderHealthComponent();

    // Hand updates are now handled automatically by React via Yjs observation
  }

  private onDrawCard(): void {
    this.player.drawCard();
  }

  private openScryModal(): void {
    const deckCount = this.player.getDeck().getCardCount();

    // Setup scry modal container if not already created
    if (!this.scryModalContainer) {
      this.scryModalContainer = document.createElement('div');
      document.body.appendChild(this.scryModalContainer);
      this.scryModalRoot = createRoot(this.scryModalContainer);
    }

    this.isScryModalOpen = true;
    this.renderScryModal(deckCount);
  }

  private renderScryModal(maxCards: number): void {
    if (!this.scryModalRoot) return;

    this.scryModalRoot.render(
      React.createElement(ScryModal, {
        isOpen: this.isScryModalOpen,
        maxCards,
        onConfirm: (count: number) => {
          this.isScryModalOpen = false;
          this.renderScryModal(maxCards);
          this.scryCards(count);
        },
        onCancel: () => {
          this.isScryModalOpen = false;
          this.renderScryModal(maxCards);
        },
      })
    );
  }

  private replaceRemainingScriedCards(): void {
    // returns any remaining cards in scryViewer on top of deck, in order
    // Add remaining scried cards back to the top of the deck
    this.scriedCards.getCards().forEach((card) => {
      this.player.getDeck().addCardToTop(card);
    });
    this.scriedCards.clearDeck();
  }

  private scryCards(count: number): void {
    // Get the top N cards from the deck
    const deckCards = this.player.getDeckCards();
    // Cards are stored bottom-to-top, so we need to slice from the end

    const scryCards: Card[] = deckCards.slice(-count);
    this.scriedCards = new Deck(scryCards);
    this.scriedCards.getCards().forEach((card) => {
      this.player.getDeck().removeCardById(card.id);
    });

    // Show them in the deck viewer
    this.scryViewer.show(this.scriedCards.getCards(), 'scry');
  }

  private viewPile(pileType: 'exile' | 'discard' | 'deck'): void {    let result = null;
    let cards;
    let pileViewer;
    switch (pileType) {
      case "deck":
        cards = this.player.getDeck().getCards();
        pileViewer = this.deckViewer;
        break;
      case "discard":
        cards = this.player.getDiscardPile().getCards();
        pileViewer = this.discardViewer;
        break;
      case "exile":
        cards = this.player.getExilePile().getCards();
        pileViewer = this.exileViewer;
        break;
    }

    pileViewer.show(cards, pileType);
  }

  // Handler methods for pile viewer callbacks
  private handlePileViewerCardToBattlefield(card: Card, pileType: 'deck' | 'exile' | 'discard'): void {
    // Remove card from the appropriate pile
    this.player.removeCardFromPileById(card.id, pileType);

    // Dispatch event to play card to battlefield
    const event = new CustomEvent('playCard', {
      detail: { card, playerId: this.player.getId() }
    });
    window.dispatchEvent(event);

    // Update viewer with new card list
    this.updatePileViewer(pileType);
  }

  private handlePileViewerCardToHand(card: Card, pileType: 'deck' | 'exile' | 'discard'): void {
    this.player.removeCardFromPileById(card.id, pileType)
    this.player.placeCardInPile(card, 'hand');

    // Update viewer with new card list
    this.updatePileViewer(pileType);
  }

  private handlePileViewerCardToExile(card: Card, pileType: 'discard' | 'deck'): void {
    this.player.removeCardFromPileById(card.id, pileType)
    this.player.placeCardInPile(card, 'exile');

    // Update viewer with new card list
    this.updatePileViewer(pileType);
  }

  private handlePileViewerCardToDiscard(card: Card, pileType: 'exile' | 'deck' | 'scry'): void {
    this.player.removeCardFromPileById(card.id, pileType)
    this.player.placeCardInPile(card, 'discard');

    // Update viewer with new card list
    this.updatePileViewer(pileType);
  }

  private handlePileViewerCardToDeckTop(card: Card, pileType: 'exile' | 'discard' | 'deck' | 'scry'): void {
    this.player.removeCardFromPileById(card.id, pileType)
    this.player.placeCardInPile(card, 'deck');

    // Update viewer with new card list
    this.updatePileViewer(pileType);
  }

  private handlePileViewerCardToDeckBottom(card: Card, pileType: 'exile' | 'discard' | 'deck' | 'scry'): void {
    this.player.removeCardFromPileById(card.id, pileType)
    this.player.placeCardInPile(card, 'deck', 0);

    // Update viewer with new card list
    this.updatePileViewer(pileType);
  }

  private updatePileViewer(pileType: 'deck' | 'exile' | 'discard' | 'scry'): void {
    if (pileType === 'deck') {
      const updatedCards = this.player.getDeckCards();
      this.deckViewer.updateCards(updatedCards);
    } else if (pileType === 'exile') {
      const state = this.player.getState();
      this.exileViewer.updateCards(state.exilePile);
    } else if (pileType === 'discard') {
      const state = this.player.getState();
      this.discardViewer.updateCards(state.discardPile);
    } else if (pileType === 'scry') {
      const updatedCards = this.scriedCards.getCards();
      this.scryViewer.updateCards(updatedCards);
    }
  }

  private setupKeyboardShortcuts(): void {
    // Expose hover state for external keyboard handlers
    (window as any).getGameResourcesDockHoverState = () => {
      return {
        hoveredHandCardId: this.hoveredHandCardId,
        hoveredPileType: this.hoveredResource,
        getHandCard: (cardId: string) => {
          const hand = this.player.getHand().getCards();
          return hand.find(c => c.id === cardId) || null;
        },
        getTopPileCard: (pileType: 'deck' | 'exile' | 'discard') => {
          const state = this.player.getState();
          let cards: Card[] = [];
          if (pileType === 'deck') {
            cards = this.player.getDeckCards();
          } else if (pileType === 'exile') {
            cards = state.exilePile;
          } else if (pileType === 'discard') {
            cards = state.discardPile;
          }
          this.player.syncToYState();

          return cards.length > 0 ? cards[cards.length - 1] : null;
        },
        moveHandCardToDiscard: (cardId: string) => {
          const hand = this.player.getHand().getCards();
          const card = hand.find(c => c.id === cardId);
          if (card) {
            this.player.removeCardFromPileById(cardId, 'hand');
            this.player.placeCardInPile(card, 'discard');
            this.cardPreview.hide();
          }
          this.player.syncToYState();
        },
        moveHandCardToExile: (cardId: string) => {
          const hand = this.player.getHand().getCards();
          const card = hand.find(c => c.id === cardId);
          if (card) {
            this.player.removeCardFromPileById(cardId, 'hand');
            this.player.placeCardInPile(card, 'exile');
            this.cardPreview.hide();
          }
          this.player.syncToYState();
        },
        moveHandCardToDeckTop: (cardId: string) => {
          const hand = this.player.getHand().getCards();
          const card = hand.find(c => c.id === cardId);
          if (card) {
            this.player.removeCardFromPileById(cardId, 'hand');
            this.player.placeCardInPile(card, 'deck');
            this.cardPreview.hide();
          }
          this.player.syncToYState();
        },
        moveHandCardToDeckBottom: (cardId: string) => {
          const hand = this.player.getHand().getCards();
          const card = hand.find(c => c.id === cardId);
          if (card) {
            this.player.removeCardFromPileById(cardId, 'hand');
            this.player.placeCardInPile(card, 'deck', 0);
            this.cardPreview.hide();
          }
          this.player.syncToYState();
        },
        flipHandCard: (cardId: string) => {
          this.player.flipHandCard(cardId);
          this.player.syncToYState();
          this.cardPreview.hide();
        },
        movePileCardToPile: (originPileType: 'deck' | 'discard' | 'exile', destinationPileType: PileType, position?: number) => {
          const card = this.player.drawCardFromPile(originPileType);
          if (card) this.player.placeCardInPile(card, destinationPileType, position);
          this.player.syncToYState();
        },
        movePileCardToHand: (pileType: 'deck' | 'exile' | 'discard') => {
          // todo: refactor this into movePileCardToPile
          const card = this.player.drawCardFromPile(pileType);
          if (card) this.player.placeCardInPile(card, 'hand');
          this.player.syncToYState();
        },
      };
    };
  }

  private setupZoomControls(): void {
    const controls = document.createElement('div');
    controls.className = 'zoom-controls hand-zoom-controls';
    controls.style.position = 'fixed';
    controls.style.bottom = '20px'; // Swap with preview zoom (was 200px)
    controls.style.left = '20px'; // Left side for hand zoom
    controls.style.zIndex = '1000';
    controls.style.display = 'flex';
    controls.style.flexDirection = 'column';
    controls.style.gap = '8px';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'zoom-button';
    zoomInBtn.textContent = '+';
    zoomInBtn.title = 'Zoom In Hand Cards';
    zoomInBtn.onclick = () => this.adjustHandZoom(0.1);

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'zoom-button';
    zoomOutBtn.textContent = '−';
    zoomOutBtn.title = 'Zoom Out Hand Cards';
    zoomOutBtn.onclick = () => this.adjustHandZoom(-0.1);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'zoom-button zoom-display';
    resetBtn.textContent = `${this.handZoomLevel.toFixed(1)}×`;
    resetBtn.title = 'Reset Hand Zoom';
    resetBtn.onclick = () => this.setHandZoom(1);

    controls.appendChild(zoomInBtn);
    controls.appendChild(resetBtn);
    controls.appendChild(zoomOutBtn);

    document.body.appendChild(controls);
    this.zoomControls = controls;
  }

  private adjustHandZoom(delta: number): void {
    const newZoom = Math.max(0.5, Math.min(2.5, this.handZoomLevel + delta));
    this.setHandZoom(newZoom);
  }

  private setHandZoom(zoom: number): void {
    function alignCardsBasedOnSize() {
      const container: HTMLElement | null = document.querySelector('.hand-cards') as HTMLElement;
      if (!container) return;
      console.log('adjusting')
      const isOverflowing = container.scrollHeight > container.clientHeight;
      container.style.alignItems = isOverflowing ? "flex-start" : "center";
    }

    this.handZoomLevel = zoom;
    localStorage.setItem('hand-zoom', zoom.toString());

    // Update the display button text
    if (this.zoomControls) {
      const displayBtn = this.zoomControls.querySelector('.zoom-display');
      if (displayBtn) {
        displayBtn.textContent = `${this.handZoomLevel.toFixed(1)}×`;
      }
    }

    // Re-render React component with new zoom
    this.renderHandComponent();

    setTimeout(() => {
      alignCardsBasedOnSize();
    }, 150);
  }

  private preloadPileImages(pileType: 'deck' | 'exile' | 'discard'): void {
    // Only preload once per pile
    if (this.preloadedPiles.has(pileType)) return;
    this.preloadedPiles.add(pileType);

    // Get cards for this pile
    let cards: Card[] = [];
    if (pileType === 'deck') {
      cards = this.player.getDeckCards();
    } else {
      const state = this.player.getState();
      cards = pileType === 'exile' ? state.exilePile : state.discardPile;
    }

    // Pre-load images by creating hidden img elements
    cards.forEach(card => {
      const imageUrl = card.images?.front?.normal || card.images?.front?.small;
      if (imageUrl) {
        const img = new Image();
        img.src = imageUrl;
        // Browser caches the image automatically
      }
    });
  }

  public destroy(): void {
    if (this.healthRoot) {
      this.healthRoot.unmount();
      this.healthRoot = null;
    }
    if (this.controlsRoot) {
      this.controlsRoot.unmount();
      this.controlsRoot = null;
    }
    if (this.handRoot) {
      this.handRoot.unmount();
      this.handRoot = null;
    }
    if (this.tooltipRoot) {
      this.tooltipRoot.unmount();
      this.tooltipRoot = null;
    }
    if (this.tooltipContainer) {
      this.tooltipContainer.remove();
      this.tooltipContainer = null;
    }
    if (this.scryModalRoot) {
      this.scryModalRoot.unmount();
      this.scryModalRoot = null;
    }
    if (this.scryModalContainer) {
      this.scryModalContainer.remove();
      this.scryModalContainer = null;
    }
    if (this.elements) {
      this.container.innerHTML = '';
      this.elements = null;
    }
    if (this.zoomControls) {
      this.zoomControls.remove();
    }
    // Close all pile viewers
    this.scryViewer.close();
    this.deckViewer.close();
    this.exileViewer.close();
    this.discardViewer.close();
  }
}