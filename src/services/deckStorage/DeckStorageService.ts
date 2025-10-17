import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SavedDeck, DeckMetadata } from '../../modules/deck/types';

interface AuraDBSchema extends DBSchema {
  decks: {
    key: string;
    value: SavedDeck;
    indexes: {
      'by-modified': Date;
      'by-name': string;
    };
  };
}

export class DeckStorageService {
  private static readonly DB_NAME = 'aura-decks';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'decks';

  private dbPromise: Promise<IDBPDatabase<AuraDBSchema>>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private async initDB(): Promise<IDBPDatabase<AuraDBSchema>> {
    return openDB<AuraDBSchema>(DeckStorageService.DB_NAME, DeckStorageService.DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DeckStorageService.STORE_NAME)) {
          const store = db.createObjectStore(DeckStorageService.STORE_NAME, {
            keyPath: 'metadata.id',
          });

          // Create indexes for efficient querying
          store.createIndex('by-modified', 'metadata.lastModified');
          store.createIndex('by-name', 'metadata.name');
        }
      },
    });
  }

  /**
   * Save a deck to IndexedDB
   */
  async saveDeck(deck: SavedDeck): Promise<void> {
    const db = await this.dbPromise;
    await db.put(DeckStorageService.STORE_NAME, deck);
  }

  /**
   * Get a specific deck by ID
   */
  async getDeck(id: string): Promise<SavedDeck | null> {
    const db = await this.dbPromise;
    const deck = await db.get(DeckStorageService.STORE_NAME, id);
    return deck || null;
  }

  /**
   * Get all deck metadata (without full card lists for efficiency)
   */
  async getAllDeckMetadata(): Promise<DeckMetadata[]> {
    const db = await this.dbPromise;
    const decks = await db.getAll(DeckStorageService.STORE_NAME);
    return decks.map(deck => deck.metadata);
  }

  /**
   * Get all decks (including full card lists)
   */
  async getAllDecks(): Promise<SavedDeck[]> {
    const db = await this.dbPromise;
    return await db.getAll(DeckStorageService.STORE_NAME);
  }

  /**
   * Delete a deck by ID
   */
  async deleteDeck(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(DeckStorageService.STORE_NAME, id);
  }

  /**
   * Update an existing deck
   */
  async updateDeck(deck: SavedDeck): Promise<void> {
    const db = await this.dbPromise;
    const existingDeck = await db.get(DeckStorageService.STORE_NAME, deck.metadata.id);

    if (!existingDeck) {
      throw new Error(`Deck with ID ${deck.metadata.id} not found`);
    }

    // Update lastModified timestamp
    deck.metadata.lastModified = new Date();
    await db.put(DeckStorageService.STORE_NAME, deck);
  }

  /**
   * Check if a deck exists
   */
  async deckExists(id: string): Promise<boolean> {
    const db = await this.dbPromise;
    const count = await db.count(DeckStorageService.STORE_NAME, id);
    return count > 0;
  }

  /**
   * Clear all decks (use with caution)
   */
  async clearAll(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear(DeckStorageService.STORE_NAME);
  }

  /**
   * Get deck count
   */
  async getDeckCount(): Promise<number> {
    const db = await this.dbPromise;
    return await db.count(DeckStorageService.STORE_NAME);
  }
}