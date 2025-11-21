import React, { useRef } from 'react';
import { Card } from '../deck';
import { DEFAULT_CARD_BACK } from '@/constants';
import { setElementDragPoint } from '@/utils/centerHtmlElementOnDrag';

interface HandCardProps {
  card: Card;
  zoomLevel: number;
  onMouseEnter: (cardId: string) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onDragStart: (card: Card, element: HTMLDivElement, e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export const HandCard: React.FC<HandCardProps> = ({
  card,
  zoomLevel,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onDragStart,
  onDragEnd
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate zoom-adjusted dimensions
  const baseWidth = 63;
  const baseHeight = 88;
  const width = baseWidth * zoomLevel;
  const height = baseHeight * zoomLevel;

  // Determine which image to show based on flip state
  const shouldHaveImage = card.isFlipped
    ? (card.images?.back?.normal || DEFAULT_CARD_BACK)
    : card.images?.front?.normal;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    // Use your normal card-centered drag image
    setElementDragPoint(cardRef.current, e.nativeEvent, 'card');

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);

    cardRef.current.classList.add('dragging');
    cardRef.current.classList.remove('hover');

    onDragStart(card, cardRef.current, e);
  };

  const handleDragEnd = () => {
    if (cardRef.current) {
      cardRef.current.classList.remove('dragging');
    }
    onDragEnd();
  };

  return (
    <div
      ref={cardRef}
      className="hand-card"
      data-card-id={card.id}
      draggable
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      onMouseEnter={() => onMouseEnter(card.id)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {shouldHaveImage ? (
        <>
          <img
            src={shouldHaveImage}
            alt={card.isFlipped ? 'Card Back' : (card.name || `Card #${card.cardNumber}`)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '8px',
              pointerEvents: 'none',
            }}
          />
          <div className="card-number-badge">
            #{card.cardNumber}
          </div>
        </>
      ) : (
        <div className="card-number-badge">
          #{card.cardNumber}
        </div>
      )}
    </div>
  );
};
