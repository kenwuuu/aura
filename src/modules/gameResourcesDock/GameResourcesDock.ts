import { Player, PlayerState } from '../player';
import { GameResourcesDockConfig } from './types';
import {Card, Deck} from '../deck';
import { DeckPileViewer } from './components';
import { CardPreview } from '../cardPreview';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { HealthDisplay } from '../../components/health/HealthDisplay';
import { HotkeyTooltip } from '../../components/HotkeyTooltip';
import { HotkeyContext } from '../../data/hotkeys';
import { DEFAULT_CARD_BACK } from '../../constants';
import {animate} from "motion";
import { ScryModal } from '../../components/ScryModal';

export class GameResourcesDock {
  private container: HTMLElement;
  private player: Player;
  private config: GameResourcesDockConfig;
  private deckViewer: DeckPileViewer;
  private scryViewer: DeckPileViewer;
  private exileViewer: DeckPileViewer;
  private discardViewer: DeckPileViewer;
  private elements: {
    exile: HTMLElement;
    discard: HTMLElement;
    hand: HTMLElement;
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
  private tooltipRoot: Root | null = null;
  private tooltipContainer: HTMLElement | null = null;
  private scryModalRoot: Root | null = null;
  private scryModalContainer: HTMLElement | null = null;
  private isScryModalOpen: boolean = false;
  private scriedCards: Deck = new Deck({initialCardCount: 0}, []);
  private currentMouseX: number = 0;
  private currentMouseY: number = 0;
  private isMouseDown: boolean = false;
  private isModalOpen: boolean = false;

  constructor(
    container: HTMLElement,
    player: Player,
    config: GameResourcesDockConfig,
    cardPreview: CardPreview
  ) {
    this.container = container;
    this.player = player;
    this.config = config;

    // Initialize all pile viewers with appropriate callbacks
    this.deckViewer = new DeckPileViewer({
      onPlayToBattlefield: (card) => this.handlePileCardToBattlefield(card, 'deck'),
      onMoveToHand: (card) => this.handlePileCardToHand(card, 'deck'),
      onMoveToDiscard: (card) => this.handlePileCardToDiscard(card, 'deck'),
      onMoveToExile: (card) => this.handlePileCardToExile(card, 'deck'),
      onMoveToDeckTop: (card) => this.handlePileCardToDeckTop(card, 'deck'),
      onMoveToDeckBottom: (card) => this.handlePileCardToDeckBottom(card, 'deck'),
    });

    this.scryViewer = new DeckPileViewer({
      onMoveToDiscard: (card) => this.handlePileCardToDiscard(card, 'scry'),
      onMoveToDeckTop: (card) => this.handlePileCardToDeckTop(card, 'scry'),
      onMoveToDeckBottom: (card) => this.handlePileCardToDeckBottom(card, 'scry'),
    });

    this.exileViewer = new DeckPileViewer({
      onPlayToBattlefield: (card) => this.handlePileCardToBattlefield(card, 'exile'),
      onMoveToHand: (card) => this.handlePileCardToHand(card, 'exile'),
      onMoveToDiscard: (card) => this.handlePileCardToDiscard(card, 'exile'),
      onMoveToDeckTop: (card) => this.handlePileCardToDeckTop(card, 'exile'),
      onMoveToDeckBottom: (card) => this.handlePileCardToDeckBottom(card, 'exile'),
    });

    this.discardViewer = new DeckPileViewer({
      onPlayToBattlefield: (card) => this.handlePileCardToBattlefield(card, 'discard'),
      onMoveToHand: (card) => this.handlePileCardToHand(card, 'discard'),
      onMoveToExile: (card) => this.handlePileCardToExile(card, 'discard'),
      onMoveToDeckTop: (card) => this.handlePileCardToDeckTop(card, 'discard'),
      onMoveToDeckBottom: (card) => this.handlePileCardToDeckBottom(card, 'discard'),
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
    const deck = this.createDeckElement();
    const health = this.createHealthElement();

    this.container.appendChild(exile);
    this.container.appendChild(discard);
    this.container.appendChild(hand);
    this.container.appendChild(deck);
    this.container.appendChild(health);

    this.elements = { exile, discard, hand, deck, health };
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
    hand.className = 'hand-container';

    const cards = document.createElement('div');
    cards.className = 'hand-cards';
    cards.dataset.hand = this.config.playerId;

    hand.appendChild(cards);

    return hand;
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

    const scryButton = document.createElement('button');
    scryButton.className = 'draw-button';
    scryButton.textContent = 'Scry';
    scryButton.onclick = (e) => {
      e.stopPropagation();
      this.openScryModal();
    };

    const drawButton = document.createElement('button');
    drawButton.className = 'draw-button';
    drawButton.textContent = 'Draw';
    drawButton.onclick = (e) => {
      e.stopPropagation();
      this.onDrawCard();
    };

    deck.appendChild(labelEl);
    deck.appendChild(count);
    deck.appendChild(scryButton);
    deck.appendChild(drawButton);

    // Add hover event listeners for keyboard shortcuts
    deck.addEventListener('mouseenter', () => {
      this.hoveredResource = 'deck';
      this.hoveredHandCardId = null;
    });

    deck.addEventListener('mouseleave', () => {
      this.hoveredResource = null;
    });

    // Click deck to view it (with search and sort)
    deck.onclick = (e) => {
      if (e.target !== drawButton && e.target !== scryButton) {
        this.viewDeck();
      }
    };

    return deck;
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
        label: 'Life',
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

        const pileType = pile.dataset.pileType;
        if (pileType === 'exile') {
          this.player.moveCardToExile(this.draggedCard.card);
        } else if (pileType === 'discard') {
          this.player.moveCardToDiscard(this.draggedCard.card);
        } else if (pileType === 'deck') {
          this.player.moveCardToDeckTop(this.draggedCard.card);
        }

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
    if (deckCount) deckCount.textContent = state.deckCardCount.toString();

    // Update health React component
    this.renderHealthComponent();

    // Update hand
    this.updateHandDisplay(state.hand);
  }

  private updateHandDisplay(hand: Card[]): void {
    if (!this.elements) return;

    const handCards = this.elements.hand.querySelector('.hand-cards');
    if (!handCards) return;

    handCards.innerHTML = '';

    hand.forEach((card) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'hand-card';
      cardEl.dataset.cardId = card.id;
      cardEl.draggable = true;

      // Apply zoom level to card
      this.applyHandZoomToCard(cardEl);

      // Determine which image to show based on flip state
      const shouldHaveImage = card.isFlipped
        ? (card.images?.back?.normal || DEFAULT_CARD_BACK)
        : card.images?.front?.normal;

      if (shouldHaveImage) {
        const img = document.createElement('img');
        img.src = shouldHaveImage;
        img.alt = card.isFlipped ? 'Card Back' : (card.name || `Card #${card.cardNumber}`);
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.pointerEvents = 'none';
        cardEl.appendChild(img);

        // Add card number badge
        const badge = document.createElement('div');
        badge.className = 'card-number-badge';
        badge.textContent = `#${card.cardNumber}`;
        cardEl.appendChild(badge);
      } else {
        // Fallback: Display card number only (no image available)
        const cardNumber = document.createElement('div');
        cardNumber.className = 'card-number-badge';
        cardNumber.textContent = `#${card.cardNumber}`;
        cardEl.appendChild(cardNumber);
      }

      // Add hover event listeners for keyboard shortcuts, card preview, and tooltip
      cardEl.addEventListener('mouseenter', () => {
        this.hoveredHandCardId = card.id;
        this.hoveredResource = null;
        this.cardPreview.show(card);
        this.updateHotkeyTooltip();
      });

      cardEl.addEventListener('mousemove', (e: MouseEvent) => {
        this.cardPreview.updatePosition(e);
      });

      cardEl.addEventListener('mouseleave', () => {
        this.hoveredHandCardId = null;
        this.cardPreview.hide();
        this.updateHotkeyTooltip();
      });

      // Drag events
      cardEl.addEventListener('dragstart', (e) => {
        this.cardPreview.hide();  // hide card preview to prevent preview bug after dropping
        this.draggedCard = { card, element: cardEl };
        cardEl.classList.add('dragging');

        // Clear hover states to prevent tooltip from showing after drag
        this.hoveredHandCardId = null;
        this.hoveredResource = null;
        this.updateHotkeyTooltip();

        // Center the drag image under the cursor. This helps us place the card in the
        // correct position after dragging to board
        this.setCardDragPoint(cardEl, e);

        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.setData('text/plain', card.id);
      });

      cardEl.addEventListener('dragend', () => {
        cardEl.classList.remove('dragging');
      });

      handCards.appendChild(cardEl);
    });

    animate(handCards.scrollLeft, handCards.scrollWidth - handCards.clientWidth, {  // TODO: animation gets heavy when you draw 40+ cards in hand. we can probably use a compressed image
      duration: 0.3,
      ease: 'easeOut',
      onUpdate(value) {
        handCards.scrollLeft = value;
      }
    });
  }

  private setCardDragPoint(cardEl: HTMLDivElement, e: DragEvent) {
    const userAgent = navigator.userAgent.toLowerCase();
    const rect = cardEl.getBoundingClientRect();
    let offsetX;
    let offsetY;

    // these magic numbers came from dragging a card out of dock and checking that it placed on the board as expected
    if (userAgent.includes("safari") && !userAgent.includes("chrome")) {  // Safari
      offsetX = rect.width / 2;
      offsetY = rect.height / 2;
    } else if (userAgent.includes("firefox")) {  // Firefox
      offsetX = rect.width / 1.3;
      offsetY = rect.height / 1.3;
    } else {  // Chrome and other browsers
      offsetX = rect.width / 1.5;
      offsetY = rect.height / 2;
    }

    e.dataTransfer!.setDragImage(cardEl, offsetX, offsetY);
  }

  private onDrawCard(): void {
    this.player.drawCard();
  }

  private openScryModal(): void {
    const deckCount = this.player.getState().deckCardCount;

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
    const newDeck = [...this.player['deck'].getCards(), ...this.scriedCards.getCards()]
    this.player['deck'].setCards(newDeck);
  }

  private scryCards(count: number): void {
    // Get the top N cards from the deck
    const deckCards = this.player.getDeckCards();
    // Cards are stored bottom-to-top, so we need to slice from the end
    this.scriedCards.setCards(deckCards.slice(-count));
    this.scriedCards.getCards().forEach((card) => {
      this.player['deck'].removeCard(card.id);
    });

    // Show them in the deck viewer
    this.scryViewer.show(this.scriedCards.getCards(), 'scry');
  }

  private viewPile(pileType: 'exile' | 'discard'): void {
    const state = this.player.getState();
    const cards = pileType === 'exile' ? state.exilePile : state.discardPile;
    const viewer = pileType === 'exile' ? this.exileViewer : this.discardViewer;

    viewer.show(cards, pileType);
  }

  private viewDeck(): void {
    const cards = this.player.getDeckCards();
    this.deckViewer.show(cards, 'deck');
  }

  // Handler methods for pile viewer callbacks
  private handlePileCardToBattlefield(card: Card, pileType: 'deck' | 'exile' | 'discard'): void {
    if (pileType === 'deck') {
      // Remove card from deck
      this.player['deck'].removeCard(card.id);
      this.player['yPlayerState'].set('deckCardCount', this.player['deck'].getCardCount());
    } else {
      // Remove from exile or discard pile
      const state = this.player.getState();
      const pile = pileType === 'exile' ? state.exilePile : state.discardPile;
      const index = pile.findIndex(c => c.id === card.id);
      if (index !== -1) {
        pile.splice(index, 1);
        this.player['yPlayerState'].set(pileType === 'exile' ? 'exilePile' : 'discardPile', pile);
      }
    }

    // Dispatch event to play card to battlefield
    const event = new CustomEvent('playCard', {
      detail: { card, playerId: this.player['playerId'] }
    });
    window.dispatchEvent(event);

    // Update viewer with new card list
    this.updatePileViewer(pileType);
  }

  private handlePileCardToHand(card: Card, pileType: 'deck' | 'exile' | 'discard'): void {
    if (pileType === 'deck') {
      // Remove card from deck
      this.player['deck'].removeCard(card.id);
      this.player['yPlayerState'].set('deckCardCount', this.player['deck'].getCardCount());
    } else {
      // Remove from exile or discard pile
      const state = this.player.getState();
      const pile = pileType === 'exile' ? state.exilePile : state.discardPile;
      const index = pile.findIndex(c => c.id === card.id);
      if (index !== -1) {
        pile.splice(index, 1);
        // TODO: add remove from top/bottom functions to PileViewer or whatever class this is
        this.player['yPlayerState'].set(pileType === 'exile' ? 'exilePile' : 'discardPile', pile);
      }
    }

    this.player.putCardInHand(card);

    // Update viewer with new card list
    this.updatePileViewer(pileType);
  }

  private handlePileCardToExile(card: Card, pileType: 'discard' | 'deck'): void {
    const state = this.player.getState();

    if (pileType === 'deck') {
      // Remove from deck (local)
      this.player['deck'].removeCard(card.id);
    } else if (pileType === 'discard') {
      // Remove from discard pile
      const pile = state.discardPile;
      const index = pile.findIndex(c => c.id === card.id);
      if (index !== -1) {
        pile.splice(index, 1);
        this.player['yPlayerState'].set('discardPile', pile);
      }
    }

    this.player.moveCardToExile(card);

    // Update viewer with new card list
    this.updatePileViewer(pileType);
  }

  private handlePileCardToDiscard(card: Card, pileType: 'exile' | 'deck' | 'scry'): void {
    const state = this.player.getState();

    if (pileType === 'deck') {
      // Remove from deck (local)
      this.player['deck'].removeCard(card.id);
    } else if (pileType === 'scry') {
      this.scriedCards.removeCard(card.id);
    } else if (pileType === 'exile') {
      // Remove from exile pile
      const pile = state.exilePile;
      const index = pile.findIndex(c => c.id === card.id);
      if (index !== -1) {
        pile.splice(index, 1);
        this.player['yPlayerState'].set('exilePile', pile);
      }
    }

    this.player.moveCardToDiscard(card);

    // Update viewer with new card list
    this.updatePileViewer(pileType);
  }

  private handlePileCardToDeckTop(card: Card, pileType: 'exile' | 'discard' | 'deck' | 'scry'): void {
    const state = this.player.getState();

    if (pileType === 'deck') {
      // Remove from deck (local) and add back to top
      this.player['deck'].removeCard(card.id);
    } else if (pileType === 'scry') {
      this.scriedCards.removeCard(card.id);
    } else {
      // Remove from exile or discard pile
      const pile = pileType === 'exile' ? state.exilePile : state.discardPile;
      const index = pile.findIndex(c => c.id === card.id);
      if (index !== -1) {
        pile.splice(index, 1);
        this.player['yPlayerState'].set(pileType === 'exile' ? 'exilePile' : 'discardPile', pile);
      }
    }

    this.player.moveCardToDeckTop(card);

    // Update viewer with new card list
    this.updatePileViewer(pileType);
  }

  private handlePileCardToDeckBottom(card: Card, pileType: 'exile' | 'discard' | 'deck' | 'scry'): void {
    const state = this.player.getState();

    if (pileType === 'deck') {
      // Remove from deck (local) and add back to bottom
      this.player['deck'].removeCard(card.id);
    } else if (pileType === 'scry') {
      this.scriedCards.removeCard(card.id);
    } else {
      // Remove from exile or discard pile
      const pile = pileType === 'exile' ? state.exilePile : state.discardPile;
      const index = pile.findIndex(c => c.id === card.id);
      if (index !== -1) {
        pile.splice(index, 1);
        this.player['yPlayerState'].set(pileType === 'exile' ? 'exilePile' : 'discardPile', pile);
      }
    }

    this.player.moveCardToDeckBottom(card);

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
          const hand = this.player.getState().hand;
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
          return cards.length > 0 ? cards[cards.length - 1] : null;
        },
        playHandCardToBattlefield: (cardId: string) => {
          const hand = this.player.getState().hand;
          const card = hand.find(c => c.id === cardId);
          if (card) {
            this.player.removeCardFromHand(cardId);
          }
        },
        moveHandCardToDiscard: (cardId: string) => {
          const hand = this.player.getState().hand;
          const card = hand.find(c => c.id === cardId);
          if (card) {
            this.player.moveCardToDiscard(card);
            this.player.removeCardFromHand(cardId);
          }
        },
        moveHandCardToExile: (cardId: string) => {
          const hand = this.player.getState().hand;
          const card = hand.find(c => c.id === cardId);
          if (card) {
            this.player.moveCardToExile(card);
            this.player.removeCardFromHand(cardId);
          }
        },
        moveHandCardToDeckTop: (cardId: string) => {
          const hand = this.player.getState().hand;
          const card = hand.find(c => c.id === cardId);
          if (card) {
            this.player.moveCardToDeckTop(card);
            this.player.removeCardFromHand(cardId);
          }
        },
        moveHandCardToDeckBottom: (cardId: string) => {
          const hand = this.player.getState().hand;
          const card = hand.find(c => c.id === cardId);
          if (card) {
            this.player.moveCardToDeckBottom(card);
            this.player.removeCardFromHand(cardId);
          }
        },
        flipHandCard: (cardId: string) => {
          const hand = this.player.getState().hand;
          const card = hand.find(c => c.id === cardId);
          if (card) {
            // Toggle flip state
            const updatedCard = { ...card, isFlipped: !card.isFlipped };
            const updatedHand = hand.map(c => c.id === cardId ? updatedCard : c);
            this.player['yPlayerState'].set('hand', updatedHand);
          }
        },
        movePileCardToBattlefield: (card: Card, pileType: 'deck' | 'exile' | 'discard') => {
          if (pileType === 'deck') {
            const drawnCard = this.player.drawCard();
            if (drawnCard) {
              const event = new CustomEvent('playCard', {
                detail: { card: drawnCard, playerId: this.player['playerId'] }
              });
              window.dispatchEvent(event);
            }
          } else {
            // Remove from pile and play
            const state = this.player.getState();
            let pile: Card[] = pileType === 'exile' ? state.exilePile : state.discardPile;
            const index = pile.findIndex(c => c.id === card.id);
            if (index !== -1) {
              pile.splice(index, 1);
              this.player['yPlayerState'].set(pileType === 'exile' ? 'exilePile' : 'discardPile', pile);

              const event = new CustomEvent('playCard', {
                detail: { card, playerId: this.player['playerId'] }
              });
              window.dispatchEvent(event);
            }
          }
        },
        movePileCardToHand: (card: Card, pileType: 'deck' | 'exile' | 'discard') => {
          if (pileType === 'deck') {
            this.player.drawCard();
          } else {
            const state = this.player.getState();
            let pile: Card[] = pileType === 'exile' ? state.exilePile : state.discardPile;
            const index = pile.findIndex(c => c.id === card.id);
            if (index !== -1) {
              pile.splice(index, 1);
              this.player['yPlayerState'].set(pileType === 'exile' ? 'exilePile' : 'discardPile', pile);

              const hand = this.player.getState().hand;
              this.player['yPlayerState'].set('hand', [...hand, card]);
            }
          }
        },
        movePileCardToExile: (card: Card, pileType: 'deck' | 'exile' | 'discard') => {
          if (pileType === 'exile') return; // Already in exile

          if (pileType === 'deck') {
            // Remove from deck and move to exile directly (don't draw to hand first)
            this.player['deck'].removeCard(card.id);
            this.player['yPlayerState'].set('deckCardCount', this.player['deck'].getCardCount());
            this.player.moveCardToExile(card);
          } else {
            const state = this.player.getState();
            let pile: Card[] = state.discardPile;
            const index = pile.findIndex(c => c.id === card.id);
            if (index !== -1) {
              pile.splice(index, 1);
              this.player['yPlayerState'].set('discardPile', pile);
              this.player.moveCardToExile(card);
            }
          }
        },
        movePileCardToDiscard: (card: Card, pileType: 'deck' | 'exile' | 'discard') => {
          if (pileType === 'discard') return; // Already in discard

          if (pileType === 'deck') {
            // Remove from deck and move to discard directly (don't draw to hand first)
            this.player['deck'].removeCard(card.id);
            this.player['yPlayerState'].set('deckCardCount', this.player['deck'].getCardCount());
            this.player.moveCardToDiscard(card);
          } else {
            const state = this.player.getState();
            let pile: Card[] = state.exilePile;
            const index = pile.findIndex(c => c.id === card.id);
            if (index !== -1) {
              pile.splice(index, 1);
              this.player['yPlayerState'].set('exilePile', pile);
              this.player.moveCardToDiscard(card);
            }
          }
        },
        movePileCardToDeckTop: (card: Card, pileType: 'deck' | 'exile' | 'discard') => {
          if (pileType === 'deck') return; // Already in deck

          const state = this.player.getState();
          let pile: Card[] = pileType === 'exile' ? state.exilePile : state.discardPile;
          const index = pile.findIndex(c => c.id === card.id);
          if (index !== -1) {
            pile.splice(index, 1);
            this.player['yPlayerState'].set(pileType === 'exile' ? 'exilePile' : 'discardPile', pile);
            this.player.moveCardToDeckTop(card);
          }
        },
        movePileCardToDeckBottom: (card: Card, pileType: 'deck' | 'exile' | 'discard') => {
          if (pileType === 'deck') return; // Already in deck

          const state = this.player.getState();
          let pile: Card[] = pileType === 'exile' ? state.exilePile : state.discardPile;
          const index = pile.findIndex(c => c.id === card.id);
          if (index !== -1) {
            pile.splice(index, 1);
            this.player['yPlayerState'].set(pileType === 'exile' ? 'exilePile' : 'discardPile', pile);
            this.player.moveCardToDeckBottom(card);
          }
        }
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
    this.handZoomLevel = zoom;
    localStorage.setItem('hand-zoom', zoom.toString());

    // Update the display button text
    if (this.zoomControls) {
      const displayBtn = this.zoomControls.querySelector('.zoom-display');
      if (displayBtn) {
        displayBtn.textContent = `${this.handZoomLevel.toFixed(1)}×`;
      }
    }

    // Re-render hand with new zoom
    const state = this.player.getState();
    this.updateHandDisplay(state.hand);
  }

  private applyHandZoomToCard(cardEl: HTMLElement): void {
    const baseWidth = 63;
    const baseHeight = 88;
    const width = baseWidth * this.handZoomLevel;
    const height = baseHeight * this.handZoomLevel;

    cardEl.style.width = `${width}px`;
    cardEl.style.height = `${height}px`;
  }

  public destroy(): void {
    if (this.healthRoot) {
      this.healthRoot.unmount();
      this.healthRoot = null;
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