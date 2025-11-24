/**
 * Battlefield Hotkeys Manager
 *
 * Lightweight React component that manages battlefield card hotkeys.
 * Uses react-hotkeys-hook internally but takes callbacks from parent class.
 * Doesn't render anything - just manages keyboard listeners.
 */

import { useBattlefieldCardHotkeys } from '@/hooks/useGameHotkeys';
import { useHotkeyStore } from '@/stores/hotkeyStore';

interface BattlefieldHotkeysManagerProps {
  onTap: (cardId: string) => void;
  onFlip: (cardId: string) => void;
  onAddCounter: (cardId: string) => void;
  onRemoveCounter: (cardId: string) => void;
  onCopy: (cardId: string) => void;
  onDelete: (cardId: string) => void;
  onMoveToHand: (cardId: string) => void;
  onMoveToDiscard: (cardId: string) => void;
  onMoveToExile: (cardId: string) => void;
  onMoveToDeckTop: (cardId: string) => void;
  onMoveToDeckBottom: (cardId: string) => void;
}

export function BattlefieldHotkeysManager(props: BattlefieldHotkeysManagerProps) {
  const hoveredCardId = useHotkeyStore(state => state.hoveredBattlefieldCardId);

  // Set up battlefield card hotkeys for the currently hovered card
  useBattlefieldCardHotkeys(hoveredCardId, {
    onTap: props.onTap,
    onFlip: props.onFlip,
    onAddCounter: props.onAddCounter,
    onRemoveCounter: props.onRemoveCounter,
    onCopy: props.onCopy,
    onDelete: props.onDelete,
    onMoveToHand: props.onMoveToHand,
    onMoveToDiscard: props.onMoveToDiscard,
    onMoveToExile: props.onMoveToExile,
    onMoveToDeckTop: props.onMoveToDeckTop,
    onMoveToDeckBottom: props.onMoveToDeckBottom,
  });

  // This component doesn't render anything
  return null;
}
