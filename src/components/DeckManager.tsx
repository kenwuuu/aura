import React, { useState } from 'react';
import { DeckImportModal } from './DeckImportModal';
import { DeckSelectionModal } from './DeckSelectionModal';
import { SavedDeck } from '../modules/deck/types';

interface DeckManagerProps {
  onDeckSelected: (deck: SavedDeck) => void;
}

export function DeckManager({ onDeckSelected }: DeckManagerProps) {
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const handleOpenSelection = () => {
    setShowSelectionModal(true);
  };

  const handleDeckImported = (deck: SavedDeck) => {
    setShowImportModal(false);
    onDeckSelected(deck);
  };

  const handleDeckSelected = (deck: SavedDeck) => {
    setShowSelectionModal(false);
    onDeckSelected(deck);
  };

  return (
    <>
      <button className="toolbar-button primary" onClick={handleOpenSelection}>
        📚 Choose Deck
      </button>

      <DeckSelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        onDeckSelected={handleDeckSelected}
        onImportNewDeck={() => {
          setShowSelectionModal(false);
          setShowImportModal(true);
        }}
      />

      <DeckImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onDeckImported={handleDeckImported}
      />
    </>
  );
}