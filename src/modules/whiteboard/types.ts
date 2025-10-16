import { Card } from '../deck';

export interface WhiteboardCard extends Card {
  zIndex: number;
}

export interface WhiteboardConfig {
  backgroundColor: string;
  width: number;
  height: number;
}

export interface DragState {
  cardId: string | null;
  offsetX: number;
  offsetY: number;
}