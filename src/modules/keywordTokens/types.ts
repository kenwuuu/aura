import { WhiteboardObject } from '../whiteboard/types';

export interface KeywordToken extends WhiteboardObject {
  title: string // descriptor used in Tooltip
  imageUrl?: string; // URL to the token image (can be SVG or regular image)
  backgroundColor: string; // Background color for circular background
  count?: number; // The number overlaid on the token (optional for blank tokens)
}

export interface KeywordTokenConfig {
  width: number;
  height: number;
}

// Template for creating tokens - used in token grid as "infinite source"
export interface KeywordTokenTemplate {
  title: string; // Display name (e.g., "Deathtouch", "Flying")
  imageUrl?: string; // Path to token image/SVG
  backgroundColor: string; // Circular background color
  count?: number; // Starting count (defaults to 1)
}