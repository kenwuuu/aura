import { describe, it, expect, beforeEach } from 'vitest';
import { ScryfallApiService } from './ScryfallApiService';

describe('ScryfallApiService', () => {
  let service: ScryfallApiService;

  beforeEach(() => {
    service = new ScryfallApiService();
  });

  it('should create an instance', () => {
    expect(service).toBeInstanceOf(ScryfallApiService);
  });
});