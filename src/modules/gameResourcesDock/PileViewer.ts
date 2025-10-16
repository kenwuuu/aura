import { Card } from '../deck';

export type PileType = 'deck' | 'discard' | 'exile';

export class PileViewer {
  private modal: HTMLElement | null = null;
  private onCardSelect: ((card: Card) => void) | null = null;

  public show(
    cards: Card[],
    pileType: PileType,
    onSelect?: (card: Card) => void
  ): void {
    this.onCardSelect = onSelect || null;
    this.modal = this.createModal(cards, pileType);
    document.body.appendChild(this.modal);

    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
  }

  private createModal(cards: Card[], pileType: PileType): HTMLElement {
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
      case 'discard':
        return 'Discard Pile';
      case 'exile':
        return 'Exile Pile';
    }
  }

  public close(): void {
    if (this.modal && this.modal.parentElement) {
      this.modal.parentElement.removeChild(this.modal);
      this.modal = null;
      this.onCardSelect = null;
    }
  }
}