/**
 * Game Hotkeys Manager
 *
 * Single centralized component that manages ALL game hotkeys.
 *
 * This component doesn't render anything - it just sets up hotkey listeners
 * using the unified useAllGameHotkeys hook.
 *
 * Game instances are accessed from the gameInstanceStore, so no props are needed.
 */

import { useAllGameHotkeys } from '@/hooks/useAllGameHotkeys';

export function GameHotkeysManager() {
  useAllGameHotkeys();

  // This component doesn't render anything
  return null;
}
