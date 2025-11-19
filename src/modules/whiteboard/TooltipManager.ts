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
  private clickedCardId: string | null = null;
  private onHotkeyClick: ((hotkey: HotkeyDefinition, cardId: string) => void) | null = null;
  private hoverTimeout: number | null = null;
  private hideTimeout: number | null = null;
  private isTooltipHovered: boolean = false;
  private latestMouseX = 0;
  private latestMouseY = 0;

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

    // Track tooltip hover to prevent premature hiding
    this.tooltipContainer.addEventListener('mouseenter', () => {
      this.isTooltipHovered = true;
      if (this.hideTimeout !== null) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    });
    this.tooltipContainer.addEventListener('mouseleave', () => {
      this.isTooltipHovered = false;
      this.scheduleHide();
    });

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
   * @param context
   * @param clickX - X position of the click
   * @param clickY - Y position of the click
   * @param pinned
   * @param title - Optional title to display at the top of the tooltip
   */
  show(cardId: string, context: HotkeyContext, clickX: number, clickY: number, pinned: boolean = true, title?: string): void {
    this.clearTimeouts();
    if (!this.tooltipRoot) return;

    if (this.clickedCardId === cardId && pinned) {
      this.hide();
      return;
    }

    this.clickedCardId = cardId;

    this.tooltipRoot.render(
      React.createElement(HotkeyTooltip, {
        context: context,
        mouseX: clickX,
        mouseY: clickY,
        title: title,
        onHotkeyClick: (hotkey: HotkeyDefinition) => {
          if (this.onHotkeyClick && this.clickedCardId) {
            this.onHotkeyClick(hotkey, this.clickedCardId);
          }
          this.hide();
        },
      })
    );
  }

  /**
   * Show tooltip on hover (delayed)
   */
  showOnHover(cardId: string, context: HotkeyContext, title?: string): void {
    this.clearTimeouts();

    this.hoverTimeout = window.setTimeout(() => {
      // Use the latest mouse coordinates, not the ones captured at mouseenter
      this.show(cardId, context, this.latestMouseX, this.latestMouseY, false, title);
    }, 500);
  }

  /**
   * Schedule tooltip hide (delayed)
   */
  private scheduleHide(): void {
    this.clearHideTimeout();
    this.hideTimeout = window.setTimeout(() => {
      if (!this.isTooltipHovered) {
        this.hide();
      }
    }, 200);
  }

  private clearTimeouts(): void {
    this.clearHoverTimeout();
    this.clearHideTimeout();  // Cancel tooltip hide when moving cursor to new card
  }

  private clearHoverTimeout(): void {
    if (this.hoverTimeout !== null) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }

  private clearHideTimeout(): void {
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Hide tooltip immediately (cancel hover, unpin)
   */
  hideOnLeave(): void {
    this.clearHoverTimeout();
    if (!this.isTooltipHovered) {
      this.scheduleHide();
    }
  }

  /**
   * Hide tooltip
   */
  hide(): void {
    this.clearTimeouts();
    if (!this.tooltipRoot) return;
    this.clickedCardId = null;
    this.tooltipRoot.render(null);
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

  setMouseLocation(x: number, y:number) {
    this.latestMouseX = x;
    this.latestMouseY = y;
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
    document.removeEventListener('click', this.handleClickOutside.bind(this), true);
  }
}