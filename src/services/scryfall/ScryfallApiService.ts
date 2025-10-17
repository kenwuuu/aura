import PQueue from 'p-queue';
import pRetry from 'p-retry';
import { CardImages, CardImageUris } from '../../modules/deck/types';

interface ScryfallCard {
  id: string;
  name: string;
  image_uris?: CardImageUris;
  card_faces?: Array<{
    image_uris?: CardImageUris;
  }>;
}

export interface ParsedDeckEntry {
  count: number;
  name: string;
}

export interface CardDataResult {
  count: number;
  name: string;
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
   * 4 Lightning Bolt
   */
  parseDecklist(text: string): ParsedDeckEntry[] {
    return text
      .trim()
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => {
        const parts = line.trim().split(/\s+/);
        const count = parseInt(parts[0], 10);
        const name = parts.slice(1).join(' ');
        return { count, name };
      })
      .filter(entry => !isNaN(entry.count) && entry.name.length > 0);
  }

  /**
   * Fetch card data from Scryfall with rate limiting and retries
   */
  private async fetchCardData(cardName: string): Promise<ScryfallCard> {
    const url = `${ScryfallApiService.BASE_URL}/cards/named?exact=${encodeURIComponent(cardName)}`;

    return await this.queue.add(() =>
      pRetry(
        async () => {
          const response = await fetch(url);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error(`Card "${cardName}" not found`);
            }
            throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`);
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
   * Extract image URIs from Scryfall card object
   */
  private extractImageUris(cardObj: ScryfallCard): CardImages {
    // Single-face cards have image_uris at the root
    if (cardObj.image_uris) {
      return {
        front: cardObj.image_uris,
        back: null,
      };
    }

    // Double-faced/multi-face cards have card_faces array
    if (Array.isArray(cardObj.card_faces)) {
      const [faceA, faceB] = cardObj.card_faces;
      return {
        front: faceA?.image_uris || null,
        back: faceB?.image_uris || null,
      };
    }

    // Fallback: no images found
    return {
      front: null,
      back: null,
    };
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
        const imageUris = this.extractImageUris(cardObj);

        results.push({
          count: entry.count,
          name: entry.name,
          scryfallId: cardObj.id,
          imageUris,
        });
      } catch (err) {
        console.error(`Error fetching "${entry.name}":`, err);
        results.push({
          count: entry.count,
          name: entry.name,
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
}
