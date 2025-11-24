/**
 * Token Hotkeys Manager
 *
 * Lightweight React component that manages keyword token hotkeys.
 * Uses react-hotkeys-hook internally but takes callbacks from parent class.
 * Doesn't render anything - just manages keyboard listeners.
 */

import { useTokenHotkeys } from '@/hooks/useGameHotkeys';
import { useHotkeyStore } from '@/stores/hotkeyStore';

interface TokenHotkeysManagerProps {
  onIncrement: (tokenId: string) => void;
  onDecrement: (tokenId: string) => void;
  onDelete: (tokenId: string) => void;
}

export function TokenHotkeysManager(props: TokenHotkeysManagerProps) {
  const hoveredTokenId = useHotkeyStore(state => state.hoveredTokenId);

  // Set up token hotkeys for the currently hovered token
  useTokenHotkeys(hoveredTokenId, {
    onIncrement: props.onIncrement,
    onDecrement: props.onDecrement,
    onDelete: props.onDelete,
  });

  // This component doesn't render anything
  return null;
}
