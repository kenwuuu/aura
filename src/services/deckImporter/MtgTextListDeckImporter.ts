import { DeckImporter, DeckImportResult } from './DeckImporter';
import {DeckLineItem, parseDecklist} from "@/services/deckImporter/DeckListParser";
import {CardDataResult, ScryfallApiService} from '../scryfall';
import { Card } from '@/modules/deck';
import * as Sentry from "@sentry/browser";

export class MtgTextListDeckImporter extends DeckImporter {
  private scryfallApi: ScryfallApiService;
  private onProgress?: (current: number, total: number) => void;

  constructor(onProgress?: (current: number, total: number) => void) {
    super();
    this.scryfallApi = new ScryfallApiService();
    this.onProgress = onProgress;
  }

  /**
   * Import deck from Scryfall-formatted text
   */
  public async importFromText(text: string): Promise<DeckImportResult> {
    let deck: DeckImportResult = {
      cards: [],
      metadata: {},
    }

    if (!this.validateFormat(text)) {
      deck.errors = ["Invalid deck format. Expected format: \"[count] [card name]\" per line"];
      return deck;
    }

    // Check for section headers and error if they exist
    const sectionHeaders = this.detectSectionHeaders(text);
    if (sectionHeaders.length > 0) {
      this.setSectionHeaderErrors(deck, sectionHeaders);
      return deck;
    }

    // call Scryfall API
    try {
      const entries: DeckLineItem[] = parseDecklist(text);
      const results: CardDataResult[] = await this.scryfallApi.fetchImagesForList(entries, this.onProgress);

      // Create cards from CardDataResult
      this.parseResultsIntoDeck(deck, results);

      // set import metadata
      deck.metadata = {
        source: 'scryfall',
        cardCount: deck.cards.length,
        importedAt: new Date(),
        lastModified: new Date(),
      }

      if (deck.errors && deck.errors.length > 0) {
        Sentry.captureMessage("Error when importing deck. ", {
          level: "error",
          extra: {
            deck: deck
          }
      });
      }

      return deck;
    } catch (e) {
      Sentry.captureMessage("Error when importing deck. Full text import:", {
        level: "error",
        extra: {
          text: text
        }
      });
    }
    return deck;
  }

  private setSectionHeaderErrors(deck: DeckImportResult, sectionHeaders: string[]) {
    const headerList = sectionHeaders.slice(0, 3).map(h => `"${h}"`).join(', ');
    const more = sectionHeaders.length > 3 ? ` and ${sectionHeaders.length - 3} more` : '';

    deck.errors = [
      `Section headers detected: ${headerList}${more}. \n` +
      'Please remove section headers like "SIDEBOARD:", "COMMANDER:", etc. \n' +
      'Use the MTGO preset from Moxfield for best results. \n' +
      'Click the Help button below for more information.'
    ];
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
   * Validate if text is in decklist format
   * Format: "<count> <card name>" per line
   * Example: "4 Lightning Bolt" or "4x Lightning Bolt"
   */
  public validateFormat(text: string): boolean {
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

  private parseResultsIntoDeck(deckImportResult: DeckImportResult, results: CardDataResult[]) {
    let cardNumberCounter = 1;

    for (const result of results) {
      if (result.error) {
        if (!deckImportResult.errors) {
          deckImportResult.errors = [];
        }
        deckImportResult.errors.push(`${result.name}: ${result.error}`);
        continue;
      }

      console.log(`Importing ${result.count}x ${result.name}`);

      for (let i = 0; i < result.count; i++) {
        let card: Card = {
          id: `card-${Math.random().toString(36).substring(2, 11)}`,
          cardNumber: cardNumberCounter++,
          name: result.name,
          type_line: result.type_line,
          images: result.imageUris,
          oracleText: result.oracleText,
          scryfallId: result.scryfallId,
          x: 100,
          y: 100,
          rotation: 0,
          isTapped: false,
          isFlipped: false,
          counters: [],
        }
        deckImportResult.cards.push(card);
      }
    }
  }
}