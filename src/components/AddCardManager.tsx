import React, { useState, useEffect } from 'react';
import { AddCardModal } from './AddCardModal';
import { ScryfallApiService } from '@/services/scryfall';
import { toCard } from '@/services/scryfall/ScryfallCardAdapter';
import { Card } from '@/modules/deck';
import * as Sentry from '@sentry/react';

interface AddCardManagerProps {
  scryfallApiService: ScryfallApiService;
  onAddCard: (card: Card) => void;
}

export const AddCardManager: React.FC<AddCardManagerProps> = ({
  scryfallApiService,
  onAddCard,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        if (e.key?.toLowerCase() === 'a' && !e.repeat) {
          // Only trigger if not focused on an input element
          if (
            document.activeElement?.tagName !== 'INPUT' &&
            document.activeElement?.tagName !== 'TEXTAREA'
          ) {
            e.preventDefault();
            setIsOpen(true);
          }
        }
      } catch (error) {
        Sentry.captureException(error, {
          extra: { event: e },
        });

        Sentry.logger.error("Error in AddCardManager_handleKeyDown", {
          action: 'AddCardManager_handleKeyDown',
          eventKey: e.key,
          eventCode: e.code,
          isRepeat: e.repeat,
          activeElement: document.activeElement?.tagName,
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddCard = async (cardName: string) => {
    const scryfallCard = await scryfallApiService.fetchCardByName(cardName);
    const card = toCard(scryfallCard, -1); // -1 indicates dynamically added card
    onAddCard(card);
    console.log(`Added ${cardName} to hand`);
  };

  return <AddCardModal isOpen={isOpen} onClose={() => setIsOpen(false)} onAddCard={handleAddCard} />;
};