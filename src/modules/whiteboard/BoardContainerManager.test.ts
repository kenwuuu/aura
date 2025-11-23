import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BoardContainerManager, BOARD_WIDTH, BOARD_HEIGHT, DOCK_HEIGHT } from './BoardContainerManager';

describe.skip('BoardContainerManager', () => {
  let manager: BoardContainerManager;
  let container: HTMLElement;
  const localPlayerId = 'player-local-123';
  const opponentPlayerId1 = 'player-opponent-456';
  const opponentPlayerId2 = 'player-opponent-789';

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Create manager instance
    manager = new BoardContainerManager(
      container,
      localPlayerId,
      '#1a1a1a',
      true // useOverlay
    );
  });

  afterEach(() => {
    manager.destroy();
    document.body.innerHTML = '';
  });

  describe('Constructor and Main Container Setup', () => {
    it('should setup main container with correct background color', () => {
      expect(container.style.backgroundColor).toBe('#1a1a1a');
    });

    it('should setup main container with correct dimensions', () => {
      expect(container.style.width).toBe(`${window.innerWidth}px`);
      expect(container.style.height).toBe(`${window.innerHeight}px`);
    });

    it('should setup main container with relative positioning', () => {
      expect(container.style.position).toBe('relative');
    });

    it('should setup main container with hidden overflow', () => {
      expect(container.style.overflow).toBe('hidden');
    });
  });

  describe('createBoardContainer()', () => {
    describe('Local Player Container', () => {
      it('should create container for local player', () => {
        const localContainer = manager.createBoardContainer(localPlayerId, true);
        expect(localContainer).toBeTruthy();
        expect(localContainer.parentElement).toBe(container);
      });

      it('should set correct classes for local player', () => {
        const localContainer = manager.createBoardContainer(localPlayerId, true);
        expect(localContainer.classList.contains('player-board')).toBe(true);
        expect(localContainer.classList.contains('player-board-local')).toBe(true);
      });

      it('should set full opacity for local player', () => {
        const localContainer = manager.createBoardContainer(localPlayerId, true);
        expect(localContainer.style.opacity).toBe('1');
      });

      it('should set correct z-index for local player', () => {
        const localContainer = manager.createBoardContainer(localPlayerId, true);
        expect(localContainer.style.zIndex).toBe('10');
      });

      it('should enable pointer events for local player', () => {
        const localContainer = manager.createBoardContainer(localPlayerId, true);
        expect(localContainer.style.pointerEvents).toBe('auto');
      });

      it('should set player ID as data attribute', () => {
        const localContainer = manager.createBoardContainer(localPlayerId, true);
        expect(localContainer.dataset.playerId).toBe(localPlayerId);
      });

      it('should center container on screen', () => {
        const localContainer = manager.createBoardContainer(localPlayerId, true);

        const expectedLeft = (window.innerWidth - BOARD_WIDTH) / 2;
        const expectedTop = window.innerHeight - BOARD_HEIGHT - DOCK_HEIGHT;

        expect(localContainer.style.left).toBe(`${expectedLeft}px`);
        expect(localContainer.style.top).toBe(`${expectedTop}px`);
      });

      it('should use correct board dimensions', () => {
        const localContainer = manager.createBoardContainer(localPlayerId, true);
        expect(localContainer.style.width).toBe(`${BOARD_WIDTH}px`);
        expect(localContainer.style.height).toBe(`${BOARD_HEIGHT}px`);
      });

      it('should set absolute positioning', () => {
        const localContainer = manager.createBoardContainer(localPlayerId, true);
        expect(localContainer.style.position).toBe('absolute');
      });

      it('should set smooth opacity transition', () => {
        const localContainer = manager.createBoardContainer(localPlayerId, true);
        expect(localContainer.style.transition).toBe('opacity 0.3s ease');
      });
    });

    describe('Opponent Player Container', () => {
      it('should create container for opponent player', () => {
        const opponentContainer = manager.createBoardContainer(opponentPlayerId1, false);
        expect(opponentContainer).toBeTruthy();
        expect(opponentContainer.parentElement).toBe(container);
      });

      it('should set correct classes for opponent', () => {
        const opponentContainer = manager.createBoardContainer(opponentPlayerId1, false);
        expect(opponentContainer.classList.contains('player-board')).toBe(true);
        expect(opponentContainer.classList.contains('player-board-opponent')).toBe(true);
      });

      it('should set low opacity for opponent by default', () => {
        const opponentContainer = manager.createBoardContainer(opponentPlayerId1, false);
        expect(opponentContainer.style.opacity).toBe('0.25');
      });

      it('should set overlay z-index for opponent (15)', () => {
        const opponentContainer = manager.createBoardContainer(opponentPlayerId1, false);
        expect(opponentContainer.style.zIndex).toBe('15');
      });

      it('should set underlay z-index when useOverlay is false', () => {
        const underlayManager = new BoardContainerManager(
          container,
          localPlayerId,
          '#1a1a1a',
          false // useOverlay = false
        );

        const opponentContainer = underlayManager.createBoardContainer(opponentPlayerId1, false);
        expect(opponentContainer.style.zIndex).toBe('5');

        underlayManager.destroy();
      });

      it('should disable pointer events for opponent container', () => {
        const opponentContainer = manager.createBoardContainer(opponentPlayerId1, false);
        expect(opponentContainer.style.pointerEvents).toBe('none');
      });

      it('should set player ID as data attribute', () => {
        const opponentContainer = manager.createBoardContainer(opponentPlayerId1, false);
        expect(opponentContainer.dataset.playerId).toBe(opponentPlayerId1);
      });
    });

    describe('Container Reuse and Multiple Players', () => {
      it('should not create duplicate containers for same player', () => {
        const container1 = manager.createBoardContainer(opponentPlayerId1, false);
        const container2 = manager.createBoardContainer(opponentPlayerId1, false);

        expect(container1).toBe(container2);

        const allContainers = document.querySelectorAll(`[data-player-id="${opponentPlayerId1}"]`);
        expect(allContainers.length).toBe(1);
      });

      it('should create separate containers for different players', () => {
        const local = manager.createBoardContainer(localPlayerId, true);
        const opponent1 = manager.createBoardContainer(opponentPlayerId1, false);
        const opponent2 = manager.createBoardContainer(opponentPlayerId2, false);

        expect(local).not.toBe(opponent1);
        expect(local).not.toBe(opponent2);
        expect(opponent1).not.toBe(opponent2);
      });

      it('should position all containers at same screen location (overlay)', () => {
        const local = manager.createBoardContainer(localPlayerId, true);
        const opponent = manager.createBoardContainer(opponentPlayerId1, false);

        expect(local.style.left).toBe(opponent.style.left);
        expect(local.style.top).toBe(opponent.style.top);
      });
    });
  });

  describe('getContainer()', () => {
    it('should return container for existing player', () => {
      manager.createBoardContainer(localPlayerId, true);
      const retrieved = manager.getContainer(localPlayerId);
      expect(retrieved).toBeTruthy();
    });

    it('should return undefined for non-existent player', () => {
      const retrieved = manager.getContainer('non-existent-player');
      expect(retrieved).toBeUndefined();
    });

    it('should return same instance as created', () => {
      const created = manager.createBoardContainer(localPlayerId, true);
      const retrieved = manager.getContainer(localPlayerId);
      expect(retrieved).toBe(created);
    });
  });

  describe('ensureContainer()', () => {
    it('should create container if it does not exist', () => {
      const ensured = manager.ensureContainer(localPlayerId);
      expect(ensured).toBeTruthy();
      expect(ensured.dataset.playerId).toBe(localPlayerId);
    });

    it('should return existing container if it already exists', () => {
      const created = manager.createBoardContainer(localPlayerId, true);
      const ensured = manager.ensureContainer(localPlayerId);
      expect(ensured).toBe(created);
    });

    it('should create local container when player is local', () => {
      const ensured = manager.ensureContainer(localPlayerId);
      expect(ensured.classList.contains('player-board-local')).toBe(true);
      expect(ensured.style.opacity).toBe('1');
    });

    it('should create opponent container when player is not local', () => {
      const ensured = manager.ensureContainer(opponentPlayerId1);
      expect(ensured.classList.contains('player-board-opponent')).toBe(true);
      expect(ensured.style.opacity).toBe('0.25');
    });
  });

  describe('getAllContainers()', () => {
    it('should return empty map initially', () => {
      const containers = manager.getAllContainers();
      expect(containers.size).toBe(0);
    });

    it('should return all created containers', () => {
      manager.createBoardContainer(localPlayerId, true);
      manager.createBoardContainer(opponentPlayerId1, false);
      manager.createBoardContainer(opponentPlayerId2, false);

      const containers = manager.getAllContainers();
      expect(containers.size).toBe(3);
      expect(containers.has(localPlayerId)).toBe(true);
      expect(containers.has(opponentPlayerId1)).toBe(true);
      expect(containers.has(opponentPlayerId2)).toBe(true);
    });
  });

  describe('getLocalPlayerId()', () => {
    it('should return the local player ID', () => {
      expect(manager.getLocalPlayerId()).toBe(localPlayerId);
    });
  });

  describe('recenterAll()', () => {
    it('should recenter all containers on window dimensions', () => {
      manager.createBoardContainer(localPlayerId, true);
      manager.createBoardContainer(opponentPlayerId1, false);

      // Simulate window resize
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true, configurable: true });

      manager.recenterAll();

      const expectedLeft = (1920 - BOARD_WIDTH) / 2;
      const expectedTop = 1080 - BOARD_HEIGHT - DOCK_HEIGHT;

      const local = manager.getContainer(localPlayerId)!;
      const opponent = manager.getContainer(opponentPlayerId1)!;

      expect(local.style.left).toBe(`${expectedLeft}px`);
      expect(local.style.top).toBe(`${expectedTop}px`);
      expect(opponent.style.left).toBe(`${expectedLeft}px`);
      expect(opponent.style.top).toBe(`${expectedTop}px`);
    });

    it('should update main container dimensions', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true, configurable: true });

      manager.recenterAll();

      expect(container.style.width).toBe('1920px');
      expect(container.style.height).toBe('1080px');
    });
  });

  describe('destroy()', () => {
    it('should remove all containers from DOM', () => {
      manager.createBoardContainer(localPlayerId, true);
      manager.createBoardContainer(opponentPlayerId1, false);
      manager.createBoardContainer(opponentPlayerId2, false);

      expect(document.querySelectorAll('.player-board').length).toBe(3);

      manager.destroy();

      expect(document.querySelectorAll('.player-board').length).toBe(0);
    });

    it('should clear internal container map', () => {
      manager.createBoardContainer(localPlayerId, true);
      manager.createBoardContainer(opponentPlayerId1, false);

      manager.destroy();

      expect(manager.getAllContainers().size).toBe(0);
    });

    it('should handle multiple destroy calls gracefully', () => {
      manager.createBoardContainer(localPlayerId, true);

      expect(() => {
        manager.destroy();
        manager.destroy();
        manager.destroy();
      }).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete lifecycle', () => {
      // Create containers
      const local = manager.createBoardContainer(localPlayerId, true);
      const opponent = manager.createBoardContainer(opponentPlayerId1, false);

      // Verify creation
      expect(manager.getAllContainers().size).toBe(2);
      expect(document.querySelectorAll('.player-board').length).toBe(2);

      // Recenter
      manager.recenterAll();
      expect(local.parentElement).toBe(container);
      expect(opponent.parentElement).toBe(container);

      // Destroy
      manager.destroy();
      expect(manager.getAllContainers().size).toBe(0);
      expect(document.querySelectorAll('.player-board').length).toBe(0);
    });
  });
});