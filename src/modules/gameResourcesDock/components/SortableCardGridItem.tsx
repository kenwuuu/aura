/**
 * SortableCardGridItem Component
 *
 * Wrapper around CardGridItemReact that adds drag-and-drop functionality using dnd-kit.
 * Implements custom animation behavior for insertions/deletions as well as sorting.
 */

import * as React from 'react';
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardGridItemReact, CardGridItemReactProps } from './CardGridItemReact';

/**
 * Custom animation config that enables animations for insertions/deletions
 * as well as during sorting operations.
 *
 * Based on: https://github.com/clauderic/dnd-kit/discussions/[issue]
 */
function animateLayoutChanges(args: Parameters<typeof defaultAnimateLayoutChanges>[0]) {
  const { isSorting, wasDragging } = args;

  // Use default animation during sorting
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args);
  }

  // Enable animations for insertions/deletions
  return true;
}

export interface SortableCardGridItemProps extends CardGridItemReactProps {
  id: string; // Required by dnd-kit
}

export const SortableCardGridItem = React.memo(function SortableCardGridItem({
  id,
  ...cardGridItemProps
}: SortableCardGridItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    animateLayoutChanges,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <CardGridItemReact {...cardGridItemProps} />
    </div>
  );
});
