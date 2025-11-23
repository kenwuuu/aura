import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResourcePile } from '@/components/ResourcePile';
import React from 'react';
import { act } from 'react';

/**
 * Resource Pile Component Tests
 *
 * Tests for the ResourcePile React component used for exile, discard, and deck piles.
 *
 * These tests verify:
 * 1. Rendering - labels, counts, CSS classes
 * 2. User interactions - hover, click, draw button
 * 3. Drag-drop - dragover, dragleave, drop events
 */

describe('ResourcePile - Rendering', () => {
  it('should render exile pile with correct structure', () => {
    const { container } = render(
      <ResourcePile type="exile" label="Exile" count={0} />
    );

    const pile = container.firstChild as HTMLElement;
    expect(pile).toHaveClass('resource-pile');
    expect(pile).toHaveClass('exile-pile');
    expect(pile.dataset.pileType).toBe('exile');

    const label = pile.querySelector('.pile-label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Exile');

    const count = pile.querySelector('.pile-count');
    expect(count).toBeInTheDocument();
    expect(count).toHaveTextContent('0');
    expect(count?.getAttribute('data-pile')).toBe('exile');
  });

  it('should render discard pile with correct structure', () => {
    const { container } = render(
      <ResourcePile type="discard" label="Discard" count={0} />
    );

    const pile = container.firstChild as HTMLElement;
    expect(pile).toHaveClass('resource-pile');
    expect(pile).toHaveClass('discard-pile');
    expect(pile.dataset.pileType).toBe('discard');

    const label = pile.querySelector('.pile-label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Discard');

    const count = pile.querySelector('.pile-count');
    expect(count).toBeInTheDocument();
    expect(count).toHaveTextContent('0');
    expect(count?.getAttribute('data-pile')).toBe('discard');
  });

  it('should render deck pile with draw button', () => {
    const mockDrawCard = vi.fn();
    const { container } = render(
      <ResourcePile
        type="deck"
        label="Deck"
        count={60}
        showDrawButton={true}
        onDraw={mockDrawCard}
      />
    );

    const deck = container.firstChild as HTMLElement;
    expect(deck).toHaveClass('resource-pile');
    expect(deck).toHaveClass('deck-pile');
    expect(deck.dataset.pileType).toBe('deck');

    const label = deck.querySelector('.pile-label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Deck');

    const count = deck.querySelector('.pile-count');
    expect(count).toBeInTheDocument();
    expect(count).toHaveTextContent('60');

    const drawButton = deck.querySelector('.draw-button');
    expect(drawButton).toBeInTheDocument();
    expect(drawButton).toHaveTextContent('Draw');
  });

  it('should not have draw button on exile pile', () => {
    const { container } = render(
      <ResourcePile type="exile" label="Exile" count={0} />
    );

    const pile = container.firstChild as HTMLElement;
    const drawButton = pile.querySelector('.draw-button');
    expect(drawButton).not.toBeInTheDocument();
  });

  it('should not have draw button on discard pile', () => {
    const { container } = render(
      <ResourcePile type="discard" label="Discard" count={0} />
    );

    const pile = container.firstChild as HTMLElement;
    const drawButton = pile.querySelector('.draw-button');
    expect(drawButton).not.toBeInTheDocument();
  });

  it('should display correct count', () => {
    const { container, rerender } = render(
      <ResourcePile type="exile" label="Exile" count={0} />
    );

    const pile = container.firstChild as HTMLElement;
    let count = pile.querySelector('.pile-count');
    expect(count).toHaveTextContent('0');

    // Re-render with different count
    rerender(<ResourcePile type="exile" label="Exile" count={5} />);
    count = pile.querySelector('.pile-count');
    expect(count).toHaveTextContent('5');
  });
});

describe('ResourcePile - User Interactions', () => {
  it('should call onHover callback when mouse enters pile', async () => {
    const mockOnHover = vi.fn();
    const { container } = render(
      <ResourcePile type="exile" label="Exile" count={0} onHover={mockOnHover} />
    );

    const pile = container.firstChild as HTMLElement;
    await userEvent.hover(pile);

    expect(mockOnHover).toHaveBeenCalled();
  });

  it('should call onLeave callback when mouse leaves pile', async () => {
    const mockOnHover = vi.fn();
    const mockOnLeave = vi.fn();
    const { container } = render(
      <ResourcePile
        type="exile"
        label="Exile"
        count={0}
        onHover={mockOnHover}
        onLeave={mockOnLeave}
      />
    );

    const pile = container.firstChild as HTMLElement;
    await userEvent.hover(pile);
    await userEvent.unhover(pile);

    expect(mockOnLeave).toHaveBeenCalled();
  });

  it('should call onClick callback when pile is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();
    const { container } = render(
      <ResourcePile type="exile" label="Exile" count={0} onClick={mockOnClick} />
    );

    const pile = container.firstChild as HTMLElement;
    await user.click(pile);

    expect(mockOnClick).toHaveBeenCalled();
  });

  it('should call onDraw callback when draw button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnDraw = vi.fn();
    const { container } = render(
      <ResourcePile
        type="deck"
        label="Deck"
        count={60}
        showDrawButton={true}
        onDraw={mockOnDraw}
      />
    );

    const drawButton = container.querySelector('.draw-button') as HTMLElement;
    await user.click(drawButton);

    expect(mockOnDraw).toHaveBeenCalled();
  });

  it('should prevent event propagation when draw button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnDraw = vi.fn();
    const mockOnClick = vi.fn();
    const { container } = render(
      <ResourcePile
        type="deck"
        label="Deck"
        count={60}
        showDrawButton={true}
        onDraw={mockOnDraw}
        onClick={mockOnClick}
      />
    );

    const drawButton = container.querySelector('.draw-button') as HTMLElement;
    await user.click(drawButton);

    expect(mockOnDraw).toHaveBeenCalled();
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should call onClick when clicking deck pile but not draw button', async () => {
    const user = userEvent.setup();
    const mockOnDraw = vi.fn();
    const mockOnClick = vi.fn();
    const { container } = render(
      <ResourcePile
        type="deck"
        label="Deck"
        count={60}
        showDrawButton={true}
        onDraw={mockOnDraw}
        onClick={mockOnClick}
      />
    );

    const label = container.querySelector('.pile-label') as HTMLElement;
    await user.click(label);

    expect(mockOnClick).toHaveBeenCalled();
    expect(mockOnDraw).not.toHaveBeenCalled();
  });

  it('should track hover state for keyboard shortcuts', async () => {
    let hoveredResource = false;
    const mockOnHover = vi.fn(() => {
      hoveredResource = true;
    });
    const mockOnLeave = vi.fn(() => {
      hoveredResource = false;
    });

    const { container } = render(
      <ResourcePile
        type="discard"
        label="Discard"
        count={0}
        onHover={mockOnHover}
        onLeave={mockOnLeave}
      />
    );

    const pile = container.firstChild as HTMLElement;
    await userEvent.hover(pile);
    expect(hoveredResource).toBe(true);

    await userEvent.unhover(pile);
    expect(hoveredResource).toBe(false);
  });
});

describe('ResourcePile - Drag and Drop', () => {
  it('should add drag-over class on dragover event', () => {
    const mockOnDrop = vi.fn();
    const { container } = render(
      <ResourcePile type="exile" label="Exile" count={0} onDrop={mockOnDrop} />
    );

    const pile = container.firstChild as HTMLElement;
    act(() => {
      const dragoverEvent = new DragEvent('dragover', { bubbles: true });
      pile.dispatchEvent(dragoverEvent);
    });

    expect(pile).toHaveClass('drag-over');
  });

  it('should remove drag-over class on dragleave event', () => {
    const mockOnDrop = vi.fn();
    const { container } = render(
      <ResourcePile type="exile" label="Exile" count={0} onDrop={mockOnDrop} />
    );

    const pile = container.firstChild as HTMLElement;

    // Add drag-over class
    act(() => {
      const dragoverEvent = new DragEvent('dragover', { bubbles: true });
      pile.dispatchEvent(dragoverEvent);
    });
    expect(pile).toHaveClass('drag-over');

    // Remove it
    act(() => {
      const dragleaveEvent = new DragEvent('dragleave', { bubbles: true });
      pile.dispatchEvent(dragleaveEvent);
    });
    expect(pile).not.toHaveClass('drag-over');
  });

  it('should remove drag-over class on drop event', () => {
    const mockOnDrop = vi.fn();
    const { container } = render(
      <ResourcePile type="exile" label="Exile" count={0} onDrop={mockOnDrop} />
    );

    const pile = container.firstChild as HTMLElement;

    // Add drag-over class
    act(() => {
      const dragoverEvent = new DragEvent('dragover', { bubbles: true });
      pile.dispatchEvent(dragoverEvent);
    });
    expect(pile).toHaveClass('drag-over');

    // Drop should remove it
    act(() => {
      const dropEvent = new DragEvent('drop', { bubbles: true });
      pile.dispatchEvent(dropEvent);
    });

    expect(pile).not.toHaveClass('drag-over');
  });

  it('should call onDrop callback on drop', () => {
    const mockOnDrop = vi.fn();
    const { container } = render(
      <ResourcePile type="exile" label="Exile" count={0} onDrop={mockOnDrop} />
    );

    const pile = container.firstChild as HTMLElement;
    const dropEvent = new DragEvent('drop', { bubbles: true }) as any;
    pile.dispatchEvent(dropEvent);

    expect(mockOnDrop).toHaveBeenCalled();
  });

  it('should prevent default behavior on dragover', () => {
    const mockOnDrop = vi.fn();
    const { container } = render(
      <ResourcePile type="exile" label="Exile" count={0} onDrop={mockOnDrop} />
    );

    const pile = container.firstChild as HTMLElement;
    const dragoverEvent = new DragEvent('dragover', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(dragoverEvent, 'preventDefault');
    pile.dispatchEvent(dragoverEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should prevent default behavior on drop', () => {
    const mockOnDrop = vi.fn();
    const { container } = render(
      <ResourcePile type="exile" label="Exile" count={0} onDrop={mockOnDrop} />
    );

    const pile = container.firstChild as HTMLElement;
    const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(dropEvent, 'preventDefault');
    pile.dispatchEvent(dropEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle drag-drop for deck pile', () => {
    const mockOnDraw = vi.fn();
    const mockOnDrop = vi.fn();
    const { container } = render(
      <ResourcePile
        type="deck"
        label="Deck"
        count={60}
        showDrawButton={true}
        onDraw={mockOnDraw}
        onDrop={mockOnDrop}
      />
    );

    const deck = container.firstChild as HTMLElement;

    // Dragover
    act(() => {
      const dragoverEvent = new DragEvent('dragover', { bubbles: true });
      deck.dispatchEvent(dragoverEvent);
    });
    expect(deck).toHaveClass('drag-over');

    // Drop
    act(() => {
      const dropEvent = new DragEvent('drop', { bubbles: true });
      deck.dispatchEvent(dropEvent);
    });

    expect(mockOnDrop).toHaveBeenCalled();
    expect(deck).not.toHaveClass('drag-over');
  });

  it('should handle drag-drop for discard pile', () => {
    const mockOnDrop = vi.fn();
    const { container } = render(
      <ResourcePile type="discard" label="Discard" count={0} onDrop={mockOnDrop} />
    );

    const pile = container.firstChild as HTMLElement;

    // Dragover
    act(() => {
      const dragoverEvent = new DragEvent('dragover', { bubbles: true });
      pile.dispatchEvent(dragoverEvent);
    });
    expect(pile).toHaveClass('drag-over');

    // Drop
    act(() => {
      const dropEvent = new DragEvent('drop', { bubbles: true });
      pile.dispatchEvent(dropEvent);
    });

    expect(mockOnDrop).toHaveBeenCalled();
    expect(pile).not.toHaveClass('drag-over');
  });
});

describe('ResourcePile - Multiple Pile Types', () => {
  it('should distinguish between exile and discard piles', () => {
    const { container: exileContainer } = render(
      <ResourcePile type="exile" label="Exile" count={0} />
    );
    const { container: discardContainer } = render(
      <ResourcePile type="discard" label="Discard" count={0} />
    );

    const exilePile = exileContainer.firstChild as HTMLElement;
    const discardPile = discardContainer.firstChild as HTMLElement;

    expect(exilePile).toHaveClass('exile-pile');
    expect(exilePile).not.toHaveClass('discard-pile');

    expect(discardPile).toHaveClass('discard-pile');
    expect(discardPile).not.toHaveClass('exile-pile');
  });

  it('should have unique data-pile attributes for each pile type', () => {
    const { container: exileContainer } = render(
      <ResourcePile type="exile" label="Exile" count={0} />
    );
    const { container: discardContainer } = render(
      <ResourcePile type="discard" label="Discard" count={0} />
    );
    const { container: deckContainer } = render(
      <ResourcePile type="deck" label="Deck" count={60} showDrawButton={true} />
    );

    const exilePile = exileContainer.firstChild as HTMLElement;
    const discardPile = discardContainer.firstChild as HTMLElement;
    const deckPile = deckContainer.firstChild as HTMLElement;

    const exileCount = exilePile.querySelector('.pile-count');
    const discardCount = discardPile.querySelector('.pile-count');
    const deckCount = deckPile.querySelector('.pile-count');

    expect(exileCount?.getAttribute('data-pile')).toBe('exile');
    expect(discardCount?.getAttribute('data-pile')).toBe('discard');
    expect(deckCount?.getAttribute('data-pile')).toBe('deck');
  });

  it('should allow independent hover states for different piles', async () => {
    let exileHovered = false;
    let discardHovered = false;

    const { container: exileContainer } = render(
      <ResourcePile
        type="exile"
        label="Exile"
        count={0}
        onHover={() => { exileHovered = true; }}
        onLeave={() => { exileHovered = false; }}
      />
    );
    const { container: discardContainer } = render(
      <ResourcePile
        type="discard"
        label="Discard"
        count={0}
        onHover={() => { discardHovered = true; }}
        onLeave={() => { discardHovered = false; }}
      />
    );

    const exilePile = exileContainer.firstChild as HTMLElement;
    const discardPile = discardContainer.firstChild as HTMLElement;

    await userEvent.hover(exilePile);
    expect(exileHovered).toBe(true);
    expect(discardHovered).toBe(false);

    await userEvent.unhover(exilePile);
    await userEvent.hover(discardPile);
    expect(exileHovered).toBe(false);
    expect(discardHovered).toBe(true);
  });
});
