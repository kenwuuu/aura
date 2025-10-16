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
  private hoveredHandCardId: string | null = null;
  private hoveredPileType: 'deck' | 'exile' | 'discard' | null = null;

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
    this.setupKeyboardShortcuts();
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

    // Hover tracking for keyboard shortcuts
    pile.addEventListener('mouseenter', () => {
      this.hoveredPileType = type as 'deck' | 'exile' | 'discard';
      this.hoveredHandCardId = null;
    });

    pile.addEventListener('mouseleave', () => {
      this.hoveredPileType = null;
    });

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

    const searchButton = document.createElement('button');
    searchButton.className = 'draw-button';
    searchButton.textContent = 'Search';
    searchButton.onclick = (e) => {
      e.stopPropagation();
      this.searchDeck();
    };

    deck.appendChild(labelEl);
    deck.appendChild(count);
    deck.appendChild(drawButton);
    deck.appendChild(searchButton);

    // Click deck to view it
    deck.onclick = (e) => {
      if (e.target !== drawButton && e.target !== searchButton) {
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

      // Hover tracking for keyboard shortcuts
      cardEl.addEventListener('mouseenter', () => {
        this.hoveredHandCardId = card.id;
        this.hoveredPileType = null;
      });

      cardEl.addEventListener('mouseleave', () => {
        this.hoveredHandCardId = null;
      });

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

  private searchDeck(): void {
    const cards = this.player.getDeckCards();

    this.pileViewer.show(cards, 'deck-search', {
      onPlayToBattlefield: (card) => {
        // Remove card from deck
        this.player['deck'].removeCard(card.id);
        this.player['yPlayerState'].set('deckCardCount', this.player['deck'].getCardCount());

        // Dispatch event to play card to battlefield
        const event = new CustomEvent('playCard', {
          detail: { card, playerId: this.player['playerId'] }
        });
        window.dispatchEvent(event);
      },
      onMoveToHand: (card) => {
        // Remove card from deck
        this.player['deck'].removeCard(card.id);
        this.player['yPlayerState'].set('deckCardCount', this.player['deck'].getCardCount());

        // Add to hand
        const hand = this.player.getState().hand;
        this.player['yPlayerState'].set('hand', [...hand, card]);
      }
    });
  }

  private setupKeyboardShortcuts(): void {
    // Expose hover state for external keyboard handlers
    (window as any).getGameResourcesDockHoverState = () => {
      return {
        hoveredHandCardId: this.hoveredHandCardId,
        hoveredPileType: this.hoveredPileType,
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
            this.player.playCardFromHand(cardId);
          }
        },
        moveHandCardToDiscard: (cardId: string) => {
          const hand = this.player.getState().hand;
          const card = hand.find(c => c.id === cardId);
          if (card) {
            this.player.moveCardToDiscard(card);
            this.player.playCardFromHand(cardId);
          }
        },
        moveHandCardToExile: (cardId: string) => {
          const hand = this.player.getState().hand;
          const card = hand.find(c => c.id === cardId);
          if (card) {
            this.player.moveCardToExile(card);
            this.player.playCardFromHand(cardId);
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
        }
      };
    };
  }

  public destroy(): void {
    if (this.elements) {
      this.container.innerHTML = '';
      this.elements = null;
    }
    this.pileViewer.close();
  }
}