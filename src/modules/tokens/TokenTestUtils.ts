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
  public spawnToken(x: number, y: number, imageUrl?: string, backgroundColor?: string): void {
    const tokenId = `token-${Math.random().toString(36).substring(2, 11)}`;

    // Use a default SVG if none provided
    const defaultImage = '/assets/token_images/ability-deathtouch.svg';
    const defaultBgColor = '#ffffff'; // Gray-500

    const token: Token = {
      id: tokenId,
      ownerId: this.playerId,
      x,
      y,
      zIndex: this.getMaxZIndex() + 1,
      rotation: 0,
      imageUrl: imageUrl ?? defaultImage,
      backgroundColor: backgroundColor ?? defaultBgColor,
      count: 1,
    };

    this.yTokens.set(tokenId, token);
    console.log('Spawned token:', token);
  }

  /**
   * Spawn a token at the center of the viewport
   */
  public spawnTokenAtCenter(imageUrl?: string, backgroundColor?: string): void {
    const x = window.innerWidth / 2 - 25; // 25 = half of token width
    const y = window.innerHeight / 2 - 25; // 25 = half of token height
    this.spawnToken(x, y, imageUrl, backgroundColor);
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

  (window as any).spawnTestToken = (x: number, y: number, imageUrl?: string, backgroundColor?: string) => {
    utils.spawnToken(x, y, imageUrl, backgroundColor);
  };

  (window as any).spawnTestTokenAtCenter = (imageUrl?: string, backgroundColor?: string) => {
    utils.spawnTokenAtCenter(imageUrl, backgroundColor);
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