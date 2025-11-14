import {BOARD_WIDTH, BOARD_HEIGHT, getBoardLeftOffset, getBoardTopOffset} from './BoardContainerManager';


/**
 * Manages canvas-based rendering for the board including center lines,
 * background images, playmats, and play area indicators
 */
export class BoardCanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private showCenterLines: boolean = true;

  constructor(container: HTMLElement) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.setupCanvas();

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;

    this.render();
  }

  /**
   * Setup the canvas element with initial styling and dimensions
   */
  private setupCanvas(): void {
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1'; // Below cards but above background
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.container.appendChild(this.canvas);
  }

  /**
   * Main render method - clears and redraws all canvas elements
   */
  private render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all layers in order
    if (this.showCenterLines) {
      this.drawCenterLines();
    }
  }

  /**
   * Draw horizontal and vertical center lines on the board
   */
  private drawCenterLines(): void {
    // Get board center position
    const boardLeft = getBoardLeftOffset();
    const boardTop = getBoardTopOffset();
    const boardCenterX = boardLeft + BOARD_WIDTH / 2;
    const boardCenterY = boardTop + BOARD_HEIGHT / 2;

    // Set line style
    this.ctx.strokeStyle = 'white';
    this.ctx.globalAlpha = .3;
    this.ctx.lineWidth = 1;

    // Draw vertical center line
    this.ctx.beginPath();
    this.ctx.moveTo(boardCenterX, boardTop);
    this.ctx.lineTo(boardCenterX, boardTop + BOARD_HEIGHT);
    this.ctx.stroke();

    // Draw horizontal center line
    this.ctx.beginPath();
    this.ctx.moveTo(boardLeft, boardCenterY);
    this.ctx.lineTo(boardLeft + BOARD_WIDTH, boardCenterY);
    this.ctx.stroke();
  }

  /**
   * Handle window resize - resize canvas and redraw
   */
  public onResize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.render();
  }

  /**
   * Toggle center lines visibility
   */
  public toggleCenterLines(show: boolean): void {
    this.showCenterLines = show;
    this.render();
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.canvas.remove();
  }
}