import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { MtgTextListDeckImporter } from '@/services/deckImporter';
import { DeckStorageService } from '@/services/deckStorage';
import { SavedDeck } from '@/modules/deck/types';
import { DeckImportHelpDialog } from './DeckImportHelpDialog';
import { ModalFooter } from '@/components/ModalFooter';
import {InfoIcon} from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface DeckImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeckImported: (deck: SavedDeck) => void;
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10001,
    animation: 'fadeIn 150ms ease-out',
  },
  content: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#1f1f1f',
    border: '2px solid #3d3d3d',
    borderRadius: '16px',
    padding: '0',
    maxWidth: '600px',
    width: '90vw',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
    zIndex: 10002,
    animation: 'slideIn 200ms ease-out',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #3d3d3d',
  },
  title: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#9ca3af',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    lineHeight: '1',
  },
  formGroup: {
    marginBottom: '10px',
  },
  body: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
  },
};

export function DeckImportModal({ isOpen, onClose, onDeckImported }: DeckImportModalProps) {
  const [deckText, setDeckText] = useState('');
  const [deckName, setDeckName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
      const importer = new MtgTextListDeckImporter((current, total) => {
        setProgress({ current, total });
      });

      const result = await importer.importFromText(deckText);

      if (result.errors && result.errors.length > 0) {
        setErrors(result.errors);
        setIsImporting(false);
        return;
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

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay style={styles.overlay} />
        <Dialog.Content style={styles.content}>
          <div style={styles.header}>
            <Dialog.Title style={styles.title}>Import Deck from Scryfall</Dialog.Title>
            <Dialog.Close style={styles.closeButton} onClick={handleClose}>×</Dialog.Close>
          </div>

          <div style={styles.body}>
          <div className="form-group">
            <label htmlFor="deck-name">Deck Name</label>
            <input
              id="deck-name"
              type="text"
              value={deckName}
              autoFocus={true}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Deck name"
              disabled={isImporting}
            />
          </div>

          <Alert className={"mb-4"}>
            <InfoIcon />
            <AlertTitle>Set imports available now!</AlertTitle>
            <AlertDescription>
              Must include set code in parentheses and collector number.
              <br/>
              Example: 1 Rhystic Study (WOT) 71
            </AlertDescription>
          </Alert>

          <div className="form-group">
            <label htmlFor="deck-list">Deck List</label>
            <textarea
              id="deck-list"
              value={deckText}
              onChange={(e) => setDeckText(e.target.value)}
              placeholder={`Place your commander in the last line.
              Enter your deck list (one card per line):
              \n\n1 Rhystic Study (WOT) 71\n4 Lightning Bolt\n20 Mountain`}
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
            <div className="error-container" style={{ whiteSpace: 'pre-line' }}>
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

          <ModalFooter
            buttons={[
              {
                label: 'Help',
                onClick: () => setIsHelpOpen(true),
                disabled: isImporting,
                align: 'left',
              },
              {
                label: 'Cancel',
                onClick: handleClose,
                disabled: isImporting,
              },
              {
                label: isImporting ? 'Importing...' : 'Import Deck',
                onClick: handleImport,
                disabled: isImporting || !deckText.trim() || !deckName.trim(),
                variant: 'primary',
              },
            ]}
          />
        </Dialog.Content>
      </Dialog.Portal>

      <DeckImportHelpDialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </Dialog.Root>
  );
}