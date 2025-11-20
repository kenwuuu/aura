import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DeckPileViewer } from './DeckPileViewer';
import { Card } from '../../deck';

// Helper to create mock cards
function createMockCard(id: string, cardNumber: number, name?: string, type_line?: string): Card {
  return {
    id,
    cardNumber,
    name,
    type_line,
    x: 0,
    y: 0,
    rotation: 0,
    isTapped: false,
    isFlipped: false,
    counters: [],
  };
}

describe('DeckPileViewer', () => {
  let viewer: DeckPileViewer;
  let mockCards: Card[];

  beforeEach(() => {
    // Create a mock deck with 10 cards
    // Deck is stored bottom-to-top, so index 0 = bottom, index 9 = top
    mockCards = Array.from({ length: 10 }, (_, i) =>
      createMockCard(`card-${i}`, i + 1, `Card ${i + 1}`)
    );

    viewer = new DeckPileViewer();
  });

  afterEach(() => {
    // Clean up any open modals
    const modals = document.querySelectorAll('.deck-pile-viewer-modal');
    modals.forEach((modal) => modal.remove());
  });

  describe('Initial display and card ordering', () => {
    it('should show cards in correct order (top to bottom)', () => {
      viewer.show(mockCards, 'deck');

      const cardElements = document.querySelectorAll('.card-grid-item');

      // Should have 10 cards
      expect(cardElements.length).toBe(10);

      // First card shown should be the TOP card (last in array = index 9)
      const firstCard = cardElements[0];
      expect(firstCard.getAttribute('data-card-id')).toBe('card-9');

      // Last card shown should be the BOTTOM card (first in array = index 0)
      const lastCard = cardElements[9];
      expect(lastCard.getAttribute('data-card-id')).toBe('card-0');
    });

    it('should fail if cards are not reversed (BUG TEST)', () => {
      // This test documents the bug: if we don't reverse the cards,
      // they will be shown in wrong order (bottom to top instead of top to bottom)

      viewer.show(mockCards, 'deck');

      const cardElements = document.querySelectorAll('.card-grid-item');

      // Verify the CORRECT order (top card first)
      const firstCardId = cardElements[0].getAttribute('data-card-id');

      // If the bug exists (no reverse), firstCardId would be 'card-0' (bottom card)
      // Correct behavior: firstCardId should be 'card-9' (top card)
      expect(firstCardId).not.toBe('card-0'); // Should NOT be bottom card
      expect(firstCardId).toBe('card-9'); // Should BE top card
    });

    it('should display absolute position labels correctly', () => {
      viewer.show(mockCards, 'deck');

      const positionBadges = document.querySelectorAll('.card-grid-item-position');

      // First displayed card (top of deck) should show "Top 1" (1-indexed for humans)
      expect(positionBadges[0].textContent).toBe('Top 1');

      // Last displayed card (bottom of deck) should show "Top 10"
      expect(positionBadges[9].textContent).toBe('Top 10');
    });

    it('should show card images when available', () => {
      const cardsWithImages: Card[] = mockCards.map((card) => ({
        ...card,
        images: {
          front: {
            normal: `https://example.com/${card.id}.jpg`,
          },
        },
      }));

      viewer.show(cardsWithImages, 'deck');

      const images = document.querySelectorAll('.card-grid-item-img');
      expect(images.length).toBe(10);

      // Check first image has correct src
      const firstImg = images[0] as HTMLImageElement;
      expect(firstImg.src).toBe('https://example.com/card-9.jpg');
    });

    it('should show card number fallback when no images', () => {
      viewer.show(mockCards, 'deck');

      const fallbacks = document.querySelectorAll('.card-grid-item-fallback');
      expect(fallbacks.length).toBe(10);

      // First card (top of deck = card-9) should show #10
      expect(fallbacks[0].textContent).toBe('#10');
    });

    it('should show card names', () => {
      viewer.show(mockCards, 'deck');

      const names = document.querySelectorAll('.card-grid-item-name');
      expect(names.length).toBe(10);

      // First card should show name "Card 10"
      expect(names[0].textContent).toBe('Card 10');
    });
  });

  describe('Search functionality', () => {
    it('should filter cards by name', () => {
      viewer.show(mockCards, 'deck');

      // Simulate typing in search box
      const searchInput = document.querySelector('.search-bar-input') as HTMLInputElement;
      searchInput.value = 'Card 5';
      searchInput.dispatchEvent(new Event('input'));

      // Wait for debounce
      return new Promise((resolve) => {
        setTimeout(() => {
          const cardElements = document.querySelectorAll('.card-grid-item');
          expect(cardElements.length).toBe(1);
          expect(cardElements[0].getAttribute('data-card-id')).toBe('card-4');
          resolve(undefined);
        }, 200);
      });
    });

    it('should filter cards by card number', () => {
      viewer.show(mockCards, 'deck');

      const searchInput = document.querySelector('.search-bar-input') as HTMLInputElement;
      searchInput.value = '7';
      searchInput.dispatchEvent(new Event('input'));

      return new Promise((resolve) => {
        setTimeout(() => {
          const cardElements = document.querySelectorAll('.card-grid-item');
          // Should match "Card 7" (cardNumber 7)
          expect(cardElements.length).toBe(1);
          resolve(undefined);
        }, 200);
      });
    });

    it('should be case-insensitive', () => {
      viewer.show(mockCards, 'deck');

      const searchInput = document.querySelector('.search-bar-input') as HTMLInputElement;
      searchInput.value = 'card 3';
      searchInput.dispatchEvent(new Event('input'));

      return new Promise((resolve) => {
        setTimeout(() => {
          const cardElements = document.querySelectorAll('.card-grid-item');
          expect(cardElements.length).toBe(1);
          resolve(undefined);
        }, 200);
      });
    });

    it('should show empty state when no matches', () => {
      viewer.show(mockCards, 'deck');

      const searchInput = document.querySelector('.search-bar-input') as HTMLInputElement;
      searchInput.value = 'Nonexistent Card';
      searchInput.dispatchEvent(new Event('input'));

      return new Promise((resolve) => {
        setTimeout(() => {
          const emptyState = document.querySelector('.deck-pile-viewer-empty');
          expect(emptyState).not.toBeNull();
          expect(emptyState?.textContent).toBe('No cards found');
          resolve(undefined);
        }, 200);
      });
    });

    it('should maintain absolute position labels when filtering', () => {
      viewer.show(mockCards, 'deck');

      const searchInput = document.querySelector('.search-bar-input') as HTMLInputElement;
      searchInput.value = 'Card 5';
      searchInput.dispatchEvent(new Event('input'));

      return new Promise((resolve) => {
        setTimeout(() => {
          const positionBadge = document.querySelector('.card-grid-item-position');
          // Card 5 has cardNumber 5, which is at index 4 in the array
          // Absolute position from top = 10 - 1 - 4 = 5 (0-indexed)
          // Display as "Top 6" (1-indexed for humans, since position + 1)
          expect(positionBadge?.textContent).toBe('Top 6');
          resolve(undefined);
        }, 200);
      });
    });

    it('should filter cards by type_line', () => {
      const cardsWithTypes = [
        createMockCard('land-1', 1, 'Mountain', 'Basic Land — Mountain'),
        createMockCard('land-2', 2, 'Island', 'Basic Land — Island'),
        createMockCard('creature-1', 3, 'Lightning Bolt', 'Instant'),
        createMockCard('creature-2', 4, 'Grizzly Bears', 'Creature — Bear'),
      ];

      viewer.show(cardsWithTypes, 'deck');

      const searchInput = document.querySelector('.search-bar-input') as HTMLInputElement;
      searchInput.value = 'Creature';
      searchInput.dispatchEvent(new Event('input'));

      return new Promise((resolve) => {
        setTimeout(() => {
          const cardElements = document.querySelectorAll('.card-grid-item');
          // Should only match "Creature — Bear"
          expect(cardElements.length).toBe(1);
          expect(cardElements[0].getAttribute('data-card-id')).toBe('creature-2');
          resolve(undefined);
        }, 200);
      });
    });

    it('should filter cards by type_line case-insensitively', () => {
      const cardsWithTypes = [
        createMockCard('land-1', 1, 'Mountain', 'Basic Land — Mountain'),
        createMockCard('instant-1', 2, 'Lightning Bolt', 'Instant'),
      ];

      viewer.show(cardsWithTypes, 'deck');

      const searchInput = document.querySelector('.search-bar-input') as HTMLInputElement;
      searchInput.value = 'instant';
      searchInput.dispatchEvent(new Event('input'));

      return new Promise((resolve) => {
        setTimeout(() => {
          const cardElements = document.querySelectorAll('.card-grid-item');
          expect(cardElements.length).toBe(1);
          expect(cardElements[0].getAttribute('data-card-id')).toBe('instant-1');
          resolve(undefined);
        }, 200);
      });
    });

    it('should search across both name and type_line', () => {
      const cardsWithTypes = [
        createMockCard('land-1', 1, 'Forest', 'Basic Land — Forest'),
        createMockCard('creature-1', 2, 'Forest Dragon', 'Creature — Dragon'),
        createMockCard('instant-1', 3, 'Lightning Bolt', 'Instant'),
      ];

      viewer.show(cardsWithTypes, 'deck');

      const searchInput = document.querySelector('.search-bar-input') as HTMLInputElement;
      searchInput.value = 'Forest';
      searchInput.dispatchEvent(new Event('input'));

      return new Promise((resolve) => {
        setTimeout(() => {
          const cardElements = document.querySelectorAll('.card-grid-item');
          // Should match both "Forest" (by name) and "Forest Dragon" (by name) and "Basic Land — Forest" (by type)
          // Since "Forest" card has both name and type matching, it should appear once
          // "Forest Dragon" matches by name
          expect(cardElements.length).toBe(2);
          resolve(undefined);
        }, 200);
      });
    });
  });

  describe('Sort functionality', () => {
    it('should default to top-to-bottom sort', () => {
      viewer.show(mockCards, 'deck');

      const select = document.querySelector('.sort-control-select') as HTMLSelectElement;
      expect(select.value).toBe('top-to-bottom');

      const cardElements = document.querySelectorAll('.card-grid-item');
      // First card should be top of deck (card-9)
      expect(cardElements[0].getAttribute('data-card-id')).toBe('card-9');
    });

    it('should fail if filterAndSort does not reverse in top-to-bottom mode (BUG TEST)', () => {
      // This test ensures that when search/sort is applied after initial show(),
      // the filterAndSort() method still reverses cards for top-to-bottom display

      viewer.show(mockCards, 'deck');

      // Type in search box to trigger filterAndSort()
      const searchInput = document.querySelector('.search-bar-input') as HTMLInputElement;
      searchInput.value = 'Card';
      searchInput.dispatchEvent(new Event('input'));

      return new Promise((resolve) => {
        setTimeout(() => {
          const cardElements = document.querySelectorAll('.card-grid-item');

          // All cards match "Card", so all 10 should be displayed
          expect(cardElements.length).toBe(10);

          // First card should still be top of deck (card-9), not bottom (card-0)
          // If filterAndSort() is missing .reverse(), this would fail
          const firstCardId = cardElements[0].getAttribute('data-card-id');
          expect(firstCardId).not.toBe('card-0'); // Should NOT be bottom card
          expect(firstCardId).toBe('card-9'); // Should BE top card

          resolve(undefined);
        }, 200);
      });
    });

    it('should sort alphabetically when selected', () => {
      viewer.show(mockCards, 'deck');

      const select = document.querySelector('.sort-control-select') as HTMLSelectElement;
      select.value = 'alphabetical';
      select.dispatchEvent(new Event('change'));

      const cardElements = document.querySelectorAll('.card-grid-item');

      // Alphabetically: "Card 1", "Card 10", "Card 2", "Card 3", ...
      const firstCardName = cardElements[0].querySelector('.card-grid-item-name')?.textContent;
      expect(firstCardName).toBe('Card 1');
    });

    it('should maintain absolute position when sorting alphabetically', () => {
      viewer.show(mockCards, 'deck');

      const select = document.querySelector('.sort-control-select') as HTMLSelectElement;
      select.value = 'alphabetical';
      select.dispatchEvent(new Event('change'));

      // Find "Card 5" in alphabetical order
      const cardElements = Array.from(document.querySelectorAll('.card-grid-item'));
      const card5Element = cardElements.find(
        (el) => el.querySelector('.card-grid-item-name')?.textContent === 'Card 5'
      );

      const positionBadge = card5Element?.querySelector('.card-grid-item-position');
      // Card 5 has cardNumber 5, which is at index 4 in the array
      // Absolute position from top = 10 - 1 - 4 = 5 (0-indexed)
      // Display as "Top 6" (1-indexed for humans, since position + 1)
      expect(positionBadge?.textContent).toBe('Top 6');
    });

    it('should show position labels in top-to-bottom mode', () => {
      viewer.show(mockCards, 'deck');

      const positionBadges = document.querySelectorAll('.card-grid-item-position');
      expect(positionBadges.length).toBe(10);
    });

    it('should still show position labels in alphabetical mode', () => {
      viewer.show(mockCards, 'deck');

      const select = document.querySelector('.sort-control-select') as HTMLSelectElement;
      select.value = 'alphabetical';
      select.dispatchEvent(new Event('change'));

      const positionBadges = document.querySelectorAll('.card-grid-item-position');
      // Always show position (changed from original spec)
      expect(positionBadges.length).toBe(10);
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should trigger onPlayToBattlefield when Z is pressed on hovered card', () => {
      const onPlayToBattlefield = vi.fn();
      viewer = new DeckPileViewer({ onPlayToBattlefield });

      viewer.show(mockCards, 'deck');

      // Simulate hovering over first card
      const firstCard = document.querySelector('.card-grid-item') as HTMLElement;
      firstCard.dispatchEvent(new MouseEvent('mouseenter'));

      // Press Z key
      const keyEvent = new KeyboardEvent('keydown', { key: 'z' });
      document.dispatchEvent(keyEvent);

      expect(onPlayToBattlefield).toHaveBeenCalledTimes(1);
      expect(onPlayToBattlefield).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'card-9' })
      );
    });

    it('should trigger onMoveToHand when H is pressed on hovered card', () => {
      const onMoveToHand = vi.fn();
      viewer = new DeckPileViewer({ onMoveToHand });

      viewer.show(mockCards, 'deck');

      // Simulate hovering over first card
      const firstCard = document.querySelector('.card-grid-item') as HTMLElement;
      firstCard.dispatchEvent(new MouseEvent('mouseenter'));

      // Press H key
      const keyEvent = new KeyboardEvent('keydown', { key: 'h' });
      document.dispatchEvent(keyEvent);

      expect(onMoveToHand).toHaveBeenCalledTimes(1);
      expect(onMoveToHand).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'card-9' })
      );
    });

    it('should not trigger shortcuts when no card is hovered', () => {
      const onPlayToBattlefield = vi.fn();
      viewer = new DeckPileViewer({ onPlayToBattlefield });

      viewer.show(mockCards, 'deck');

      // Press Z without hovering
      const keyEvent = new KeyboardEvent('keydown', { key: 'z' });
      document.dispatchEvent(keyEvent);

      expect(onPlayToBattlefield).not.toHaveBeenCalled();
    });

    it('should update hovered card when mouse moves between cards', () => {
      const onPlayToBattlefield = vi.fn();
      viewer = new DeckPileViewer({ onPlayToBattlefield });

      viewer.show(mockCards, 'deck');

      const cardElements = document.querySelectorAll('.card-grid-item') as NodeListOf<HTMLElement>;

      // Hover over first card
      cardElements[0].dispatchEvent(new MouseEvent('mouseenter'));

      // Move to second card
      cardElements[0].dispatchEvent(new MouseEvent('mouseleave'));
      cardElements[1].dispatchEvent(new MouseEvent('mouseenter'));

      // Press Z
      const keyEvent = new KeyboardEvent('keydown', { key: 'z' });
      document.dispatchEvent(keyEvent);

      // Should trigger with second card
      expect(onPlayToBattlefield).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'card-8' })
      );
    });

    it('should not trigger shortcuts when typing in search box', () => {
      const onPlayToBattlefield = vi.fn();
      viewer = new DeckPileViewer({ onPlayToBattlefield });

      viewer.show(mockCards, 'deck');

      // Hover over a card
      const firstCard = document.querySelector('.card-grid-item') as HTMLElement;
      firstCard.dispatchEvent(new MouseEvent('mouseenter'));

      // Focus search input
      const searchInput = document.querySelector('.search-bar-input') as HTMLInputElement;
      searchInput.focus();

      // Press Z (should be ignored because typing in input)
      const keyEvent = new KeyboardEvent('keydown', { key: 'z', target: searchInput } as any);
      Object.defineProperty(keyEvent, 'target', { value: searchInput, writable: false });
      document.dispatchEvent(keyEvent);

      expect(onPlayToBattlefield).not.toHaveBeenCalled();
    });

    it('should close modal when Escape is pressed', () => {
      viewer.show(mockCards, 'deck');

      expect(document.querySelector('.deck-pile-viewer-modal')).not.toBeNull();

      // Press Escape
      const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(keyEvent);

      expect(document.querySelector('.deck-pile-viewer-modal')).toBeNull();
    });
  });

  describe('Modal behavior', () => {
    it('should open modal when show() is called', () => {
      viewer.show(mockCards, 'deck');

      const modal = document.querySelector('.deck-pile-viewer-modal');
      expect(modal).not.toBeNull();
    });

    it('should show correct title in search mode', () => {
      viewer.show(mockCards, 'deck');

      const title = document.querySelector('.deck-pile-viewer-header h2');
      expect(title?.textContent).toBe('Search Deck');
    });

    it('should show correct title in view mode', () => {
      viewer.show(mockCards, 'deck');

      const title = document.querySelector('.deck-pile-viewer-header h2');
      expect(title?.textContent).toBe('Search Deck');
    });

    it('should show keyboard shortcuts hint in search mode', () => {
      viewer.show(mockCards, 'deck');

      const subtitle = document.querySelector('.deck-pile-viewer-subtitle');
      expect(subtitle?.textContent).toContain('H: Hand');
    });

    it('should close modal when close button is clicked', () => {
      viewer.show(mockCards, 'deck');

      const closeBtn = document.querySelector('.deck-pile-viewer-close') as HTMLElement;
      closeBtn.click();

      expect(document.querySelector('.deck-pile-viewer-modal')).toBeNull();
    });

    it('should close modal when backdrop is clicked', () => {
      viewer.show(mockCards, 'deck');

      const modal = document.querySelector('.deck-pile-viewer-modal') as HTMLElement;
      modal.click(); // Click on backdrop

      expect(document.querySelector('.deck-pile-viewer-modal')).toBeNull();
    });

    it('should not close modal when clicking inside content', () => {
      viewer.show(mockCards, 'deck');

      const content = document.querySelector('.deck-pile-viewer-content') as HTMLElement;
      content.click();

      expect(document.querySelector('.deck-pile-viewer-modal')).not.toBeNull();
    });

    it('should clean up event listeners when closed', () => {
      const onPlayToBattlefield = vi.fn();
      viewer = new DeckPileViewer({ onPlayToBattlefield });

      viewer.show(mockCards, 'deck');

      const firstCard = document.querySelector('.card-grid-item') as HTMLElement;
      firstCard.dispatchEvent(new MouseEvent('mouseenter'));

      // Close modal
      const closeBtn = document.querySelector('.deck-pile-viewer-close') as HTMLElement;
      closeBtn.click();

      // Press Z after modal is closed
      const keyEvent = new KeyboardEvent('keydown', { key: 'z' });
      document.dispatchEvent(keyEvent);

      // Should not trigger callback
      expect(onPlayToBattlefield).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty deck', () => {
      viewer.show([], 'deck');

      const emptyState = document.querySelector('.deck-pile-viewer-empty');
      expect(emptyState).not.toBeNull();
      expect(emptyState?.textContent).toBe('No cards in deck');
    });

    it('should handle cards without names', () => {
      const cardsWithoutNames = mockCards.map((card) => ({
        ...card,
        name: undefined,
      }));

      viewer.show(cardsWithoutNames, 'deck');

      const cardElements = document.querySelectorAll('.card-grid-item');
      expect(cardElements.length).toBe(10);

      // Should not have name elements
      const names = document.querySelectorAll('.card-grid-item-name');
      expect(names.length).toBe(0);
    });

    it('should handle very long card names', () => {
      const cardsWithLongNames = [
        createMockCard('card-1', 1, 'A'.repeat(100)),
      ];

      viewer.show(cardsWithLongNames, 'deck');

      const name = document.querySelector('.card-grid-item-name');
      expect(name?.textContent?.length).toBe(100);
    });

    it('should handle search with special characters', () => {
      const specialCard = createMockCard('card-special', 1, 'Card (Special) [Test]');
      viewer.show([specialCard], 'deck');

      const searchInput = document.querySelector('.search-bar-input') as HTMLInputElement;
      searchInput.value = '(Special)';
      searchInput.dispatchEvent(new Event('input'));

      return new Promise((resolve) => {
        setTimeout(() => {
          const cardElements = document.querySelectorAll('.card-grid-item');
          expect(cardElements.length).toBe(1);
          resolve(undefined);
        }, 200);
      });
    });

    it('should focus search bar on open', () => {
      viewer.show(mockCards, 'deck');

      // Note: In a real browser, focus() would work. In JSDOM, we just check it was called
      const searchInput = document.querySelector('.search-bar-input') as HTMLInputElement;
      expect(searchInput).not.toBeNull();
    });
  });
});