import React, { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { toast } from 'sonner';
import { HealthDisplay } from './HealthDisplay';
import { CustomCounter } from '@/modules/player/types';
import { Card } from '@/modules/deck';
import { PileViewer } from '@/modules/gameResourcesDock/components';
import {YSTATE_CUSTOM_COUNTERS, YSTATE_DISCARD_PILE} from "../../constants";

interface OpponentHealthListProps {
  yDoc: Y.Doc;
  localPlayerId: string;
}

interface OpponentData {
  playerId: string;
  health: number;
  customCounters: CustomCounter[];
  exilePile: Card[];
  discardPile: Card[];
  hand: Card[];
  allowViewHand: boolean; // Flag to control if hand can be viewed
}

export const OpponentHealthList: React.FC<OpponentHealthListProps> = ({
  yDoc,
  localPlayerId,
}) => {
  const [opponents, setOpponents] = useState<OpponentData[]>([]);
  const pileViewersRef = useRef<Map<string, { exile: PileViewer; discard: PileViewer; hand: PileViewer }>>(new Map());

  // Notify MultiPlayerBoardManager when opponent count changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('opponentCountChanged', {
      detail: { opponentCount: opponents.length }
    }));
  }, [opponents.length]);

  useEffect(() => {
    const updateOpponents = () => {
      const opponentsList: OpponentData[] = [];

      yDoc.share.forEach((_, key) => {
        if (key.startsWith('player-') && key !== `player-${localPlayerId}`) {
          const playerId = key.replace('player-', '');
          const yPlayerState = yDoc.getMap(key);
          const health = (yPlayerState.get('health') as number | undefined) ?? 20;
          const customCounters = (yPlayerState.get(YSTATE_CUSTOM_COUNTERS) as CustomCounter[] | undefined) ?? [];
          const exilePile = (yPlayerState.get('exilePile') as Card[] | undefined) ?? [];
          const discardPile = (yPlayerState.get(YSTATE_DISCARD_PILE) as Card[] | undefined) ?? [];
          const hand = (yPlayerState.get('hand') as Card[] | undefined) ?? [];
          const allowViewHand = (yPlayerState.get('allowViewHand') as boolean | undefined) ?? false;

          opponentsList.push({ playerId, health, customCounters, exilePile, discardPile, hand, allowViewHand });
        }
      });

      setOpponents(opponentsList);
    };

    // Initial update
    updateOpponents();

    // Set up observers for all player states
    const observerCleanups: Array<() => void> = [];

    const setupObservers = () => {
      yDoc.share.forEach((_, key) => {
        if (key.startsWith('player-') && key !== `player-${localPlayerId}`) {
          const playerId = key.replace('player-', '');
          const yPlayerState = yDoc.getMap(key);
          // General observer for all state changes
          const observer = () => updateOpponents();
          yPlayerState.observe(observer);
          observerCleanups.push(() => yPlayerState.unobserve(observer));

          // Specific observer for deckRevealCount changes to show toast
          const deckRevealObserver = (event: Y.YMapEvent<any>) => {
            if (event.changes.keys.has('deckRevealCount')) {
              const deckRevealCount = yPlayerState.get('deckRevealCount') as number | undefined ?? 0;
              const playerLabel = playerId.slice(0, 9);

              if (deckRevealCount === -1) {
                toast.warning(`${playerLabel} revealed their entire deck`, {
                  position: 'bottom-center',
                  style: { marginBottom: '200px' },
                  richColors: true
                });
              } else if (deckRevealCount > 0) {
                toast.warning(`${playerLabel} revealed the top ${deckRevealCount} card${deckRevealCount > 1 ? 's' : ''} of their deck`, {
                  position: 'bottom-center',
                  style: { marginBottom: '200px' },
                  richColors: true
                });
              } else if (deckRevealCount === 0) {
                console.log(`${playerLabel} hid their deck`);
                toast.info(`${playerLabel} hid their deck`, {
                  position: 'bottom-center',
                  style: { marginBottom: '200px' }
                });
              }
            }
          };
          yPlayerState.observe(deckRevealObserver);
          observerCleanups.push(() => yPlayerState.unobserve(deckRevealObserver));
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
    const counters = (yPlayerState.get(YSTATE_CUSTOM_COUNTERS) as CustomCounter[] | undefined) ?? [];
    const newCounter: CustomCounter = {
      id: `counter-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title,
      icon,
      value: 0,
    };
    yPlayerState.set(YSTATE_CUSTOM_COUNTERS, [...counters, newCounter]);
  };

  const modifyOpponentCounter = (playerId: string, counterId: string, delta: number) => {
    const yPlayerState = yDoc.getMap(`player-${playerId}`);
    const counters = (yPlayerState.get(YSTATE_CUSTOM_COUNTERS) as CustomCounter[] | undefined) ?? [];
    const updatedCounters = counters.map(counter =>
      counter.id === counterId
        ? { ...counter, value: counter.value + delta }
        : counter
    );
    yPlayerState.set(YSTATE_CUSTOM_COUNTERS, updatedCounters);
  };

  const removeOpponentCounter = (playerId: string, counterId: string) => {
    const yPlayerState = yDoc.getMap(`player-${playerId}`);
    const counters = (yPlayerState.get(YSTATE_CUSTOM_COUNTERS) as CustomCounter[] | undefined) ?? [];
    const updatedCounters = counters.filter(counter => counter.id !== counterId);
    yPlayerState.set(YSTATE_CUSTOM_COUNTERS, updatedCounters);
  };

  const getOrCreateViewer = (playerId: string, pileType: 'exile' | 'discard' | 'hand'): PileViewer => {
    let viewers = pileViewersRef.current.get(playerId);
    if (!viewers) {
      viewers = {
        exile: new PileViewer({}),
        discard: new PileViewer({}),
        hand: new PileViewer({})
      };
      pileViewersRef.current.set(playerId, viewers);
    }
    return pileType === 'exile' ? viewers.exile : pileType === 'discard' ? viewers.discard : viewers.hand;
  };

  const viewPile = (playerId: string, pileType: 'exile' | 'discard') => {
    const opponent = opponents.find(o => o.playerId === playerId);
    if (!opponent) return;

    const cards = pileType === 'exile' ? opponent.exilePile : opponent.discardPile;
    const viewer = getOrCreateViewer(playerId, pileType);
    viewer.show(cards, pileType);
  };

  const viewHand = (playerId: string) => {
    const opponent = opponents.find(o => o.playerId === playerId);
    if (!opponent) return;

    // Only allow viewing if the flag is set
    // TODO: add ability to take cards from hand without seeing face of card. will have to show blanks, and add a
    //  function to move card to hand while removing from opponent hand at same time
    if (!opponent.allowViewHand) return;

    const viewer = getOrCreateViewer(playerId, 'hand');
    viewer.show(opponent.hand, 'hand');
  };

  return (
    <>
      {opponents.map((opponent) => (
        <HealthDisplay
          key={opponent.playerId}
          label={opponent.playerId.slice(0, 9)}
          health={opponent.health}
          onModifyHealth={(delta) => modifyOpponentHealth(opponent.playerId, delta)}
          variant="opponent"
          playerId={opponent.playerId}
          customCounters={opponent.customCounters}
          onAddCounter={(title, icon) => addOpponentCounter(opponent.playerId, title, icon)}
          onModifyCounter={(counterId, delta) => modifyOpponentCounter(opponent.playerId, counterId, delta)}
          onRemoveCounter={(counterId) => removeOpponentCounter(opponent.playerId, counterId)}
          handCount={opponent.hand.length}
          allowViewHand={opponent.allowViewHand}
          exileCount={opponent.exilePile.length}
          discardCount={opponent.discardPile.length}
          onViewHand={() => viewHand(opponent.playerId)}
          onViewExile={() => viewPile(opponent.playerId, 'exile')}
          onViewDiscard={() => viewPile(opponent.playerId, 'discard')}
        />
      ))}
    </>
  );
};