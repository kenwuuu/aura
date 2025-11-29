import {expect, test} from "../../fixtures";
import {Locator, Page} from "@playwright/test";

function secondCardInGrid(page) {
  const secondCardInGrid: Locator = page.getByRole('img', {name: 'Card Back'}).nth(1);
  return secondCardInGrid;
}

/**
 * Wait for card grid to finish rendering after a card is removed.
 * The CardGrid component uses micro-batching to progressively render cards,
 * so we need to wait for the batching to complete before interacting with cards.
 */
async function waitForCardGridStable(page: Page) {
  // Wait for React to finish rerendering by waiting for the second card to be stable
  await secondCardInGrid(page).waitFor({ state: 'visible', timeout: 5000 });
  // Small additional delay to ensure batching is complete
  await page.waitForTimeout(50);
}

test('testDeckViewerCardToExile', async ({ page }) => {
  await page.getByText('Deck', { exact: true }).click();
  await expect(page.getByText('Exile0')).toBeVisible();

  // move card to exile
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('s');
  await expect(page.getByText('Exile1')).toBeVisible();
});

test('testDeckViewerCardToDiscard', async ({ page }) => {
  await page.getByText('Deck', { exact: true }).click();
  await expect(page.getByText('Discard0')).toBeVisible();

  // move card to discard
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('d');
  await expect(page.getByText('Discard1')).toBeVisible();
});

test('testDeckViewerCardToHand', async ({ page }) => {
  await page.getByText('Deck', { exact: true }).click();

  // move card to hand
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  const ninthBoardCard = page.locator('.hand-cards .hand-card').nth(8);
  await expect(ninthBoardCard).toBeHidden();
  await page.keyboard.press('h');
  await expect(ninthBoardCard).toBeVisible();
});

test('testDeckViewerCardToDeckTop', async ({ page }) => {
  await page.getByText('Deck', { exact: true }).click();
  await expect(page.getByText('Deck92')).toBeVisible();

  // move card to deck top (reshuffling within deck)
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('t');
  await waitForCardGridStable(page);

  // Deck count should remain the same (92)
  await expect(page.getByText('Deck92')).toBeVisible();
});

test('testDeckViewerCardToDeckBottom', async ({ page }) => {
  await page.getByText('Deck', { exact: true }).click();
  await expect(page.getByText('Deck92')).toBeVisible();

  // move card to deck bottom (reshuffling within deck)
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('y');
  await waitForCardGridStable(page);

  // Deck count should remain the same (92)
  await expect(page.getByText('Deck92')).toBeVisible();
});

test('testDiscardViewerCardToExile', async ({ page }) => {
  // load discard with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('d');
  }

  await expect(page.getByText('Exile0')).toBeVisible();
  await expect(page.getByText('Deck85')).toBeVisible();

  // open discard pile viewer
  await page.getByText('Discard7', { exact: true }).click();

  // move card to exile
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('s');
  const deckCounter = page.getByText('Exile1', { exact: true });
  await deckCounter.waitFor({ state: 'visible' });
});

test('testDiscardViewerCardToDeckTop', async ({ page }) => {
  // load discard with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('d');
  }

  await expect(page.getByText('Exile0')).toBeVisible();
  await expect(page.getByText('Deck85')).toBeVisible();

  // open discard pile viewer
  await page.getByText('Discard7', { exact: true }).click();

  // move 2 cards to deck top
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('t');
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('t');
  const deckCounter = page.getByText('Deck87Draw', { exact: true });
  await deckCounter.waitFor({ state: 'visible' });
});

test('testDiscardViewerCardToDeckBottom', async ({ page }) => {
  // load discard with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('d');
  }

  await expect(page.getByText('Deck85')).toBeVisible();

  // open discard pile viewer
  await page.getByText('Discard7', { exact: true }).click();

  // move 2 cards to deck bottom
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('y');
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('y');
  const deckCounter = page.getByText('Deck87Draw', { exact: true });
  await deckCounter.waitFor({ state: 'visible' });
});

test('testDiscardViewerCardToHand', async ({ page }) => {
  // load discard with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('d');
  }

  await expect(page.getByText('Deck85')).toBeVisible();

  // open discard pile viewer
  await page.getByText('Discard7', { exact: true }).click();

  // move card to hand
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  const ninthBoardCard = page.locator('.hand-cards .hand-card').nth(8);
  await waitForCardGridStable(page);
  await expect(ninthBoardCard).toBeHidden();
  await waitForCardGridStable(page);
  await page.keyboard.press('h');
  await waitForCardGridStable(page);
  await expect(ninthBoardCard).toBeVisible();
});

test('testExileViewerCardToDiscard', async ({ page }) => {
  // load exile with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('s');
  }

  await expect(page.getByText('Discard0')).toBeVisible();
  await expect(page.getByText('Deck85')).toBeVisible();

  // open exile pile viewer
  await page.getByText('Exile7', { exact: true }).click();

  // move card to discard
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('d');
  await waitForCardGridStable(page);
  const deckCounter = page.getByText('Discard1', { exact: true });
  await waitForCardGridStable(page);
  await deckCounter.waitFor({ state: 'visible' });
});

test('testExileViewerCardToDeckTop', async ({ page }) => {
  // load exile with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('s');
  }

  await expect(page.getByText('Deck85')).toBeVisible();

  // open exile pile viewer
  await page.getByText('Exile7', { exact: true }).click();

  // move 2 cards to deck top
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await secondCardInGrid(page).hover();
  await page.keyboard.press('t');
  const deckCounter = page.getByText('Deck86Draw', { exact: true });
  await deckCounter.waitFor({ state: 'visible' });
});

test('testExileViewerCardToDeckBottom', async ({ page }) => {
  // load exile with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('s');
  }

  await expect(page.getByText('Deck85')).toBeVisible();

  // open exile pile viewer
  await page.getByText('Exile7', { exact: true }).click();

  // move 2 cards to deck bottom
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('y');
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('y');
  await waitForCardGridStable(page);
  const deckCounter = page.getByText('Deck87Draw', { exact: true });
  await waitForCardGridStable(page);
  await deckCounter.waitFor({ state: 'visible' });
});

test('testExileViewerCardToHand', async ({ page }) => {
  // load exile with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('s');
  }

  await expect(page.getByText('Deck85')).toBeVisible();

  // open exile pile viewer
  await page.getByText('Exile7', { exact: true }).click();

  // move card to hand
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  const ninthHandCard = page.locator('.hand-cards .hand-card').nth(8);
  await waitForCardGridStable(page);
  await expect(ninthHandCard).toBeHidden();
  await waitForCardGridStable(page);
  await page.keyboard.press('h');
  await waitForCardGridStable(page);
  await expect(ninthHandCard).toBeVisible();
});

test('testScryViewerCardToDiscard', async ({ page }) => {
  await expect(page.getByText('Discard0')).toBeVisible();
  await expect(page.getByText('Deck92')).toBeVisible();

  // Open scry modal and scry 10 cards
  await page.getByRole('button', { name: 'Scry' }).click();
  await page.getByRole('textbox').fill('10');
  await page.getByRole('button', { name: 'Scry' }).click();

  // move card to discard
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('d');
  await waitForCardGridStable(page);
  const discardCounter = page.getByText('Discard1', { exact: true });
  await discardCounter.waitFor({ state: 'visible' });
});

test('testScryViewerCardToDeckTop', async ({ page }) => {
  await expect(page.getByText('Deck92')).toBeVisible();

  // Open scry modal and scry 10 cards
  await page.getByRole('button', { name: 'Scry' }).click();
  await page.getByRole('textbox').fill('10');
  await page.getByRole('button', { name: 'Scry' }).click();

  // Scrying 10 cards should remove 10 cards from deck
  await page.getByText('Deck82Draw', { exact: true }).waitFor({ state: 'visible' });

  // move card to deck top
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('t');
  await waitForCardGridStable(page);

  // Deck count should remain the same (moving from scry to deck top)
  const deckCounter = page.getByText('Deck83Draw', { exact: true });
  await deckCounter.waitFor({ state: 'visible' });
});

test('testScryViewerCardToDeckBottom', async ({ page }) => {
  await expect(page.getByText('Deck92')).toBeVisible();

  // Open scry modal and scry 10 cards
  await page.getByRole('button', { name: 'Scry' }).click();
  await page.getByRole('textbox').fill('10');
  await page.getByRole('button', { name: 'Scry' }).click();

  // Scrying 10 cards should remove 10 cards from deck
  await page.getByText('Deck82Draw', { exact: true }).waitFor({ state: 'visible' });

  // move card to deck bottom
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await waitForCardGridStable(page);
  await page.keyboard.press('y');
  await waitForCardGridStable(page);

  // Deck count should increase by 1.
  const deckCounter = page.getByText('Deck83Draw', { exact: true });
  await deckCounter.waitFor({ state: 'visible' });
});

test('testScryViewerDragAndDropReordering', async ({ page }) => {
  await expect(page.getByText('Deck92')).toBeVisible();

  // Open scry modal and scry 5 cards for easier testing
  await page.getByRole('button', { name: 'Scry' }).click();
  await page.getByRole('textbox').fill('5');
  await page.getByRole('button', { name: 'Scry' }).click();

  // Wait for cards to be visible - use a more specific locator
  const gridItems = page.locator('.deck-pile-viewer-grid > div');
  await expect(gridItems).toHaveCount(5, { timeout: 10000 });
  await page.waitForTimeout(500); // Extra wait for micro-batching

  // Helper function to get card order by reading card names and positions
  const getCardOrder = async () => {
    return await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const grid = dialog?.querySelector('.deck-pile-viewer-grid');
      const items = grid?.children || [];

      return Array.from(items).map(item => {
        const cardGridItem = item.querySelector('[data-card-id]');
        const img = cardGridItem?.querySelector('img');
        const cardName = img?.alt;
        const allText = item.textContent;
        const positionMatch = allText.match(/(Top \d+)/);

        return {
          cardName,
          position: positionMatch ? positionMatch[1] : null
        };
      });
    });
  };

  // Get initial order
  const initialOrder = await getCardOrder();

  // Verify we have 5 cards
  expect(initialOrder).toHaveLength(5);

  // Store initial card names for verification
  const initialCardNames = initialOrder.map(c => c.cardName);

  // Drag the first card (index 0) to the third position (index 2)
  const firstCard = gridItems.nth(0);
  const thirdCard = gridItems.nth(2);

  const firstBox = await firstCard.boundingBox();
  const thirdBox = await thirdCard.boundingBox();

  if (!firstBox || !thirdBox) {
    throw new Error('Could not get card bounding boxes');
  }

  // Perform first drag with mouse events (dnd-kit requires 8px movement threshold)
  await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(thirdBox.x + thirdBox.width / 2, thirdBox.y + thirdBox.height / 2, { steps: 10 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(500); // Wait for drag animation

  // Get order after first drag
  const orderAfterFirstDrag = await getCardOrder();
  const cardNamesAfterFirstDrag = orderAfterFirstDrag.map(c => c.cardName);

  expect(cardNamesAfterFirstDrag[0]).toBe(initialCardNames[1]);
  expect(cardNamesAfterFirstDrag[1]).toBe(initialCardNames[2]);
  expect(cardNamesAfterFirstDrag[2]).toBe(initialCardNames[0]);
  expect(cardNamesAfterFirstDrag[3]).toBe(initialCardNames[3]);
  expect(cardNamesAfterFirstDrag[4]).toBe(initialCardNames[4]);

  // Second drag: drag the card at position 4 to position 1
  const fifthCard = gridItems.nth(4);
  const secondCard = gridItems.nth(1);

  const fifthBox = await fifthCard.boundingBox();
  const secondBox = await secondCard.boundingBox();

  if (!fifthBox || !secondBox) {
    throw new Error('Could not get card bounding boxes for second drag');
  }

  // Perform second drag
  await page.mouse.move(fifthBox.x + fifthBox.width / 2, fifthBox.y + fifthBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2, { steps: 10 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(500); // Wait for drag animation

  // Get final order
  const finalOrder = await getCardOrder();
  const finalCardNames = finalOrder.map(c => c.cardName);

  expect(finalCardNames[0]).toBe(initialCardNames[1]);
  expect(finalCardNames[1]).toBe(initialCardNames[4]);
  expect(finalCardNames[2]).toBe(initialCardNames[2]);
  expect(finalCardNames[3]).toBe(initialCardNames[0]);
  expect(finalCardNames[4]).toBe(initialCardNames[3]);
});

test.skip('testDeckViewerDragCardToDiscard', async ({ page }) => {
  await expect(page.getByText('Discard0')).toBeVisible();

  // Open deck viewer
  await page.getByText('Deck', { exact: true }).click();
  await waitForCardGridStable(page);

  // Get the second card in the grid
  const secondCard = secondCardInGrid(page);
  const secondCardBox = await secondCard.boundingBox();

  if (!secondCardBox) {
    throw new Error('Could not get card bounding box');
  }

  // Get the Discard pile element
  const discardPile = page.getByText('Discard0', { exact: true });
  const discardBox = await discardPile.boundingBox();

  if (!discardBox) {
    throw new Error('Could not get discard pile bounding box');
  }

  // Drag card from deck viewer to discard pile
  await page.mouse.move(secondCardBox.x + secondCardBox.width / 2, secondCardBox.y + secondCardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(discardBox.x + discardBox.width / 2, discardBox.y + discardBox.height / 2, { steps: 10 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(500); // Wait for drag animation

  // Verify discard pile count increased
  await expect(page.getByText('Discard1')).toBeVisible();
});

test.skip('testDeckViewerDragCardToExile', async ({ page }) => {
  await expect(page.getByText('Exile0')).toBeVisible();

  // Open deck viewer
  await page.getByText('Deck', { exact: true }).click();
  await waitForCardGridStable(page);

  // Get the second card in the grid
  const secondCard = secondCardInGrid(page);
  const secondCardBox = await secondCard.boundingBox();

  if (!secondCardBox) {
    throw new Error('Could not get card bounding box');
  }

  // Get the Exile pile element
  const exilePile = page.getByText('Exile0', { exact: true });
  const exileBox = await exilePile.boundingBox();

  if (!exileBox) {
    throw new Error('Could not get exile pile bounding box');
  }

  // Drag card from deck viewer to exile pile
  await page.mouse.move(secondCardBox.x + secondCardBox.width / 2, secondCardBox.y + secondCardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(exileBox.x + exileBox.width / 2, exileBox.y + exileBox.height / 2, { steps: 10 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(500); // Wait for drag animation

  // Verify exile pile count increased
  await expect(page.getByText('Exile1')).toBeVisible();
});

test.skip('testDiscardViewerDragCardToExile', async ({ page }) => {
  // Load discard with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('d');
  }

  await expect(page.getByText('Exile0')).toBeVisible();
  await expect(page.getByText('Discard7')).toBeVisible();

  // Open discard pile viewer
  await page.getByText('Discard7', { exact: true }).click();
  await waitForCardGridStable(page);

  // Get the second card in the grid
  const secondCard = secondCardInGrid(page);
  const secondCardBox = await secondCard.boundingBox();

  if (!secondCardBox) {
    throw new Error('Could not get card bounding box');
  }

  // Get the Exile pile element
  const exilePile = page.getByText('Exile0', { exact: true });
  const exileBox = await exilePile.boundingBox();

  if (!exileBox) {
    throw new Error('Could not get exile pile bounding box');
  }

  // Drag card from discard viewer to exile pile
  await page.mouse.move(secondCardBox.x + secondCardBox.width / 2, secondCardBox.y + secondCardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(exileBox.x + exileBox.width / 2, exileBox.y + exileBox.height / 2, { steps: 10 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(500); // Wait for drag animation

  // Verify exile pile count increased and discard decreased
  await expect(page.getByText('Exile1')).toBeVisible();
  await expect(page.getByText('Discard6')).toBeVisible();
});

test.skip('testDiscardViewerDragCardToDeck', async ({ page }) => {
  // Load discard with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('d');
  }

  await expect(page.getByText('Deck85')).toBeVisible();
  await expect(page.getByText('Discard7')).toBeVisible();

  // Open discard pile viewer
  await page.getByText('Discard7', { exact: true }).click();
  await waitForCardGridStable(page);

  // Get the second card in the grid
  const secondCard = secondCardInGrid(page);
  const secondCardBox = await secondCard.boundingBox();

  if (!secondCardBox) {
    throw new Error('Could not get card bounding box');
  }

  // Get the Deck pile element
  const deckPile = page.getByText('Deck85', { exact: true });
  const deckBox = await deckPile.boundingBox();

  if (!deckBox) {
    throw new Error('Could not get deck pile bounding box');
  }

  // Drag card from discard viewer to deck pile
  await page.mouse.move(secondCardBox.x + secondCardBox.width / 2, secondCardBox.y + secondCardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(deckBox.x + deckBox.width / 2, deckBox.y + deckBox.height / 2, { steps: 10 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(500); // Wait for drag animation

  // Verify deck pile count increased and discard decreased
  await expect(page.getByText('Deck86Draw')).toBeVisible();
  await expect(page.getByText('Discard6')).toBeVisible();
});

test.skip('testExileViewerDragCardToDiscard', async ({ page }) => {
  // Load exile with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('s');
  }

  await expect(page.getByText('Discard0')).toBeVisible();
  await expect(page.getByText('Exile7')).toBeVisible();

  // Open exile pile viewer
  await page.getByText('Exile7', { exact: true }).click();
  await waitForCardGridStable(page);

  // Get the second card in the grid
  const secondCard = secondCardInGrid(page);
  const secondCardBox = await secondCard.boundingBox();

  if (!secondCardBox) {
    throw new Error('Could not get card bounding box');
  }

  // Get the Discard pile element
  const discardPile = page.getByText('Discard0', { exact: true });
  const discardBox = await discardPile.boundingBox();

  if (!discardBox) {
    throw new Error('Could not get discard pile bounding box');
  }

  // Drag card from exile viewer to discard pile
  await page.mouse.move(secondCardBox.x + secondCardBox.width / 2, secondCardBox.y + secondCardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(discardBox.x + discardBox.width / 2, discardBox.y + discardBox.height / 2, { steps: 10 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(500); // Wait for drag animation

  // Verify discard pile count increased and exile decreased
  await expect(page.getByText('Discard1')).toBeVisible();
  await expect(page.getByText('Exile6')).toBeVisible();
});

test.skip('testExileViewerDragCardToDeck', async ({ page }) => {
  // Load exile with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('s');
  }

  await expect(page.getByText('Deck85')).toBeVisible();
  await expect(page.getByText('Exile7')).toBeVisible();

  // Open exile pile viewer
  await page.getByText('Exile7', { exact: true }).click();
  await waitForCardGridStable(page);

  // Get the second card in the grid
  const secondCard = secondCardInGrid(page);
  const secondCardBox = await secondCard.boundingBox();

  if (!secondCardBox) {
    throw new Error('Could not get card bounding box');
  }

  // Get the Deck pile element
  const deckPile = page.getByText('Deck85', { exact: true });
  const deckBox = await deckPile.boundingBox();

  if (!deckBox) {
    throw new Error('Could not get deck pile bounding box');
  }

  // Drag card from exile viewer to deck pile
  await page.mouse.move(secondCardBox.x + secondCardBox.width / 2, secondCardBox.y + secondCardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(deckBox.x + deckBox.width / 2, deckBox.y + deckBox.height / 2, { steps: 10 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(500); // Wait for drag animation

  // Verify deck pile count increased and exile decreased
  await expect(page.getByText('Deck86Draw')).toBeVisible();
  await expect(page.getByText('Exile6')).toBeVisible();
});

test.skip('testScryViewerDragCardToDiscard', async ({ page }) => {
  await expect(page.getByText('Discard0')).toBeVisible();

  // Open scry modal and scry 5 cards
  await page.getByRole('button', { name: 'Scry' }).click();
  await page.getByRole('textbox').fill('5');
  await page.getByRole('button', { name: 'Scry' }).click();

  await waitForCardGridStable(page);

  // Get the second card in the grid
  const secondCard = secondCardInGrid(page);
  const secondCardBox = await secondCard.boundingBox();

  if (!secondCardBox) {
    throw new Error('Could not get card bounding box');
  }

  // Get the Discard pile element
  const discardPile = page.getByText('Discard0', { exact: true });
  const discardBox = await discardPile.boundingBox();

  if (!discardBox) {
    throw new Error('Could not get discard pile bounding box');
  }

  // Drag card from scry viewer to discard pile
  await page.mouse.move(secondCardBox.x + secondCardBox.width / 2, secondCardBox.y + secondCardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(discardBox.x + discardBox.width / 2, discardBox.y + discardBox.height / 2, { steps: 10 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(500); // Wait for drag animation

  // Verify discard pile count increased
  await expect(page.getByText('Discard1')).toBeVisible();
});

test.skip('testScryViewerDragCardToDeck', async ({ page }) => {
  await expect(page.getByText('Deck92')).toBeVisible();

  // Open scry modal and scry 5 cards
  await page.getByRole('button', { name: 'Scry' }).click();
  await page.getByRole('textbox').fill('5');
  await page.getByRole('button', { name: 'Scry' }).click();

  await waitForCardGridStable(page);

  // Get the second card in the grid
  const secondCard = secondCardInGrid(page);
  const secondCardBox = await secondCard.boundingBox();

  if (!secondCardBox) {
    throw new Error('Could not get card bounding box');
  }

  // Get the Deck pile element (Deck87 after scrying 5)
  const deckPile = page.getByText('Deck87', { exact: true });
  const deckBox = await deckPile.boundingBox();

  if (!deckBox) {
    throw new Error('Could not get deck pile bounding box');
  }

  // Drag card from scry viewer to deck pile
  await page.mouse.move(secondCardBox.x + secondCardBox.width / 2, secondCardBox.y + secondCardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(deckBox.x + deckBox.width / 2, deckBox.y + deckBox.height / 2, { steps: 10 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(500); // Wait for drag animation

  // Verify deck pile count increased
  await expect(page.getByText('Deck88Draw')).toBeVisible();
});
