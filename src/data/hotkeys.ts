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
  EnemyBattlefieldCard: 'EnemyBattlefieldCard',
} as const;

export type HotkeyContext = typeof HotkeyContext[keyof typeof HotkeyContext];

export interface Hotkey {
  key: string; // Display name for UI (e.g., "Space", "+  or  =")
  keys: string[]; // Actual key bindings for react-hotkeys-hook (e.g., ["space"], ["+", "="])
  context: HotkeyContext[];
  shortDescription: string;
  longDescription: string;
  action: string; // Unique action identifier (e.g., "tap", "draw", "addCounter")
}

export const HOTKEYS: Hotkey[] = [
  // Global shortcuts (work anywhere)
  {
    key: 'C',
    keys: ['c'],
    context: ['global', 'deck'],
    shortDescription: 'Draw',
    longDescription: 'Draw',
    action: 'draw',
  },
  {
    key: 'V',
    keys: ['v'],
    context: ['global', 'deck'],
    shortDescription: 'Shuffle',
    longDescription: 'Shuffle deck',
    action: 'shuffle',
  },
  {
    key: 'M',
    keys: ['m'],
    context: ['global', 'deck'],
    shortDescription: 'Mulligan',
    longDescription: 'Mulligan (draw new hand)',
    action: 'mulligan',
  },
  {
    key: 'A',
    keys: ['a'],
    context: ['global', 'deck'],
    shortDescription: 'Add any card',
    longDescription: 'Add a card from outside of game',
    action: 'addCard',
  },
  {
    key: '+  or  =',
    keys: ['shift+equal', 'equal'],
    context: ['global', "health"],
    shortDescription: '+1 life',
    longDescription: 'Gain 1 life',
    action: 'gainHealth',
  },
  {
    key: '-  or  _',
    keys: ['minus', 'shift+minus'],
    context: ['global', "health"],
    shortDescription: '-1 life',
    longDescription: 'Lose 1 life',
    action: 'loseHealth',
  },

  // Battlefield card shortcuts
  {
    key: 'X',
    keys: ['x'],
    context: ['global', 'battlefield'],
    shortDescription: 'Untap all',
    longDescription: 'Untap all your cards',
    action: 'untapAll',
  },
  {
    key: 'Space',
    keys: ['space'],
    context: ['battlefield'],
    shortDescription: 'Tap/Untap',
    longDescription: 'Tap/Untap card',
    action: 'tap',
  },
  {
    key: 'F',
    keys: ['f'],
    context: ['battlefield', 'hand'],
    shortDescription: 'Flip',
    longDescription: 'Flip card face-down/face-up',
    action: 'flip',
  },
  {
    key: 'U',
    keys: ['u'],
    context: ['battlefield'],
    shortDescription: '+1 counter',
    longDescription: 'Add +1 counter to card',
    action: 'addCounter',
  },
  {
    key: 'I',
    keys: ['i'],
    context: ['battlefield'],
    shortDescription: '-1 counter',
    longDescription: 'Add -1 counter to card',
    action: 'removeCounter',
  },
  {
    key: 'K',
    keys: ['k'],
    context: ['battlefield', 'EnemyBattlefieldCard'],
    shortDescription: 'Copy/clone',
    longDescription: 'Create copy of card',
    action: 'copy',
  },
  {
    key: 'Back', // leaving this icon here: ⌫
    keys: ['backspace'],
    context: ['battlefield'],
    shortDescription: 'Delete',
    longDescription: 'Delete a card',
    action: 'delete',
  },
  {
    key: 'H',
    keys: ['h'],
    context: ['battlefield', 'deck', 'exile', 'discard', 'deckcard'],
    shortDescription: 'Hand',
    longDescription: 'Move card to hand',
    action: 'moveToHand',
  },
  {
    key: '▲ / Left Click',
    keys: ['arrowup'],
    context: ['kwToken'],
    shortDescription: '+1',
    longDescription: '+1',
    action: 'tokenIncrement',
  },
  {
    key: '▼ / Right Click',
    keys: ['arrowdown'],
    context: ['kwToken'],
    shortDescription: '-1',
    longDescription: '-1',
    action: 'tokenDecrement',
  },
  {
    key: 'Back',
    keys: ['backspace'],
    context: ['kwToken'],
    shortDescription: 'Delete token',
    longDescription: 'Delete a keyword token',
    action: 'tokenDelete',
  },

  // Hand and pile shortcuts
  {
    key: 'D',
    keys: ['d'],
    context: ['battlefield', 'hand', 'exile', 'deck', 'deckcard', 'scry'],
    shortDescription: 'Discard',
    longDescription: 'Move card to discard',
    action: 'moveToDiscard',
  },
  {
    key: 'S',
    keys: ['s'],
    context: ['battlefield', 'hand', 'deck', 'discard', 'deckcard'],
    shortDescription: 'Exile',
    longDescription: 'Move card from hand/deck to exile',
    action: 'moveToExile',
  },
  {
    key: 'T',
    keys: ['t'],
    context: ['battlefield', 'hand', 'exile', 'discard', 'scry'],
    shortDescription: 'To deck top',
    longDescription: 'Move card from hand/deck to top of deck',
    action: 'moveToDeckTop',
  },
  {
    key: 'Y',
    keys: ['y'],
    context: ['battlefield', 'hand', 'exile', 'discard', 'scry'],
    shortDescription: 'To deck bottom',
    longDescription: 'Move card from hand/deck to bottom of deck',
    action: 'moveToDeckBottom',
  },
];

/**
 * Get hotkeys relevant to a specific context
 */
export function getHotkeysForContext(context: HotkeyContext): Hotkey[] {
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

/**
 * Get key bindings for a specific action (for react-hotkeys-hook)
 */
export function getKeyBindingsForAction(action: string): string[] {
  const hotkey = HOTKEYS.find((h) => h.action === action);
  return hotkey?.keys ?? [];
}