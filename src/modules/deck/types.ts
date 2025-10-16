export interface Card {
  id: string;
  x: number;
  y: number;
  rotation: number;
  isTapped: boolean;
}

export interface DeckConfig {
  cardWidth: number;
  cardHeight: number;
  initialCardCount: number;
}