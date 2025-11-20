import React, { useState, useEffect } from 'react';
import { DeckStorageService } from '../services/deckStorage';
import { DeckMetadata, SavedDeck } from '../modules/deck/types';

interface DeckSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeckSelected: (deck: SavedDeck) => void;
  onImportNewDeck: () => void;
}

export function DeckSelectionModal({
  isOpen,
  onClose,
  onDeckSelected,
  onImportNewDeck,
}: DeckSelectionModalProps) {
  const [decks, setDecks] = useState<DeckMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDecks();
    }
  }, [isOpen]);

  const loadDecks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const storage = new DeckStorageService();
      const deckMetadata = await storage.getAllDeckMetadata();

      // Sort by last modified (newest first)
      deckMetadata.sort((a, b) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );

      setDecks(deckMetadata);
    } catch (err) {
      console.error('Error loading decks:', err);
      setError('Failed to load decks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDeck = async (deckId: string) => {
    try {
      const storage = new DeckStorageService();
      const deck = await storage.getDeck(deckId);

      if (deck) {
        onDeckSelected(deck);
        onClose();
      } else {
        setError('Deck not found');
      }
    } catch (err) {
      console.error('Error loading deck:', err);
      setError('Failed to load deck');
    }
  };

  const handleDeleteDeck = async (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this deck?')) {
      return;
    }

    try {
      const storage = new DeckStorageService();
      await storage.deleteDeck(deckId);
      await loadDecks();
    } catch (err) {
      console.error('Error deleting deck:', err);
      setError('Failed to delete deck');
    }
  };

  const handleImportNew = () => {
    onClose();
    onImportNewDeck();
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content deck-selection-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select a Deck</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {isLoading && <p>Loading decks...</p>}

          {error && (
            <div className="error-container">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && decks.length === 0 && (
            <div className="empty-state">
              <p>No decks found. Import your first deck to get started!</p>
            </div>
          )}

          {!isLoading && decks.length > 0 && (
            <div className="deck-list">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="deck-item"
                  onClick={() => handleSelectDeck(deck.id)}
                >
                  <div className="deck-info">
                    <h3>{deck.name}</h3>
                    <div className="deck-meta">
                      <span className="deck-card-count">{deck.cardCount} cards</span>
                      {deck.format && <span className="deck-format">{deck.format}</span>}
                      <span className="deck-source">{deck.source}</span>
                    </div>
                    <p className="deck-date">
                      Last modified: {formatDate(deck.lastModified)}
                    </p>
                  </div>
                  <button
                    className="deck-delete"
                    onClick={(e) => handleDeleteDeck(deck.id, e)}
                    title="Delete deck"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleImportNew} className="primary">
            Import New Deck
          </button>
        </div>
      </div>
    </div>
  );
}