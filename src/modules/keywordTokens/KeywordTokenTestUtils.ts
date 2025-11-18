import * as Y from 'yjs';
import { KeywordToken } from './types';

/**
 * Test utility for manually spawning tokens
 * Call from browser console: window.spawnTestKeywordToken(x, y)
 */
export class KeywordTokenTestUtils {
  private yDoc: Y.Doc;
  private playerId: string;
  private yKeywordTokens: Y.Map<KeywordToken>;

  constructor(yDoc: Y.Doc, playerId: string) {
    this.yDoc = yDoc;
    this.playerId = playerId;
    this.yKeywordTokens = yDoc.getMap('tokens');
  }

  /**
   * Spawn a test token at the specified position
   */
  public spawnKeywordToken(x: number, y: number, name?: string, imageUrl?: string, backgroundColor?: string): void {
    const tokenId = `token-${Math.random().toString(36).substring(2, 11)}`;

    // Use a default SVG if none provided
    const defaultImage = '/assets/token_images/ability-deathtouch.svg';
    const defaultName = 'Deathtouch';
    const defaultBgColor = '#ffffff'; // Gray-500

    const token: KeywordToken = {
      id: tokenId,
      title: name ?? defaultName,
      ownerId: this.playerId,
      x,
      y,
      zIndex: this.getMaxZIndex() + 1,
      rotation: 0,
      imageUrl: imageUrl ?? defaultImage,
      backgroundColor: backgroundColor ?? defaultBgColor,
      count: 1,
    };

    this.yKeywordTokens.set(tokenId, token);
    console.log('Spawned token:', token);
  }

  /**
   * Spawn a token at the center of the viewport
   */
  public spawnKeywordTokenAtCenter(imageUrl?: string, backgroundColor?: string): void {
    const x = window.innerWidth / 2 - 25; // 25 = half of token width
    const y = window.innerHeight / 2 - 25; // 25 = half of token height
    this.spawnKeywordToken(x, y, imageUrl, backgroundColor);
  }

  /**
   * Clear all tokens from the board
   */
  public clearAllKeywordTokens(): void {
    this.yKeywordTokens.clear();
    console.log('Cleared all tokens');
  }

  /**
   * List all current tokens
   */
  public listKeywordTokens(): KeywordToken[] {
    const tokens = Array.from(this.yKeywordTokens.values());
    console.table(tokens);
    return tokens;
  }

  private getMaxZIndex(): number {
    let max = 0;
    this.yKeywordTokens.forEach((token) => {
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
  const utils = new KeywordTokenTestUtils(yDoc, playerId);

  (window as any).spawnTestKeywordToken = (x: number, y: number, imageUrl?: string, backgroundColor?: string) => {
    utils.spawnKeywordToken(x, y, imageUrl, backgroundColor);
  };

  (window as any).spawnTestKeywordTokenAtCenter = (imageUrl?: string, backgroundColor?: string) => {
    utils.spawnKeywordTokenAtCenter(imageUrl, backgroundColor);
  };

  (window as any).clearAllKeywordTokens = () => {
    utils.clearAllKeywordTokens();
  };

  (window as any).listKeywordTokens = () => {
    return utils.listKeywordTokens();
  };

  console.log('Token test utils loaded! Available commands:');
  console.log('  spawnTestKeywordToken(x, y, imageUrl?) - Spawn token at position');
  console.log('  spawnTestKeywordTokenAtCenter(imageUrl?) - Spawn token at center');
  console.log('  spawnKeywordTokenGrid(rows?, cols?) - Spawn grid of tokens');
  console.log('  clearAllKeywordTokens() - Remove all tokens');
  console.log('  listKeywordTokens() - List all tokens');
}