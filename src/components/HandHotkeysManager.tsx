/**
 * Hand Hotkeys Manager
 *
 * Lightweight React component that manages hand card hotkeys.
 * Uses react-hotkeys-hook internally but takes callbacks from parent class.
 * Doesn't render anything - just manages keyboard listeners.
 */

import { useHandCardHotkeys } from '@/hooks/useGameHotkeys';
import { useHotkeyStore } from '@/stores/hotkeyStore';

interface HandHotkeysManagerProps {
  onFlip: (cardId: string) => void;
  onMoveToDiscard: (cardId: string) => void;
  onMoveToExile: (cardId: string) => void;
  onMoveToDeckTop: (cardId: string) => void;
  onMoveToDeckBottom: (cardId: string) => void;
}

export function HandHotkeysManager(props: HandHotkeysManagerProps) {
  const hoveredCardId = useHotkeyStore(state => state.hoveredHandCardId);

  // Set up hand card hotkeys for the currently hovered card
  useHandCardHotkeys(hoveredCardId, {
    onFlip: props.onFlip,
    onMoveToDiscard: props.onMoveToDiscard,
    onMoveToExile: props.onMoveToExile,
    onMoveToDeckTop: props.onMoveToDeckTop,
    onMoveToDeckBottom: props.onMoveToDeckBottom,
  });

  // This component doesn't render anything
  return null;
}
