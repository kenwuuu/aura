import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export type PileType = 'exile' | 'discard' | 'deck';

export interface ResourcePileProps {
  /** Type of pile - determines styling and behavior */
  type: PileType;
  /** Display label for the pile */
  label: string;
  /** Number of cards in the pile */
  count: number;
  /** Called when mouse enters the pile */
  onHover?: () => void;
  /** Called when mouse leaves the pile */
  onLeave?: () => void;
  /** Called when pile is clicked */
  onClick?: () => void;
  /** Called when a card is dropped on the pile */
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  /** Deck-only: whether to show the draw button */
  showDrawButton?: boolean;
  /** Deck-only: called when draw button is clicked */
  onDraw?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ResourcePile - A reusable pile component for exile, discard, and deck piles
 *
 * Features:
 * - Hover state tracking for keyboard shortcuts
 * - Click to view pile contents
 * - Drag-and-drop support for card placement
 * - Optional draw button for deck pile
 * - Visual feedback for drag-over state
 *
 * Usage:
 * ```tsx
 * <ResourcePile
 *   type="exile"
 *   label="Exile"
 *   count={exilePile.length}
 *   onHover={() => setHoveredResource('exile')}
 *   onLeave={() => setHoveredResource(null)}
 *   onClick={() => viewPile('exile')}
 *   onDrop={handleCardDrop}
 * />
 * ```
 */
export const ResourcePile: React.FC<ResourcePileProps> = ({
  type,
  label,
  count,
  onHover,
  onLeave,
  onClick,
  onDrop,
  showDrawButton = false,
  onDraw,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop?.(e);
  };

  const handleDrawClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent triggering pile onClick
    onDraw?.();
  };

  return (
    <div
      className={cn(
        'resource-pile',
        `${type}-pile`,
        isDragOver && 'drag-over',
        className
      )}
      data-pile-type={type}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="pile-label">{label}</div>
      <div className="pile-count" data-pile={type}>
        {count}
      </div>
      {showDrawButton && (
        <button
          className="draw-button"
          onClick={handleDrawClick}
          type="button"
        >
          Draw
        </button>
      )}
    </div>
  );
};
