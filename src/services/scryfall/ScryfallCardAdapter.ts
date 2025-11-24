import { ScryfallCard, CardDataResult } from "./ScryfallApiService";
import { Card, CardImages, CardImageUris } from "../../modules/deck/types";

/**
 * Extract image URIs from Scryfall card object
 */
function extractImageUris(cardObj: ScryfallCard): CardImages {
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
 * Convert ScryfallCard (raw API response) to CardDataResult (app domain type)
 */
export function toCardDataResult(
  scryfallCard: ScryfallCard,
  count: number = 1
): CardDataResult {
  return {
    count,
    name: scryfallCard.name,
    type_line: scryfallCard.type_line,
    oracleText: scryfallCard.oracle_text,
    scryfallId: scryfallCard.id,
    imageUris: extractImageUris(scryfallCard),
  };
}

/**
 * Convert ScryfallCard to Card (for adding to game state)
 * @param scryfallCard - Raw Scryfall API response
 * @param cardNumber - Card number for tracking (default -1 for dynamically added cards)
 */
export function toCard(
  scryfallCard: ScryfallCard,
  cardNumber: number = -1
): Card {
  return {
    id: `card-${Math.random().toString(36).substring(2, 11)}`,
    cardNumber,
    name: scryfallCard.name,
    type_line: scryfallCard.type_line,
    oracleText: scryfallCard.oracle_text,
    images: extractImageUris(scryfallCard),
    scryfallId: scryfallCard.id,
    x: 100,
    y: 100,
    rotation: 0,
    isTapped: false,
    isFlipped: false,
    counters: [],
  };
}

export function fromScryfallCard(card: ScryfallCard): Card {
  return toCard(card);
}
