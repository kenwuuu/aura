import { KeywordToken, KeywordTokenTemplate } from './types';

export interface TokenElementOptions {
  mode: 'board' | 'grid'; // Board tokens are interactive, grid tokens are drag sources
  onMouseEnter?: (e: MouseEvent, tokenId: string) => void;
  onMouseMove?: (e: MouseEvent, tokenId: string) => void;
  onMouseLeave?: (tokenId: string) => void;
  onMouseDown?: (e: MouseEvent, tokenId: string) => void;
  onMouseUp?: (e: MouseEvent, tokenId: string) => void;
  onContextMenu?: (e: MouseEvent, tokenId: string) => void;
  onDragStart?: (e: DragEvent, template: KeywordTokenTemplate) => void;
}

export const tokenDiameter = 40;

export class KeywordTokenFactory {
  /**
   * Creates a token DOM element
   * @param token The token data (for board mode) or template (for grid mode)
   * @param options Configuration for event handlers and behavior
   */
  static createTokenElement(
    token: KeywordToken | KeywordTokenTemplate,
    options: TokenElementOptions
  ): HTMLElement {
    const tokenElement = document.createElement('div');

    // Set data attribute for board tokens (have id)
    if ('id' in token) {
      tokenElement.dataset.tokenId = token.id;
    }

    tokenElement.className = 'token';
    tokenElement.style.position = options.mode === 'board' ? 'absolute' : 'relative';
    tokenElement.style.width = tokenDiameter + 'px';
    tokenElement.style.height = tokenDiameter + 'px';
    tokenElement.style.cursor = options.mode === 'grid' ? 'grab' : 'grab';
    tokenElement.style.userSelect = 'none';
    tokenElement.style.pointerEvents = 'auto';

    // Make grid tokens draggable
    if (options.mode === 'grid') {
      tokenElement.draggable = true;
    }

    // Circular background
    const background = document.createElement('div');
    background.className = 'token-background';
    background.style.position = 'absolute';
    background.style.width = '100%';
    background.style.height = '100%';
    background.style.borderRadius = '50%';
    background.style.backgroundColor = token.backgroundColor;
    background.style.display = 'flex';
    background.style.alignItems = 'center';
    background.style.justifyContent = 'center';
    background.style.pointerEvents = 'none';
    tokenElement.appendChild(background);

    // Token image (SVG or regular image)
    if (token.imageUrl) {
      const img = document.createElement('img');
      img.src = token.imageUrl;
      img.alt = token.title;
      img.className = 'svg-black'; // Make SVGs fully black
      img.style.width = '70%';
      img.style.height = '70%';
      img.style.objectFit = 'contain';
      img.style.pointerEvents = 'none';
      img.style.userSelect = 'none';
      img.draggable = false;
      background.appendChild(img);
    }

    // Count overlay (only if count is defined)
    if (token.count !== undefined) {
      const countElement = document.createElement('div');
      countElement.className = 'token-count';
      countElement.style.position = 'absolute';
      countElement.style.top = '-15%';
      countElement.style.left = '0%';
      countElement.style.fontSize = '20px';
      countElement.style.fontWeight = 'bold';
      countElement.style.color = 'white';
      countElement.style.textShadow = `
        -2px -2px 0 black,
        2px -2px 0 black,
        -2px 2px 0 black,
        2px 2px 0 black,
        0 0 8px black,
        0 0 12px black
      `;
      countElement.style.pointerEvents = 'none';
      countElement.style.userSelect = 'none';
      countElement.textContent = token.count.toString();
      tokenElement.appendChild(countElement);
    }

    // Attach event handlers based on mode
    if (options.mode === 'board') {
      this.attachBoardEventHandlers(tokenElement, token as KeywordToken, options);
    } else if (options.mode === 'grid') {
      this.attachGridEventHandlers(tokenElement, token as KeywordTokenTemplate, options);
    }

    return tokenElement;
  }

  /**
   * Attach event handlers for board tokens (interactive)
   */
  private static attachBoardEventHandlers(
    element: HTMLElement,
    token: KeywordToken,
    options: TokenElementOptions
  ): void {
    // Hover tracking
    if (options.onMouseEnter) {
      element.addEventListener('mouseenter', (e: MouseEvent) => {
        options.onMouseEnter!(e, token.id);
      });
    }

    if (options.onMouseMove) {
      element.addEventListener('mousemove', (e: MouseEvent) => {
        options.onMouseMove!(e, token.id);
      });
    }

    if (options.onMouseLeave) {
      element.addEventListener('mouseleave', () => {
        options.onMouseLeave!(token.id);
      });
    }

    // Mouse interactions
    if (options.onMouseDown) {
      element.addEventListener('mousedown', (e) => {
        options.onMouseDown!(e, token.id);
      });
    }

    if (options.onMouseUp) {
      element.addEventListener('mouseup', (e: MouseEvent) => {
        options.onMouseUp!(e, token.id);
      });
    }

    if (options.onContextMenu) {
      element.addEventListener('contextmenu', (e) => {
        options.onContextMenu!(e, token.id);
      });
    }
  }

  /**
   * Attach event handlers for grid tokens (drag sources)
   */
  private static attachGridEventHandlers(
    element: HTMLElement,
    template: KeywordTokenTemplate,
    options: TokenElementOptions
  ): void {
    // Hover tracking (for tooltips)
    if (options.onMouseEnter) {
      element.addEventListener('mouseenter', (e: MouseEvent) => {
        options.onMouseEnter!(e, template.title); // Use title as identifier for grid tokens
      });
    }

    if (options.onMouseMove) {
      element.addEventListener('mousemove', (e: MouseEvent) => {
        options.onMouseMove!(e, template.title);
      });
    }

    if (options.onMouseLeave) {
      element.addEventListener('mouseleave', () => {
        options.onMouseLeave!(template.title);
      });
    }

    // Drag handlers
    if (options.onDragStart) {
      element.addEventListener('dragstart', (e: DragEvent) => {
        e.stopPropagation();
        element.style.opacity = '0.5';
        options.onDragStart!(e, template);
      });

      element.addEventListener('dragend', () => {
        element.style.opacity = '1';
      });
    }
  }

  /**
   * Update the count display on an existing token element
   */
  static updateCount(element: HTMLElement, newCount: number | undefined): void {
    const countElement = element.querySelector('.token-count') as HTMLElement;
    if (countElement) {
      if (newCount !== undefined) {
        countElement.textContent = newCount.toString();
        countElement.style.display = '';
      } else {
        countElement.style.display = 'none';
      }
    } else if (newCount !== undefined) {
      // Count element doesn't exist but we need to create it
      const newCountElement = document.createElement('div');
      newCountElement.className = 'token-count';
      newCountElement.style.position = 'absolute';
      newCountElement.style.top = '-15%';
      newCountElement.style.left = '0%';
      newCountElement.style.fontSize = '24px';
      newCountElement.style.fontWeight = 'bold';
      newCountElement.style.color = 'white';
      newCountElement.style.textShadow = `
        -2px -2px 0 black,
        2px -2px 0 black,
        -2px 2px 0 black,
        2px 2px 0 black,
        0 0 8px black,
        0 0 12px black
      `;
      newCountElement.style.pointerEvents = 'none';
      newCountElement.style.userSelect = 'none';
      newCountElement.textContent = newCount.toString();
      element.appendChild(newCountElement);
    }
  }
}
