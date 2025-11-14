import React from 'react';
import { Card } from '../deck/types';

interface CardPreviewProps {
  card: Card | null;
  isVisible: boolean;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ card, isVisible }) => {
  // Don't render if not visible or no card image
  if (!isVisible || !card?.images?.front?.normal) {
    return null;
  }

  return (
    <div className="card-preview-popup fixed top-5 right-5 w-[500px] h-[698px] z-[10000] rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.6)] border-2 border-slate-600 overflow-hidden pointer-events-none">
      <img
        src={card.images.front.normal}
        alt={card.name || `Card #${card.cardNumber}`}
        className="w-full h-full object-cover"
      />
    </div>
  );
};