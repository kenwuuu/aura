export const CARD_HEIGHT = 88;
export const CARD_WIDTH = 63;

// RoomManager
export const ROOM_PREFIX = 'mtg-';

// Default card back image (will be added to /public/assets/)
export const DEFAULT_CARD_BACK = '/assets/card-back.png';

// yDoc constants
export const YDOC_CARDS_ON_BOARD = 'cards-on-board';
export const YDOC_KEYWORD_TOKENS = 'tokens';
export function YDOC_PLAYER(playerId: string): string { return `player-${playerId}` }
export const YSTATE_HEALTH = 'health';
export const YSTATE_DECK = 'deck';
export const YSTATE_HAND = 'hand';
export const YSTATE_EXILE_PILE = 'exile-pile';
export const YSTATE_DISCARD_PILE = 'discard-pile';
export const YSTATE_DECK_CARD_COUNT = 'deck-card-count';
export const YSTATE_CUSTOM_COUNTERS = 'custom-counters';
export const YSTATE_CAN_VIEW_HAND = 'allowViewHand';