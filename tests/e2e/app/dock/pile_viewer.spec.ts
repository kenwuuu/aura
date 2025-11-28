import {expect, test} from "../../fixtures";
import {Locator, Page} from "@playwright/test";

test.beforeEach(async ({page, context}) => {
  await page.goto('/', {waitUntil: 'networkidle'});
  await page.evaluate(() => localStorage.clear());
});

function secondCardInGrid(page) {
  const secondCardInGrid: Locator = page.getByRole('img', {name: 'Card Back'}).nth(1);
  secondCardInGrid.waitFor({state: 'visible', timeout: 5000}).then(r => {})
  return secondCardInGrid;
}

test('testDeckViewerCardToExile', async ({ page }) => {
  await page.getByText('Deck', { exact: true }).click();
  await expect(page.getByText('Exile0')).toBeVisible();

  // move card to exile
  await secondCardInGrid(page).click();
  await page.keyboard.press('s');
  await expect(page.getByText('Exile1')).toBeVisible();
});

test('testDeckViewerCardToDiscard', async ({ page }) => {
  await page.getByText('Deck', { exact: true }).click();
  await expect(page.getByText('Discard0')).toBeVisible();

  // move card to discard
  await secondCardInGrid(page).click();
  await page.keyboard.press('d');
  await expect(page.getByTestId('discard-count')).toHaveText('1');
});

test('testDeckViewerCardToHand', async ({ page }) => {
  await page.getByText('Deck', { exact: true }).click();

  // move card to hand
  await secondCardInGrid(page).click();
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
  await secondCardInGrid(page).click();
  await page.keyboard.press('s');
  page.getByText('Exile1', { exact: true }).waitFor({state: 'visible'});
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
  await secondCardInGrid(page).click();
  await page.keyboard.press('y');
  await secondCardInGrid(page).click();
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
  await secondCardInGrid(page).click();
  const ninthBoardCard = page.locator('.hand-cards .hand-card').nth(8);
  await expect(ninthBoardCard).toBeHidden();
  await page.keyboard.press('h');
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
  await secondCardInGrid(page).click();
  await page.keyboard.press('d');
  const deckCounter = page.getByText('Discard1', { exact: true });
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
  await secondCardInGrid(page).click();
  await secondCardInGrid(page).waitFor({state: 'visible'})
  await page.keyboard.press('y');
  await secondCardInGrid(page).click();
  await secondCardInGrid(page).waitFor({state: 'visible'})
  await page.keyboard.press('y');
  const deckCounter = page.getByText('Deck87Draw', { exact: true });
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
  await secondCardInGrid(page).click();
  const ninthHandCard = page.locator('.hand-cards .hand-card').nth(8);

  await expect(ninthHandCard).toBeHidden();
  await page.keyboard.press('h');
  ninthHandCard.waitFor({state: 'visible'})
  await expect(ninthHandCard).toBeVisible();
});
