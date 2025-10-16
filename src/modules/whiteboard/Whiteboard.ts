import { Card } from '../deck';
import { WhiteboardCard, WhiteboardConfig, DragState } from './types';
import * as Y from 'yjs';

export class Whiteboard {
  private container: HTMLElement;
  private config: WhiteboardConfig;
  private cards: Map<string, WhiteboardCard> = new Map();
  private dragState: DragState = { cardId: null, offsetX: 0, offsetY: 0 };
  private yCards: Y.Map<WhiteboardCard>;
  private maxZIndex: number = 0;

  constructor(
    container: HTMLElement,
    yDoc: Y.Doc,
    config: WhiteboardConfig
  ) {
    this.container = container;
    this.config = config;

    this.yCards = yDoc.getMap('cards');
    this.setupContainer();
    this.setupYjsSync();
    this.attachEventListeners();
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
    }

    this.updateCardPosition(cardElement, card);
  }

  private createCardElement(card: WhiteboardCard): HTMLElement {
    const cardElement = document.createElement('div');
    cardElement.dataset.cardId = card.id;
    cardElement.className = 'card';
    cardElement.style.position = 'absolute';
    cardElement.style.width = '63px';
    cardElement.style.height = '88px';
    cardElement.style.backgroundColor = '#2d2d2d';
    cardElement.style.border = '2px solid #4a4a4a';
    cardElement.style.borderRadius = '8px';
    cardElement.style.cursor = 'grab';
    cardElement.style.userSelect = 'none';
    cardElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';

    // Add card number badge
    const badge = document.createElement('div');
    badge.className = 'card-number-badge-battlefield';
    badge.textContent = `#${card.cardNumber}`;
    cardElement.appendChild(badge);

    cardElement.addEventListener('mousedown', (e) => this.onMouseDown(e, card.id));

    return cardElement;
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

  public destroy(): void {
    this.cards.clear();
    this.container.innerHTML = '';
  }
}