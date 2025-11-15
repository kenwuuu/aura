export const CARD_HEIGHT = 88;
export const CARD_WIDTH = 63;

// RoomManager
export const ROOM_PREFIX = 'mtg-';

// Default card back image (will be added to /public/assets/)
export const DEFAULT_CARD_BACK = '/assets/card-back.png';

// yDoc constants
export const YDOC_CARDS_ON_BOARD = 'cards-on-board';
export function YDOC_PLAYER(playerId: string): string { return `player-${playerId}` }