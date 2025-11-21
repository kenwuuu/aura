/**
 * CardGridItemReact Component
 *
 * Displays a single card in a grid layout with:
 * - Image loading with lazy loading and fallback
 * - Position label (e.g., "Top 1", "Top 2")
 * - Card name display
 * - Hover interactions with tooltip manager
 * - Keyboard navigation support
 */

import * as React from 'react';
import { Card } from '../../deck';
import { TooltipManager } from '../../whiteboard/TooltipManager';
import { HotkeyContext } from '@/data/hotkeys';
import { DEFAULT_CARD_BACK } from '@/constants';
import styles from './CardGridItemReact.module.css';

export interface CardGridItemReactProps {
  card: Card;
  position: number;
  showPosition: boolean;
  positionPrefix: string;
  showFaceDown: boolean;
  onHover: (card: Card | null) => void;
  tooltipManager: TooltipManager | null;
  hotkeyContext: HotkeyContext;
}

export const CardGridItemReact = React.memo(function CardGridItemReact({
  card,
  position,
  showPosition,
  positionPrefix,
  showFaceDown,
  onHover,
  tooltipManager,
  hotkeyContext,
}: CardGridItemReactProps) {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const imageUrl = showFaceDown
    ? DEFAULT_CARD_BACK
    : card.images?.front?.normal || card.images?.front?.small;

  const handleMouseEnter = (e: React.MouseEvent) => {
    onHover(card);
    tooltipManager?.showOnHover(card.id, hotkeyContext);
  };

  const handleMouseLeave = () => {
    onHover(null);
    tooltipManager?.hideOnLeave();
  };

  const handleClick = (e: React.MouseEvent) => {
    tooltipManager?.show(card.id, hotkeyContext, e.clientX, e.clientY);
  };

  return (
    <div
      ref={cardRef}
      className={styles.cardGridItem}
      data-card-id={card.id}
      tabIndex={0}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Card Image */}
      <div className={`${styles.cardGridItemImage} ${imageLoaded ? styles.loaded : ''}`}>
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={showFaceDown ? 'Card Back' : card.name || `Card #${card.cardNumber}`}
            className={styles.cardGridItemImg}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.cardGridItemFallback}>#{card.cardNumber}</div>
        )}
      </div>

      {/* Card Name */}
      {card.name && !showFaceDown && (
        <div className={styles.cardGridItemName}>{card.name}</div>
      )}

      {/* Position Label */}
      {showPosition && (
        <div className={styles.cardGridItemPosition}>
          {positionPrefix} {position + 1}
        </div>
      )}
    </div>
  );
});
