import React, { useEffect, useState, useRef } from 'react';
import { HotkeyContext, getHotkeysForContext, HotkeyDefinition } from '../data/hotkeys';

interface HotkeyTooltipProps {
  context: HotkeyContext;
  mouseX: number;
  mouseY: number;
  isMouseDown?: boolean;
  onHotkeyClick?: (hotkey: HotkeyDefinition) => void;
}

const TOOLTIP_DELAY = 500;

export const HotkeyTooltip: React.FC<HotkeyTooltipProps> = ({ context, mouseX, mouseY, isMouseDown = false, onHotkeyClick }) => {
  const [position, setPosition] = useState({ x: mouseX, y: mouseY });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hotkeys = getHotkeysForContext(context);

  useEffect(() => {
    // Wait for tooltip to be rendered so we can get its actual dimensions
    if (!tooltipRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    // Offset the tooltip slightly from the cursor
    const offsetX = 15;
    const offsetY = 15;

    // Calculate tooltip position, ensuring it stays within viewport
    let x = mouseX + offsetX;
    let y = mouseY + offsetY;

    // Keep tooltip within viewport bounds
    if (x + tooltipWidth > window.innerWidth) {
      x = mouseX - tooltipWidth - offsetX;
    }
    if (y + tooltipHeight > window.innerHeight) {
      y = mouseY - tooltipHeight - offsetY;
    }

    setPosition({ x, y });
  }, [mouseX, mouseY, hotkeys.length]);

  // Hide tooltip when mouse is down (dragging)
  if (hotkeys.length === 0 || isMouseDown) {
    return null;
  }

  const handleHotkeyClick = (hotkey: HotkeyDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHotkeyClick) {
      onHotkeyClick(hotkey);
    }
  };

  return (
    <div
      ref={tooltipRef}
      className="fixed bg-slate-950 border border-slate-800 rounded-md p-1 pointer-events-auto z-[10000] shadow-[0_4px_12px_rgba(0,0,0,0.6)] max-w-[280px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {hotkeys.map((hotkey, index) => (
        <div
          key={`${hotkey.key}-${index}`}
            className={`flex items-center gap-2 mb-0 text-xs px-2 py-1.5 rounded cursor-pointer transition-colors duration-150 ${hoveredIndex === index ? 'bg-slate-900' : ''}`}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={(e) => handleHotkeyClick(hotkey, e)}
        >
          <span className="font-mono font-bold text-blue-500 text-xs min-w-[50px] shrink-0">{hotkey.key}</span>
          <span className="text-gray-200 text-xs whitespace-nowrap">{hotkey.shortDescription}</span>
        </div>
      ))}
    </div>
  );
};