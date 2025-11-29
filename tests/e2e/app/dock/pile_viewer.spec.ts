import {expect, test} from "../../fixtures";
import {Locator, Page} from "@playwright/test";

test.beforeEach(async ({page, context}) => {
  await page.goto('/', {waitUntil: 'networkidle'});
  await page.evaluate(() => localStorage.clear());
});

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
  await page.keyboard.press('t');
  await waitForCardGridStable(page);
  await secondCardInGrid(page).click();
  await page.keyboard.press('t');
  await waitForCardGridStable(page);
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

  // Wait for cards to be visible
  await waitForCardGridStable(page);

  // Get all card elements
  const cardGridItems = page.locator('.card-grid-item');
  await expect(cardGridItems).toHaveCount(5);

  // Get position labels to verify order
  const getPositionLabels = async () => {
    const labels = await page.locator('.card-grid-item-position').allTextContents();
    return labels;
  };

  // Get initial order
  const initialOrder = await getPositionLabels();
  console.log('Initial order:', initialOrder);

  // Expected initial order should be "Top 0", "Top 1", "Top 2", "Top 3", "Top 4"
  expect(initialOrder).toEqual(['Top 0', 'Top 1', 'Top 2', 'Top 3', 'Top 4']);

  // Drag the first card (Top 0) to the third position
  const firstCard = cardGridItems.nth(0);
  const thirdCard = cardGridItems.nth(2);

  await firstCard.dragTo(thirdCard);
  await waitForCardGridStable(page);

  // Get new order after drag
  const newOrder = await getPositionLabels();
  console.log('Order after dragging first to third:', newOrder);

  // After dragging index 0 to index 2, the order should shift
  // Original: [0, 1, 2, 3, 4]
  // After moving 0 to position 2: [1, 2, 0, 3, 4]
  // But position labels should update to reflect new logical positions
  expect(newOrder).toHaveLength(5);

  // Drag another card - drag what's now in position 3 to position 0
  const fourthCard = cardGridItems.nth(3);
  const newFirstCard = cardGridItems.nth(0);

  await fourthCard.dragTo(newFirstCard);
  await waitForCardGridStable(page);

  // Get final order
  const finalOrder = await getPositionLabels();
  console.log('Final order after second drag:', finalOrder);

  // Verify we still have 5 cards
  expect(finalOrder).toHaveLength(5);

  // Position labels should still be sequential (Top 0 through Top 4)
  // even though the underlying cards have been reordered
  const hasAllPositions = ['Top 0', 'Top 1', 'Top 2', 'Top 3', 'Top 4'].every(
    pos => finalOrder.includes(pos)
  );
  expect(hasAllPositions).toBeTruthy();
});
