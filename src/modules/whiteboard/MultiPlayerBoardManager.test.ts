import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MultiPlayerBoardManager } from './MultiPlayerBoardManager';
import * as Y from 'yjs';
import { CardPreview } from '../cardPreview';
import {YDOC_CARDS_ON_BOARD} from "../../constants";

// Mock dependencies
vi.mock('../cardPreview', () => ({
  CardPreview: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
    hide: vi.fn(),
    updatePosition: vi.fn(),
  })),
}));

vi.mock('./KeyboardHandler', () => ({
  KeyboardHandler: vi.fn().mockImplementation(() => ({
    setHoveredCard: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock('./TooltipManager', () => ({
  TooltipManager: vi.fn().mockImplementation(() => ({
    setup: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
  })),
}));

vi.mock('./ZoomController', () => ({
  ZoomController: vi.fn().mockImplementation(() => ({
    setupControls: vi.fn(),
    onZoomChange: vi.fn(),
    applyZoomToCard: vi.fn(),
    getZoomLevel: vi.fn(() => 1),
    destroy: vi.fn(),
  })),
}));

vi.mock('react', () => ({
  default: {
    createElement: vi.fn((type, props) => ({ type, props })),
  },
  createElement: vi.fn((type, props) => ({ type, props })),
}));

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
}));

vi.mock('../../components', () => ({
  CardCounter: vi.fn(),
}));

describe('MultiPlayerBoardManager - Container Management', () => {
  let manager: MultiPlayerBoardManager;
  let container: HTMLElement;
  let yDoc: Y.Doc;
  let cardPreview: CardPreview;
  const localPlayerId = 'player-local-123';
  const opponentPlayerId1 = 'player-opponent-456';
  const opponentPlayerId2 = 'player-opponent-789';

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'whiteboard-container';
    document.body.appendChild(container);

    // Create Yjs doc
    yDoc = new Y.Doc();
    cardPreview = new CardPreview();

    // Create manager instance
    manager = new MultiPlayerBoardManager(
      container,
      yDoc,
      localPlayerId,
      '#1a1a1a',
      cardPreview
    );
  });

  afterEach(() => {
    manager.destroy();
    yDoc.destroy();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Constructor - Initial Container Setup', () => {
    it('should setup main container with correct styles', () => {
      expect(container.style.backgroundColor).toBe('#1a1a1a');
      expect(container.style.width).toBe(`${window.innerWidth}px`);
      expect(container.style.height).toBe(`${window.innerHeight}px`);
      expect(container.style.position).toBe('relative');
      expect(container.style.overflow).toBe('hidden');
    });

    it('should create local player container on initialization', () => {
      const localContainer = container.querySelector('[data-player-id="player-local-123"]');
      expect(localContainer).toBeTruthy();
    });

    it('should set local player container with correct classes', () => {
      const localContainer = container.querySelector('[data-player-id="player-local-123"]');
      expect(localContainer?.classList.contains('player-board')).toBe(true);
      expect(localContainer?.classList.contains('player-board-local')).toBe(true);
    });

    it('should set local player container with full opacity', () => {
      const localContainer = container.querySelector('[data-player-id="player-local-123"]') as HTMLElement;
      expect(localContainer.style.opacity).toBe('1');
    });

    it('should set local player container with correct z-index', () => {
      const localContainer = container.querySelector('[data-player-id="player-local-123"]') as HTMLElement;
      expect(localContainer.style.zIndex).toBe('10');
    });

    it('should set local player container with pointer-events auto', () => {
      const localContainer = container.querySelector('[data-player-id="player-local-123"]') as HTMLElement;
      expect(localContainer.style.pointerEvents).toBe('auto');
    });

    it('should center local player container on screen', () => {
      const localContainer = container.querySelector('[data-player-id="player-local-123"]') as HTMLElement;

      // Board dimensions: 16 * 63 = 1008px width, 6.5 * 88 = 572px height
      const expectedLeft = (window.innerWidth - 1008) / 2;
      const expectedTop = window.innerHeight - 572 - 160; // 160 is DOCK_HEIGHT

      expect(localContainer.style.left).toBe(`${expectedLeft}px`);
      expect(localContainer.style.top).toBe(`${expectedTop}px`);
    });
  });

  describe('createPlayerContainer()', () => {
    it('should create opponent container when card is added by opponent', () => {
      // Add a card owned by opponent to trigger container creation
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
      yCards.set('card-1', {
        id: 'card-1',
        cardNumber: 1,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 1,
        ownerId: opponentPlayerId1,
      });

      // Give Yjs time to propagate
      const opponentContainer = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`);
      expect(opponentContainer).toBeTruthy();
    });

    it('should set opponent container with correct classes', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
      yCards.set('card-1', {
        id: 'card-1',
        cardNumber: 1,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 1,
        ownerId: opponentPlayerId1,
      });

      const opponentContainer = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`);
      expect(opponentContainer?.classList.contains('player-board')).toBe(true);
      expect(opponentContainer?.classList.contains('player-board-opponent')).toBe(true);
    });

    it('should set opponent container with low opacity by default', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
      yCards.set('card-1', {
        id: 'card-1',
        cardNumber: 1,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 1,
        ownerId: opponentPlayerId1,
      });

      const opponentContainer = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`) as HTMLElement;
      expect(opponentContainer.style.opacity).toBe('0.25');
    });

    it('should set opponent container with overlay z-index (15)', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
      yCards.set('card-1', {
        id: 'card-1',
        cardNumber: 1,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 1,
        ownerId: opponentPlayerId1,
      });

      const opponentContainer = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`) as HTMLElement;
      expect(opponentContainer.style.zIndex).toBe('15');
    });

    it('should set opponent container with pointer-events none', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
      yCards.set('card-1', {
        id: 'card-1',
        cardNumber: 1,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 1,
        ownerId: opponentPlayerId1,
      });

      const opponentContainer = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`) as HTMLElement;
      expect(opponentContainer.style.pointerEvents).toBe('none');
    });

    it('should not create duplicate containers for same player', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);

      // Add two cards from same opponent
      yCards.set('card-1', {
        id: 'card-1',
        cardNumber: 1,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 1,
        ownerId: opponentPlayerId1,
      });

      yCards.set('card-2', {
        id: 'card-2',
        cardNumber: 2,
        x: 200,
        y: 200,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 2,
        ownerId: opponentPlayerId1,
      });

      const containers = container.querySelectorAll(`[data-player-id="${opponentPlayerId1}"]`);
      expect(containers.length).toBe(1);
    });

    it('should create separate containers for different opponents', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);

      yCards.set('card-1', {
        id: 'card-1',
        cardNumber: 1,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 1,
        ownerId: opponentPlayerId1,
      });

      yCards.set('card-2', {
        id: 'card-2',
        cardNumber: 2,
        x: 200,
        y: 200,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 2,
        ownerId: opponentPlayerId2,
      });

      const opponent1Container = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`);
      const opponent2Container = container.querySelector(`[data-player-id="${opponentPlayerId2}"]`);

      expect(opponent1Container).toBeTruthy();
      expect(opponent2Container).toBeTruthy();
      expect(opponent1Container).not.toBe(opponent2Container);
    });

    it('should position all containers at same screen location (overlay)', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);

      yCards.set('card-1', {
        id: 'card-1',
        cardNumber: 1,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 1,
        ownerId: opponentPlayerId1,
      });

      const localContainer = container.querySelector(`[data-player-id="${localPlayerId}"]`) as HTMLElement;
      const opponentContainer = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`) as HTMLElement;

      expect(localContainer.style.left).toBe(opponentContainer.style.left);
      expect(localContainer.style.top).toBe(opponentContainer.style.top);
    });
  });

  describe('Opponent Opacity Management', () => {
    beforeEach(() => {
      // Setup opponent containers
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
      yCards.set('card-1', {
        id: 'card-1',
        cardNumber: 1,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 1,
        ownerId: opponentPlayerId1,
      });

      yCards.set('card-2', {
        id: 'card-2',
        cardNumber: 2,
        x: 200,
        y: 200,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 2,
        ownerId: opponentPlayerId2,
      });
    });

    it('should increase opacity when opponent board is hovered', () => {
      // Dispatch hover event
      window.dispatchEvent(new CustomEvent('opponentBoardHover', {
        detail: { playerId: opponentPlayerId1, isHovered: true }
      }));

      const opponentContainer = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`) as HTMLElement;
      expect(opponentContainer.style.opacity).toBe('1');
    });

    it('should decrease opacity when opponent board hover ends', () => {
      // Hover on
      window.dispatchEvent(new CustomEvent('opponentBoardHover', {
        detail: { playerId: opponentPlayerId1, isHovered: true }
      }));

      // Hover off
      window.dispatchEvent(new CustomEvent('opponentBoardHover', {
        detail: { playerId: opponentPlayerId1, isHovered: false }
      }));

      const opponentContainer = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`) as HTMLElement;
      expect(opponentContainer.style.opacity).toBe('0.25');
    });

    it('should pin opponent board when clicked', () => {
      // Pin opponent
      window.dispatchEvent(new CustomEvent('opponentBoardPin', {
        detail: { playerId: opponentPlayerId1 }
      }));

      const opponentContainer = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`) as HTMLElement;
      expect(opponentContainer.style.opacity).toBe('1');
    });

    it('should unpin opponent board when clicked again', () => {
      // Pin
      window.dispatchEvent(new CustomEvent('opponentBoardPin', {
        detail: { playerId: opponentPlayerId1 }
      }));

      // Unpin
      window.dispatchEvent(new CustomEvent('opponentBoardPin', {
        detail: { playerId: opponentPlayerId1 }
      }));

      const opponentContainer = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`) as HTMLElement;
      expect(opponentContainer.style.opacity).toBe('0.25');
    });

    it('should show only hovered opponent at full opacity when hovering', () => {
      window.dispatchEvent(new CustomEvent('opponentBoardHover', {
        detail: { playerId: opponentPlayerId1, isHovered: true }
      }));

      const opponent1Container = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`) as HTMLElement;
      const opponent2Container = container.querySelector(`[data-player-id="${opponentPlayerId2}"]`) as HTMLElement;

      expect(opponent1Container.style.opacity).toBe('1');
      expect(opponent2Container.style.opacity).toBe('0.25');
    });

    it('should prioritize hover over pin', () => {
      // Pin opponent 1
      window.dispatchEvent(new CustomEvent('opponentBoardPin', {
        detail: { playerId: opponentPlayerId1 }
      }));

      // Hover opponent 2
      window.dispatchEvent(new CustomEvent('opponentBoardHover', {
        detail: { playerId: opponentPlayerId2, isHovered: true }
      }));

      const opponent1Container = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`) as HTMLElement;
      const opponent2Container = container.querySelector(`[data-player-id="${opponentPlayerId2}"]`) as HTMLElement;

      // Hovered opponent should be opaque, pinned should be dimmed
      expect(opponent2Container.style.opacity).toBe('1');
      expect(opponent1Container.style.opacity).toBe('0.25');
    });

    it('should show single opponent at full opacity by default', () => {
      // First, clear the second opponent
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
      yCards.delete('card-2');

      // Notify manager about single opponent
      window.dispatchEvent(new CustomEvent('opponentCountChanged', {
        detail: { opponentCount: 1 }
      }));

      const opponent1Container = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`) as HTMLElement;
      expect(opponent1Container.style.opacity).toBe('1');
    });

    it('should keep local player at full opacity always', () => {
      const localContainer = container.querySelector(`[data-player-id="${localPlayerId}"]`) as HTMLElement;

      // Initial
      expect(localContainer.style.opacity).toBe('1');

      // After hover
      window.dispatchEvent(new CustomEvent('opponentBoardHover', {
        detail: { playerId: opponentPlayerId1, isHovered: true }
      }));
      expect(localContainer.style.opacity).toBe('1');

      // After pin
      window.dispatchEvent(new CustomEvent('opponentBoardPin', {
        detail: { playerId: opponentPlayerId1 }
      }));
      expect(localContainer.style.opacity).toBe('1');
    });
  });

  describe('Window Resize - Container Recentering', () => {
    it('should recenter all containers on window resize', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
      yCards.set('card-1', {
        id: 'card-1',
        cardNumber: 1,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 1,
        ownerId: opponentPlayerId1,
      });

      // Simulate window resize
      window.dispatchEvent(new Event('resize'));

      const expectedLeft = (window.innerWidth - 1008) / 2;
      const expectedTop = window.innerHeight - 572 - 160;

      const localContainer = container.querySelector(`[data-player-id="${localPlayerId}"]`) as HTMLElement;
      const opponentContainer = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`) as HTMLElement;

      expect(localContainer.style.left).toBe(`${expectedLeft}px`);
      expect(localContainer.style.top).toBe(`${expectedTop}px`);
      expect(opponentContainer.style.left).toBe(`${expectedLeft}px`);
      expect(opponentContainer.style.top).toBe(`${expectedTop}px`);
    });

    it('should update main container dimensions on resize', () => {
      // Change window size (simulate)
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });

      window.dispatchEvent(new Event('resize'));

      expect(container.style.width).toBe('1920px');
      expect(container.style.height).toBe('1080px');
    });
  });

  describe('Container Cleanup - destroy()', () => {
    it('should remove all player containers on destroy', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
      yCards.set('card-1', {
        id: 'card-1',
        cardNumber: 1,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 1,
        ownerId: opponentPlayerId1,
      });

      // Verify containers exist
      expect(container.querySelector(`[data-player-id="${localPlayerId}"]`)).toBeTruthy();
      expect(container.querySelector(`[data-player-id="${opponentPlayerId1}"]`)).toBeTruthy();

      manager.destroy();

      // Verify containers removed
      expect(container.querySelector(`[data-player-id="${localPlayerId}"]`)).toBeNull();
      expect(container.querySelector(`[data-player-id="${opponentPlayerId1}"]`)).toBeNull();
    });

    it('should remove all containers including multiple opponents', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
      yCards.set('card-1', {
        id: 'card-1',
        cardNumber: 1,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 1,
        ownerId: opponentPlayerId1,
      });

      yCards.set('card-2', {
        id: 'card-2',
        cardNumber: 2,
        x: 200,
        y: 200,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 2,
        ownerId: opponentPlayerId2,
      });

      manager.destroy();

      expect(container.querySelectorAll('.player-board').length).toBe(0);
    });
  });

  describe('Container Dimensions and Positioning Constants', () => {
    it('should use correct board width (16 cards * 63px = 1008px)', () => {
      const localContainer = container.querySelector(`[data-player-id="${localPlayerId}"]`) as HTMLElement;
      expect(localContainer.style.width).toBe('1008px');
    });

    it('should use correct board height (6.5 cards * 88px = 572px)', () => {
      const localContainer = container.querySelector(`[data-player-id="${localPlayerId}"]`) as HTMLElement;
      expect(localContainer.style.height).toBe('572px');
    });

    it('should set absolute positioning on player containers', () => {
      const localContainer = container.querySelector(`[data-player-id="${localPlayerId}"]`) as HTMLElement;
      expect(localContainer.style.position).toBe('absolute');
    });

    it('should set smooth opacity transition on containers', () => {
      const localContainer = container.querySelector(`[data-player-id="${localPlayerId}"]`) as HTMLElement;
      expect(localContainer.style.transition).toBe('opacity 0.3s ease');
    });
  });

  describe('Container Data Attributes', () => {
    it('should set player ID as data attribute on local container', () => {
      const localContainer = container.querySelector(`[data-player-id="${localPlayerId}"]`) as HTMLElement;
      expect(localContainer.dataset.playerId).toBe(localPlayerId);
    });

    it('should set player ID as data attribute on opponent containers', () => {
      const yCards = yDoc.getMap(YDOC_CARDS_ON_BOARD);
      yCards.set('card-1', {
        id: 'card-1',
        cardNumber: 1,
        x: 100,
        y: 100,
        rotation: 0,
        isTapped: false,
        isFlipped: false,
        counters: [],
        zIndex: 1,
        ownerId: opponentPlayerId1,
      });

      const opponentContainer = container.querySelector(`[data-player-id="${opponentPlayerId1}"]`) as HTMLElement;
      expect(opponentContainer.dataset.playerId).toBe(opponentPlayerId1);
    });
  });
});