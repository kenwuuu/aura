import {BOARD_WIDTH, BOARD_HEIGHT, getBoardLeftOffset, getBoardTopOffset} from './BoardContainerManager';

// ─── Watermark constants ──────────────────────────────────────────────────────
const WATERMARK_TEXT        = 'aura0.app';
const WATERMARK_SEPARATOR   = '   ·   ';          // gap between repetitions
const WATERMARK_FONT_SIZE   = 16;                  // px
const WATERMARK_FONT        = `${WATERMARK_FONT_SIZE}px -apple-system, sans-serif`;
const WATERMARK_COLOR       = 'white';
const WATERMARK_ALPHA       = 0.18;
const WATERMARK_HALF_LENGTH = 2;                   // repetitions on each side of center

// ─── Center-line constants ────────────────────────────────────────────────────
const CENTER_LINE_COLOR     = 'white';
const CENTER_LINE_ALPHA     = 0.3;
const CENTER_LINE_WIDTH     = 1;

/**
 * Manages canvas-based rendering for the board including center lines,
 * background images, playmats, and play area indicators.
 */
export class BoardCanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private showCenterLines: boolean = true;
  private watermarkHalfLength: number = WATERMARK_HALF_LENGTH;

  constructor(container: HTMLElement) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.setupCanvas();
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context from canvas');
    this.ctx = ctx;
    this.render();
  }

  // ─── Setup ─────────────────────────────────────────────────────────────────

  private setupCanvas(): void {
    this.canvas.style.position    = 'absolute';
    this.canvas.style.top         = '0';
    this.canvas.style.left        = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex      = '1';   // below cards, above background
    this.canvas.width             = window.innerWidth;
    this.canvas.height            = window.innerHeight;
    this.container.appendChild(this.canvas);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.showCenterLines) {
      this.drawVerticalCenterLine();
      this.drawHorizontalWatermark();
    }
  }

  // ─── Center lines ──────────────────────────────────────────────────────────

  private drawVerticalCenterLine(): void {
    const { boardLeft, boardTop } = this.getBoardOrigin();
    const centerX = boardLeft + BOARD_WIDTH / 2;

    this.ctx.save();
    this.ctx.strokeStyle = CENTER_LINE_COLOR;
    this.ctx.globalAlpha = CENTER_LINE_ALPHA;
    this.ctx.lineWidth   = CENTER_LINE_WIDTH;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, boardTop);
    this.ctx.lineTo(centerX, boardTop + BOARD_HEIGHT);
    this.ctx.stroke();
    this.ctx.restore();
  }

  // ─── Watermark ─────────────────────────────────────────────────────────────

  /**
   * Draws a repeating "aura0.app · aura0.app · …" line along the board's
   * horizontal centre, growing outward from the midpoint in both directions.
   * Adjust `watermarkHalfLength` (or call `setWatermarkLength`) to control reach.
   */
  private drawHorizontalWatermark(): void {
    const { boardLeft, boardTop } = this.getBoardOrigin();
    const originX = (boardLeft + BOARD_WIDTH  / 2) + 17;
    const originY = boardTop  + BOARD_HEIGHT / 2;

    this.ctx.save();
    this.ctx.font      = WATERMARK_FONT;
    this.ctx.fillStyle = WATERMARK_COLOR;
    this.ctx.globalAlpha       = WATERMARK_ALPHA;
    this.ctx.textBaseline      = 'middle';
    this.ctx.textAlign         = 'left';

    const unit = this.measureWatermarkUnit();

    // Draw one unit at the centre, then mirror outward on both sides.
    for (let i = -this.watermarkHalfLength; i <= this.watermarkHalfLength; i++) {
      if (i !== 0 ) {
        const x = originX + i * unit - unit / 2;
        this.ctx.fillText(WATERMARK_TEXT, x, originY);
      }
    }

    this.ctx.restore();
  }

  /** Width of one "aura0.app   ·   " repetition unit */
  private measureWatermarkUnit(): number {
    this.ctx.save();
    this.ctx.font = WATERMARK_FONT;
    const width = this.ctx.measureText(WATERMARK_TEXT + WATERMARK_SEPARATOR).width;
    this.ctx.restore();
    return width;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private getBoardOrigin(): { boardLeft: number; boardTop: number } {
    return { boardLeft: getBoardLeftOffset(), boardTop: getBoardTopOffset() };
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  public onResize(): void {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.render();
  }

  public toggleCenterLines(show: boolean): void {
    this.showCenterLines = show;
    this.render();
  }

  /**
   * Adjust how many repetitions spread out from the centre on each side.
   * Higher values reach further toward the board edges.
   */
  public setWatermarkLength(halfLength: number): void {
    this.watermarkHalfLength = halfLength;
    this.render();
  }

  public destroy(): void {
    this.canvas.remove();
  }
}