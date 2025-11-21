import React, { useEffect, useRef } from 'react';
import { KeywordTokenTemplate } from '@/modules/keywordTokens/types';
import { KeywordTokenFactory } from '@/modules/keywordTokens/KeywordTokenFactory';
import { setElementDragPoint } from "@/utils/centerHtmlElementOnDrag";
import { HotkeyContext } from '@/data/hotkeys';
import { useTooltipManager } from '@/contexts/TooltipContext';

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
  const tooltipManager = useTooltipManager();

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear existing tokens
    containerRef.current.innerHTML = '';

    // Create token elements for each template
    templates.forEach((template) => {
      const tokenElement = KeywordTokenFactory.createTokenElement(template, {
        mode: 'grid',
        onMouseEnter: tooltipManager ? (e: MouseEvent, tokenId: string) => {
          tooltipManager.show(tokenId, HotkeyContext.KeywordToken, e.clientX, e.clientY, false, template.title);
        } : undefined,
        onMouseMove: tooltipManager ? (e: MouseEvent) => {
          tooltipManager.setMouseLocation(e.clientX, e.clientY);
        } : undefined,
        onMouseLeave: tooltipManager ? () => {
          tooltipManager.hide();
        } : undefined,
        onDragStart: (e: DragEvent, draggedTemplate: KeywordTokenTemplate) => {
          // Hide tooltip when starting drag
          tooltipManager?.hide();

          // Center the drag image on the mouse cursor
          setElementDragPoint(e.target as HTMLDivElement, e, 'kwToken');

          // Store token template data in dataTransfer for board to read
          e.dataTransfer!.setData('text/x-keyword-token-template', JSON.stringify(draggedTemplate));
          e.dataTransfer!.effectAllowed = 'copy'; // Indicate this is a copy operation

          // Call parent callback
          onDragStart?.(draggedTemplate);
        },
      });

      containerRef.current!.appendChild(tokenElement);
    });
  }, [templates, onDragStart, tooltipManager]);

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
