/**
 * Centralized hotkey configuration
 * Each hotkey has both a short description (for tooltips) and a long description (for the modal)
 */

export const HotkeyContext = {
  Global: 'global',
  Battlefield: 'battlefield',
  Hand: 'hand',
  Deck: 'deck',
  DeckCard: 'deckcard',
  Exile: 'exile',
  Scry: 'scry',
  Discard: 'discard',
  Health: 'health',
  KeywordToken: 'kwToken',
  KeywordTokenStack: 'kwTokenStack',
} as const;

export type HotkeyContext = typeof HotkeyContext[keyof typeof HotkeyContext];

export interface HotkeyDefinition {
  key: string;
  context: HotkeyContext[];
  shortDescription: string;
  longDescription: string;
}

export const HOTKEYS: HotkeyDefinition[] = [
  // Global shortcuts (work anywhere)
  {
    key: 'C',
    context: ['global', 'deck'],
    shortDescription: 'Draw card',
    longDescription: 'Draw card',
  },
  {
    key: 'V',
    context: ['global', 'deck'],
    shortDescription: 'Shuffle deck',
    longDescription: 'Shuffle deck',
  },
  {
    key: 'M',
    context: ['global', 'deck'],
    shortDescription: 'Mulligan',
    longDescription: 'Mulligan (draw new hand)',
  },
  {
    key: 'A',
    context: ['global', 'deck'],
    shortDescription: 'Add any card',
    longDescription: 'Add a card from outside of game',
  },
  {
    key: '+  or  =',
    context: ['global', "health"],
    shortDescription: '+1 life',
    longDescription: 'Gain 1 life',
  },
  {
    key: '-  or  _',
    context: ['global', "health"],
    shortDescription: '-1 life',
    longDescription: 'Lose 1 life',
  },

  // Battlefield card shortcuts
  {
    key: 'X',
    context: ['global', 'battlefield'],
    shortDescription: 'Untap all',
    longDescription: 'Untap all your cards',
  },
  {
    key: 'Space',
    context: ['battlefield'],
    shortDescription: 'Tap/Untap',
    longDescription: 'Tap/Untap card',
  },
  {
    key: 'F',
    context: ['battlefield'],
    shortDescription: 'Flip',
    longDescription: 'Flip card face-down/face-up',
  },
  {
    key: 'U',
    context: ['battlefield'],
    shortDescription: '+1 counter',
    longDescription: 'Add +1 counter to card',
  },
  {
    key: 'I',
    context: ['battlefield'],
    shortDescription: '-1 counter',
    longDescription: 'Add -1 counter to card',
  },
  {
    key: 'K',
    context: ['battlefield'],
    shortDescription: 'Copy card',
    longDescription: 'Create copy of card',
  },
  {
    key: 'Back', // leaving this icon here: ⌫
    context: ['battlefield'],
    shortDescription: 'Delete card',
    longDescription: 'Delete a card',
  },
  {
    key: 'H',
    context: ['battlefield', 'deck', 'exile', 'discard', 'deckcard'],
    shortDescription: 'To hand',
    longDescription: 'Move card to hand',
  },
  {
    key: '▲ / Left Click',
    context: ['kwToken'],
    shortDescription: '+1',
    longDescription: '+1',
  },
  {
    key: '▼ / Right Click',
    context: ['kwToken'],
    shortDescription: '-1',
    longDescription: '-1',
  },
  {
    key: 'Back',
    context: ['kwToken'],
    shortDescription: 'Delete token',
    longDescription: 'Delete a keyword token',
  },

  // Hand and pile shortcuts
  {
    key: 'D',
    context: ['battlefield', 'hand', 'exile', 'deck', 'deckcard', 'scry'],
    shortDescription: 'To discard',
    longDescription: 'Move card from hand/deck to discard',
  },
  {
    key: 'S',
    context: ['battlefield', 'hand', 'deck', 'discard', 'deckcard'],
    shortDescription: 'To exile',
    longDescription: 'Move card from hand/deck to exile',
  },
  {
    key: 'T',
    context: ['battlefield', 'hand', 'exile', 'discard', 'scry'],
    shortDescription: 'To deck top',
    longDescription: 'Move card from hand/deck to top of deck',
  },
  {
    key: 'Y',
    context: ['battlefield', 'hand', 'exile', 'discard', 'scry'],
    shortDescription: 'To deck bottom',
    longDescription: 'Move card from hand/deck to bottom of deck',
  },
];

/**
 * Get hotkeys relevant to a specific context
 */
export function getHotkeysForContext(context: HotkeyContext): HotkeyDefinition[] {
  return HOTKEYS.filter(hotkey => hotkey.context.includes(context));
}

/**
 * Get all hotkeys with their long descriptions (for the modal)
 */
export function getAllHotkeysWithLongDescriptions(): Array<{ key: string; action: string }> {
  return HOTKEYS.map(hotkey => ({
    key: hotkey.key,
    action: hotkey.longDescription,
  }));
}