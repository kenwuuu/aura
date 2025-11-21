/**
 * CardGrid Component
 *
 * Displays a grid of cards with drag-and-drop reordering support via dnd-kit.
 * Extracted from PileViewerReact to enable sortable functionality.
 *
 * Features:
 * - Drag-and-drop reordering for deck, exile, and discard piles
 * - Smooth animations for insertions/deletions
 * - Lazy loading with skeleton placeholders
 * - Static position labels during drag operations
 * - Automatic Yjs sync on reorder
 */

import * as React from 'react';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Card } from '../../deck';
import { TooltipManager } from '../../whiteboard/TooltipManager';
import { HotkeyContext } from '@/data/hotkeys';
import { CardGridItemReact } from './CardGridItemReact';
import { SortableCardGridItem } from './SortableCardGridItem';
import { PileType } from './PileViewerReact';
import styles from './PileViewerReact.module.css';

export interface CardGridProps {
  cards: Card[];
  pileType: PileType;
  visibleCardCount: number;
  revealAll: boolean;
  revealCount: number;
  onCardReorder?: (reorderedCards: Card[]) => void;
  onHover: (card: Card | null) => void;
  tooltipManager: TooltipManager | null;
  hotkeyContext: HotkeyContext;
  enableReordering?: boolean;
}

/**
 * Measuring configuration for dnd-kit to enable insert/delete animations.
 * Uses MeasuringStrategy.Always to continuously measure droppable dimensions.
 */
const measuringConfig = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

export const CardGrid = React.memo(function CardGrid({
  cards,
  pileType,
  visibleCardCount,
  revealAll,
  revealCount,
  onCardReorder,
  onHover,
  tooltipManager,
  hotkeyContext,
  enableReordering = false,
}: CardGridProps) {
  const [localCards, setLocalCards] = React.useState(cards);

  console.log('🎨 CardGrid render:', {
    pileType,
    enableReordering,
    hasOnCardReorder: !!onCardReorder,
    cardCount: cards.length,
  });

  // Sync local cards when prop changes
  React.useEffect(() => {
    setLocalCards(cards);
  }, [cards]);

  // Configure sensors for drag interactions
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8, // 8px movement required before drag starts (prevents accidental drags)
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200, // 200ms hold required for touch devices
      tolerance: 8,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('🎯 handleDragEnd called', { activeId: active.id, overId: over?.id });

    if (!over || active.id === over.id) {
      console.log('⏭️ Skipping - no over or same position');
      return;
    }

    const oldIndex = localCards.findIndex((card) => card.id === active.id);
    const newIndex = localCards.findIndex((card) => card.id === over.id);

    console.log('📍 Indices:', { oldIndex, newIndex });

    if (oldIndex === -1 || newIndex === -1) {
      console.error('❌ Invalid indices!');
      return;
    }

    const reordered = arrayMove(localCards, oldIndex, newIndex);
    console.log('✨ Reordered:', {
      oldCardNum: localCards[oldIndex]?.cardNumber,
      newCardNum: reordered[oldIndex]?.cardNumber,
      movedTo: newIndex,
    });

    setLocalCards(reordered);

    // Trigger callback to sync to Yjs
    console.log('📞 Calling onCardReorder callback');
    onCardReorder?.(reordered);
  };

  // If reordering is disabled, render static grid
  if (!enableReordering) {
    return (
      <div className="deck-pile-viewer-grid grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
        {localCards.map((card, index) => {
          // Position is just the index (cards are already sorted by parent component)
          const absoluteIndex = index;
          const shouldShowFaceDown =
            !revealAll && (revealCount === 0 || absoluteIndex >= revealCount);

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
                onHover={onHover}
                tooltipManager={tooltipManager}
                hotkeyContext={hotkeyContext}
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
    );
  }

  // Render sortable grid with dnd-kit
  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      measuring={measuringConfig}
    >
      <SortableContext items={localCards.map((c) => c.id)} strategy={rectSortingStrategy}>
        <div className="deck-pile-viewer-grid grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
          {localCards.map((card, index) => {
            // Position is just the index (cards are already sorted by parent component)
            const absoluteIndex = index;
            const shouldShowFaceDown =
              !revealAll && (revealCount === 0 || absoluteIndex >= revealCount);

            // Only render actual card if it's within visible batch
            if (index < visibleCardCount) {
              return (
                <SortableCardGridItem
                  key={card.id}
                  id={card.id}
                  card={card}
                  position={absoluteIndex}
                  showPosition={true}
                  positionPrefix="Top"
                  showFaceDown={shouldShowFaceDown}
                  onHover={onHover}
                  tooltipManager={tooltipManager}
                  hotkeyContext={hotkeyContext}
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
      </SortableContext>
    </DndContext>
  );
});
