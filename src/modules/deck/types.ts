export interface CardImageUris {
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
  art_crop?: string;
  border_crop?: string;
}

export interface CardImages {
  front: CardImageUris | null;
  back: CardImageUris | null; // For double-faced cards
}

export interface Card {
  id: string;
  cardNumber: number; // Persistent numbering for stack tracking
  name?: string; // Actual card name from Scryfall
  images?: CardImages; // Image URIs from Scryfall
  scryfallId?: string; // Scryfall ID for future API calls
  x: number;
  y: number;
  rotation: number;
  isTapped: boolean;
  isFlipped: boolean;
  counters: number[]; // Array of counter values
}

export interface DeckConfig {
  cardWidth: number;
  cardHeight: number;
  initialCardCount: number;
}

export interface DeckMetadata {
  id: string; // Unique deck ID
  name: string; // User-provided deck name
  format?: string; // Commander, Standard, Modern, etc.
  source: 'scryfall' | 'moxfield' | 'manual';
  cardCount: number;
  importedAt: Date;
  lastModified: Date;
}

export interface SavedDeck {
  metadata: DeckMetadata;
  cards: Card[]; // Full card list with images
}