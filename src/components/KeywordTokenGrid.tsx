import React, { useEffect, useRef } from 'react';
import { KeywordTokenTemplate } from '../modules/keywordTokens/types';
import { KeywordTokenFactory } from '../modules/keywordTokens/KeywordTokenFactory';
import {setCardDragPoint} from "@/utils/centerHtmlElementOnDrag";

interface KeywordTokenGridProps {
  templates: KeywordTokenTemplate[];
  columns?: number; // Number of columns (default: auto-fill)
  rows?: number; // Number of rows (default: auto based on templates)
  gap?: number; // Gap between tokens in pixels (default: 12)
  onDragStart?: (template: KeywordTokenTemplate) => void;
}

export const KeywordTokenGrid: React.FC<KeywordTokenGridProps> = ({
  templates,
  columns = 7, // Default to 5 columns
  rows, // Auto-calculate if not provided
  gap = 12,
  onDragStart,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear existing tokens
    containerRef.current.innerHTML = '';

    // Create token elements for each template
    templates.forEach((template) => {
      const tokenElement = KeywordTokenFactory.createTokenElement(template, {
        mode: 'grid',
        onDragStart: (e: DragEvent, draggedTemplate: KeywordTokenTemplate) => {
          // Center the drag image on the mouse cursor
          setCardDragPoint(e.target as HTMLDivElement, e);

          // Store token template data in dataTransfer for board to read
          e.dataTransfer!.setData('application/x-keyword-token-template', JSON.stringify(draggedTemplate));
          e.dataTransfer!.effectAllowed = 'copy'; // Indicate this is a copy operation

          // Call parent callback
          onDragStart?.(draggedTemplate);
        },
      });

      containerRef.current!.appendChild(tokenElement);
    });
  }, [templates, onDragStart]);

  // Calculate grid template based on columns/rows config
  const gridTemplateColumns = columns ? `repeat(${columns}, 50px)` : 'repeat(auto-fill, 50px)';
  const gridTemplateRows = rows ? `repeat(${rows}, 50px)` : undefined;

  return (
    <div
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns,
        gridTemplateRows,
        gap: `${gap}px`,
        padding: '8px',
      }}
    />
  );
};
