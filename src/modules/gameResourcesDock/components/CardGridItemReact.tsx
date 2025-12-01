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
  const [frontImageLoaded, setFrontImageLoaded] = React.useState(false);
  const [backImageLoaded, setBackImageLoaded] = React.useState(false);
  const [frontImageError, setFrontImageError] = React.useState(false);
  const [backImageError, setBackImageError] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const frontImageUrl = card.images?.front?.normal || card.images?.front?.small;
  const backImageUrl = DEFAULT_CARD_BACK;

  const handleMouseEnter = (e: React.MouseEvent) => {
    onHover(card);
    tooltipManager?.showOnHover(card.id, hotkeyContext);
  };

  const handleMouseLeave = () => {
    onHover(null);
    tooltipManager?.hideOnLeave();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    tooltipManager?.setMouseLocation(e.clientX, e.clientY);
  };

  const handleClick = (e: React.MouseEvent) => {
    tooltipManager?.show(card.id, hotkeyContext, e.clientX, e.clientY);
  };

  const hasFrontImage = frontImageUrl && !frontImageError;
  const hasBackImage = backImageUrl && !backImageError;
  const hasAnyImage = hasFrontImage || hasBackImage;

  return (
    <div
      ref={cardRef}
      className={styles.cardGridItem}
      data-card-id={card.id}
      tabIndex={0}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Card Image */}
      <div className={styles.cardGridItemImage}>
        {hasAnyImage ? (
          <div className={styles.cardImageContainer}>
            {/* Front Image */}
            {hasFrontImage && (
              <img
                src={frontImageUrl}
                alt={card.name || `Card #${card.cardNumber}`}
                className={`${styles.cardGridItemImg} ${styles.cardFrontImage} ${
                  frontImageLoaded ? styles.loaded : ''
                } ${showFaceDown ? styles.hidden : ''}`}
                loading="lazy"
                onLoad={() => setFrontImageLoaded(true)}
                onError={() => setFrontImageError(true)}
              />
            )}

            {/* Back Image */}
            {hasBackImage && (
              <img
                src={backImageUrl}
                alt="Card Back"
                className={`${styles.cardGridItemImg} ${styles.cardBackImage} ${
                  backImageLoaded ? styles.loaded : ''
                } ${!showFaceDown ? styles.hidden : ''}`}
                loading="lazy"
                onLoad={() => setBackImageLoaded(true)}
                onError={() => setBackImageError(true)}
              />
            )}
          </div>
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
