import React, { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { HealthDisplay } from './HealthDisplay';
import { CustomCounter } from '../modules/player/types';

interface OpponentHealthListProps {
  yDoc: Y.Doc;
  localPlayerId: string;
}

interface OpponentData {
  playerId: string;
  health: number;
  customCounters: CustomCounter[];
}

export const OpponentHealthList: React.FC<OpponentHealthListProps> = ({
  yDoc,
  localPlayerId,
}) => {
  const [opponents, setOpponents] = useState<OpponentData[]>([]);

  // Notify MultiPlayerBoardManager when opponent count changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('opponentCountChanged', {
      detail: { opponentCount: opponents.length }
    }));
  }, [opponents.length]);

  useEffect(() => {
    const updateOpponents = () => {
      const opponentsList: OpponentData[] = [];

      yDoc.share.forEach((value, key) => {
        if (key.startsWith('player-') && key !== `player-${localPlayerId}`) {
          const playerId = key.replace('player-', '');
          const yPlayerState = yDoc.getMap(key);
          const health = (yPlayerState.get('health') as number | undefined) ?? 20;
          const customCounters = (yPlayerState.get('customCounters') as CustomCounter[] | undefined) ?? [];

          opponentsList.push({ playerId, health, customCounters });
        }
      });

      setOpponents(opponentsList);
    };

    // Initial update
    updateOpponents();

    // Set up observers for all player states
    const observerCleanups: Array<() => void> = [];

    const setupObservers = () => {
      yDoc.share.forEach((value, key) => {
        if (key.startsWith('player-') && key !== `player-${localPlayerId}`) {
          const yPlayerState = yDoc.getMap(key);
          const observer = () => updateOpponents();
          yPlayerState.observe(observer);
          observerCleanups.push(() => yPlayerState.unobserve(observer));
        }
      });
    };

    setupObservers();

    // Check for new players periodically and reset observers
    const interval = setInterval(() => {
      // Clean up old observers
      observerCleanups.forEach(cleanup => cleanup());
      observerCleanups.length = 0;
      // Setup new observers
      setupObservers();
      updateOpponents();
    }, 1000);

    return () => {
      clearInterval(interval);
      observerCleanups.forEach(cleanup => cleanup());
    };
  }, [yDoc, localPlayerId]);

  const modifyOpponentHealth = (playerId: string, delta: number) => {
    const yPlayerState = yDoc.getMap(`player-${playerId}`);
    const currentHealth = (yPlayerState.get('health') as number | undefined) ?? 20;
    yPlayerState.set('health', currentHealth + delta);
  };

  const addOpponentCounter = (playerId: string, title: string, icon: string) => {
    const yPlayerState = yDoc.getMap(`player-${playerId}`);
    const counters = (yPlayerState.get('customCounters') as CustomCounter[] | undefined) ?? [];
    const newCounter: CustomCounter = {
      id: `counter-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title,
      icon,
      value: 0,
    };
    yPlayerState.set('customCounters', [...counters, newCounter]);
  };

  const modifyOpponentCounter = (playerId: string, counterId: string, delta: number) => {
    const yPlayerState = yDoc.getMap(`player-${playerId}`);
    const counters = (yPlayerState.get('customCounters') as CustomCounter[] | undefined) ?? [];
    const updatedCounters = counters.map(counter =>
      counter.id === counterId
        ? { ...counter, value: counter.value + delta }
        : counter
    );
    yPlayerState.set('customCounters', updatedCounters);
  };

  const removeOpponentCounter = (playerId: string, counterId: string) => {
    const yPlayerState = yDoc.getMap(`player-${playerId}`);
    const counters = (yPlayerState.get('customCounters') as CustomCounter[] | undefined) ?? [];
    const updatedCounters = counters.filter(counter => counter.id !== counterId);
    yPlayerState.set('customCounters', updatedCounters);
  };

  return (
    <>
      {opponents.map((opponent) => (
        <HealthDisplay
          key={opponent.playerId}
          label="Opponent"
          health={opponent.health}
          onModifyHealth={(delta) => modifyOpponentHealth(opponent.playerId, delta)}
          variant="opponent"
          playerId={opponent.playerId}
          customCounters={opponent.customCounters}
          onAddCounter={(title, icon) => addOpponentCounter(opponent.playerId, title, icon)}
          onModifyCounter={(counterId, delta) => modifyOpponentCounter(opponent.playerId, counterId, delta)}
          onRemoveCounter={(counterId) => removeOpponentCounter(opponent.playerId, counterId)}
        />
      ))}
    </>
  );
};