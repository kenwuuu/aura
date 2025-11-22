import React, { useState, useEffect } from 'react';
import { DeckStorageService } from '../services/deckStorage';
import { DeckMetadata, SavedDeck } from '../modules/deck/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Select a Deck</DialogTitle>
          <DialogDescription>
            Choose a deck to load or import a new one
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          {isLoading && <p className="text-gray-400">Loading decks...</p>}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isLoading && decks.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>No decks found. Import your first deck to get started!</p>
            </div>
          )}

          {!isLoading && decks.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className="flex items-center justify-between p-4 bg-[#2a2a2a] border border-[#3d3d3d] rounded-lg hover:bg-[#333] transition-colors cursor-pointer"
                  onClick={() => handleSelectDeck(deck.id)}
                >
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{deck.name}</h3>
                    <div className="flex gap-3 text-sm text-gray-400 mb-1">
                      <span>{deck.cardCount} cards</span>
                      {deck.format && <span>{deck.format}</span>}
                      <span>{deck.source}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Last modified: {formatDate(deck.lastModified)}
                    </p>
                  </div>
                  <button
                    className="ml-4 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-[#2a2a2a] rounded transition-colors"
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

        <DialogFooter className="px-6 pb-6">
          <Button
            type="button"
            onClick={onClose}
            className="bg-[#2a2a2a] border border-[#3d3d3d] text-gray-400 hover:bg-[#3d3d3d] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImportNew}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            Import New Deck
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}