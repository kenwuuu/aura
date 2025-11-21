/**
 * PileViewer React Component
 *
 * Full React implementation using shadcn/ui components for:
 * - Modal dialog
 * - Search input with debouncing
 * - Sort select dropdown
 * - Reveal controls with checkbox
 * - Card grid rendering
 * - Keyboard shortcuts
 */

import * as React from 'react';
import * as Y from 'yjs';
import { Card } from '../../deck';
import { TooltipManager } from '../../whiteboard/TooltipManager';
import { HotkeyContext, HotkeyDefinition } from '@/data/hotkeys';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CardGridItemReact } from './CardGridItemReact';
import styles from './PileViewerReact.module.css';

export type PileType = 'deck' | 'exile' | 'discard' | 'hand' | 'scry';

export interface PileViewerCallbacks {
  onPlayToBattlefield?: (card: Card) => void;
  onMoveToHand?: (card: Card) => void;
  onMoveToExile?: (card: Card) => void;
  onMoveToDiscard?: (card: Card) => void;
  onMoveToDeckTop?: (card: Card) => void;
  onMoveToDeckBottom?: (card: Card) => void;
}

export interface PileViewerReactProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  pileType: PileType;
  callbacks?: PileViewerCallbacks;
  yPlayerState?: Y.Map<any>;
}

type SortOrder = 'top-to-bottom' | 'bottom-to-top' | 'alphabetical';

export function PileViewerReact({
  isOpen,
  onClose,
  cards,
  pileType,
  callbacks = {},
  yPlayerState,
}: PileViewerReactProps) {
  // State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('top-to-bottom');
  const [hoveredCard, setHoveredCard] = React.useState<Card | null>(null);
  const [revealAll, setRevealAll] = React.useState(false);
  const [revealCount, setRevealCount] = React.useState(0);
  const [visibleCardCount, setVisibleCardCount] = React.useState(0);

  // Refs
  const tooltipManagerRef = React.useRef<TooltipManager | null>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Reset state when dialog opens or closes
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSortOrder('top-to-bottom');
      setHoveredCard(null);

      // Initialize reveal state from yPlayerState
      if (pileType === 'deck' && yPlayerState) {
        const deckRevealCount = yPlayerState.get('deckRevealCount') ?? 0;
        if (deckRevealCount === -1) {
          setRevealAll(true);
          setRevealCount(0);
        } else if (deckRevealCount > 0) {
          setRevealAll(false);
          setRevealCount(deckRevealCount);
        } else {
          setRevealAll(false);
          setRevealCount(0);
        }
      } else {
        setRevealAll(pileType !== 'deck');
        setRevealCount(0);
      }
    } else {
      // Reset state when closing
      setSearchQuery('');
      setSortOrder('top-to-bottom');
      setHoveredCard(null);
      setRevealAll(false);
      setRevealCount(0);

      // Clear deck reveal count in Yjs when closing
      if (pileType === 'deck' && yPlayerState) {
        yPlayerState.set('deckRevealCount', 0);
      }
    }
  }, [isOpen, pileType, yPlayerState]);

  // Setup tooltip manager
  React.useEffect(() => {
    if (!isOpen) return;

    tooltipManagerRef.current = new TooltipManager();
    tooltipManagerRef.current.setup((hotkey: HotkeyDefinition, cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      const key = hotkey.key.toLowerCase();

      if (key === 'h' && callbacks.onMoveToHand) {
        callbacks.onMoveToHand(card);
      } else if (key === 'd' && callbacks.onMoveToDiscard && pileType !== 'discard') {
        callbacks.onMoveToDiscard(card);
      } else if (key === 's' && callbacks.onMoveToExile && pileType !== 'exile') {
        callbacks.onMoveToExile(card);
      } else if (key === 't' && callbacks.onMoveToDeckTop && pileType !== 'deck') {
        callbacks.onMoveToDeckTop(card);
      } else if (key === 'y' && callbacks.onMoveToDeckBottom && pileType !== 'deck') {
        callbacks.onMoveToDeckBottom(card);
      }
    });

    return () => {
      tooltipManagerRef.current?.destroy();
      tooltipManagerRef.current = null;
    };
  }, [isOpen, cards, callbacks, pileType]);

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Escape always closes
      if (key === 'escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Don't handle shortcuts if typing in input
      if (e.target instanceof HTMLInputElement) {
        return;
      }

      // All other shortcuts require hovered card
      if (!hoveredCard) return;

      // H - Move to hand
      if (key === 'h' && callbacks.onMoveToHand) {
        e.preventDefault();
        callbacks.onMoveToHand(hoveredCard);
      }

      // D - Move to discard
      if (key === 'd' && callbacks.onMoveToDiscard && pileType !== 'discard') {
        e.preventDefault();
        callbacks.onMoveToDiscard(hoveredCard);
      }

      // S - Move to exile
      if (key === 's' && callbacks.onMoveToExile && pileType !== 'exile') {
        e.preventDefault();
        callbacks.onMoveToExile(hoveredCard);
      }

      // T - Move to deck top
      if (key === 't' && callbacks.onMoveToDeckTop && pileType !== 'deck') {
        e.preventDefault();
        callbacks.onMoveToDeckTop(hoveredCard);
      }

      // Y - Move to deck bottom
      if (key === 'y' && callbacks.onMoveToDeckBottom && pileType !== 'deck') {
        e.preventDefault();
        callbacks.onMoveToDeckBottom(hoveredCard);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hoveredCard, callbacks, pileType, onClose]);

  // Emit scry viewer closing event
  React.useEffect(() => {
    if (!isOpen && pileType === 'scry') {
      window.dispatchEvent(new Event('scryViewer closing'));
    }
  }, [isOpen, pileType]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 150);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle reveal all change
  const handleRevealAllChange = (checked: boolean) => {
    setRevealAll(checked);
    if (checked) {
      setRevealCount(0);
      if (yPlayerState) {
        yPlayerState.set('deckRevealCount', -1);
      }
    } else {
      if (yPlayerState) {
        yPlayerState.set('deckRevealCount', 0);
      }
    }
  };

  // Handle reveal count change
  const handleRevealCountChange = (value: string) => {
    const count = parseInt(value) || 0;
    const boundedCount = Math.max(0, Math.min(cards.length, count));
    setRevealCount(boundedCount);
    if (boundedCount > 0) {
      setRevealAll(false);
      if (yPlayerState) {
        yPlayerState.set('deckRevealCount', boundedCount);
      }
    } else {
      if (yPlayerState) {
        yPlayerState.set('deckRevealCount', 0);
      }
    }
  };

  // Filter and sort cards
  const filteredAndSortedCards = React.useMemo(() => {
    let filtered = cards;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = cards.filter((card) => {
        const name = card.name?.toLowerCase() || '';
        const typeLine = card.type_line?.toLowerCase() || '';
        const cardNumber = card.cardNumber.toString();
        return (
          name.includes(query) ||
          cardNumber.includes(query) ||
          typeLine.includes(query)
        );
      });
    }

    // Sort
    if (sortOrder === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => {
        const nameA = a.name?.toLowerCase() || `card${a.cardNumber}`;
        const nameB = b.name?.toLowerCase() || `card${b.cardNumber}`;
        return nameA.localeCompare(nameB);
      });
    } else if (sortOrder === 'top-to-bottom') {
      filtered = [...filtered].reverse();
    } else if (sortOrder === 'bottom-to-top') {
      filtered = [...filtered];
    }

    return filtered;
  }, [cards, searchQuery, sortOrder]);

  // Micro-batch card mounting to prevent blocking the main thread
  // Opens modal instantly, then progressively renders cards in small batches
  React.useEffect(() => {
    if (!isOpen) return;

    // Reset visible count
    setVisibleCardCount(0);

    // Determine batch size based on total card count
    const totalCards = filteredAndSortedCards.length;
    const batchSize = 5;
    const batchInterval = 25; // ms between batches

    const intervalId = setInterval(() => {
      setVisibleCardCount((prev) => {
        const nextCount = Math.min(prev + batchSize, totalCards);
        if (nextCount >= totalCards) {
          clearInterval(intervalId);
        }
        return nextCount;
      });
    }, batchInterval);

    return () => clearInterval(intervalId);
  }, [isOpen, filteredAndSortedCards.length]);

  // Get dialog title
  const getTitle = () => {
    switch (pileType) {
      case 'deck':
        return 'Search Deck';
      case 'exile':
        return 'Exile Pile';
      case 'discard':
        return 'Discard Pile';
      case 'hand':
        return "Opponent's Hand";
      case 'scry':
        return 'Scry and Surveil';
      default:
        return 'Cards';
    }
  };

  // Get subtitle text
  const getSubtitle = () => {
    if (pileType === 'scry') {
      return 'Hover card and move to... D: Graveyard • T: Deck Top • Y: Deck Bottom';
    }
    return 'Hover card and move to... H: Hand • D: Graveyard • S: Exile • T: Deck Top • Y: Deck Bottom';
  };

  // Get hotkey context for tooltip
  const getHotkeyContext = (): HotkeyContext => {
    switch (pileType) {
      case 'deck':
        return HotkeyContext.DeckCard;
      case 'discard':
        return HotkeyContext.Discard;
      case 'exile':
        return HotkeyContext.Exile;
      case 'scry':
        return HotkeyContext.Scry;
      default:
        return HotkeyContext.DeckCard;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="deck-pile-viewer-content max-w-[90vw] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <DialogTitle className="text-2xl font-bold">{getTitle()}</DialogTitle>
            <p className="text-sm text-muted-foreground text-center">
              {getSubtitle()}
            </p>
            <div></div>
          </div>
        </DialogHeader>

        {/* Controls */}
        <div className="px-6 pb-4 border-b flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search cards..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort:</span>
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-to-bottom">Top to Bottom</SelectItem>
                <SelectItem value="bottom-to-top">Bottom to Top</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reveal controls (deck only) */}
          {pileType === 'deck' && (
            <div className="deck-pile-viewer-reveal-controls flex items-center gap-4">
              <label className="reveal-all-label flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={revealAll}
                  onCheckedChange={handleRevealAllChange}
                />
                <span className="text-sm">Reveal All</span>
              </label>
              <div className="reveal-count-container flex items-center gap-2">
                <span className="text-sm">Reveal top:</span>
                <Input
                  type="number"
                  min="0"
                  max={cards.length}
                  placeholder="0"
                  value={revealCount > 0 ? revealCount : ''}
                  onChange={(e) => handleRevealCountChange(e.target.value)}
                  className="reveal-count-input w-[80px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Card Grid */}
        <div className="deck-pile-viewer-grid-container overflow-auto">
          {filteredAndSortedCards.length === 0 ? (
            <div className="deck-pile-viewer-empty text-center py-12 text-muted-foreground">
              {searchQuery ? 'No cards found' : `No cards in ${pileType}`}
            </div>
          ) : (
            <div className="deck-pile-viewer-grid grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
              {filteredAndSortedCards.map((card, index) => {
                const absoluteIndex =
                  cards.length - 1 - cards.findIndex((c) => c.id === card.id);
                const shouldShowFaceDown =
                  !revealAll &&
                  (revealCount === 0 || absoluteIndex >= revealCount);

                // Only render actual card if it's within visible batch
                if (index < visibleCardCount) {
                  return (
                    <CardGridItemReact
                      key={card.id}
                      card={card}
                      position={absoluteIndex}
                      showPosition={true}
                      positionPrefix="Top"
                      showFaceDown={shouldShowFaceDown}
                      onHover={setHoveredCard}
                      tooltipManager={tooltipManagerRef.current}
                      hotkeyContext={getHotkeyContext()}
                    />
                  );
                }

                // Show skeleton for cards not yet mounted
                return (
                  <div key={card.id} className={`card-grid-item ${styles.skeleton}`}>
                    <div className="card-grid-item-image">
                      <div className={styles.shimmer}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}