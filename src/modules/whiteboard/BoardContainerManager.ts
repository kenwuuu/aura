import { CARD_WIDTH, CARD_HEIGHT } from '../../constants';
import { BoardCanvasRenderer } from './BoardCanvasRenderer';

// Board Layout Constants
const BOARD_WIDTH_IN_CARDS = 16;
const BOARD_HEIGHT_IN_CARDS = 6.5;

export const DOCK_HEIGHT = 160; // Height of bottom UI dock
export const BOARD_WIDTH = BOARD_WIDTH_IN_CARDS * CARD_WIDTH;
export const BOARD_HEIGHT = BOARD_HEIGHT_IN_CARDS * CARD_HEIGHT;
export const DEFAULT_OPPONENT_OPACITY = 0.25;
export const FOCUSED_OPACITY = 1.0;

/**
 * Calculate the left offset to center the board horizontally
 * @returns The left pixel offset from the viewport edge
 */
export function getBoardLeftOffset(): number {
  return (window.innerWidth - BOARD_WIDTH) / 2;
}

/**
 * Calculate the top offset to center the board vertically
 * @returns The top pixel offset from the viewport edge
 */
export function getBoardTopOffset(): number {
  return ((window.innerHeight - DOCK_HEIGHT - BOARD_HEIGHT) / 2) - 38;  // 38 is a magic number that helps center directly in the middle of top menu bar and game dock
}

/**
 * Manages player board container lifecycle and positioning
 */
export class BoardContainerManager {
  private mainContainer: HTMLElement;
  private playerContainers: Map<string, HTMLElement> = new Map();
  private localPlayerId: string;
  private backgroundColor: string;
  // Configuration for overlay vs underlay (easy to debug/change)
  private useOverlay: boolean = true; // true = overlay, false = underlay
  private readonly canvasRenderer: BoardCanvasRenderer;

  constructor(
    mainContainer: HTMLElement,
    localPlayerId: string,
    backgroundColor: string,
    useOverlay: boolean = true
  ) {
    this.mainContainer = mainContainer;
    this.localPlayerId = localPlayerId;
    this.backgroundColor = backgroundColor;
    this.useOverlay = useOverlay;

    this.setupMainContainer();
    this.canvasRenderer = new BoardCanvasRenderer(mainContainer);
  }

  /**
   * Setup the main container with initial styling and dimensions
   */
  private setupMainContainer(): void {
    this.mainContainer.style.backgroundColor = this.backgroundColor;
    this.mainContainer.style.width = `${window.innerWidth}px`;
    this.mainContainer.style.height = `${window.innerHeight}px`;
    this.mainContainer.style.position = 'relative';
    this.mainContainer.style.overflow = 'hidden';
  }

  /**
   * Creates a board container for a player
   * All boards are positioned at the same screen location for overlay effect
   *
   * @param playerId - The player's unique ID
   * @param isLocal - Whether this is the local player's board
   * @returns The created or existing container element
   */
  createBoardContainer(playerId: string, isLocal: boolean): HTMLElement {
    // Check if container already exists
    if (this.playerContainers.has(playerId)) {
      return this.playerContainers.get(playerId)!;
    }

    const container = document.createElement('div');
    container.className = isLocal ? 'player-board player-board-local' : 'player-board player-board-opponent';
    container.dataset.playerId = playerId;
    container.style.position = 'absolute';
    container.style.width = `${BOARD_WIDTH}px`;
    container.style.height = `${BOARD_HEIGHT}px`;
    // Opponent containers: pointer-events none on container, but will enable on cards
    // Local container: pointer-events auto for full interaction
    container.style.pointerEvents = isLocal ? 'auto' : 'none';
    container.style.transition = 'opacity 0.3s ease';

    // Calculate centered position (same for all boards)
    const left = getBoardLeftOffset();
    const top = getBoardTopOffset();

    container.style.left = `${left}px`;
    container.style.top = `${top}px`;

    if (isLocal) {
      // Local player: full opacity, normal z-index
      container.style.opacity = FOCUSED_OPACITY.toString();
      container.style.zIndex = '10';
    } else {
      // Opponent: low opacity by default
      container.style.opacity = DEFAULT_OPPONENT_OPACITY.toString();

      // Set z-index based on overlay/underlay preference
      container.style.zIndex = this.useOverlay ? '15' : '5';
    }

    this.mainContainer.appendChild(container);
    this.playerContainers.set(playerId, container);

    console.log(`Created ${isLocal ? 'local' : 'opponent'} player container for ${playerId}`);
    return container;
  }

  /**
   * Get a player's container if it exists
   *
   * @param playerId - The player's unique ID
   * @returns The container element or undefined if not found
   */
  getContainer(playerId: string): HTMLElement | undefined {
    return this.playerContainers.get(playerId);
  }

  /**
   * Ensure a player container exists, creating it if necessary
   *
   * @param playerId - The player's unique ID
   * @returns The existing or newly created container
   */
  ensureContainer(playerId: string): HTMLElement {
    if (!this.playerContainers.has(playerId)) {
      const isLocal = playerId === this.localPlayerId;
      return this.createBoardContainer(playerId, isLocal);
    }
    return this.playerContainers.get(playerId)!;
  }

  /**
   * Recenter all player board containers based on current window dimensions
   */
  recenterAll(): void {
    const left = getBoardLeftOffset();
    const top = getBoardTopOffset();

    this.playerContainers.forEach((container) => {
      container.style.left = `${left}px`;
      container.style.top = `${top}px`;
    });

    // Also update main container dimensions
    this.mainContainer.style.width = `${window.innerWidth}px`;
    this.mainContainer.style.height = `${window.innerHeight}px`;

    // Update canvas renderer
    this.canvasRenderer.onResize();
  }

  /**
   * Get all player containers
   */
  getAllContainers(): Map<string, HTMLElement> {
    return this.playerContainers;
  }

  /**
   * Get the local player's ID
   */
  getLocalPlayerId(): string {
    return this.localPlayerId;
  }

  /**
   * Get the canvas renderer (for drawing center lines, playmats, etc.)
   */
  getCanvasRenderer(): BoardCanvasRenderer {
    return this.canvasRenderer;
  }

  /**
   * Clean up all containers
   */
  destroy(): void {
    this.playerContainers.forEach((container) => container.remove());
    this.playerContainers.clear();
    this.canvasRenderer.destroy();
  }
}