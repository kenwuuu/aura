import React, { useState, useEffect } from 'react';
import { TurnManager } from '../services/turnManager';
import styles from './TurnSystem.module.css';

interface TurnSystemProps {
  turnManager: TurnManager;
  localPlayerId: string;
  onPassTurn: () => void;
  onTakePriority: () => void;
  onEndPriority: () => void;
}

export const TurnSystem: React.FC<TurnSystemProps> = ({
  turnManager,
  localPlayerId,
  onPassTurn,
  onTakePriority,
  onEndPriority,
}) => {
  const [turnState, setTurnState] = useState(turnManager.getTurnState());
  const [playerNames, setPlayerNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Subscribe to turn state changes
    const cleanup = turnManager.onTurnStateChange((newState) => {
      setTurnState(newState);
    });

    // Initialize player order when component mounts
    turnManager.initializePlayerOrder();

    return cleanup;
  }, [turnManager]);

  // Get player display name (use first 8 chars of ID for now)
  const getPlayerDisplayName = (playerId: string): string => {
    if (playerNames.has(playerId)) {
      return playerNames.get(playerId)!;
    }
    // Use first 8 characters of player ID as display name
    return playerId.substring(0, 8);
  };

  const isActivePlayer = turnManager.isActivePlayer(localPlayerId);
  const hasPriority = turnManager.hasPriority(localPlayerId);
  const canPassTurn = isActivePlayer;
  const canTakePriority = !isActivePlayer && !hasPriority;
  const canEndPriority = !isActivePlayer && hasPriority;

  return (
    <div className={styles.container}>
      {/* Active Player Display */}
      <div className={styles.activePlayerSection}>
        <div className={styles.activePlayerLabel}>
          Active Player:
        </div>
        <div className={`${styles.activePlayerName} ${
          turnState.activePlayerId === localPlayerId 
            ? styles.activePlayerNameLocal 
            : styles.activePlayerNameOpponent
        }`}>
          {turnState.activePlayerId 
            ? (turnState.activePlayerId === localPlayerId 
                ? 'YOU' 
                : getPlayerDisplayName(turnState.activePlayerId))
            : 'None'}
        </div>
      </div>

      {/* Turn Actions */}
      <div className={styles.actionsContainer}>
        {canPassTurn && (
          <button
            onClick={onPassTurn}
            className={styles.buttonPassTurn}
          >
            PASS THE TURN
          </button>
        )}

        {canTakePriority && (
          <button
            onClick={onTakePriority}
            className={styles.buttonTakePriority}
          >
            TAKE PRIORITY
          </button>
        )}

        {canEndPriority && (
          <button
            onClick={onEndPriority}
            className={styles.buttonEndPriority}
          >
            END PRIORITY
          </button>
        )}
      </div>

      {/* Priority Status */}
      {hasPriority && (
        <div className={styles.priorityStatus}>
          You have priority
        </div>
      )}
    </div>
  );
};

