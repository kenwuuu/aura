/**
 * DeckPileViewer Component
 *
 * General-purpose pile viewer for deck, exile, and discard piles with:
 * - Card images
 * - Search by card name
 * - Sort by top-to-bottom or alphabetical
 * - Keyboard shortcuts (Z, H, D, S, T, Y)
 *
 * IMPORTANT: Card Order Assumption
 * ================================
 * This component assumes cards are stored in the deck array in BOTTOM-TO-TOP order
 * (i.e., deck[0] = bottom card, deck[deck.length - 1] = top card).
 *
 * Because the app draws cards from the END of the array (via LIFO/pop semantics),
 * we must REVERSE the array to display cards in TOP-TO-BOTTOM order.
 *
 * This reversal happens in two places:
 * 1. show() method (line 49): Initial display reverses the cards
 * 2. filterAndSort() method (line 180): Search/sort operations also reverse for top-to-bottom mode
 *
 * If the deck storage order changes in the future (e.g., switching to top-to-bottom storage),
 * you MUST remove both .reverse() calls to prevent displaying cards in the wrong order.
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Card } from '../../deck';
import { SearchBar } from './SearchBar';
import { SortControl } from './SortControl';
import { CardGridItem } from './CardGridItem';

export type PileType = 'deck' | 'exile' | 'discard' | 'hand';

export interface DeckPileViewerCallbacks {
  onPlayToBattlefield?: (card: Card) => void;
  onMoveToHand?: (card: Card) => void;
  onMoveToExile?: (card: Card) => void;
  onMoveToDiscard?: (card: Card) => void;
  onMoveToDeckTop?: (card: Card) => void;
  onMoveToDeckBottom?: (card: Card) => void;
}

export class DeckPileViewer {
  private modal: HTMLElement | null = null;
  private callbacks: DeckPileViewerCallbacks;
  private allCards: Card[] = [];
  private filteredCards: Card[] = [];
  private hoveredCard: Card | null = null;
  private pileType: PileType = 'deck';

  // Components
  private searchBar: SearchBar | null = null;
  private sortControl: SortControl | null = null;
  private gridContainer: HTMLElement | null = null;

  // Tooltip
  private tooltipRoot: Root | null = null;
  private tooltipContainer: HTMLElement | null = null;
  private hoverTimeout: number | null = null;
  private hideTimeout: number | null = null;
  private isTooltipHovered: boolean = false;
  private tooltipCardId: string | null = null;
  private currentMouseX: number = 0;
  private currentMouseY: number = 0;
  private clickOutsideHandler: ((e: MouseEvent) => void) | null = null;

  // Current state
  private currentSortOrder: string = 'top-to-bottom';
  private currentSearchQuery: string = '';

  constructor(callbacks: DeckPileViewerCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public show(cards: Card[], pileType: PileType): void {
    this.allCards = cards;
    this.pileType = pileType;
    this.currentSearchQuery = '';
    this.currentSortOrder = 'top-to-bottom';
    this.filteredCards = [...cards].reverse();

    this.modal = this.createModal();
    document.body.appendChild(this.modal);

    this.setupTooltip();
    this.attachGlobalListeners();
    this.renderCards();
  }

  public updateCards(cards: Card[]): void {
    this.allCards = cards;
    this.filterAndSort();
  }

  private createModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'deck-pile-viewer-modal';

    const content = document.createElement('div');
    content.className = 'deck-pile-viewer-content';

    // Header
    const header = this.createHeader();
    content.appendChild(header);

    // Controls (search + sort)
    const controls = this.createControls();
    content.appendChild(controls);

    // Card grid
    this.gridContainer = document.createElement('div');
    this.gridContainer.className = 'deck-pile-viewer-grid';
    content.appendChild(this.gridContainer);

    modal.appendChild(content);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close();
      }
    });

    return modal;
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'deck-pile-viewer-header';

    const title = document.createElement('h2');

    // Set title based on pile type
    if (this.pileType === 'deck') {
      title.textContent = 'Search Deck';
    } else if (this.pileType === 'exile') {
      title.textContent = 'Exile Pile';
    } else if (this.pileType === 'discard') {
      title.textContent = 'Discard Pile';
    } else if (this.pileType === 'hand') {
      title.textContent = "Opponent's Hand";
    }

    header.appendChild(title);



    const closeBtn = document.createElement('button');
    closeBtn.className = 'deck-pile-viewer-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => this.close();

    header.appendChild(closeBtn);

    return header;
  }

  private createControls(): HTMLElement {
    const controls = document.createElement('div');
    controls.className = 'deck-pile-viewer-controls';

    // Search bar
    this.searchBar = new SearchBar({
      placeholder: 'Search by card name...',
      onSearch: (query) => {
        this.currentSearchQuery = query;
        this.filterAndSort();
      },
    });

    // Sort control
    this.sortControl = new SortControl({
      options: [
        { value: 'top-to-bottom', label: 'Top to Bottom' },
        { value: 'bottom-to-top', label: 'Bottom to Top' },
        { value: 'alphabetical', label: 'Alphabetical' },
      ],
      defaultValue: 'top-to-bottom',
      onSortChange: (value) => {
        this.currentSortOrder = value;
        this.filterAndSort();
      },
    });

    controls.appendChild(this.searchBar.getElement());
    controls.appendChild(this.sortControl.getElement());

    return controls;
  }

  private filterAndSort(): void {
    // Filter by search query
    let filtered = this.allCards;

    if (this.currentSearchQuery.trim()) {
      const query = this.currentSearchQuery.toLowerCase().trim();
      filtered = this.allCards.filter((card) => {
        const name = card.name?.toLowerCase() || '';
        const typeLine = card.type_line?.toLowerCase() || '';
        const cardNumber = card.cardNumber.toString();
        return name.includes(query) || cardNumber.includes(query) ||
          typeLine.includes(query);
      });
    }

    // Sort
    if (this.currentSortOrder === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => {
        const nameA = a.name?.toLowerCase() || `card${a.cardNumber}`;
        const nameB = b.name?.toLowerCase() || `card${b.cardNumber}`;
        return nameA.localeCompare(nameB);
      });
    } else if (this.currentSortOrder === 'top-to-bottom') {
      // Deck pile: reverse array to show top cards first (deck is stored as a stack, so fifo,
      // which means we must reverse to get most recent card)
      filtered = [...filtered].reverse();
    } else if (this.currentSortOrder === 'bottom-to-top') {
      filtered = [...filtered];
    }

    this.filteredCards = filtered;
    this.renderCards();
  }

  private renderCards(): void {
    if (!this.gridContainer) return;

    this.gridContainer.innerHTML = '';

    if (this.filteredCards.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'deck-pile-viewer-empty';
      empty.textContent = this.currentSearchQuery
        ? 'No cards found'
        : `No cards in ${this.pileType}`;
      this.gridContainer.appendChild(empty);
      return;
    }

    this.filteredCards.forEach((card) => {
      // Find absolute position in original deck (top to bottom)
      // Deck is stored bottom-to-top, so reverse to get top-to-bottom index
      const absoluteIndex = this.allCards.length - 1 - this.allCards.findIndex(c => c.id === card.id);

      const cardItem = new CardGridItem({
        card,
        position: absoluteIndex,
        showPosition: true, // Always show position
        positionPrefix: 'Top',
        onHover: (card) => {
          this.hoveredCard = card;
          // Focus the card element when hovered to enable immediate hotkey use
          if (card) {
            const cardElement = this.gridContainer?.querySelector(`[data-card-id="${card.id}"]`) as HTMLElement;
            cardElement?.focus();
          }
        },
        onClick: (card) => {
          // Show tooltip on click
          const cardElement = this.gridContainer?.querySelector(`[data-card-id="${card.id}"]`) as HTMLElement;
          if (cardElement) {
            const rect = cardElement.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            this.showTooltip(card.id, x, y, true);
          }
        },
      });

      const cardElement = cardItem.getElement();
      // Make card focusable for keyboard shortcuts
      cardElement.tabIndex = 0;
      
      // Add mouse move tracking for hover tooltip
      cardElement.addEventListener('mousemove', (e) => {
        this.currentMouseX = e.clientX;
        this.currentMouseY = e.clientY;
        this.showTooltipOnHover(card.id);
      });
      
      cardElement.addEventListener('mouseleave', () => {
        this.hideTooltipOnLeave();
      });

      this.gridContainer!.appendChild(cardElement);
    });
  }

  private attachGlobalListeners(): void {
    const keyHandler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Escape always closes
      if (key === 'escape') {
        e.preventDefault();
        this.close();
        return;
      }

      // Don't handle shortcuts if typing in search
      if (e.target instanceof HTMLInputElement) {
        return;
      }

      // All other shortcuts require hovered card
      if (!this.hoveredCard) return;

      // Z - Play to battlefield TODO: implement when we can get them to stop disappearing

      // H - Move to hand
      if (key === 'h' && this.callbacks.onMoveToHand) {
        e.preventDefault();
        this.callbacks.onMoveToHand(this.hoveredCard);
      }

      // D - Move to discard (only if not already in discard)
      if (key === 'd' && this.callbacks.onMoveToDiscard && this.pileType !== 'discard') {
        e.preventDefault();
        this.callbacks.onMoveToDiscard(this.hoveredCard);
      }

      // S - Move to exile (only if not already in exile)
      if (key === 's' && this.callbacks.onMoveToExile && this.pileType !== 'exile') {
        e.preventDefault();
        this.callbacks.onMoveToExile(this.hoveredCard);
      }

      // T - Move to deck top (only if not already in deck)
      if (key === 't' && this.callbacks.onMoveToDeckTop && this.pileType !== 'deck') {
        e.preventDefault();
        this.callbacks.onMoveToDeckTop(this.hoveredCard);
      }

      // Y - Move to deck bottom (only if not already in deck)
      if (key === 'y' && this.callbacks.onMoveToDeckBottom && this.pileType !== 'deck') {
        e.preventDefault();
        this.callbacks.onMoveToDeckBottom(this.hoveredCard);
      }
    };

    document.addEventListener('keydown', keyHandler);

    // Store handler for cleanup
    if (this.modal) {
      (this.modal as any)._keyHandler = keyHandler;
    }
  }

  private setupTooltip(): void {
    // Create tooltip container
    this.tooltipContainer = document.createElement('div');
    this.tooltipContainer.className = 'deck-pile-viewer-tooltip-container';
    document.body.appendChild(this.tooltipContainer);
    this.tooltipRoot = createRoot(this.tooltipContainer);

    // Track tooltip hover to prevent premature hiding
    this.tooltipContainer.addEventListener('mouseenter', () => {
      this.isTooltipHovered = true;
      if (this.hideTimeout !== null) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    });

    this.tooltipContainer.addEventListener('mouseleave', () => {
      this.isTooltipHovered = false;
      this.scheduleHide();
    });

    // Setup click outside handler
    this.clickOutsideHandler = this.handleClickOutside.bind(this);
    document.addEventListener('click', this.clickOutsideHandler, true);
  }

  private handleClickOutside(e: MouseEvent): void {
    if (!this.tooltipCardId || !this.tooltipContainer) return;

    const target = e.target as HTMLElement;
    // Check if click is outside the tooltip container
    if (!this.tooltipContainer.contains(target)) {
      // Check if click is on the card that opened the tooltip
      const cardElement = target.closest('[data-card-id]');
      if (cardElement && cardElement.getAttribute('data-card-id') === this.tooltipCardId) {
        // Don't handle clicks on the card itself - card click handler will handle toggle
        return;
      }
      // Hide tooltip if clicking anywhere else
      this.hideTooltip();
    }
  }

  private getAvailableActions(): Array<{ key: string; label: string; action: () => void }> {
    const actions: Array<{ key: string; label: string; action: () => void }> = [];

    if (!this.hoveredCard) return actions;

    // H - Move to hand (always available)
    if (this.callbacks.onMoveToHand) {
      actions.push({
        key: 'H',
        label: 'Hand',
        action: () => {
          this.callbacks.onMoveToHand!(this.hoveredCard!);
          this.hideTooltip();
        },
      });
    }

    // D - Move to discard (only if not already in discard)
    if (this.callbacks.onMoveToDiscard && this.pileType !== 'discard') {
      actions.push({
        key: 'D',
        label: 'Discard',
        action: () => {
          this.callbacks.onMoveToDiscard!(this.hoveredCard!);
          this.hideTooltip();
        },
      });
    }

    // S - Move to exile (only if not already in exile)
    if (this.callbacks.onMoveToExile && this.pileType !== 'exile') {
      actions.push({
        key: 'S',
        label: 'Exile',
        action: () => {
          this.callbacks.onMoveToExile!(this.hoveredCard!);
          this.hideTooltip();
        },
      });
    }

    // T - Move to deck top (available for all pile types, including deck)
    if (this.callbacks.onMoveToDeckTop) {
      actions.push({
        key: 'T',
        label: 'Deck Top',
        action: () => {
          this.callbacks.onMoveToDeckTop!(this.hoveredCard!);
          this.hideTooltip();
        },
      });
    }

    // Y - Move to deck bottom (available for all pile types, including deck)
    if (this.callbacks.onMoveToDeckBottom) {
      actions.push({
        key: 'Y',
        label: 'Deck Bottom',
        action: () => {
          this.callbacks.onMoveToDeckBottom!(this.hoveredCard!);
          this.hideTooltip();
        },
      });
    }

    return actions;
  }

  private showTooltip(cardId: string, x: number, y: number, pinned: boolean = false): void {
    this.clearTimeouts();
    if (!this.tooltipRoot || !this.hoveredCard) return;

    // Toggle tooltip if clicking the same card
    if (this.tooltipCardId === cardId && pinned) {
      this.hideTooltip();
      return;
    }

    this.tooltipCardId = cardId;
    const actions = this.getAvailableActions();

    if (actions.length === 0) {
      this.hideTooltip();
      return;
    }

    this.tooltipRoot.render(
      React.createElement(DeckPileViewerTooltip, {
        actions,
        mouseX: x,
        mouseY: y,
      })
    );
  }

  private showTooltipOnHover(cardId: string): void {
    this.clearHoverTimeout();
    this.clearHideTimeout();

    this.hoverTimeout = window.setTimeout(() => {
      if (this.hoveredCard && this.hoveredCard.id === cardId) {
        this.showTooltip(cardId, this.currentMouseX, this.currentMouseY, false);
      }
    }, 500);
  }

  private hideTooltipOnLeave(): void {
    this.clearHoverTimeout();
    if (!this.isTooltipHovered) {
      this.scheduleHide();
    }
  }

  private scheduleHide(): void {
    this.clearHideTimeout();
    this.hideTimeout = window.setTimeout(() => {
      if (!this.isTooltipHovered) {
        this.hideTooltip();
      }
    }, 200);
  }

  private clearTimeouts(): void {
    this.clearHoverTimeout();
    this.clearHideTimeout();
  }

  private clearHoverTimeout(): void {
    if (this.hoverTimeout !== null) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }

  private clearHideTimeout(): void {
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  private hideTooltip(): void {
    this.clearTimeouts();
    if (!this.tooltipRoot) return;
    this.tooltipCardId = null;
    this.tooltipRoot.render(null);
  }

  public close(): void {
    if (this.modal) {
      // Clean up keyboard handler
      const handler = (this.modal as any)._keyHandler;
      if (handler) {
        document.removeEventListener('keydown', handler);
      }

      // Clean up tooltip
      this.hideTooltip();
      if (this.tooltipContainer) {
        if (this.clickOutsideHandler) {
          document.removeEventListener('click', this.clickOutsideHandler, true);
          this.clickOutsideHandler = null;
        }
        if (this.tooltipContainer.parentElement) {
          this.tooltipContainer.parentElement.removeChild(this.tooltipContainer);
        }
        if (this.tooltipRoot) {
          this.tooltipRoot.unmount();
          this.tooltipRoot = null;
        }
        this.tooltipContainer = null;
      }

      if (this.modal.parentElement) {
        this.modal.parentElement.removeChild(this.modal);
      }

      this.modal = null;
      this.searchBar = null;
      this.sortControl = null;
      this.gridContainer = null;
      this.hoveredCard = null;
      this.allCards = [];
      this.filteredCards = [];
    }
  }
}

// Tooltip component for DeckPileViewer
interface DeckPileViewerTooltipProps {
  actions: Array<{ key: string; label: string; action: () => void }>;
  mouseX: number;
  mouseY: number;
}

const DeckPileViewerTooltip: React.FC<DeckPileViewerTooltipProps> = ({ actions, mouseX, mouseY }) => {
  const [position, setPosition] = React.useState({ x: mouseX, y: mouseY });
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!tooltipRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    const offsetX = 15;
    const offsetY = 15;

    let x = mouseX + offsetX;
    let y = mouseY + offsetY;

    if (x + tooltipWidth > window.innerWidth) {
      x = mouseX - tooltipWidth - offsetX;
    }
    if (y + tooltipHeight > window.innerHeight) {
      y = mouseY - tooltipHeight - offsetY;
    }

    setPosition({ x, y });
  }, [mouseX, mouseY, actions.length]);

  const tooltipStyles: React.CSSProperties = {
    position: 'fixed',
    backgroundColor: '#1a1a1a',
    border: '1px solid #3d3d3d',
    borderRadius: '6px',
    padding: '4px',
    pointerEvents: 'auto',
    zIndex: 10000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
    left: `${position.x}px`,
    top: `${position.y}px`,
  };

  const rowStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '0px',
    fontSize: '12px',
    padding: '6px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  };

  return React.createElement(
    'div',
    {
      ref: tooltipRef,
      style: tooltipStyles,
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    },
    actions.map((action, index) =>
      React.createElement(
        'div',
        {
          key: `${action.key}-${index}`,
          style: {
            ...rowStyles,
            ...(index === actions.length - 1 ? { marginBottom: '0px' } : {}),
            ...(hoveredIndex === index ? { backgroundColor: '#2d2d2d' } : {}),
          },
          onMouseEnter: () => setHoveredIndex(index),
          onMouseLeave: () => setHoveredIndex(null),
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            action.action();
          },
        },
        React.createElement(
          'span',
          {
            style: {
              fontFamily: "'Courier New', monospace",
              fontWeight: 'bold',
              color: '#3b82f6',
              fontSize: '12px',
              minWidth: '50px',
              flexShrink: 0,
            },
          },
          action.key
        ),
        React.createElement(
          'span',
          {
            style: {
              color: '#e5e7eb',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            },
          },
          action.label
        )
      )
    )
  );
};