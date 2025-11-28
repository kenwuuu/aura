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
  await expect(page.getByTestId('discard-count')).toHaveText('1');
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
  await secondCardInGrid(page).click();
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
