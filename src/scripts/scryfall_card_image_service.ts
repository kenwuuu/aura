/**
 * Parse a decklist-like plain text of the form:
 * 1 mountain
 * 2 island
 * 1 rhystic study
 *
 * Returns an array of { count, name } entries.
 */
function parseList(text) {
  return text
    .trim()
    .split("\n")
    .map(line => {
      const parts = line.trim().split(/\s+/);
      const count = parseInt(parts[0], 10);
      const name = parts.slice(1).join(" ");
      return { count, name };
    });
}

/**
 * Given a card name, fetch the Scryfall card data (named endpoint).
 * Use the `exact` parameter so it matches precisely.
 */
async function fetchCardData(cardName) {
  const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`;
  console.log(url)
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Scryfall fetch error for "${cardName}": ${resp.status}`);
  }
  const json = await resp.json();
  return json;
}

/**
 * Given the Scryfall card object, extract image URIs.
 * If the card has `image_uris`, return those.
 * If it's a double-sided (or multi-face) card, use card_faces[].image_uris.
 */
function extractImageUris(cardObj) {
  // For single-face cards, cardObj.image_uris exists. :contentReference[oaicite:0]{index=0}
  if (cardObj.image_uris) {
    return {
      front: cardObj.image_uris,
      back: null
    };
  }

  // Otherwise, for double-sided / multi-face cards, there's card_faces
  if (Array.isArray(cardObj.card_faces)) {
    // Some faces may have no image_uris, but usually both do. :contentReference[oaicite:1]{index=1}
    const [faceA, faceB] = cardObj.card_faces;
    return {
      front: faceA.image_uris || null,
      back: faceB ? (faceB.image_uris || null) : null
    };
  }

  // Fallback, no images found
  return {
    front: null,
    back: null
  };
}

/**
 * Main function: given the plain text list, fetch images for each entry.
 */
async function fetchImagesForList(listText) {
  const entries = parseList(listText);

  const results = await Promise.all(entries.map(async (entry) => {
    try {
      const cardObj = await fetchCardData(entry.name);
      const uris = extractImageUris(cardObj);
      return {
        count: entry.count,
        name: entry.name,
        imageUris: uris
      };
    } catch (err) {
      console.error("Error fetching", entry.name, err);
      return {
        count: entry.count,
        name: entry.name,
        imageUris: { front: null, back: null },
        error: err.message
      };
    }
  }));

  return results;
}

// Example usage:
const input = `
1 mountain
2 island
1 rhystic study
`;

fetchImagesForList(input)
  .then(results => {
    console.log("Image results:", results);
    /*
    Example output structure:
    [
      {
        count: 1,
        name: "mountain",
        imageUris: { front: { small: "...", normal: "...", large: "..." }, back: null }
      },
      {
        count: 2,
        name: "island",
        imageUris: { front: { ... }, back: null }
      },
      {
        count: 1,
        name: "rhystic study",
        imageUris: { front: { ... }, back: null }
      }
    ]
    */
  })
  .catch(err => {
    console.error("Fatal error:", err);
  });
