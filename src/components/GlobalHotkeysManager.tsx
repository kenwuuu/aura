/**
 * Global Hotkeys Manager
 *
 * React component that sets up global hotkeys using useGlobalHotkeys hook.
 * This component doesn't render anything - it just manages hotkey listeners.
 */

import { useEffect } from 'react';
import { useGlobalHotkeys } from '@/hooks/useGameHotkeys';

interface GlobalHotkeysManagerProps {
  onDraw: () => void;
  onShuffle: () => void;
  onMulligan: () => void;
  onGainHealth: () => void;
  onLoseHealth: () => void;
  onUntapAll: () => void;
  onAddCard?: () => void;
}

export function GlobalHotkeysManager(props: GlobalHotkeysManagerProps) {
  // Set up global hotkeys
  useGlobalHotkeys({
    onDraw: props.onDraw,
    onShuffle: props.onShuffle,
    onMulligan: props.onMulligan,
    onGainHealth: props.onGainHealth,
    onLoseHealth: props.onLoseHealth,
    onUntapAll: props.onUntapAll,
    onAddCard: props.onAddCard,
  });

  // This component doesn't render anything
  return null;
}
