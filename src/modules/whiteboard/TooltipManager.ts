import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { HotkeyTooltip } from '../../components';
import { HotkeyContext, HotkeyDefinition } from '../../data/hotkeys';

/**
 * Manages hotkey tooltip display for the battlefield
 */
export class TooltipManager {
  private tooltipRoot: Root | null = null;
  private tooltipContainer: HTMLElement | null = null;
  private currentMouseX: number = 0;
  private currentMouseY: number = 0;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private clickedCardId: string | null = null;
  private clickPosition: { x: number; y: number } | null = null;
  private onHotkeyClick: ((hotkey: HotkeyDefinition, cardId: string) => void) | null = null;

  /**
   * Initialize tooltip container and event listeners
   */
  setup(onHotkeyClick?: (hotkey: HotkeyDefinition, cardId: string) => void): void {
    // Create tooltip container
    this.tooltipContainer = document.createElement('div');
    this.tooltipContainer.className = 'hotkey-tooltip-container-battlefield';
    document.body.appendChild(this.tooltipContainer);
    this.tooltipRoot = createRoot(this.tooltipContainer);
    this.onHotkeyClick = onHotkeyClick || null;

    // Setup mouse move listener to track cursor position
    this.mouseMoveHandler = (e: MouseEvent) => {
      this.currentMouseX = e.clientX;
      this.currentMouseY = e.clientY;
    };
    document.addEventListener('mousemove', this.mouseMoveHandler);

    // Setup click outside handler
    document.addEventListener('click', this.handleClickOutside.bind(this), true);
  }

  /**
   * Handle clicks outside the tooltip to close it
   */
  private handleClickOutside(e: MouseEvent): void {
    if (!this.clickedCardId || !this.tooltipContainer) return;

    const target = e.target as HTMLElement;
    // Check if click is outside the tooltip container
    if (!this.tooltipContainer.contains(target)) {
      // Check if click is on the card that opened the menu
      // If so, don't handle it here - let the card's click handler handle it (for toggle behavior)
      const cardElement = target.closest('[data-card-id]');
      if (cardElement && cardElement.getAttribute('data-card-id') === this.clickedCardId) {
        // Don't handle clicks on the card itself - card click handler will handle toggle
        return;
      }
      // Hide menu if clicking anywhere else (outside both tooltip and card)
      this.hide();
    }
  }

  /**
   * Show tooltip for a clicked card
   * @param cardId - The ID of the card that was clicked
   * @param clickX - X position of the click
   * @param clickY - Y position of the click
   */
  show(cardId: string, clickX: number, clickY: number): void {
    if (!this.tooltipRoot) return;

    // Toggle: if same card is clicked, hide it
    if (this.clickedCardId === cardId) {
      this.hide();
      return;
    }

    this.clickedCardId = cardId;
    this.clickPosition = { x: clickX, y: clickY };
    this.currentMouseX = clickX;
    this.currentMouseY = clickY;

    this.tooltipRoot.render(
      React.createElement(HotkeyTooltip, {
        context: 'battlefield' as HotkeyContext,
        mouseX: clickX,
        mouseY: clickY,
        onHotkeyClick: (hotkey: HotkeyDefinition) => {
          if (this.onHotkeyClick && this.clickedCardId) {
            this.onHotkeyClick(hotkey, this.clickedCardId);
          }
          // Hide menu after clicking an item
          this.hide();
        },
      })
    );
  }

  /**
   * Hide tooltip
   */
  hide(): void {
    if (!this.tooltipRoot) return;
    this.clickedCardId = null;
    this.clickPosition = null;
    this.tooltipRoot.render(null);
  }

  /**
   * Check if tooltip is currently showing for a card
   */
  isShowingForCard(cardId: string): boolean {
    return this.clickedCardId === cardId;
  }

  /**
   * Update tooltip display based on hover state (kept for backward compatibility, but deprecated)
   * @param isCardHovered - Whether a battlefield card is currently hovered
   * @deprecated Use show() and hide() instead
   */
  update(isCardHovered: boolean): void {
    // This method is kept for backward compatibility but does nothing
    // The new click-based system uses show() and hide() instead
  }

  /**
   * Clean up tooltip resources
   */
  destroy(): void {
    if (this.tooltipRoot) {
      this.tooltipRoot.unmount();
      this.tooltipRoot = null;
    }
    if (this.tooltipContainer) {
      this.tooltipContainer.remove();
      this.tooltipContainer = null;
    }
    if (this.mouseMoveHandler) {
      document.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
    document.removeEventListener('click', this.handleClickOutside.bind(this), true);
  }
}