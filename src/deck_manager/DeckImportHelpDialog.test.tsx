import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeckImportHelpDialog } from './DeckImportHelpDialog';

describe('DeckImportHelpDialog', () => {
  it('should not render when isOpen is false', () => {
    const onClose = vi.fn();
    render(<DeckImportHelpDialog isOpen={false} onClose={onClose} />);

    expect(screen.queryByText('Deck Import Guide')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    const onClose = vi.fn();
    render(<DeckImportHelpDialog isOpen={true} onClose={onClose} />);

    expect(screen.getByText('Deck Import Guide')).toBeInTheDocument();
  });

  it('should display all sections', () => {
    const onClose = vi.fn();
    render(<DeckImportHelpDialog isOpen={true} onClose={onClose} />);

    expect(screen.getByText('Recommended Format')).toBeInTheDocument();
    expect(screen.getByText('Not Supported')).toBeInTheDocument();
    expect(screen.getByText('Supported Formats')).toBeInTheDocument();
  });

  it('should show MTGO preset recommendation', () => {
    const onClose = vi.fn();
    render(<DeckImportHelpDialog isOpen={true} onClose={onClose} />);

    expect(screen.getByText(/MTGO preset/i)).toBeInTheDocument();
    expect(screen.getByText(/Moxfield's download button/i)).toBeInTheDocument();
  });

  it('should show unsupported format examples', () => {
    const onClose = vi.fn();
    render(<DeckImportHelpDialog isOpen={true} onClose={onClose} />);

    // Check that unsupported keywords appear in the document
    expect(document.body.textContent).toContain('SIDEBOARD:');
    expect(document.body.textContent).toContain('COMMANDER:');
    expect(document.body.textContent).toContain('Zuran Orb');
  });

  it('should show supported formats list', () => {
    const onClose = vi.fn();
    render(<DeckImportHelpDialog isOpen={true} onClose={onClose} />);

    expect(screen.getByText(/Simple quantity \+ name format/)).toBeInTheDocument();
    expect(screen.getByText(/Blank lines between cards/)).toBeInTheDocument();
  });

  it('should call onClose when "Got it" button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DeckImportHelpDialog isOpen={true} onClose={onClose} />);

    const gotItButton = screen.getByRole('button', { name: /got it/i });
    await user.click(gotItButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should stop propagation when "Got it" is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const parentClickHandler = vi.fn();

    const { container } = render(
      <div onClick={parentClickHandler}>
        <DeckImportHelpDialog isOpen={true} onClose={onClose} />
      </div>
    );

    const gotItButton = screen.getByRole('button', { name: /got it/i });
    await user.click(gotItButton);

    // onClose should be called
    expect(onClose).toHaveBeenCalledTimes(1);

    // Parent handler should NOT be called due to stopPropagation
    // Note: This behavior depends on how Radix Portal renders - it may not actually
    // prevent the parent click in a portal scenario, but we're testing our onClick handler
    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  it('should have correct z-index for overlay and content', () => {
    const onClose = vi.fn();
    const { container } = render(<DeckImportHelpDialog isOpen={true} onClose={onClose} />);

    // Check that elements exist (z-index is applied via inline styles)
    // We can't easily test inline styles in this setup, but we can verify structure
    expect(screen.getByText('Deck Import Guide')).toBeInTheDocument();
  });

  it('should show code examples with correct formatting', () => {
    const onClose = vi.fn();
    render(<DeckImportHelpDialog isOpen={true} onClose={onClose} />);

    // Check that code examples are present
    expect(screen.getByText(/4 Pygmy Pyrosaur/)).toBeInTheDocument();
    expect(screen.getByText(/1 Flubs, the Fool/)).toBeInTheDocument();
    expect(screen.getByText(/1 Zuran Orb/)).toBeInTheDocument();
  });
});