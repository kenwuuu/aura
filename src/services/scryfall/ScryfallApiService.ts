import PQueue from 'p-queue';
import pRetry from 'p-retry';
import { CardImages, CardImageUris } from '../../modules/deck/types';
import { toCardDataResult } from './ScryfallCardAdapter';

export interface ScryfallCard {
  id: string;
  name: string;
  type_line?: string;
  image_uris?: CardImageUris;
  card_faces?: Array<{
    image_uris?: CardImageUris;
  }>;
  all_parts?: Array<{
    id: string;
    component: string;
    name: string;
    type_line?: string;
    uri: string;
  }>;
}

export interface ParsedDeckEntry {
  count: number;
  name: string;
}

export interface CardDataResult {
  count: number;
  name: string;
  type_line?: string;
  scryfallId: string;
  imageUris: CardImages;
  error?: string;
}

export class ScryfallApiService {
  private queue: PQueue;
  private static readonly BASE_URL = 'https://api.scryfall.com';
  private static readonly RATE_LIMIT_INTERVAL = 1000; // 1 second
  private static readonly RATE_LIMIT_CAP = 10; // 10 requests per interval

  constructor() {
    this.queue = new PQueue({
      interval: ScryfallApiService.RATE_LIMIT_INTERVAL,
      intervalCap: ScryfallApiService.RATE_LIMIT_CAP,
      timeout: 30000, // 30 second timeout per request
    });
  }

  /**
   * Parse a decklist in the format:
   * 1 Mountain
   * 2 Island
   * 4x Lightning Bolt (supports 'x' notation)
   *
   * Lines that don't start with a numeral are ignored.
   */
  parseDecklist(text: string): ParsedDeckEntry[] {
    return text
      .trim()
      .split('\n')
      .filter(line => line.trim().length > 0)
      .filter(line => {
        // Ignore lines that don't start with a numeral
        const trimmed = line.trim();
        return /^\d/.test(trimmed);
      })
      .map(line => {
        const parts = line.trim().split(/\s+/);
        let firstPart = parts[0];

        // Handle 'x' notation (e.g., "20x" -> "20")
        if (firstPart.toLowerCase().endsWith('x')) {
          firstPart = firstPart.slice(0, -1);
        }

        const count = parseInt(firstPart, 10);
        const name = parts.slice(1).join(' ');
        return { count, name };
      })
      .filter(entry => !isNaN(entry.count) && entry.name.length > 0);
  }

  /**
   * Fetch card data from Scryfall with rate limiting and retries
   */
  private async fetchCardData(cardName: string): Promise<ScryfallCard> {
    const exactUrl = `${ScryfallApiService.BASE_URL}/cards/named?exact=${encodeURIComponent(cardName)}`;
    const fuzzyUrl = `${ScryfallApiService.BASE_URL}/cards/named?fuzzy=${encodeURIComponent(cardName)}`;
    const attemptNumberToSwitchToFuzzySearch = 2;

    return await this.queue.add(() =>
      pRetry(
        async (attemptNumber) => {
          const url = attemptNumber >= attemptNumberToSwitchToFuzzySearch ?  fuzzyUrl : exactUrl;  // switch to fuzzy search after first

          const response = await fetch(url);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error(`Card "${cardName}" not found`);
            }
            throw new Error(`Scryfall API error: ${response.status} ${response.statusText}. URL: ${url}. Will use 
            fuzzy search starting from attempt #${attemptNumberToSwitchToFuzzySearch}`);
          }
          return await response.json();
        },
        {
          retries: 3,
          onFailedAttempt: (error) => {
            console.warn(`Attempt ${error.attemptNumber} failed for "${cardName}". ${error.retriesLeft} retries left.`);
          },
        }
      )
    ) as ScryfallCard;
  }


  /**
   * Fetch images for a list of cards with progress callback
   */
  async fetchImagesForList(
    entries: ParsedDeckEntry[],
    onProgress?: (current: number, total: number) => void
  ): Promise<CardDataResult[]> {
    const results: CardDataResult[] = [];
    let completed = 0;

    for (const entry of entries) {
      try {
        const cardObj = await this.fetchCardData(entry.name);
        results.push(toCardDataResult(cardObj, entry.count));
      } catch (err) {
        console.error(`Error fetching "${entry.name}":`, err);
        results.push({
          count: entry.count,
          name: entry.name,
          type_line: undefined,
          scryfallId: '',
          imageUris: { front: null, back: null },
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }

      completed++;
      onProgress?.(completed, entries.length);
    }

    return results;
  }

  /**
   * Get the current queue size (pending requests)
   */
  getQueueSize(): number {
    return this.queue.size;
  }

  /**
   * Get the number of pending requests
   */
  getPendingCount(): number {
    return this.queue.pending;
  }

  /**
   * Fetch card data by Scryfall ID
   */
  async fetchCardById(scryfallId: string): Promise<ScryfallCard> {
    const url = `${ScryfallApiService.BASE_URL}/cards/${scryfallId}`;

    return await this.queue.add(() =>
      pRetry(
        async () => {
          const response = await fetch(url);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error(`Card with ID "${scryfallId}" not found`);
            }
            throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`);
          }
          return await response.json();
        },
        {
          retries: 3,
          onFailedAttempt: (error) => {
            console.warn(`Attempt ${error.attemptNumber} failed for ID "${scryfallId}". ${error.retriesLeft} retries left.`);
          },
        }
      )
    ) as ScryfallCard;
  }

  /**
   * Extract token IDs from a card's all_parts
   * Returns array of Scryfall IDs for tokens created by this card
   */
  extractTokenIds(cardData: ScryfallCard): string[] {
    if (!cardData.all_parts || !Array.isArray(cardData.all_parts)) {
      return [];
    }

    return cardData.all_parts
      .filter(part => part.component === 'token')
      .map(part => part.id);
  }

  /**
   * Create a Card object from Scryfall data
   */
  createCardFromScryfall(scryfallCard: ScryfallCard): CardDataResult {
    return toCardDataResult(scryfallCard, 1);
  }

  /**
   * Fetch card by name (public API for adding arbitrary cards)
   */
  async fetchCardByName(cardName: string): Promise<ScryfallCard> {
    return this.fetchCardData(cardName);
  }
}
