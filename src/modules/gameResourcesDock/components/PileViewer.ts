/**
 * PileViewer Wrapper
 *
 * Thin wrapper around PileViewerReact to maintain backwards compatibility
 * with existing class-based API while using React components internally.
 */

import * as Y from 'yjs';
import { Card } from '../../deck';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import { PileViewerReact } from './PileViewerReact';

export type PileType = 'deck' | 'exile' | 'discard' | 'hand' | 'scry';

export interface PileViewerCallbacks {
  onPlayToBattlefield?: (card: Card) => void;
  onMoveToHand?: (card: Card) => void;
  onMoveToExile?: (card: Card) => void;
  onMoveToDiscard?: (card: Card) => void;
  onMoveToDeckTop?: (card: Card) => void;
  onMoveToDeckBottom?: (card: Card) => void;
}

export class PileViewer {
  private readonly callbacks: PileViewerCallbacks;
  private readonly yPlayerState?: Y.Map<any>;
  private containerElement: HTMLElement | null = null;
  private root: Root | null = null;
  private isOpen: boolean = false;
  private currentCards: Card[] = [];
  private currentPileType: PileType = 'deck';

  constructor(callbacks: PileViewerCallbacks = {}, yPlayerState?: Y.Map<any>) {
    this.callbacks = callbacks;
    this.yPlayerState = yPlayerState;
  }

  public show(cards: Card[], pileType: PileType): void {
    this.currentCards = cards;
    this.currentPileType = pileType;
    this.isOpen = true;

    // Create container if it doesn't exist
    if (!this.containerElement) {
      this.containerElement = document.createElement('div');
      document.body.appendChild(this.containerElement);
      this.root = createRoot(this.containerElement);
    }

    // Render React component
    this.render();
  }

  public updateCards(cards: Card[]): void {
    this.currentCards = cards;
    if (this.isOpen) {
      this.render();
    }
  }

  public close(): void {
    this.isOpen = false;
    this.render();
  }

  private render(): void {
    if (!this.root) return;

    this.root.render(
      React.createElement(PileViewerReact, {
        isOpen: this.isOpen,
        onClose: () => this.close(),
        cards: this.currentCards,
        pileType: this.currentPileType,
        callbacks: this.callbacks,
        yPlayerState: this.yPlayerState,
      })
    );
  }
}