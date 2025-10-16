import * as Y from 'yjs';
import { Deck } from './modules/deck';
import { Whiteboard } from './modules/whiteboard';
import { WebRTCProvider } from './modules/webrtc';
import './style.css';

class AuraApp {
  private yDoc: Y.Doc;
  private webrtcProvider: WebRTCProvider;
  private whiteboard: Whiteboard;
  private deck: Deck;

  constructor() {
    this.yDoc = new Y.Doc();

    // Get room name from URL or generate a random one
    const urlParams = new URLSearchParams(window.location.search);
    const roomName = urlParams.get('room') ?? this.generateRoomId();

    // Update URL with room name if not present
    if (!urlParams.get('room')) {
      window.history.replaceState({}, '', `?room=${roomName}`);
    }

    // Initialize WebRTC provider
    this.webrtcProvider = new WebRTCProvider(this.yDoc, {
      roomName,
    });

    // Initialize deck
    this.deck = new Deck({
      initialCardCount: 60,
    });

    // Initialize whiteboard
    const container = document.getElementById('whiteboard');
    if (!container) {
      throw new Error('Whiteboard container not found');
    }

    this.whiteboard = new Whiteboard(container, this.yDoc);

    this.setupUI();
    this.setupConnectionStatus();
  }

  private generateRoomId(): string {
    return `mtg-${Math.random().toString(36).substring(2, 9)}`;
  }

  private setupUI(): void {
    const drawButton = document.getElementById('draw-card');
    const shuffleButton = document.getElementById('shuffle-deck');
    const deckCount = document.getElementById('deck-count');

    if (drawButton) {
      drawButton.addEventListener('click', () => {
        const card = this.deck.drawCard();
        if (card) {
          // Place card in center of whiteboard
          card.x = window.innerWidth / 2 - 31.5;
          card.y = window.innerHeight / 2 - 44;
          this.whiteboard.addCard(card);
          this.updateDeckCount();
        }
      });
    }

    if (shuffleButton) {
      shuffleButton.addEventListener('click', () => {
        this.deck.shuffleDeck();
        console.log('Deck shuffled');
      });
    }

    this.updateDeckCount();
  }

  private updateDeckCount(): void {
    const deckCount = document.getElementById('deck-count');
    if (deckCount) {
      deckCount.textContent = `Cards in deck: ${this.deck.getCardCount()}`;
    }
  }

  private setupConnectionStatus(): void {
    const statusElement = document.getElementById('connection-status');
    const roomElement = document.getElementById('room-name');

    if (roomElement) {
      roomElement.textContent = `Room: ${this.webrtcProvider.getRoomName()}`;
    }

    this.webrtcProvider.onStatusChange((status) => {
      if (statusElement) {
        if (status.isConnected) {
          statusElement.textContent = `Connected (${status.peersCount} peer${status.peersCount !== 1 ? 's' : ''})`;
          statusElement.style.color = '#4ade80';
        } else {
          statusElement.textContent = 'Waiting for peers...';
          statusElement.style.color = '#facc15';
        }
      }
    });
  }

  public destroy(): void {
    this.whiteboard.destroy();
    this.webrtcProvider.destroy();
  }
}

// Initialize the app
const app = new AuraApp();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  app.destroy();
});