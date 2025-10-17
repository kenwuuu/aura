import { DeckImporter, DeckImportResult } from './DeckImporter';
import { ScryfallApiService } from '../scryfall';
import { Card } from '../../modules/deck/types';

export class ScryfallDeckImporter implements DeckImporter {
  private scryfallApi: ScryfallApiService;
  private onProgress?: (current: number, total: number) => void;

  constructor(onProgress?: (current: number, total: number) => void) {
    this.scryfallApi = new ScryfallApiService();
    this.onProgress = onProgress;
  }

  /**
   * Validate if text is in Scryfall decklist format
   * Format: "<count> <card name>" per line
   * Example: "4 Lightning Bolt"
   */
  validateFormat(text: string): boolean {
    if (!text || text.trim().length === 0) {
      return false;
    }

    const lines = text.trim().split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return false;
    }

    // Check if at least one line matches the expected format
    const validLines = lines.filter(line => {
      const parts = line.trim().split(/\s+/);
      const count = parseInt(parts[0], 10);
      return !isNaN(count) && count > 0 && parts.length > 1;
    });

    return validLines.length > 0;
  }

  /**
   * Import deck from Scryfall-formatted text
   */
  async importFromText(text: string): Promise<DeckImportResult> {
    if (!this.validateFormat(text)) {
      return {
        cards: [],
        metadata: {},
        errors: ['Invalid deck format. Expected format: "<count> <card name>" per line'],
      };
    }

    const entries = this.scryfallApi.parseDecklist(text);
    const results = await this.scryfallApi.fetchImagesForList(entries, this.onProgress);

    const cards: Card[] = [];
    const errors: string[] = [];
    let cardNumberCounter = 1;

    // Expand cards based on count (e.g., "4 Lightning Bolt" → 4 card objects)
    for (const result of results) {
      if (result.error) {
        errors.push(`${result.name}: ${result.error}`);
        continue;
      }

      console.log(`Importing ${result.count}x ${result.name}`);

      for (let i = 0; i < result.count; i++) {
        cards.push({
          id: `card-${Math.random().toString(36).substring(2, 11)}`,
          cardNumber: cardNumberCounter++,
          name: result.name,
          images: result.imageUris,
          scryfallId: result.scryfallId,
          x: 100,
          y: 100,
          rotation: 0,
          isTapped: false,
          isFlipped: false,
          counters: [],
        });
      }
    }

    return {
      cards,
      metadata: {
        source: 'scryfall',
        cardCount: cards.length,
        importedAt: new Date(),
        lastModified: new Date(),
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}