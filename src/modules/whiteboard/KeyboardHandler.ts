import { WhiteboardCard } from './types';
import * as Y from 'yjs';

export interface KeyboardHandlerCallbacks {
  onMoveToHand: (card: WhiteboardCard) => void;
  onMoveToDeckTop: (card: WhiteboardCard) => void;
  onMoveToDeckBottom: (card: WhiteboardCard) => void;
  onMoveToGraveyard: (card: WhiteboardCard) => void;
  onMoveToExile: (card: WhiteboardCard) => void;
  onDeleteCard: (card: WhiteboardCard) => void;
  onDrawCard: () => void;
  onShuffleDeck: () => void;
  onUntapAll: () => void;
  onEndTurn: () => void;
  onHideCardPreview: () => void;
  onHideCardTooltip: () => void;
  onMulligan: () => void;
  loseHealth: () => void;
  gainHealth: () => void;
}

export class KeyboardHandler {
  private hoveredCardId: string | null = null;
  private yCards: Y.Map<WhiteboardCard>;
  private callbacks: KeyboardHandlerCallbacks;
  private readonly localPlayerId: string;
  private handleKeyDownBound: (e: KeyboardEvent) => void;

  // Copy tracking for smart offset positioning
  private lastCopiedCardId: string | null = null;
  private lastCopyTime: number = 0;
  private copyOffsetMultiplier: number = 0;
  private readonly COPY_RESET_DELAY = 1500; // 1.5 seconds

  constructor(yCards: Y.Map<WhiteboardCard>, callbacks: KeyboardHandlerCallbacks, localPlayerId: string) {
    this.yCards = yCards;
    this.callbacks = callbacks;
    this.localPlayerId = localPlayerId;
    this.handleKeyDownBound = (e) => this.handleKeyDown(e);
    this.attachListeners();
  }

  public setHoveredCard(cardId: string | null): void {
    this.hoveredCardId = cardId;
  }

  public getHoveredCard(): string | null {
    return this.hoveredCardId;
  }

  /**
   * Execute a hotkey action programmatically
   * @param key - The key to simulate (e.g., 'c', 'Space', 'f', '+  or  =')
   * @param cardId - Optional card ID to use as context (if null, uses hovered card)
   */
  public executeHotkey(key: string, cardId: string | null = null): void {
    // Normalize key (handle special cases and display strings)
    let normalizedKey = key.toLowerCase().trim();
    
    // Handle display strings from hotkeys.ts
    if (normalizedKey === 'space') {
      normalizedKey = ' ';
    } else if (normalizedKey.includes('+') || normalizedKey.includes('=')) {
      // Handle '+  or  =' -> use '='
      normalizedKey = '=';
    } else if (normalizedKey.includes('-') || normalizedKey.includes('_')) {
      // Handle '-  or  _' -> use '-'
      normalizedKey = '-';
    } else {
      // For regular keys, use first character (handles 'C' -> 'c')
      normalizedKey = normalizedKey.charAt(0);
    }

    // Use provided cardId or fall back to hovered card
    const targetCardId = cardId ?? this.hoveredCardId;
    const card = targetCardId ? this.yCards.get(targetCardId) : null;

    // Create a mock keyboard event for compatibility
    const mockEvent = {
      key: normalizedKey,
      preventDefault: () => {
      },
      target: document.body,
    } as unknown as KeyboardEvent;

    // Temporarily set hovered card if provided
    const originalHoveredCard = this.hoveredCardId;
    if (cardId !== null) {
      this.hoveredCardId = cardId;
    }

    try {
      // Execute the action
      this.handleKeyDown(mockEvent);
    } finally {
      // Restore original hovered card
      if (cardId !== null) {
        this.hoveredCardId = originalHoveredCard;
      }
    }
  }

  private attachListeners(): void {
    document.addEventListener('keydown', this.handleKeyDownBound);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Ignore if modifier keys are held
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    
    // Ignore if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = e.key.toLowerCase();
    const card = this.hoveredCardId ? this.yCards.get(this.hoveredCardId) : null;

    // draw card
    if (key === 'c') {
      e.preventDefault();
      this.callbacks.onDrawCard();
      return;
    }

    // shuffle deck
    if (key === 'v') {
      e.preventDefault();
      this.callbacks.onShuffleDeck();
      return;
    }

    // mulligan hand
    if (key === 'm') {
      e.preventDefault();
      this.callbacks.onMulligan();
      return;
    }

    // lose health / subtract health
    if (key === '-' || key === '_' ) {
      e.preventDefault();
      this.callbacks.loseHealth();
      return;
    }

    // gain health / add health
    if (key === '=' || key === '+' ) {
      e.preventDefault();
      this.callbacks.gainHealth();
      return;
    }

    // Check if GameResourcesDock has a hovered card/pile
    const getDockState = (window as any).getGameResourcesDockHoverState;
    const dockState = getDockState ? getDockState() : null;

    // If there's a battlefield card, prioritize it
    if (card) {
      this.handleBattlefieldCardHotkeys(key, card, e);
      return;
    }

    // Otherwise check GameResourcesDock hover state
    if (dockState && (dockState.hoveredHandCardId || dockState.hoveredPileType)) {
      this.handleDockHotkeys(key, dockState, e);
      return;
    }

    // Global hotkeys (no hover needed)
    switch (key) {
      case 'c': // C - Draw card
        e.preventDefault();
        this.callbacks.onDrawCard();
        break;

      case 'x': // X - Untap all
        e.preventDefault();
        this.callbacks.onUntapAll();
        this.untapAllCards();
        break;

      case 'v': // V - Shuffle deck
        e.preventDefault();
        this.callbacks.onShuffleDeck();
        break;

      case 'e': // E - End turn (boilerplate)
        e.preventDefault();
        this.callbacks.onEndTurn();
        console.log('End turn - not yet implemented');
        break;
    }
  }

  private handleBattlefieldCardHotkeys(key: string, card: WhiteboardCard, e: KeyboardEvent): void {
    e.preventDefault();

    // All hotkeys that don't hover a card
    switch (key) {
      case 'c': // C - Draw card
        this.callbacks.onDrawCard();
        break;

      case 'x': // X - Untap all
        this.callbacks.onUntapAll();
        this.untapAllCards();
        break;

      case 'v': // V - Shuffle deck
        this.callbacks.onShuffleDeck();
        break;

      case 'e': // E - End turn (boilerplate)
        this.callbacks.onEndTurn();
        console.log('End turn - not yet implemented');
        break;
    }

    // Return if no card is hovered
    if (!card) return;

    if (key === 'k') { // K - Create copy
      this.createCopy(card);
      return;
    }

    // Return if hovered card is owned by an opponent (not by user)
    if (card.ownerId !== this.localPlayerId) return;

    switch (key) {
      case ' ': // Space - Tap/Untap
        if (card) this.toggleTap(card);
        break;

      case 'y': // Y - Move to bottom of deck
        if (card) {
          this.hideCardDependents();
          this.callbacks.onMoveToDeckBottom(card);
          this.removeCard(card.id);
        }
        break;

      case 't': // T - Move to top of deck
        if (card) {
          this.hideCardDependents();
          this.callbacks.onMoveToDeckTop(card);
          this.removeCard(card.id);
        }
        break;

      case 'u': // U - Add counter
        if (card) this.addPositiveCounter(card);
        break;

      case 'i': // U - Add counter
        if (card) this.addNegativeCounter(card);
        break;

      case 'd': // D - Move to graveyard
        if (card) {
          this.hideCardDependents();
          this.callbacks.onMoveToGraveyard(card);
          this.removeCard(card.id);
        }
        break;

      case 's': // S - Move to exile
        if (card) {
          this.hideCardDependents();

          this.callbacks.onMoveToExile(card);
          this.removeCard(card.id);
        }
        break;

      case 'backspace':
        if (card) {
          this.hideCardDependents();
          this.removeCard(card.id);
        }
        break;

      case 'f': // F - Flip card
        if (card) this.flipCard(card);
        break;

      case 'h': // H - Move to hand
        if (card) {
          this.hideCardDependents();
          this.callbacks.onMoveToHand(card);
          this.removeCard(card.id);
        }
        break;
    }
  }

  private hideCardDependents() {
    this.callbacks.onHideCardPreview();
    this.callbacks.onHideCardTooltip();
  }

  private handleDockHotkeys(key: string, dockState: any, e: KeyboardEvent): void {
    if (dockState.hoveredHandCardId) {
      // Hand card hotkeys
      const card = dockState.getHandCard(dockState.hoveredHandCardId);
      if (!card) return;

      switch (key) {
        case 'z': // Z - Play from hand to battlefield  TODO: Doesn't play when you press z on card
          e.preventDefault();
          dockState.playHandCardToBattlefield(dockState.hoveredHandCardId);
          break;

        case 'd': // D - Move to graveyard
          e.preventDefault();
          dockState.moveHandCardToDiscard(dockState.hoveredHandCardId);
          break;

        case 's': // S - Move to exile
          e.preventDefault();
          dockState.moveHandCardToExile(dockState.hoveredHandCardId);
          break;

        case 'f': // F - Flip hand card
          e.preventDefault();
          dockState.flipHandCard(dockState.hoveredHandCardId);
          break;

        case 't': // T - Move to top of deck
          e.preventDefault();
          dockState.moveHandCardToDeckTop(dockState.hoveredHandCardId);
          break;

        case 'y': // Y - Move to bottom of deck
          e.preventDefault();
          dockState.moveHandCardToDeckBottom(dockState.hoveredHandCardId);
          break;
      }
    } else if (dockState.hoveredPileType) {
      // Pile hotkeys (top card)
      const topCard = dockState.getTopPileCard(dockState.hoveredPileType);
      if (!topCard) return;

      const pileType = dockState.hoveredPileType;

      switch (key) {
        case 'z': // Z - Play top card to battlefield
          e.preventDefault();
          dockState.movePileCardToBattlefield(topCard, pileType);
          break;

        case 'h': // H - Move top card to hand
          e.preventDefault();
          dockState.movePileCardToHand(topCard, pileType);
          break;

        case 's': // S - Move top card to exile
          // Skip if already in exile
          if (pileType !== 'exile') {
            e.preventDefault();
            dockState.movePileCardToExile(topCard, pileType);
          }
          break;

        case 'd': // D - Move top card to discard
          // Skip if already in discard
          if (pileType !== 'discard') {
            e.preventDefault();
            dockState.movePileCardToDiscard(topCard, pileType);
          }
          break;

        case 't': // T - Move top card to top of deck
          // Skip if already in deck (would be redundant)
          if (pileType !== 'deck') {
            e.preventDefault();
            dockState.movePileCardToDeckTop(topCard, pileType);
          }
          break;

        case 'y': // Y - Move top card to bottom of deck
          // Skip if already in deck
          if (pileType !== 'deck') {
            e.preventDefault();
            dockState.movePileCardToDeckBottom(topCard, pileType);
          }
          break;
      }
    }
  }

  private toggleTap(card: WhiteboardCard): void {
    const updatedCard = { ...card, isTapped: !card.isTapped };
    this.yCards.set(card.id, updatedCard);
  }

  private addPositiveCounter(card: WhiteboardCard): void {
    const updatedCard = { ...card, counters: [...card.counters, 1] };
    this.yCards.set(card.id, updatedCard);
  }

  private addNegativeCounter(card: WhiteboardCard): void {
    const updatedCard = { ...card, counters: [...card.counters, -1] };
    this.yCards.set(card.id, updatedCard);
  }

  private removeCard(cardId: string): void {
    this.yCards.delete(cardId);
  }

  private createCopy(card: WhiteboardCard): void {
    const now = Date.now();

    // Reset multiplier if copying a different card OR if enough time passed
    if (this.lastCopiedCardId !== card.id ||
        now - this.lastCopyTime > this.COPY_RESET_DELAY) {
      this.copyOffsetMultiplier = 0;
    }

    this.copyOffsetMultiplier++;
    this.lastCopiedCardId = card.id;
    this.lastCopyTime = now;

    const offset = 20 * this.copyOffsetMultiplier;

    const newCard: WhiteboardCard = {
      ...card,
      id: `card-${Math.random().toString(36).substring(2, 11)}`,
      ownerId: this.localPlayerId,
      x: card.x + offset,
      y: card.y + offset,
      counters: [...card.counters],
    };
    this.yCards.set(newCard.id, newCard);
  }

  private flipCard(card: WhiteboardCard): void {
    const updatedCard = { ...card, isFlipped: !card.isFlipped };
    this.yCards.set(card.id, updatedCard);
  }

  private untapAllCards(): void {
    this.yCards.forEach((card, cardId) => {
      if (card.ownerId === this.localPlayerId && card.isTapped) {
        const updatedCard = { ...card, isTapped: false };
        this.yCards.set(cardId, updatedCard);
      }
    });
  }

  public destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDownBound);
  }
}