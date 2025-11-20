export type DeckLineItem = {
  // example: 1 Mabel, Heir to Cragflame (BLB) 336
  count: number;  // quantity of card
  name: string;  // card name, "Mabel, Heir to Cragflame"
  set_code?: string;  // three to five-letter set code, "BLB"
  collector_number?: string;  // number that points to a specific card when paired with a set code, e.g. "336"
}

export function parseDecklist(text: string): DeckLineItem[] {
  return text
    .trim()
    .split('\n')
    .filter(line => line.trim().length > 0)
    .filter(line => {
      // Ignore lines that don't start with a numeral
      const trimmed = line.trim();
      return /^\d/.test(trimmed);
    })
    .map(line => {
      const parts = line.trim().split(/\s+/);
      let firstPart = parts[0];

      // Handle 'x' notation (e.g., "20x" -> "20")
      if (firstPart.toLowerCase().endsWith('x')) {
        firstPart = firstPart.slice(0, -1);
      }

      // set count and name
      const count = parseInt(firstPart, 10);
      const name = parts.slice(1).join(' ');

      // set set_code
      const startIndex = text.indexOf('(');
      const endIndex = text.indexOf(')');
      let set_code = undefined;
      let collector_number = undefined;
      if (startIndex >= 0) {
        set_code = text.substring(startIndex + 1, endIndex);
        collector_number = parts.slice(-1)?.join(' ');
        return {count, name, set_code, collector_number};
      }

      return {count, name}
    })
    .filter(entry => !isNaN(entry.count) && entry.name.length > 0);
}
