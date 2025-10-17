import { Card } from '../deck/types';

export class CardPreview {
  // Constants
  private static readonly PREVIEW_WIDTH = '500px';
  private static readonly PREVIEW_HEIGHT = '698px'; // Maintain Magic card aspect ratio (~1.4:1)
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
  private static readonly RIGHT_OFFSET = '20px';
  private static readonly DISPLAY_VISIBLE = 'block';
  private static readonly DISPLAY_HIDDEN = 'none';

  private previewElement: HTMLElement | null = null;
  private currentCard: Card | null = null;

  constructor() {
    this.createPreviewElement();
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
    this.previewElement.style.width = CardPreview.PREVIEW_WIDTH;
    this.previewElement.style.height = CardPreview.PREVIEW_HEIGHT;

    // Fixed to top right corner
    this.previewElement.style.top = CardPreview.TOP_OFFSET;
    this.previewElement.style.right = CardPreview.RIGHT_OFFSET;

    document.body.appendChild(this.previewElement);
  }

  public show(card: Card, mouseEvent?: MouseEvent): void {
    if (!this.previewElement) return;
    if (!card.images?.front?.normal) return; // Only show if card has image

    this.currentCard = card;

    // Clear previous content
    this.previewElement.innerHTML = '';

    // Add card image
    const img = document.createElement('img');
    img.src = card.images.front.normal;
    img.alt = card.name || `Card #${card.cardNumber}`;
    img.style.width = CardPreview.PREVIEW_WIDTH;
    img.style.height = CardPreview.PREVIEW_HEIGHT;
    img.style.objectFit = CardPreview.OBJECT_FIT;
    this.previewElement.appendChild(img);

    // Show the preview
    this.previewElement.style.display = CardPreview.DISPLAY_VISIBLE;
  }

  public updatePosition(mouseEvent: MouseEvent): void {
    // No-op: Preview is now fixed to top right corner
    // Method kept for backward compatibility
  }

  public hide(): void {
    if (this.previewElement) {
      this.previewElement.style.display = CardPreview.DISPLAY_HIDDEN;
      this.currentCard = null;
    }
  }

  public destroy(): void {
    if (this.previewElement) {
      this.previewElement.remove();
      this.previewElement = null;
    }
  }
}