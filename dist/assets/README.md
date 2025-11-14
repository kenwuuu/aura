# Assets Directory

This directory contains static assets that are served by the application.

## Card Back Image

**File:** `card-back.png`

**Required Specifications:**
- **Dimensions:** 745×1040 pixels (standard MTG card aspect ratio 63:88)
- **Format:** PNG with transparency recommended
- **File Size:** Ideally under 200KB for fast loading

**Usage:**
This image is displayed when a card is flipped face-down on the battlefield. It serves as the default card back for all cards that don't have a specific back-side image.

### How to Add

1. Find or create a card back image (Standard Magic: The Gathering card back recommended)
2. Resize to 745×1040 pixels
3. Save as `card-back.png` in this directory
4. The image will be automatically used when cards are flipped

### Where It's Used

The default card back is referenced in:
- `/src/constants.ts` as `DEFAULT_CARD_BACK = '/assets/card-back.png'`
- `/src/modules/whiteboard/Whiteboard.ts` - displays when `card.isFlipped === true`
- `/src/modules/whiteboard/MultiPlayerBoardManager.ts` - displays when `card.isFlipped === true`

### Fallback Behavior

If no card back image is provided:
- Cards with `card.images.back.normal` will use their specific back image
- Cards without a back image will show a plain gray rectangle with the card number

### Example Card Back Sources

- **Official MTG Card Back:** Search for "mtg card back" online
- **Custom Backs:** Design your own or use community-created alternatives
- **Proxy Backs:** Simple colored designs for playtesting

---

**Note:** Ensure you have appropriate licensing/permissions for any images you add to this directory.