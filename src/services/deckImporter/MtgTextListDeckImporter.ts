import { DeckImporter, DeckImportResult } from './DeckImporter';
import { DeckLineItem, parseDecklist, validateFormat } from "@/services/deckImporter/DeckListParser";
import { CardDataResult, ScryfallApiService } from '../scryfall';
import { Card } from '@/modules/deck';
import * as Sentry from "@sentry/browser";

export class MtgTextListDeckImporter extends DeckImporter {
  private scryfallApi: ScryfallApiService;
  private readonly onProgress?: (current: number, total: number) => void;

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

    if (!validateFormat(text)) {
      deck.errors = ["Invalid deck format. Expected format: \"[count] [card name]\" per line"];
      return deck;
    }

    // Check for section headers and error if they exist
    const sectionHeaders = this.detectSectionHeaders(text);
    if (sectionHeaders.length > 0) {
      this.setSectionHeaderErrors(deck, sectionHeaders);
      return deck;
    }

    let entries: DeckLineItem[] = [];

    try {
      entries = parseDecklist(text);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      deck.errors = [`Failed to parse decklist: ${message}`];
      Sentry.captureException(e, {
        level: "error",
        extra: { stage: "parseDecklist", text },
      });
      return deck;
    }

    if (entries.length === 0) {
      deck.errors = ["No valid card entries found. Make sure each line starts with a quantity, e.g. \"4 Lightning Bolt\"."];
      return deck;
    }

    let results: CardDataResult[];
    try {
      results = await this.scryfallApi.fetchImagesForList(entries, this.onProgress);
    } catch (e) {
      // Unexpected throw from fetchImagesForList itself (not per-card errors,
      // which are returned as CardDataResult.error — this is a catastrophic failure)
      const message = e instanceof Error ? e.message : String(e);
      deck.errors = [`Card data fetch failed: ${message}. Please try again.`];
      Sentry.captureException(e, {
        level: "error",
        extra: { stage: "fetchImagesForList", entries },
      });
      return deck;
    }

    // Build deck and collect per-card errors
    this.parseResultsIntoDeck(deck, results);

    deck.metadata = {
      source: 'scryfall',
      cardCount: deck.cards.length,
      importedAt: new Date(),
      lastModified: new Date(),
    };

    // Report partial failures to Sentry with structured context
    if (deck.errors && deck.errors.length > 0) {
      const failedCards = results
        .filter(r => r.error)
        .map(r => ({ name: r.name, error: r.error }));

      Sentry.captureMessage("Partial deck import failure", {
        level: "warning",
        extra: {
          stage: "parseResultsIntoDeck",
          totalRequested: entries.length,
          totalImported: deck.cards.length,
          totalFailed: failedCards.length,
          failedCards,
        },
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