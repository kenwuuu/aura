/**
 * Pile Hotkeys Manager
 *
 * Lightweight React component that manages pile hotkeys.
 * Uses react-hotkeys-hook internally but takes callbacks from parent class.
 * Doesn't render anything - just manages keyboard listeners.
 */

import { usePileHotkeys } from '@/hooks/useGameHotkeys';
import { useHotkeyStore } from '@/stores/hotkeyStore';

interface PileHotkeysManagerProps {
  pileType: 'deck' | 'exile' | 'discard';
  onMoveToHand: (pileType: string) => void;
  onMoveToDiscard?: (pileType: string) => void;
  onMoveToExile?: (pileType: string) => void;
  onMoveToDeckTop?: (pileType: string) => void;
  onMoveToDeckBottom?: (pileType: string) => void;
}

export function PileHotkeysManager(props: PileHotkeysManagerProps) {
  const hoveredPileType = useHotkeyStore(state => state.hoveredPileType);

  // Only activate if this pile is currently hovered
  const isThisPileHovered = hoveredPileType === props.pileType;

  // Set up pile hotkeys
  usePileHotkeys(isThisPileHovered ? props.pileType : null, {
    onMoveToHand: props.onMoveToHand,
    onMoveToDiscard: props.onMoveToDiscard,
    onMoveToExile: props.onMoveToExile,
    onMoveToDeckTop: props.onMoveToDeckTop,
    onMoveToDeckBottom: props.onMoveToDeckBottom,
  });

  // This component doesn't render anything
  return null;
}
