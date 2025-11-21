import { Card } from '../deck';

export interface WhiteboardObject {
  id: string,
  ownerId: string,
  x: number,
  y: number,
  zIndex: number,
  rotation: number,
}

export interface WhiteboardCard extends Card {
  zIndex: number;
  ownerId: string;
}

export interface WhiteboardConfig {
  backgroundColor: string;
  width: number;
  height: number;
  localPlayerId: string;
}

export interface DragState {
  cardId: string | null;
  offsetX: number;
  offsetY: number;
}