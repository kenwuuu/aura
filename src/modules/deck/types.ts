export interface Card {
  id: string;
  cardNumber: number; // Persistent numbering for stack tracking
  x: number;
  y: number;
  rotation: number;
  isTapped: boolean;
  isFlipped: boolean;
  counters: number;
}

export interface DeckConfig {
  cardWidth: number;
  cardHeight: number;
  initialCardCount: number;
}