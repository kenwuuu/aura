import React, {useState, useRef, useLayoutEffect} from 'react';
import { HotkeyContext, getHotkeysForContext, Hotkey } from '../data/hotkeys';

interface HotkeyTooltipProps {
  context: HotkeyContext;
  mouseX: number;
  mouseY: number;
  isMouseDown?: boolean;
  onHotkeyClick?: (hotkey: Hotkey) => void;
  title?: string;
}

const styles = {
  tooltip: {
    position: 'fixed',
    backgroundColor: '#1a1a1a',
    border: '1px solid #3d3d3d',
    borderRadius: '6px',
    padding: '4px',
    pointerEvents: 'auto',
    zIndex: 10000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
    maxWidth: '280px',
  } as React.CSSProperties,
  hotkeyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '0px',
    fontSize: '12px',
    padding: '6px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  } as React.CSSProperties,
  hotkeyRowHover: {
    backgroundColor: '#2d2d2d',
  } as React.CSSProperties,
  hotkeyRowLast: {
    marginBottom: '0px',
  } as React.CSSProperties,
  hotkeyKey: {
    fontFamily: "'Courier New', monospace",
    fontWeight: 'bold',
    color: '#3b82f6',
    fontSize: '12px',
    minWidth: '50px',
    flexShrink: 0,
  } as React.CSSProperties,
  hotkeyAction: {
    color: '#e5e7eb',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  tooltipTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#f9fafb',
    padding: '8px',
    borderBottom: '1px solid #3d3d3d',
    marginBottom: '4px',
  } as React.CSSProperties,
};

export const HotkeyTooltip: React.FC<HotkeyTooltipProps> = ({ context, mouseX, mouseY, isMouseDown = false, onHotkeyClick, title }) => {
  const [position, setPosition] = useState({ x: mouseX, y: mouseY });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hotkeys = getHotkeysForContext(context);

  useLayoutEffect(() => {
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

  const handleHotkeyClick = (hotkey: Hotkey, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHotkeyClick) {
      onHotkeyClick(hotkey);
    }
  };

  return (
    <div
      ref={tooltipRef}
      style={{
        ...styles.tooltip,
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {title && (
        <div style={styles.tooltipTitle}>
          {title}
        </div>
      )}
      {hotkeys.map((hotkey, index) => (
        <div
          key={`${hotkey.key}-${index}`}
          style={{
            ...styles.hotkeyRow,
            ...(index === hotkeys.length - 1 ? styles.hotkeyRowLast : {}),
            ...(hoveredIndex === index ? styles.hotkeyRowHover : {}),
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={(e) => handleHotkeyClick(hotkey, e)}
        >
          <span style={styles.hotkeyKey}>{hotkey.key}</span>
          <span style={styles.hotkeyAction}>{hotkey.shortDescription}</span>
        </div>
      ))}
    </div>
  );
};