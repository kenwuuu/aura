import { Card } from '../deck';

export type PileType = 'deck' | 'discard' | 'exile' | 'deck-search';

export class PileViewer {
  private modal: HTMLElement | null = null;
  private onCardSelect: ((card: Card) => void) | null = null;
  private onPlayToBattlefield?: (card: Card) => void;
  private onMoveToHand?: (card: Card) => void;
  private hoveredCardId: string | null = null;

  public show(
    cards: Card[],
    pileType: PileType,
    callbacks?: {
      onSelect?: (card: Card) => void;
      onPlayToBattlefield?: (card: Card) => void;
      onMoveToHand?: (card: Card) => void;
    }
  ): void {
    this.onCardSelect = callbacks?.onSelect || null;
    this.onPlayToBattlefield = callbacks?.onPlayToBattlefield;
    this.onMoveToHand = callbacks?.onMoveToHand;
    this.modal = this.createModal(cards, pileType);
    document.body.appendChild(this.modal);

    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Setup keyboard shortcuts for all pile viewers
    this.attachKeyboardListeners(pileType);
  }

  private attachKeyboardListeners(pileType: PileType): void {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Escape key always closes the modal
      if (key === 'escape') {
        e.preventDefault();
        this.close();
        return;
      }

      // Card-specific shortcuts (require hover)
      if (!this.hoveredCardId) return;

      const card = this.findCardById(this.hoveredCardId);
      if (!card) return;

      // Z key - play to battlefield (for deck-search mode)
      if (key === 'z' && this.onPlayToBattlefield) {
        e.preventDefault();
        this.onPlayToBattlefield(card);
        // Close modal for all types except deck-search
        if (pileType !== 'deck-search') {
          this.close();
        }
      }

      // H key - move to hand (for deck-search mode)
      if (key === 'h' && this.onMoveToHand) {
        e.preventDefault();
        this.onMoveToHand(card);
        // Don't close modal for deck-search mode
      }

      // D key - move to graveyard
      if (key === 'd') {
        e.preventDefault();
        // Dispatch event to handle card movement
        const event = new CustomEvent('pileViewerCardToDiscard', { detail: { card } });
        window.dispatchEvent(event);
      }

      // S key - move to exile
      if (key === 's') {
        e.preventDefault();
        const event = new CustomEvent('pileViewerCardToExile', { detail: { card } });
        window.dispatchEvent(event);
      }
    };

    document.addEventListener('keydown', handler);

    // Store handler for cleanup
    if (this.modal) {
      (this.modal as any)._keyHandler = handler;
    }
  }

  private currentCards: Card[] = [];

  private findCardById(cardId: string): Card | null {
    return this.currentCards.find(c => c.id === cardId) || null;
  }

  private createModal(cards: Card[], pileType: PileType): HTMLElement {
    this.currentCards = cards;
    const modal = document.createElement('div');
    modal.className = 'pile-viewer-modal';

    const content = document.createElement('div');
    content.className = 'pile-viewer-content';

    const header = document.createElement('div');
    header.className = 'pile-viewer-header';

    const title = document.createElement('h2');
    title.textContent = this.getPileTitle(pileType);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'pile-viewer-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => this.close();

    header.appendChild(title);
    header.appendChild(closeBtn);

    const grid = document.createElement('div');
    grid.className = 'pile-viewer-grid';

    if (cards.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'pile-viewer-empty';
      empty.textContent = 'No cards';
      grid.appendChild(empty);
    } else {
      // Show cards from top to bottom (reverse array for display)
      const displayCards = pileType === 'deck' ? [...cards].reverse() : cards;
      displayCards.forEach((card, index) => {
        const cardEl = this.createCardElement(card, index, pileType);
        grid.appendChild(cardEl);
      });
    }

    content.appendChild(header);
    content.appendChild(grid);
    modal.appendChild(content);

    return modal;
  }

  private createCardElement(
    card: Card,
    position: number,
    pileType: PileType
  ): HTMLElement {
    const cardEl = document.createElement('div');
    cardEl.className = 'pile-viewer-card';
    cardEl.dataset.cardId = card.id;

    const number = document.createElement('div');
    number.className = 'pile-viewer-card-number';
    number.textContent = `#${card.cardNumber}`;

    const positionLabel = document.createElement('div');
    positionLabel.className = 'pile-viewer-card-position';
    positionLabel.textContent = pileType === 'deck' ? `Top ${position + 1}` : `${position + 1}`;

    cardEl.appendChild(number);
    cardEl.appendChild(positionLabel);

    // Track hover for keyboard shortcuts
    cardEl.addEventListener('mouseenter', () => {
      this.hoveredCardId = card.id;
    });

    cardEl.addEventListener('mouseleave', () => {
      this.hoveredCardId = null;
    });

    if (this.onCardSelect) {
      cardEl.style.cursor = 'pointer';
      cardEl.onclick = () => {
        if (this.onCardSelect) {
          this.onCardSelect(card);
          this.close();
        }
      };
    }

    return cardEl;
  }

  private getPileTitle(pileType: PileType): string {
    switch (pileType) {
      case 'deck':
        return 'Deck (Top to Bottom)';
      case 'deck-search':
        return 'Search Deck (Z: Play, H: Hand)';
      case 'discard':
        return 'Discard Pile';
      case 'exile':
        return 'Exile Pile';
    }
  }

  public close(): void {
    if (this.modal) {
      // Clean up keyboard handler
      const handler = (this.modal as any)._keyHandler;
      if (handler) {
        document.removeEventListener('keydown', handler);
      }

      if (this.modal.parentElement) {
        this.modal.parentElement.removeChild(this.modal);
      }
      this.modal = null;
      this.onCardSelect = null;
      this.onPlayToBattlefield = undefined;
      this.onMoveToHand = undefined;
      this.hoveredCardId = null;
    }
  }
}