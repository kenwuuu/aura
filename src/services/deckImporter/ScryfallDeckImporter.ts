import { DeckImporter, DeckImportResult } from './DeckImporter';
import { ScryfallApiService } from '../scryfall';
import { Card } from '../../modules/deck';

export class ScryfallDeckImporter implements DeckImporter {
  private scryfallApi: ScryfallApiService;
  private onProgress?: (current: number, total: number) => void;

  constructor(onProgress?: (current: number, total: number) => void) {
    this.scryfallApi = new ScryfallApiService();
    this.onProgress = onProgress;
  }

  /**
   * Detect section headers (lines without numbers at the start)
   * Returns an array of detected section headers
   */
  private detectSectionHeaders(text: string): string[] {
    const lines = text.trim().split('\n').filter(line => line.trim().length > 0);
    const sectionHeaders: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if the line starts with a digit (including 'x' notation like "4x")
      const startsWithNumber = /^\d/.test(trimmedLine);

      // If it doesn't start with a number and the line is not empty, it's likely a section header
      if (!startsWithNumber && trimmedLine.length > 0) {
        sectionHeaders.push(trimmedLine);
      }
    }

    return sectionHeaders;
  }

  /**
   * Validate if text is in Scryfall decklist format
   * Format: "<count> <card name>" per line
   * Example: "4 Lightning Bolt" or "4x Lightning Bolt"
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
      const trimmed = line.trim();
      // Must start with a digit
      if (!/^\d/.test(trimmed)) {
        return false;
      }

      const parts = trimmed.split(/\s+/);
      let firstPart = parts[0];

      // Handle 'x' notation
      if (firstPart.toLowerCase().endsWith('x')) {
        firstPart = firstPart.slice(0, -1);
      }

      const count = parseInt(firstPart, 10);
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

    // Check for section headers
    const sectionHeaders = this.detectSectionHeaders(text);
    if (sectionHeaders.length > 0) {
      const headerList = sectionHeaders.slice(0, 3).map(h => `"${h}"`).join(', ');
      const more = sectionHeaders.length > 3 ? ` and ${sectionHeaders.length - 3} more` : '';

      return {
        cards: [],
        metadata: {},
        errors: [
          `Section headers detected: ${headerList}${more}. \n` +
          'Please remove section headers like "SIDEBOARD:", "COMMANDER:", etc. \n' +
          'Use the MTGO preset from Moxfield for best results. \n' +
          'Click the Help button below for more information.'
        ],
      };
    }

    // call Scryfall API
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
          type_line: result.type_line,
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