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
import { HotkeyContext, Hotkey } from '@/data/hotkeys';
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
import { CardGrid } from './CardGrid';
import { YSTATE_DECK, YSTATE_EXILE_PILE, YSTATE_DISCARD_PILE } from '@/constants';
import { usePlayerStore } from '@/stores/playerStore';
import { useHotkeyStore } from '@/stores/hotkeyStore';

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
}

type SortOrder = 'top-to-bottom' | 'bottom-to-top' | 'alphabetical';

export function PileViewerReact({
  isOpen,
  onClose,
  cards,
  pileType,
  callbacks = {},
}: PileViewerReactProps) {
  const yPlayerState = usePlayerStore((state) => state.yPlayerState);
  const setModalOpen = useHotkeyStore((state) => state.setModalOpen);
  const setHoveredPileViewerCard = useHotkeyStore((state) => state.setHoveredPileViewerCard);

  // State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortOrder, setSortOrder] = useSortOrder('top-to-bottom');
  const [hoveredCard, setHoveredCard] = React.useState<Card | null>(null);
  const [revealAll, setRevealAll] = React.useState(false);
  const [revealCount, setRevealCount] = React.useState(0);
  const [visibleCardCount, setVisibleCardCount] = React.useState(0);

  // Refs
  const tooltipManagerRef = React.useRef<TooltipManager | null>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Custom hooks
  function useSortOrder(initial: SortOrder): [SortOrder, (newSortOrder: SortOrder) => void] {
    const [sortOrder, setSort] = React.useState<SortOrder>(initial);

    const setSortOrder = (newSortOrder: SortOrder)  => {
      setSort(newSortOrder);
      setRevealCount(0);
      setRevealAll(false);
    };

    return [sortOrder, setSortOrder];
  }

  // Map pile type to hotkey context
  const getPileViewerContext = (): HotkeyContext => {
    switch (pileType) {
      case 'deck': return HotkeyContext.DeckCard;
      case 'discard': return HotkeyContext.Discard;
      case 'exile': return HotkeyContext.Exile;
      case 'scry': return HotkeyContext.Scry;
      default: return HotkeyContext.DeckCard;
    }
  };

  // Update hover handler to use hotkeyStore
  const handleCardHover = (card: Card | null) => {
    setHoveredCard(card);  // Keep for local tooltip use
    setHoveredPileViewerCard(card?.id ?? null, card ? getPileViewerContext() : null);
  };

  // Update hotkey store when modal opens/closes
  React.useEffect(() => {
    setModalOpen(isOpen);
  }, [isOpen, setModalOpen]);

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
    tooltipManagerRef.current.setup((hotkey: Hotkey, cardId: string) => {
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

  // Listen for centralized hotkey events
  React.useEffect(() => {
    if (!isOpen) return;

    const handlePileViewerAction = (e: Event) => {
      const { action, cardId } = (e as CustomEvent).detail;
      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      switch (action) {
        case 'moveToHand':
          callbacks.onMoveToHand?.(card);
          break;
        case 'moveToDiscard':
          callbacks.onMoveToDiscard?.(card);
          break;
        case 'moveToExile':
          callbacks.onMoveToExile?.(card);
          break;
        case 'moveToDeckTop':
          callbacks.onMoveToDeckTop?.(card);
          break;
        case 'moveToDeckBottom':
          callbacks.onMoveToDeckBottom?.(card);
          break;
      }

      setHoveredCard(null);
    };

    window.addEventListener('pileViewerCardAction', handlePileViewerAction);
    return () => window.removeEventListener('pileViewerCardAction', handlePileViewerAction);
  }, [isOpen, cards, callbacks]);

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
      setRevealAll(true);
    }, 250);
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
  const filteredAndSortedCards: Card[] = React.useMemo(() => {
    let filtered: Card[] = cards;

    // Filter by search query
    if (searchQuery.trim()) {
      const query: string = searchQuery.toLowerCase().trim();
      filtered = cards.filter((card: Card) => {
        const name: string = card.name?.toLowerCase() || '';
        const typeLine: string = card.type_line?.toLowerCase() || '';
        const cardNumber: string = card.cardNumber.toString();
        const oracleText: string = card.oracleText?.toLowerCase() || '';
        return (
          name.includes(query) ||
          cardNumber.includes(query) ||
          typeLine.includes(query) ||
          oracleText.includes(query)
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
        <DialogContent className="deck-pile-viewer-content w-[80vw] h-[70vh] p-0">
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
            <Select value={sortOrder} onValueChange={(value: string): void => setSortOrder(value as SortOrder)}>
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
            <CardGrid
              cards={filteredAndSortedCards}
              pileType={pileType}
              visibleCardCount={visibleCardCount}
              revealAll={revealAll}
              revealCount={revealCount}
              onHover={handleCardHover}
              tooltipManager={tooltipManagerRef.current}
              hotkeyContext={getHotkeyContext()}
              enableReordering={pileType === 'scry'}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}