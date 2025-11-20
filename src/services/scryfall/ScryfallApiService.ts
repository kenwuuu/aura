import PQueue from 'p-queue';
import pRetry from 'p-retry';
import {CardImages, CardImageUris} from '@/modules/deck/types';
import {toCardDataResult} from './ScryfallCardAdapter';
import {DeckLineItem} from "@/services/deckImporter/DeckListParser";

export type ScryfallCard = {
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

export type CardDataResult = {
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
      timeout: 30000, // 30 second timeout for whole import
    });
  }

  /**
   * Fetch card data from Scryfall with rate limiting and retries
   */
  private async fetchCardDataByName(cardLineItem: DeckLineItem): Promise<ScryfallCard> {
    const cardName = cardLineItem.name;
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
   * Fetch card data from Scryfall with rate limiting and retries
   */
  private async fetchCardDataBySet(cardLineItem: DeckLineItem): Promise<ScryfallCard> {
    const encodedSetCode = encodeURIComponent(cardLineItem.setCode!);
    const encodedCollectorNumber = encodeURIComponent(cardLineItem.collectorNumber!);

    const url = `${ScryfallApiService.BASE_URL}/cards/${encodedSetCode}/${encodedCollectorNumber}`;

    return await this.queue.add(() =>
      pRetry(
        async () => {
          const response = await fetch(url);
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error(`Card "${cardLineItem.name}" not found`);
            }
            throw new Error(`Scryfall API error: ${response.status} ${response.statusText}. URL: ${url}.`);
          }
          return await response.json();
        },
        {
          retries: 3,
          onFailedAttempt: (error) => {
            console.warn(`Attempt ${error.attemptNumber} failed for "${cardLineItem.name}". ${error.retriesLeft} retries left.`);
          },
        }
      )
    ) as ScryfallCard;
  }


  /**
   * Fetch images for a list of cards with progress callback
   */
  public async fetchImagesForList(
    entries: DeckLineItem[],
    onProgress?: (current: number, total: number) => void
  ): Promise<CardDataResult[]> {
    const results: CardDataResult[] = [];
    let completed = 0;

    for (const entry of entries) {
      try {
        let cardObj: ScryfallCard;
        if (entry.setCode && entry.collectorNumber) {
          cardObj = await this.fetchCardDataBySet(entry);
        } else { // fall back to using name
          cardObj = await this.fetchCardDataByName(entry);
        }
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
  public getQueueSize(): number {
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
  public async fetchCardById(scryfallId: string): Promise<ScryfallCard> {
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
  public extractTokenIds(cardData: ScryfallCard): string[] {
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
  public createCardFromScryfall(scryfallCard: ScryfallCard): CardDataResult {
    return toCardDataResult(scryfallCard, 1);
  }

  /**
   * Fetch card by name (public API for adding arbitrary cards)
   */
  public async fetchCardByName(cardName: string): Promise<ScryfallCard> {
    const card:DeckLineItem = {name: cardName, count: 1}
    return this.fetchCardDataByName(card);
  }
}
