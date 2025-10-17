import { Card } from '../deck';
import { WhiteboardCard, WhiteboardConfig, DragState } from './types';
import { KeyboardHandler, KeyboardHandlerCallbacks } from './KeyboardHandler';
import { CardPreview } from '../cardPreview';
import * as Y from 'yjs';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Counter } from '../../components';

export class Whiteboard {
  private container: HTMLElement;
  private config: WhiteboardConfig;
  private cards: Map<string, WhiteboardCard> = new Map();
  private dragState: DragState = { cardId: null, offsetX: 0, offsetY: 0 };
  private yCards: Y.Map<WhiteboardCard>;
  private maxZIndex: number = 0;
  private keyboardHandler: KeyboardHandler;
  private keyboardCallbacks?: KeyboardHandlerCallbacks;
  private zoomLevel: number = 1;
  private zoomControls?: HTMLElement;
  private cardPreview: CardPreview;

  constructor(
    container: HTMLElement,
    yDoc: Y.Doc,
    config: WhiteboardConfig
  ) {
    this.container = container;
    this.config = config;

    this.yCards = yDoc.getMap('cards');
    this.zoomLevel = parseFloat(localStorage.getItem('whiteboard-zoom') || '1');
    this.cardPreview = new CardPreview();
    this.setupContainer();
    this.setupZoomControls();
    this.setupYjsSync();
    this.attachEventListeners();

    // Initialize keyboard handler with empty callbacks (will be set by app)
    this.keyboardHandler = new KeyboardHandler(this.yCards, {
      onMoveToHand: () => {},
      onMoveToDeckTop: () => {},
      onMoveToDeckBottom: () => {},
      onMoveToGraveyard: () => {},
      onMoveToExile: () => {},
      onDrawCard: () => {},
      onShuffleDeck: () => {},
      onUntapAll: () => {},
      onEndTurn: () => {},
    });
  }

  public setKeyboardCallbacks(callbacks: KeyboardHandlerCallbacks): void {
    this.keyboardCallbacks = callbacks;
    this.keyboardHandler = new KeyboardHandler(this.yCards, callbacks);
  }

  private setupContainer(): void {
    this.container.style.backgroundColor = this.config.backgroundColor;
    this.container.style.width = `${this.config.width}px`;
    this.container.style.height = `${this.config.height}px`;
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
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
      this.updateCardElement(card);
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

  // Transform coordinates for opponent's view
  private transformCoordinates(card: WhiteboardCard): { x: number; y: number } {
    if (card.ownerId === this.config.localPlayerId) {
      // Local player's cards stay as-is
      return { x: card.x, y: card.y };
    } else {
      // Opponent's cards are mirrored vertically only (not horizontally)
      // Left/right stays the same, but top becomes bottom
      return {
        x: card.x, // Keep X the same
        // y: this.config.height - card.y - 88, // Flip Y axis only (88 is card height)
        y: card.y, // Flip Y axis only (88 is card height)
      };
    }
  }

  private updateCardElement(card: WhiteboardCard): void {
    this.cards.set(card.id, card);

    let cardElement = this.container.querySelector(
      `[data-card-id="${card.id}"]`
    ) as HTMLElement;

    if (!cardElement) {
      cardElement = this.createCardElement(card);
      this.container.appendChild(cardElement);
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
    const baseWidth = 63;
    const baseHeight = 88;
    const width = baseWidth * this.zoomLevel;
    const height = baseHeight * this.zoomLevel;

    const cardElement = document.createElement('div');
    cardElement.dataset.cardId = card.id;
    cardElement.className = 'card';
    cardElement.style.position = 'absolute';
    cardElement.style.width = `${width}px`;
    cardElement.style.height = `${height}px`;
    cardElement.style.cursor = 'grab';
    cardElement.style.userSelect = 'none';
    cardElement.style.overflow = 'hidden';

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
      img.style.pointerEvents = 'none';
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

    // Track hover for keyboard shortcuts and card preview
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

  private createCounterElement(card: WhiteboardCard, index: number, value: number): HTMLElement {
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
    const { x, y } = this.transformCoordinates(card);
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.transform = `rotate(${card.rotation}deg) ${card.isTapped ? 'rotate(90deg)' : ''}`;
    element.style.zIndex = card.zIndex.toString();
  }

  private removeCardElement(cardId: string): void {
    this.cards.delete(cardId);
    const cardElement = this.container.querySelector(`[data-card-id="${cardId}"]`);
    if (cardElement) {
      cardElement.remove();
    }
  }

  private onMouseDown(e: MouseEvent, cardId: string): void {
    e.preventDefault();
    const card = this.cards.get(cardId);
    if (!card) return;

    this.dragState = {
      cardId,
      offsetX: e.clientX - card.x,
      offsetY: e.clientY - card.y,
    };

    // Bring card to front
    const updatedCard = { ...card, zIndex: ++this.maxZIndex };
    this.yCards.set(cardId, updatedCard);

    const cardElement = this.container.querySelector(
      `[data-card-id="${cardId}"]`
    ) as HTMLElement;
    if (cardElement) {
      cardElement.style.cursor = 'grabbing';
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.dragState.cardId) return;

    const card = this.cards.get(this.dragState.cardId);
    if (!card) return;

    const x = e.clientX - this.dragState.offsetX;
    const y = e.clientY - this.dragState.offsetY;

    const updatedCard = { ...card, x, y };
    this.yCards.set(this.dragState.cardId, updatedCard);
  }

  private onMouseUp(): void {
    if (this.dragState.cardId) {
      const cardElement = this.container.querySelector(
        `[data-card-id="${this.dragState.cardId}"]`
      ) as HTMLElement;
      if (cardElement) {
        cardElement.style.cursor = 'grab';
      }
    }

    this.dragState = { cardId: null, offsetX: 0, offsetY: 0 };
  }

  private attachEventListeners(): void {
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('mouseup', () => this.onMouseUp());
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
    resetBtn.className = 'zoom-button';
    resetBtn.textContent = '1×';
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

  private setZoom(zoom: number): void {
    this.zoomLevel = zoom;
    localStorage.setItem('whiteboard-zoom', zoom.toString());

    // Update all card sizes
    this.cards.forEach((card) => {
      const cardElement = this.container.querySelector(
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
    this.container.innerHTML = '';
    if (this.zoomControls) {
      this.zoomControls.remove();
    }
  }
}