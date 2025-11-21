import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MtgTextListDeckImporter } from './MtgTextListDeckImporter';
import {parseDecklist} from "@/services/deckImporter/DeckListParser";

// Mock the ScryfallApiService but use real parseDecklist
vi.mock('../scryfall', async () => {
  const actual = await vi.importActual<typeof import('../scryfall')>('../scryfall');
  return {
    ScryfallApiService: vi.fn().mockImplementation(() => {
      const realService = new actual.ScryfallApiService();
      return {
        parseDecklist: parseDecklist.bind(realService),
        fetchImagesForList: vi.fn().mockImplementation(async (entries) => {
          // Return mock data for each entry
          return entries.map((entry: any) => ({
            name: entry.name,
            count: entry.count,
            scryfallId: `${entry.name.toLowerCase().replace(/\s+/g, '-')}-id`,
            type_line: entry.name.includes('Mountain') ? 'Basic Land' : 'Instant',
            imageUris: { front: { normal: `https://example.com/${entry.name.toLowerCase()}.jpg` } },
          }));
        }),
      };
    }),
  };
});

describe('MtgTextListDeckImporter - Section Header Detection', () => {
  let importer: MtgTextListDeckImporter;

  beforeEach(() => {
    importer = new MtgTextListDeckImporter();
  });

  describe('Section header detection', () => {
    it('should detect SIDEBOARD section header', async () => {
      const deckText = `4 Lightning Bolt
20 Mountain

SIDEBOARD:
1 Drill Too Deep
4 Pygmy Pyrosaur`;

      const result = await importer.importFromText(deckText);

      expect(result.cards).toHaveLength(0);
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0]).toContain('Section headers detected');
      expect(result.errors![0]).toContain('SIDEBOARD:');
    });

    it('should detect COMMANDER section header', async () => {
      const deckText = `4 Lightning Bolt
20 Mountain

COMMANDER:
1 Flubs, the Fool`;

      const result = await importer.importFromText(deckText);

      expect(result.cards).toHaveLength(0);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Section headers detected');
      expect(result.errors![0]).toContain('COMMANDER:');
    });

    it('should detect multiple section headers', async () => {
      const deckText = `4 Lightning Bolt

SIDEBOARD:
1 Drill Too Deep

COMMANDER:
1 Flubs, the Fool`;

      const result = await importer.importFromText(deckText);

      expect(result.cards).toHaveLength(0);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Section headers detected');
      expect(result.errors![0]).toContain('SIDEBOARD:');
      expect(result.errors![0]).toContain('COMMANDER:');
    });

    it('should show first 3 headers and count if more than 3', async () => {
      const deckText = `4 Lightning Bolt

SIDEBOARD:
1 Card A

COMMANDER:
1 Card B

MAYBEBOARD:
1 Card C

CONSIDERING:
1 Card D`;

      const result = await importer.importFromText(deckText);

      expect(result.cards).toHaveLength(0);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('and 1 more');
    });

    it('should suggest MTGO preset in error message', async () => {
      const deckText = `4 Lightning Bolt

SIDEBOARD:
1 Drill Too Deep`;

      const result = await importer.importFromText(deckText);

      expect(result.errors![0]).toContain('MTGO preset');
      expect(result.errors![0]).toContain('Moxfield');
    });

    it('should direct users to Help button', async () => {
      const deckText = `4 Lightning Bolt

SIDEBOARD:
1 Drill Too Deep`;

      const result = await importer.importFromText(deckText);

      expect(result.errors![0]).toContain('Help button');
    });

    it('should NOT detect valid card lines as section headers', async () => {
      const deckText = `4 Lightning Bolt
20 Mountain
1 Bonfire of the Damned`;

      const result = await importer.importFromText(deckText);

      // Should succeed - no section headers detected
      expect(result.cards.length).toBeGreaterThan(0);
      expect(result.errors).toBeUndefined();
    });

    it('should handle case where line starts with text but is actually a card name', async () => {
      // This edge case: a card name that doesn't start with a number won't be imported
      // but we're testing that the error message is clear
      const deckText = `Lightning Bolt
4 Mountain`;

      const result = await importer.importFromText(deckText);

      // This will be detected as a section header since it doesn't start with a number
      expect(result.cards).toHaveLength(0);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Section headers detected');
      expect(result.errors![0]).toContain('"Lightning Bolt"');
    });

    it('should handle mixed valid and invalid lines', async () => {
      const deckText = `4 Lightning Bolt
SIDEBOARD:
1 Drill Too Deep
20 Mountain`;

      const result = await importer.importFromText(deckText);

      expect(result.cards).toHaveLength(0);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('SIDEBOARD:');
    });

    it('should handle section headers with trailing colons', async () => {
      const deckText = `4 Lightning Bolt

Sideboard:
1 Card A`;

      const result = await importer.importFromText(deckText);

      expect(result.cards).toHaveLength(0);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Sideboard:');
    });

    it('should handle section headers without colons', async () => {
      const deckText = `4 Lightning Bolt

SIDEBOARD
1 Card A`;

      const result = await importer.importFromText(deckText);

      expect(result.cards).toHaveLength(0);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('SIDEBOARD');
    });

    it('should allow importing valid deck without section headers', async () => {
      const deckText = `4 Lightning Bolt
20 Mountain
1 Zuran Orb`;

      const result = await importer.importFromText(deckText);

      // Should succeed
      expect(result.cards.length).toBeGreaterThan(0);
      expect(result.errors).toBeUndefined();
    });
  });

  describe('x notation support', () => {
    it('should import deck with lowercase x notation', async () => {
      const deckText = `4x Lightning Bolt
20x Mountain`;

      const result = await importer.importFromText(deckText);

      expect(result.cards.length).toBeGreaterThan(0);
      expect(result.errors).toBeUndefined();
    });

    it('should import deck with uppercase X notation', async () => {
      const deckText = `4X Lightning Bolt
20X Mountain`;

      const result = await importer.importFromText(deckText);

      expect(result.cards.length).toBeGreaterThan(0);
      expect(result.errors).toBeUndefined();
    });

    it('should import deck with mixed x notation and regular notation', async () => {
      const deckText = `4x Lightning Bolt
20 Mountain
1X Sol Ring`;

      const result = await importer.importFromText(deckText);

      expect(result.cards.length).toBeGreaterThan(0);
      expect(result.errors).toBeUndefined();
    });
  });

//   describe('ignoring non-numeral lines', () => {
//     it('should automatically filter out comment lines', async () => {
//       const deckText = `# This is my awesome deck
// 4 Lightning Bolt
// // Another comment
// 20 Mountain`;
//
//       const result = await importer.importFromText(deckText);
//
//       // Should succeed - comments are filtered out automatically
//       expect(result.cards.length).toBeGreaterThan(0);
//       expect(result.errors).toBeUndefined();
//     });
//
//     it('should automatically filter out blank text lines', async () => {
//       const deckText = `Some random text
// 4 Lightning Bolt
// Another line of text
// 20 Mountain`;
//
//       const result = await importer.importFromText(deckText);
//
//       // Should succeed - text lines are filtered out automatically
//       expect(result.cards.length).toBeGreaterThan(0);
//       expect(result.errors).toBeUndefined();
//     });
//   });

  describe('validateFormat', () => {
    it('should validate deck with x notation', () => {
      const deckText = `4x Lightning Bolt
20x Mountain`;

      const result = importer.validateFormat(deckText);

      expect(result).toBe(true);
    });

    it('should validate deck with mixed notation', () => {
      const deckText = `4x Lightning Bolt
20 Mountain`;

      const result = importer.validateFormat(deckText);

      expect(result).toBe(true);
    });

    it('should invalidate empty deck', () => {
      const result = importer.validateFormat('');
      expect(result).toBe(false);
    });

    it('should invalidate deck with only section headers', () => {
      const deckText = `SIDEBOARD:
COMMANDER:`;

      const result = importer.validateFormat(deckText);

      expect(result).toBe(false);
    });

//     it('should validate deck even if it contains lines to be ignored', () => {
//       const deckText = `# Comment
// 4 Lightning Bolt
// Some text
// 20 Mountain`;
//
//       const result = importer.validateFormat(deckText);
//
//       expect(result).toBe(true);
//     });
  });
});