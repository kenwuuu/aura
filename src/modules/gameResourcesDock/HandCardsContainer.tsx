import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { HandCard } from './HandCard';
import { Card } from '../deck';
import { CardPreview } from '../cardPreview';
import { animate } from 'motion';

interface HandCardsContainerProps {
  yPlayerState: Y.Map<any>;
  playerId: string;
  zoomLevel: number;
  cardPreview: CardPreview;
  onHoveredCardChange: (cardId: string | null) => void;
  onDraggedCardChange: (draggedCard: { card: Card; element: HTMLElement } | null) => void;
  onDragStateChange: (dragState: { mode: string; draggedElement: HTMLDivElement; startIndex: number } | undefined) => void;
  onHandReorder: (reorderedHand: Card[]) => void;
}

/**
 * Custom hook to observe Yjs Map changes and trigger React re-renders
 */
function useYjsObserver<T>(yMap: Y.Map<any>, key: string, defaultValue: T): T {
  const [value, setValue] = useState<T>(() => yMap.get(key) ?? defaultValue);

  useEffect(() => {
    const observer = () => {
      setValue(yMap.get(key) ?? defaultValue);
    };

    yMap.observe(observer);
    // Initial sync
    observer();

    return () => {
      yMap.unobserve(observer);
    };
  }, [yMap, key, defaultValue]);

  return value;
}

export const HandCardsContainer: React.FC<HandCardsContainerProps> = ({
  yPlayerState,
  playerId,
  zoomLevel,
  cardPreview,
  onHoveredCardChange,
  onDraggedCardChange,
  onDragStateChange,
  onHandReorder
}) => {
  const hand = useYjsObserver<Card[]>(yPlayerState, 'hand', []);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ mode: string; draggedElement: HTMLDivElement; startIndex: number } | undefined>(undefined);
  const requestAnimationFrameIdRef = useRef<number | null>(null);
  const scrollAnimationRef = useRef<any>(null);

  // Scroll to end when hand changes
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;

      // Cancel any existing scroll animation
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }

      scrollAnimationRef.current = animate(
        container.scrollLeft,
        container.scrollWidth - container.clientWidth,
        {
          duration: 0.3,
          ease: 'easeOut',
          onUpdate(value) {
            container.scrollLeft = value;
          }
        }
      );
    }
  }, [hand]);

  const handleCardMouseEnter = useCallback((cardId: string) => {
    onHoveredCardChange(cardId);
    const card = hand.find(c => c.id === cardId);
    if (card) {
      cardPreview.show(card);
    }
  }, [hand, cardPreview, onHoveredCardChange]);

  const handleCardMouseMove = useCallback((e: React.MouseEvent) => {
    cardPreview.updatePosition(e.nativeEvent);
  }, [cardPreview]);

  const handleCardMouseLeave = useCallback(() => {
    onHoveredCardChange(null);
    cardPreview.hide();
  }, [cardPreview, onHoveredCardChange]);

  const handleCardDragStart = useCallback((card: Card, element: HTMLDivElement, e: React.DragEvent) => {
    cardPreview.hide();
    onHoveredCardChange(null);

    // Track the card globally for board drop logic
    onDraggedCardChange({ card, element });

    // Starting state: we assume play mode, not reorder mode
    const startIndex = hand.findIndex(c => c.id === card.id);
    const dragState = {
      mode: 'play',
      draggedElement: element,
      startIndex
    };
    dragStateRef.current = dragState;
    onDragStateChange(dragState);
  }, [hand, cardPreview, onHoveredCardChange, onDraggedCardChange, onDragStateChange]);

  const handleCardDragEnd = useCallback(() => {
    // Handled by container dragend
  }, []);

  // Setup hand reordering
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const buffer = 60; // px allowed above/below hand before switching to play mode
    const transparentDragImage = new Image();
    transparentDragImage.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

    const handleDragOver = (e: DragEvent) => {
      if (!dragStateRef.current) return;
      e.preventDefault();

      // Throttle with requestAnimationFrame to prevent layout thrashing
      if (requestAnimationFrameIdRef.current !== null) return;

      requestAnimationFrameIdRef.current = requestAnimationFrame(() => {
        requestAnimationFrameIdRef.current = null;

        if (!dragStateRef.current) return;
        const { draggedElement, mode } = dragStateRef.current;
        if (!draggedElement) return;

        // Read phase: batch all layout reads together
        const handRect = container.getBoundingClientRect();
        const outOfBounds =
          e.clientY < handRect.top - buffer ||
          e.clientY > handRect.bottom + buffer;

        // MODE SWITCHING LOGIC
        if (outOfBounds) {
          // Switch to PLAY MODE
          if (mode !== 'play') {
            dragStateRef.current.mode = 'play';
            onDragStateChange(dragStateRef.current);

            // Switch BACK to your full-size centered drag image
            try {
              // Note: Can't change drag image mid-drag in most browsers
            } catch {}
          }
          return;
        } else {
          // Switch into REORDER MODE
          if (mode !== 'reorder') {
            dragStateRef.current.mode = 'reorder';
            onDragStateChange(dragStateRef.current);

            // Use transparent drag image so reorder looks clean
            try {
              e.dataTransfer?.setDragImage(transparentDragImage, 0, 0);
            } catch {}
          }
        }

        // REORDER MODE BEHAVIOR
        if (dragStateRef.current.mode === 'reorder') {
          const target = (e.target as HTMLElement).closest('.hand-card') as HTMLElement | null;
          if (!target || target === draggedElement) return;

          const rect = target.getBoundingClientRect();
          const midpoint = rect.left + rect.width / 2;

          // Write phase: batch all DOM mutations together
          if (e.clientX < midpoint) {
            container.insertBefore(draggedElement, target);
          } else {
            container.insertBefore(draggedElement, target.nextSibling);
          }
        }
      });
    };

    const handleDragEnd = () => {
      // Cancel any pending animation frame
      if (requestAnimationFrameIdRef.current !== null) {
        cancelAnimationFrame(requestAnimationFrameIdRef.current);
        requestAnimationFrameIdRef.current = null;
      }

      if (!dragStateRef.current) return;
      const { draggedElement, startIndex, mode } = dragStateRef.current;

      if (mode === 'reorder') {
        // Apply Yjs reorder
        const newIndex = Array.from(container.children).indexOf(draggedElement);

        if (newIndex !== startIndex && newIndex !== -1) {
          const reordered = [...hand];
          const movedCard = reordered.splice(startIndex, 1)[0];
          reordered.splice(newIndex, 0, movedCard);

          onHandReorder(reordered);
        }
      }

      dragStateRef.current = { ...dragStateRef.current, mode: 'none' };
      onDragStateChange(dragStateRef.current);
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragend', handleDragEnd);

    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('dragend', handleDragEnd);

      // Cancel any pending animation frame on unmount
      if (requestAnimationFrameIdRef.current !== null) {
        cancelAnimationFrame(requestAnimationFrameIdRef.current);
      }

      // Cancel any pending scroll animation
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
      }
    };
  }, [hand, onHandReorder, onDragStateChange]);

  return (
    <div className="hand-container">
      <div
        ref={containerRef}
        className="hand-cards"
        data-hand={playerId}
      >
        {hand.map((card) => (
          <HandCard
            key={card.id}
            card={card}
            zoomLevel={zoomLevel}
            onMouseEnter={handleCardMouseEnter}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            onDragStart={handleCardDragStart}
            onDragEnd={handleCardDragEnd}
          />
        ))}
      </div>
    </div>
  );
};
