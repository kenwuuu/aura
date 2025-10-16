import { PlayerState } from '../player';

export interface GameResourcesDockConfig {
  position: 'bottom' | 'top';
  playerId: string;
}

export interface OpponentHealth {
  playerId: string;
  health: number;
}