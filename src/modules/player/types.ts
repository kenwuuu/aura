import { Card } from '../deck';

export interface PlayerState {
  id: string;
  health: number;
  hand: Card[];
  exilePile: Card[];
  discardPile: Card[];
  deckCardCount: number;
}

export interface PlayerConfig {
  initialHealth: number;
}
