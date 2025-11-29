import { Card } from '../deck';
import { DEFAULT_CARD_BACK } from '../../constants';

export class CardPreview {
  // Constants
  private static readonly BASE_WIDTH = 500;
  private static readonly BASE_HEIGHT = 698; // Maintain Magic card aspect ratio (~1.4:1)
  private static DISPLAY_WIDTH = 500; // Maintain Magic card aspect ratio (~1.4:1)
  private static DISPLAY_HEIGHT = 698; // Maintain Magic card aspect ratio (~1.4:1)
  private static readonly BORDER_RADIUS = '12px';
  private static readonly Z_INDEX = '10000';
  private static readonly BOX_SHADOW = '0 8px 16px rgba(0, 0, 0, 0.6)';
  private static readonly BORDER = '2px solid #4a4a4a';
  private static readonly CLASS_NAME = 'card-preview-popup';
  private static readonly OBJECT_FIT = 'cover';
  private static readonly POSITION_TYPE = 'fixed';
  private static readonly POINTER_EVENTS = 'none';
  private static readonly OVERFLOW = 'hidden';
  private static readonly TOP_OFFSET = '20px';
  private static readonly SIDE_OFFSET = '20px';
  private static readonly DISPLAY_VISIBLE = 'block';
  private static readonly DISPLAY_HIDDEN = 'none';

  private previewElement: HTMLElement | null = null;
  private currentCard: Card | null = null;
  private zoomLevel: number = 1;
  private zoomControls?: HTMLElement;
  private currentMouseX: number = 0;
  private currentMouseY: number = 0;

  constructor() {
    this.zoomLevel = parseFloat(localStorage.getItem('card-preview-zoom') || '1');
    this.createPreviewElement();
    this.setupZoomControls();
  }

  private createPreviewElement(): void {
    this.previewElement = document.createElement('div');
    this.previewElement.className = CardPreview.CLASS_NAME;
    this.previewElement.style.position = CardPreview.POSITION_TYPE;
    this.previewElement.style.display = CardPreview.DISPLAY_HIDDEN;
    this.previewElement.style.pointerEvents = CardPreview.POINTER_EVENTS;
    this.previewElement.style.zIndex = CardPreview.Z_INDEX;
    this.previewElement.style.borderRadius = CardPreview.BORDER_RADIUS;
    this.previewElement.style.boxShadow = CardPreview.BOX_SHADOW;
    this.previewElement.style.border = CardPreview.BORDER;
    this.previewElement.style.overflow = CardPreview.OVERFLOW;

    // Apply zoom
    this.updatePreviewSize();

    // Initially positioned on right side (will be repositioned based on mouse)
    this.previewElement.style.top = CardPreview.TOP_OFFSET;
    this.previewElement.style.right = CardPreview.SIDE_OFFSET;

    document.body.appendChild(this.previewElement);
  }

  private updatePreviewSize(): void {
    if (!this.previewElement) return;

    CardPreview.DISPLAY_WIDTH = CardPreview.BASE_WIDTH * this.zoomLevel;
    CardPreview.DISPLAY_HEIGHT = CardPreview.BASE_HEIGHT * this.zoomLevel;

    this.previewElement.style.width = `${CardPreview.DISPLAY_WIDTH}px`;
    this.previewElement.style.height = `${CardPreview.DISPLAY_HEIGHT}px`;
  }

  public show(card: Card): void {
    function selectPreviewImage(): string | null {  // Determine which image to show based on flip state
      let imageSrc: string | null;

      if (card.isFlipped) {
        // Card is flipped - show back side
        imageSrc = card.images?.back?.normal || DEFAULT_CARD_BACK;
      } else {
        // Card is face-up - show front side
        imageSrc = card.images?.front?.large || null;
      }

      return imageSrc;
    }

    if (!this.previewElement) return;

    let imageSrc = selectPreviewImage();

    // Don't show preview if no image available
    if (!imageSrc) return;

    this.currentCard = card;

    // Clear previous content
    this.previewElement.innerHTML = '';

    // Add card image
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = card.isFlipped ? 'Card Back' : (card.name || `Card #${card.cardNumber}`);
    img.style.width = this.previewElement.style.width;
    img.style.height = this.previewElement.style.height;
    img.style.objectFit = CardPreview.OBJECT_FIT;
    this.previewElement.appendChild(img);

    // Show the preview
    this.previewElement.style.display = CardPreview.DISPLAY_VISIBLE;
  }

  public updatePosition(mouseEvent: MouseEvent): void {
    this.currentMouseX = mouseEvent.clientX;
    this.currentMouseY = mouseEvent.clientY;
    this.updatePreviewPosition();
  }

  // Move preview to left side of screen if it would be blocking cursor
  private updatePreviewPosition(): void {
    if (!this.previewElement) return;

    const isCursorUnderCard = () => {
      return this.currentMouseX > window.innerWidth - (CardPreview.DISPLAY_WIDTH * 1.1) &&
        this.currentMouseY < (CardPreview.DISPLAY_HEIGHT * 1.1);
    }

    if (isCursorUnderCard.call(this)) {
      // Cursor on right, show preview on left
      this.previewElement.style.left = CardPreview.SIDE_OFFSET;
      this.previewElement.style.right = 'auto';
    } else {
      // Cursor on left, show preview on right
      this.previewElement.style.right = CardPreview.SIDE_OFFSET;
      this.previewElement.style.left = 'auto';
    }
  }

  public hide(): void {
    if (this.previewElement) {
      this.previewElement.style.display = CardPreview.DISPLAY_HIDDEN;
      this.currentCard = null;
    }
  }

  private setupZoomControls(): void {
    const controls = document.createElement('div');
    controls.className = 'zoom-controls card-preview-zoom-controls';
    controls.style.position = 'fixed';
    controls.style.bottom = '200px'; // Swap with hand zoom (was 20px)
    controls.style.left = '20px'; // Left side for card preview zoom
    controls.style.zIndex = '1000';
    controls.style.display = 'flex';
    controls.style.flexDirection = 'column';
    controls.style.gap = '8px';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'zoom-button';
    zoomInBtn.textContent = '+';
    zoomInBtn.title = 'Zoom In Card Preview';
    zoomInBtn.onclick = () => this.adjustZoom(0.1);

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'zoom-button';
    zoomOutBtn.textContent = '−';
    zoomOutBtn.title = 'Zoom Out Card Preview';
    zoomOutBtn.onclick = () => this.adjustZoom(-0.1);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'zoom-button zoom-display';
    resetBtn.textContent = `${this.zoomLevel.toFixed(1)}×`;
    resetBtn.title = 'Reset Card Preview Zoom';
    resetBtn.onclick = () => this.setZoom(1);

    controls.appendChild(zoomInBtn);
    controls.appendChild(resetBtn);
    controls.appendChild(zoomOutBtn);

    document.body.appendChild(controls);
    this.zoomControls = controls;
  }

  private adjustZoom(delta: number): void {
    const newZoom = Math.max(0.5, Math.min(2.5, this.zoomLevel + delta));
    this.setZoom(newZoom);
  }

  private setZoom(zoom: number): void {
    this.zoomLevel = zoom;
    localStorage.setItem('card-preview-zoom', zoom.toString());
    this.updatePreviewSize();

    // Update the display button text
    if (this.zoomControls) {
      const displayBtn = this.zoomControls.querySelector('.zoom-display');
      if (displayBtn) {
        displayBtn.textContent = `${this.zoomLevel.toFixed(1)}×`;
      }
    }
  }

  public destroy(): void {
    if (this.previewElement) {
      this.previewElement.remove();
      this.previewElement = null;
    }
    if (this.zoomControls) {
      this.zoomControls.remove();
      this.zoomControls = undefined;
    }
  }
}