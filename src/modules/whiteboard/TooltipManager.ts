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
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private clickedCardId: string | null = null;
  private onHotkeyClick: ((hotkey: HotkeyDefinition, cardId: string) => void) | null = null;
  private hoverTimeout: number | null = null;
  private hideTimeout: number | null = null;
  private isTooltipHovered: boolean = false;

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
   * @param clickX - X position of the click
   * @param clickY - Y position of the click
   */
  show(cardId: string, clickX: number, clickY: number, pinned: boolean = true): void {
    this.clearTimeouts();
    if (!this.tooltipRoot) return;

    if (this.clickedCardId === cardId && pinned) {
      this.hide();
      return;
    }

    this.clickedCardId = cardId;

    this.tooltipRoot.render(
      React.createElement(HotkeyTooltip, {
        context: 'battlefield' as HotkeyContext,
        mouseX: clickX,
        mouseY: clickY,
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
  showOnHover(cardId: string, mouseX: number, mouseY: number): void {
    this.clearHoverTimeout();
    this.clearHideTimeout(); // Cancel tooltip hide when moving cursor to new card

    this.hoverTimeout = window.setTimeout(() => {
      this.show(cardId, mouseX, mouseY, false);
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
    this.clearHideTimeout();
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