import { WhiteboardObject } from '../whiteboard/types';

export interface KeywordToken extends WhiteboardObject {
  imageUrl: string; // URL to the token image (can be SVG or regular image)
  backgroundColor: string; // Background color for circular background
  count: number; // The number overlaid on the token
}

export interface KeywordTokenConfig {
  width: number;
  height: number;
}