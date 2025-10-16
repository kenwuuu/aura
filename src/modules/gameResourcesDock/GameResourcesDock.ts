import { Player, PlayerState } from '../player';
import { GameResourcesDockConfig } from './types';
import { Card } from '../deck';
import { PileViewer } from './PileViewer';

export class GameResourcesDock {
  private container: HTMLElement;
  private player: Player;
  private config: GameResourcesDockConfig;
  private pileViewer: PileViewer;
  private elements: {
    exile: HTMLElement;
    discard: HTMLElement;
    hand: HTMLElement;
    deck: HTMLElement;
    health: HTMLElement;
  } | null = null;
  private draggedCard: { card: Card; element: HTMLElement } | null = null;

  constructor(
    container: HTMLElement,
    player: Player,
    config: GameResourcesDockConfig
  ) {
    this.container = container;
    this.player = player;
    this.config = config;
    this.pileViewer = new PileViewer();

    this.render();
    this.setupEventListeners();
    this.setupDragDropZones();
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

    // Click to view pile
    pile.onclick = () => this.viewPile(type as 'exile' | 'discard');

    return pile;
  }

  private createHandElement(): HTMLElement {
    const hand = document.createElement('div');
    hand.className = 'hand-container';

    const label = document.createElement('div');
    label.className = 'hand-label';
    label.textContent = 'Hand';

    const cards = document.createElement('div');
    cards.className = 'hand-cards';
    cards.dataset.hand = this.config.playerId;

    hand.appendChild(label);
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

    const drawButton = document.createElement('button');
    drawButton.className = 'draw-button';
    drawButton.textContent = 'Draw';
    drawButton.onclick = (e) => {
      e.stopPropagation();
      this.onDrawCard();
    };

    deck.appendChild(labelEl);
    deck.appendChild(count);
    deck.appendChild(drawButton);

    // Click deck to view it
    deck.onclick = (e) => {
      if (e.target !== drawButton) {
        this.viewPile('deck');
      }
    };

    return deck;
  }

  private createHealthElement(): HTMLElement {
    const health = document.createElement('div');
    health.className = 'health-container';

    const label = document.createElement('div');
    label.className = 'health-label';
    label.textContent = 'Life';

    const value = document.createElement('div');
    value.className = 'health-value';
    value.textContent = '20';

    const controls = document.createElement('div');
    controls.className = 'health-controls';

    const decrementBtn = document.createElement('button');
    decrementBtn.textContent = '-';
    decrementBtn.onclick = () => this.player.modifyHealth(-1);

    const incrementBtn = document.createElement('button');
    incrementBtn.textContent = '+';
    incrementBtn.onclick = () => this.player.modifyHealth(1);

    controls.appendChild(decrementBtn);
    controls.appendChild(incrementBtn);

    health.appendChild(label);
    health.appendChild(value);
    health.appendChild(controls);

    return health;
  }

  private setupEventListeners(): void {
    this.player.onStateChange((state) => {
      this.updateUI(state);
    });

    // Initial update
    this.updateUI(this.player.getState());
  }

  private setupDragDropZones(): void {
    if (!this.elements) return;

    // Setup drop zones for exile and discard
    [this.elements.exile, this.elements.discard].forEach((pile) => {
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
        }

        // Remove the dragged card from hand
        this.player.playCardFromHand(this.draggedCard.card.id);
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

    // Update health
    const healthValue = this.elements.health.querySelector('.health-value');
    if (healthValue) healthValue.textContent = state.health.toString();

    // Update hand
    this.updateHandDisplay(state.hand);
  }

  private updateHandDisplay(hand: Card[]): void {
    if (!this.elements) return;

    const handCards = this.elements.hand.querySelector('.hand-cards');
    if (!handCards) return;

    handCards.innerHTML = '';

    hand.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'hand-card';
      cardEl.dataset.cardId = card.id;
      cardEl.draggable = true;

      // Display card number
      const cardNumber = document.createElement('div');
      cardNumber.className = 'card-number-badge';
      cardNumber.textContent = `#${card.cardNumber}`;

      cardEl.appendChild(cardNumber);

      // Drag events
      cardEl.addEventListener('dragstart', (e) => {
        this.draggedCard = { card, element: cardEl };
        cardEl.classList.add('dragging');
        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.setData('text/plain', card.id);
      });

      cardEl.addEventListener('dragend', () => {
        cardEl.classList.remove('dragging');
      });

      handCards.appendChild(cardEl);
    });
  }

  private onDrawCard(): void {
    this.player.drawCard();
  }

  private viewPile(pileType: 'deck' | 'exile' | 'discard'): void {
    const state = this.player.getState();
    let cards: Card[] = [];

    switch (pileType) {
      case 'deck':
        cards = this.player.getDeckCards();
        break;
      case 'exile':
        cards = state.exilePile;
        break;
      case 'discard':
        cards = state.discardPile;
        break;
    }

    this.pileViewer.show(cards, pileType);
  }

  public destroy(): void {
    if (this.elements) {
      this.container.innerHTML = '';
      this.elements = null;
    }
    this.pileViewer.close();
  }
}