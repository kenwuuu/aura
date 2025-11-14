# Turn and Priority System

## How It Works

**Turn Structure**: Only one player is active at a time. When a turn starts, the active player's tapped cards untap and they draw a card. Clicking "PASS THE TURN" moves to the next player clockwise.

**Priority System**: Inactive players can tap/untap cards, add counters, and move cards from battlefield to zones. They cannot move cards from dock to battlefield unless they click "TAKE PRIORITY". Priority allows playing cards while the active player remains active. Priority clears when the turn passes.

**State**: Turn state (active player, player order, priority) is stored in Yjs and syncs across all peers.

## File Changes

**New Files**:
- `src/services/turnManager/TurnManager.ts` - Core turn and priority management logic
- `src/services/turnManager/index.ts` - Export file
- `src/components/TurnSystem.tsx` - React UI component for turn controls
- `src/components/TurnSystem.module.css` - Styles for turn system UI
- `src/vite-env.d.ts` - TypeScript declarations for CSS modules

**Modified Files**:
- `src/index.ts` - Integrated TurnManager, added turn state observer and event handlers
- `src/services/eventHandlers/WhiteboardEventHandlers.ts` - Added turn/priority checks for card play
- `src/modules/whiteboard/KeyboardHandler.ts` - Removed ownership restrictions for battlefield interactions
- `src/modules/gameResourcesDock/GameResourcesDock.ts` - Added playCard event dispatch for keyboard shortcuts

## Recent Changes

Refactored all inline styles to `TurnSystem.module.css` CSS module for better maintainability and consistency with other components.

