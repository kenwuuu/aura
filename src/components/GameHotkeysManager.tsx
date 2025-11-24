/**
 * Game Hotkeys Manager
 *
 * Single centralized component that manages ALL game hotkeys.
 *
 * This component doesn't render anything - it just sets up hotkey listeners
 * using the unified useAllGameHotkeys hook.
 */

import { useAllGameHotkeys } from '@/hooks/useAllGameHotkeys';
import type {
  GlobalActions,
  BattlefieldActions,
  HandActions,
  PileActions,
  TokenActions,
} from '@/types/hotkeys';

interface GameHotkeysManagerProps {
  globalActions: GlobalActions;
  battlefieldActions: BattlefieldActions;
  handActions: HandActions;
  pileActions: PileActions;
  tokenActions: TokenActions;
}

export function GameHotkeysManager(props: GameHotkeysManagerProps) {
  useAllGameHotkeys({
    globalActions: props.globalActions,
    battlefieldActions: props.battlefieldActions,
    handActions: props.handActions,
    pileActions: props.pileActions,
    tokenActions: props.tokenActions,
  });

  // This component doesn't render anything
  return null;
}
