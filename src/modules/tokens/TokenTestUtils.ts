import * as Y from 'yjs';
import { Token } from './types';

/**
 * Test utility for manually spawning tokens
 * Call from browser console: window.spawnTestToken(x, y)
 */
export class TokenTestUtils {
  private yDoc: Y.Doc;
  private playerId: string;
  private yTokens: Y.Map<Token>;

  constructor(yDoc: Y.Doc, playerId: string) {
    this.yDoc = yDoc;
    this.playerId = playerId;
    this.yTokens = yDoc.getMap('tokens');
  }

  /**
   * Spawn a test token at the specified position
   */
  public spawnToken(x: number, y: number, imageUrl?: string): void {
    const tokenId = `token-${Math.random().toString(36).substring(2, 11)}`;

    // Use a default test image if none provided
    const defaultImage = 'https://cards.scryfall.io/art_crop/front/f/c/fc1f8977-c35f-4d5c-9e3b-7b8c1e9e8f3a.jpg';

    const token: Token = {
      id: tokenId,
      ownerId: this.playerId,
      x,
      y,
      zIndex: this.getMaxZIndex() + 1,
      rotation: 0,
      imageUrl: imageUrl ?? defaultImage,
      count: 1,
    };

    this.yTokens.set(tokenId, token);
    console.log('Spawned token:', token);
  }

  /**
   * Spawn a token at the center of the viewport
   */
  public spawnTokenAtCenter(imageUrl?: string): void {
    const x = window.innerWidth / 2 - 25; // 25 = half of token width
    const y = window.innerHeight / 2 - 25; // 25 = half of token height
    this.spawnToken(x, y, imageUrl);
  }

  /**
   * Spawn multiple test tokens in a grid
   */
  public spawnTokenGrid(rows: number = 3, cols: number = 3): void {
    const startX = 100;
    const startY = 100;
    const spacing = 70;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.spawnToken(
          startX + col * spacing,
          startY + row * spacing
        );
      }
    }
  }

  /**
   * Clear all tokens from the board
   */
  public clearAllTokens(): void {
    this.yTokens.clear();
    console.log('Cleared all tokens');
  }

  /**
   * List all current tokens
   */
  public listTokens(): Token[] {
    const tokens = Array.from(this.yTokens.values());
    console.table(tokens);
    return tokens;
  }

  private getMaxZIndex(): number {
    let max = 0;
    this.yTokens.forEach((token) => {
      if (token.zIndex > max) {
        max = token.zIndex;
      }
    });
    return max;
  }
}

/**
 * Expose test utils to window for browser console access
 */
export function exposeTokenTestUtils(yDoc: Y.Doc, playerId: string): void {
  const utils = new TokenTestUtils(yDoc, playerId);

  (window as any).spawnTestToken = (x: number, y: number, imageUrl?: string) => {
    utils.spawnToken(x, y, imageUrl);
  };

  (window as any).spawnTestTokenAtCenter = (imageUrl?: string) => {
    utils.spawnTokenAtCenter(imageUrl);
  };

  (window as any).spawnTokenGrid = (rows?: number, cols?: number) => {
    utils.spawnTokenGrid(rows, cols);
  };

  (window as any).clearAllTokens = () => {
    utils.clearAllTokens();
  };

  (window as any).listTokens = () => {
    return utils.listTokens();
  };

  console.log('Token test utils loaded! Available commands:');
  console.log('  spawnTestToken(x, y, imageUrl?) - Spawn token at position');
  console.log('  spawnTestTokenAtCenter(imageUrl?) - Spawn token at center');
  console.log('  spawnTokenGrid(rows?, cols?) - Spawn grid of tokens');
  console.log('  clearAllTokens() - Remove all tokens');
  console.log('  listTokens() - List all tokens');
}