import { Card } from '../deck';

export interface CustomCounter {
  id: string;
  title: string;
  icon: string;
  value: number;
}

export interface PlayerState {
  id: string;
  health: number;
  hand: Card[];
  exilePile: Card[];
  discardPile: Card[];
  deck: Card[];
  customCounters: CustomCounter[];
}

export interface PlayerConfig {
  initialHealth: number;
}
