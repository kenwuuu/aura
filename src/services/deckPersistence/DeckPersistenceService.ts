import { Deck } from '../../modules/deck';
import { CardPile } from '../../modules/player';

/**
 * Service for persisting deck state per room to localStorage
 * Allows deck state to survive page reloads within a room session
 */
export class DeckPersistenceService {
  private static readonly STORAGE_PREFIX = 'aura-deck-state-';
  private static readonly MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

  /**
   * Restore deck state for a specific room
   * @param roomName The room identifier
   * @returns Restored Deck instance or null if no valid state found
   */
  static restoreDeckForRoom(roomName: string): Deck | null {
    try {
      this.clearExpiredDecks()

      const key = `${this.STORAGE_PREFIX}${roomName}`;
      const savedState = localStorage.getItem(key);

      if (!savedState) {
        console.log('No saved deck state for this room');
        return null;
      }

      const { cards, timestamp } = JSON.parse(savedState);

      // Only restore if the session is recent (within 1 hour)
      // This prevents collisions when re-entering a room after a long time
      const now = Date.now();

      if (timestamp && (now - timestamp) > this.MAX_AGE_MS) {
        const minutesAgo = Math.round((now - timestamp) / 1000 / 60);
        console.log(`Deck state for room ${roomName} is too old (${minutesAgo} minutes), skipping restore`);
        // Clean up old state
        localStorage.removeItem(key);
        return null;
      }

      console.log(`Restored deck with ${cards.length} cards for room ${roomName}`);
      return new Deck(cards);
    } catch (error) {
      console.error('Error restoring deck state:', error);
      return null;
    }
  }

  /**
   * Save deck state for a specific room
   * @param roomName The room identifier
   * @param deck The deck or card pile instance to save
   */
  static saveDeckForRoom(roomName: string, deck: Deck | CardPile): void {
    try {
      const key = `${this.STORAGE_PREFIX}${roomName}`;
      const state = {
        cards: deck.getCards(),
        timestamp: Date.now(), // Add timestamp to track session age
      };
      localStorage.setItem(key, JSON.stringify(state));
      console.log(`Saved deck state (${state.cards.length} cards) for room ${roomName}`);
    } catch (error) {
      console.error('Error saving deck state:', error);
    }
  }

  /**
   * Clear deck state for a specific room
   * @param roomName The room identifier
   */
  static clearDeckForRoom(roomName: string): void {
    try {
      const key = `${this.STORAGE_PREFIX}${roomName}`;
      localStorage.removeItem(key);
      console.log(`Cleared deck state for room ${roomName}`);
    } catch (error) {
      console.error('Error clearing deck state:', error);
    }
  }

  /**
   * Clear all expired deck states from localStorage
   */
  static clearExpiredDecks(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      // Find all deck state keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            const { timestamp } = JSON.parse(value);
            if (timestamp && (now - timestamp) > this.MAX_AGE_MS) {
              keysToRemove.push(key);
            }
          }
        }
      }

      // Remove expired keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      if (keysToRemove.length > 0) {
        console.log(`Cleared ${keysToRemove.length} expired deck state(s)`);
      }
    } catch (error) {
      console.error('Error clearing expired decks:', error);
    }
  }
}