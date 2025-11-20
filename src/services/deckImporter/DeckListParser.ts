// Example: 1 Mabel, Heir to Cragflame (BLB) 336
export type DeckLineItem = {
  // Quantity of card
  count: number;
  // Card name, "Mabel, Heir to Cragflame"
  name: string;
  // Three to five-letter set code, "BLB"
  setCode?: string;
  // Number that points to a specific card when paired with a set code, e.g. "336"
  collectorNumber?: string;
  // Whether this card was under a commander header
  commander?: boolean;
}

function parseCount(firstPart: string): number {
  // Handle 'x' notation (e.g., "20x" -> "20")
  if (firstPart.toLowerCase().endsWith('x')) {
    firstPart = firstPart.slice(0, -1);
  }
  return parseInt(firstPart, 10);
}

function extractSetInfo(line: string): { setCode: string; collectorNumber: string } | null {
  const startIndex = line.indexOf('(');
  const endIndex = line.indexOf(')');

  if (startIndex < 0 || endIndex <= startIndex) {
    return null;
  }

  const setCode = line.substring(startIndex + 1, endIndex);

  // Extract collector number - it's after the closing paren
  const afterParen = line.substring(endIndex + 1).trim();
  const collectorNumber = afterParen.split(/\s+/)[0];

  return { setCode, collectorNumber };
}

function extractCardName(line: string, parts: string[]): string {
  const setInfo = extractSetInfo(line);

  if (setInfo) {
    // If there's set info, extract name between count and opening paren
    const startIndex = line.indexOf('(');
    const countLength = parts[0].length;
    return line.substring(countLength, startIndex).trim();
  }

  // No set info - just join all parts after the count
  return parts.slice(1).join(' ');
}

function parseLine(line: string): DeckLineItem {
  const parts = line.trim().split(/\s+/);
  const count = parseCount(parts[0]);
  const name = extractCardName(line, parts);
  const setInfo = extractSetInfo(line);

  if (setInfo) {
    return { count, name, setCode: setInfo.setCode, collectorNumber: setInfo.collectorNumber };
  }

  return { count, name };
}

// Ignore lines that don't start with a number
function isValidDeckLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.length > 0 && /^\d/.test(trimmed);
}

export function parseDecklist(text: string): DeckLineItem[] {
  return text
    .trim()
    .split('\n')
    .filter(isValidDeckLine)
    .map(parseLine)
    .filter(entry => !isNaN(entry.count) && entry.name.length > 0);
}
