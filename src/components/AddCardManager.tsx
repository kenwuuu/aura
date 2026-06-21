import React, { useEffect } from 'react';
import posthog from 'posthog-js';
import { AddCardModal } from './AddCardModal';
import { ScryfallApiService } from '@/services/scryfall';
import { toCard } from '@/services/scryfall/ScryfallCardAdapter';
import { Card } from '@/modules/deck';
import { useHotkeyStore } from '@/stores/hotkeyStore';

interface AddCardManagerProps {
  scryfallApiService: ScryfallApiService;
  onAddCard: (card: Card) => void;
}

export const AddCardManager: React.FC<AddCardManagerProps> = ({
  scryfallApiService,
  onAddCard,
}) => {
  const addCardModalOpen = useHotkeyStore((state) => state.addCardModalOpen);
  const setAddCardModalOpen = useHotkeyStore((state) => state.setAddCardModalOpen);
  const setModalOpen = useHotkeyStore((state) => state.setModalOpen);

  // Sync the global modal state with the AddCard modal state
  useEffect(() => {
    setModalOpen(addCardModalOpen);
  }, [addCardModalOpen, setModalOpen]);

  const handleAddCard = async (cardName: string) => {
    const scryfallCard = await scryfallApiService.fetchCardByName(cardName);
    const card = toCard(scryfallCard, -1); // -1 indicates dynamically added card
    onAddCard(card);
    posthog.capture('card_added_to_hand', { card_name: cardName });
    console.log(`Added ${cardName} to hand`);
  };

  const handleClose = () => {
    setAddCardModalOpen(false);
  };

  return <AddCardModal isOpen={addCardModalOpen} onClose={handleClose} onAddCard={handleAddCard} />;
};