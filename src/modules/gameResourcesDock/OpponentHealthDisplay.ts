import * as Y from 'yjs';
import { OpponentHealth } from './types';

export class OpponentHealthDisplay {
  private container: HTMLElement;
  private yDoc: Y.Doc;
  private localPlayerId: string;
  private opponentElements: Map<string, HTMLElement> = new Map();

  constructor(container: HTMLElement, yDoc: Y.Doc, localPlayerId: string) {
    this.container = container;
    this.yDoc = yDoc;
    this.localPlayerId = localPlayerId;

    this.setupObservers();
  }

  private setupObservers(): void {
    // Observe all player states
    const observePlayerState = (playerId: string) => {
      if (playerId === this.localPlayerId) return;

      const yPlayerState = this.yDoc.getMap(`player-${playerId}`);

      yPlayerState.observe(() => {
        const health = (yPlayerState.get('health') as number | undefined) ?? 20;
        this.updateOpponentHealth(playerId, health);
      });

      // Initial render
      const health = (yPlayerState.get('health') as number | undefined) ?? 20;
      this.updateOpponentHealth(playerId, health);
    };

    // Watch for new players
    const checkForPlayers = () => {
      const existingPlayers = new Set(this.opponentElements.keys());

      // Check all possible player maps in the document
      this.yDoc.share.forEach((value, key) => {
        if (key.startsWith('player-') && key !== `player-${this.localPlayerId}`) {
          const playerId = key.replace('player-', '');
          if (!existingPlayers.has(playerId)) {
            observePlayerState(playerId);
          }
        }
      });
    };

    // Check periodically for new players
    checkForPlayers();
    setInterval(checkForPlayers, 1000);
  }

  private updateOpponentHealth(playerId: string, health: number): void {
    let element = this.opponentElements.get(playerId);

    if (!element) {
      element = this.createOpponentHealthElement(playerId);
      this.container.appendChild(element);
      this.opponentElements.set(playerId, element);
    }

    const healthValue = element.querySelector('.opponent-health-value');
    if (healthValue) {
      healthValue.textContent = health.toString();
    }
  }

  private createOpponentHealthElement(playerId: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'opponent-health';
    container.dataset.playerId = playerId;

    const label = document.createElement('div');
    label.className = 'opponent-health-label';
    label.textContent = 'Opponent';

    const value = document.createElement('div');
    value.className = 'opponent-health-value';
    value.textContent = '20';

    const controls = document.createElement('div');
    controls.className = 'opponent-health-controls';

    const decrementBtn = document.createElement('button');
    decrementBtn.textContent = '-';
    decrementBtn.onclick = () => this.modifyOpponentHealth(playerId, -1);

    const incrementBtn = document.createElement('button');
    incrementBtn.textContent = '+';
    incrementBtn.onclick = () => this.modifyOpponentHealth(playerId, 1);

    controls.appendChild(decrementBtn);
    controls.appendChild(incrementBtn);

    container.appendChild(label);
    container.appendChild(value);
    container.appendChild(controls);

    return container;
  }

  private modifyOpponentHealth(playerId: string, delta: number): void {
    const yPlayerState = this.yDoc.getMap(`player-${playerId}`);
    const currentHealth = (yPlayerState.get('health') as number | undefined) ?? 20;
    yPlayerState.set('health', currentHealth + delta);
  }

  public destroy(): void {
    this.opponentElements.clear();
    this.container.innerHTML = '';
  }
}