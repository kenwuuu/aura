import React, { useState } from 'react';
import { ScryfallDeckImporter } from '../services/deckImporter';
import { DeckStorageService } from '../services/deckStorage';
import { SavedDeck } from '../modules/deck/types';

interface DeckImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeckImported: (deck: SavedDeck) => void;
}

export function DeckImportModal({ isOpen, onClose, onDeckImported }: DeckImportModalProps) {
  const [deckText, setDeckText] = useState('');
  const [deckName, setDeckName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  const handleImport = async () => {
    if (!deckText.trim() || !deckName.trim()) {
      setErrors(['Please provide both a deck name and deck list']);
      return;
    }

    setIsImporting(true);
    setErrors([]);
    setSuccessMessage('');
    setProgress({ current: 0, total: 0 });

    try {
      const importer = new ScryfallDeckImporter((current, total) => {
        setProgress({ current, total });
      });

      const result = await importer.importFromText(deckText);

      if (result.errors && result.errors.length > 0) {
        setErrors(result.errors);
      }

      if (result.cards.length === 0) {
        setErrors(['No cards could be imported. Please check your deck list format.']);
        setIsImporting(false);
        return;
      }

      const savedDeck: SavedDeck = {
        metadata: {
          id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: deckName,
          source: 'scryfall',
          cardCount: result.cards.length,
          importedAt: new Date(),
          lastModified: new Date(),
          ...result.metadata,
        },
        cards: result.cards,
      };

      const storage = new DeckStorageService();
      await storage.saveDeck(savedDeck);

      setSuccessMessage(`Successfully imported ${result.cards.length} cards!`);

      // Wait a moment to show success message, then call the callback
      setTimeout(() => {
        onDeckImported(savedDeck);
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Import error:', error);
      setErrors([error instanceof Error ? error.message : 'An unknown error occurred']);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setDeckText('');
    setDeckName('');
    setErrors([]);
    setSuccessMessage('');
    setProgress({ current: 0, total: 0 });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import Deck from Scryfall</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="deck-name">Deck Name</label>
            <input
              id="deck-name"
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="My Awesome Deck"
              disabled={isImporting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="deck-list">Deck List</label>
            <textarea
              id="deck-list"
              value={deckText}
              onChange={(e) => setDeckText(e.target.value)}
              placeholder={`Enter your deck list (one card per line):\n\n4 Lightning Bolt\n20 Mountain\n1 Bonfire of the Damned`}
              rows={15}
              disabled={isImporting}
            />
          </div>

          {isImporting && progress.total > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="progress-text">
                Fetching card {progress.current} of {progress.total}...
              </p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="error-container">
              <h4>Errors:</h4>
              <ul>
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {successMessage && (
            <div className="success-container">
              <p>{successMessage}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={handleClose} disabled={isImporting}>
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || !deckText.trim() || !deckName.trim()}
            className="primary"
          >
            {isImporting ? 'Importing...' : 'Import Deck'}
          </button>
        </div>
      </div>
    </div>
  );
}