import { Card, DeckMetadata } from '../../modules/deck/types';

export interface DeckImportResult {
  cards: Card[];
  metadata: Partial<DeckMetadata>;
  errors?: string[];
}

export interface DeckImporter {
  /**
   * Import a deck from text format
   * @param text The deck list in the importer's expected format
   * @returns Promise resolving to import result with cards and metadata
   */
  importFromText(text: string): Promise<DeckImportResult>;

  /**
   * Validate if the provided text is in the correct format
   * @param text The text to validate
   * @returns true if the format is valid
   */
  validateFormat(text: string): boolean;
}