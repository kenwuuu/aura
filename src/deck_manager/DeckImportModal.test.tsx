import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeckImportModal } from './DeckImportModal';

// Mock the deck importer and storage services
vi.mock('../services/deckImporter', () => ({
  MtgTextListDeckImporter: vi.fn().mockImplementation(() => ({
    importFromText: vi.fn().mockResolvedValue({
      cards: [
        { id: 'card-1', cardNumber: 1, name: 'Lightning Bolt' },
        { id: 'card-2', cardNumber: 2, name: 'Mountain' },
      ],
      errors: [],
      metadata: {},
    }),
  })),
}));

vi.mock('../services/deckStorage', () => ({
  DeckStorageService: vi.fn().mockImplementation(() => ({
    saveDeck: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('DeckImportModal - Help Dialog Integration', () => {
  const mockOnClose = vi.fn();
  const mockOnDeckImported = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <DeckImportModal
        isOpen={false}
        onClose={mockOnClose}
        onDeckImported={mockOnDeckImported}
      />
    );

    expect(screen.queryByText('Import Deck from Scryfall')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <DeckImportModal
        isOpen={true}
        onClose={mockOnClose}
        onDeckImported={mockOnDeckImported}
      />
    );

    expect(screen.getByText('Import Deck from Scryfall')).toBeInTheDocument();
  });

  it('should have a Help button', () => {
    render(
      <DeckImportModal
        isOpen={true}
        onClose={mockOnClose}
        onDeckImported={mockOnDeckImported}
      />
    );

    const helpButton = screen.getByRole('button', { name: /help/i });
    expect(helpButton).toBeInTheDocument();
  });

  it('should open Help dialog when Help button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DeckImportModal
        isOpen={true}
        onClose={mockOnClose}
        onDeckImported={mockOnDeckImported}
      />
    );

    const helpButton = screen.getByRole('button', { name: /help/i });
    await user.click(helpButton);

    // Help dialog should be visible
    expect(screen.getByText('Deck Import Guide')).toBeInTheDocument();
  });

  it('should keep Import modal open when Help dialog is opened', async () => {
    const user = userEvent.setup();
    render(
      <DeckImportModal
        isOpen={true}
        onClose={mockOnClose}
        onDeckImported={mockOnDeckImported}
      />
    );

    const helpButton = screen.getByRole('button', { name: /help/i });
    await user.click(helpButton);

    // Both modals should be visible
    expect(screen.getByText('Import Deck from Scryfall')).toBeInTheDocument();
    expect(screen.getByText('Deck Import Guide')).toBeInTheDocument();
  });

  it('should keep Import modal open when Help dialog is closed via "Got it" button', async () => {
    const user = userEvent.setup();
    render(
      <DeckImportModal
        isOpen={true}
        onClose={mockOnClose}
        onDeckImported={mockOnDeckImported}
      />
    );

    // Open Help dialog
    const helpButton = screen.getByRole('button', { name: /help/i });
    await user.click(helpButton);

    expect(screen.getByText('Deck Import Guide')).toBeInTheDocument();

    // Close Help dialog
    const gotItButton = screen.getByRole('button', { name: /got it/i });
    await user.click(gotItButton);

    // Import modal should still be open
    expect(screen.getByText('Import Deck from Scryfall')).toBeInTheDocument();

    // Help dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText('Deck Import Guide')).not.toBeInTheDocument();
    });

    // Import modal's onClose should NOT have been called
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should keep Import modal open when Help dialog is closed via X button', async () => {
    const user = userEvent.setup();
    render(
      <DeckImportModal
        isOpen={true}
        onClose={mockOnClose}
        onDeckImported={mockOnDeckImported}
      />
    );

    // Open Help dialog
    const helpButton = screen.getByRole('button', { name: /help/i });
    await user.click(helpButton);

    // Close Help dialog via X button
    const closeButtons = screen.getAllByText('×');
    const helpDialogCloseButton = closeButtons.find(
      (btn) => btn.closest('[role="dialog"]')?.textContent?.includes('Deck Import Guide')
    );

    if (helpDialogCloseButton) {
      await user.click(helpDialogCloseButton);
    }

    // Import modal should still be open
    expect(screen.getByText('Import Deck from Scryfall')).toBeInTheDocument();

    // Import modal's onClose should NOT have been called
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should have Help button on the left side of footer', () => {
    render(
      <DeckImportModal
        isOpen={true}
        onClose={mockOnClose}
        onDeckImported={mockOnDeckImported}
      />
    );

    const footer = screen.getByRole('button', { name: /help/i }).parentElement;
    const buttons = footer?.querySelectorAll('button');

    // Help should be first, then Cancel and Import
    expect(buttons?.[0]).toHaveTextContent('Help');
  });

  it('should disable Help button when importing', async () => {
    const user = userEvent.setup();
    render(
      <DeckImportModal
        isOpen={true}
        onClose={mockOnClose}
        onDeckImported={mockOnDeckImported}
      />
    );

    // Fill in required fields
    const deckNameInput = screen.getByPlaceholderText(/deck name/i);
    const deckListTextarea = screen.getByPlaceholderText(/enter your deck list/i);

    await user.type(deckNameInput, 'Test Deck');
    await user.type(deckListTextarea, '4 Lightning Bolt\n20 Mountain');

    // Start import (this is mocked, so it completes immediately)
    const importButton = screen.getByRole('button', { name: /import deck/i });
    await user.click(importButton);

    // Help button should be disabled during import
    const helpButton = screen.getByRole('button', { name: /help/i });
    expect(helpButton).toBeDisabled();
  });

  it('should show correct content in Help dialog', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DeckImportModal
        isOpen={true}
        onClose={mockOnClose}
        onDeckImported={mockOnDeckImported}
      />
    );

    const helpButton = screen.getByRole('button', { name: /help/i });
    await user.click(helpButton);

    // Verify Help dialog content
    expect(screen.getByText('Recommended Format')).toBeInTheDocument();
    expect(screen.getByText('Not Supported')).toBeInTheDocument();
    expect(screen.getByText('Supported Formats')).toBeInTheDocument();
    expect(screen.getByText(/MTGO preset/i)).toBeInTheDocument();

    // Check that unsupported keywords appear in the document
    expect(document.body.textContent).toContain('SIDEBOARD:');
    expect(document.body.textContent).toContain('COMMANDER:');
  });

  it('should allow reopening Help dialog after closing it', async () => {
    const user = userEvent.setup();
    render(
      <DeckImportModal
        isOpen={true}
        onClose={mockOnClose}
        onDeckImported={mockOnDeckImported}
      />
    );

    // Open Help
    const helpButton = screen.getByRole('button', { name: /help/i });
    await user.click(helpButton);
    expect(screen.getByText('Deck Import Guide')).toBeInTheDocument();

    // Close Help
    const gotItButton = screen.getByRole('button', { name: /got it/i });
    await user.click(gotItButton);

    await waitFor(() => {
      expect(screen.queryByText('Deck Import Guide')).not.toBeInTheDocument();
    });

    // Reopen Help
    await user.click(helpButton);
    expect(screen.getByText('Deck Import Guide')).toBeInTheDocument();
  });

  it('should close Import modal independently of Help dialog state', async () => {
    const user = userEvent.setup();
    render(
      <DeckImportModal
        isOpen={true}
        onClose={mockOnClose}
        onDeckImported={mockOnDeckImported}
      />
    );

    // Open Help dialog first
    const helpButton = screen.getByRole('button', { name: /help/i });
    await user.click(helpButton);

    // Close Import modal
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Import modal's onClose should have been called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});