import {expect, test} from "../../fixtures";
import {Locator} from "@playwright/test";

test.beforeEach(async ({page, context}) => {
  await page.goto('/', {waitUntil: 'networkidle'});
  await page.evaluate(() => localStorage.clear());
});

function secondCardInGrid(page) {
  const secondCardInGrid: Locator = page.getByRole('img', {name: 'Card Back'}).nth(1);
  return secondCardInGrid;
}

test('testDeckViewerCardToExile', async ({ page }) => {
  await page.getByText('Deck', { exact: true }).click();
  await expect(page.getByText('Exile0')).toBeVisible();

  // move card to exile
  await secondCardInGrid(page).click();
  setTimeout(() => {}, 50);
  await page.keyboard.press('s');
  await expect(page.getByText('Exile1')).toBeVisible();
});

test('testDeckViewerCardToDiscard', async ({ page }) => {
  await page.getByText('Deck', { exact: true }).click();
  await expect(page.getByText('Discard0')).toBeVisible();

  // move card to discard
  await secondCardInGrid(page).click();
  setTimeout(() => {}, 50);
  await page.keyboard.press('d');
  await expect(page.getByText('Discard1')).toBeVisible();
});

test('testDeckViewerCardToHand', async ({ page }) => {
  await page.getByText('Deck', { exact: true }).click();

  // move card to hand
  await secondCardInGrid(page).click();
  setTimeout(() => {}, 50);
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
  await expect(page.getByText('Deck84')).toBeVisible();

  // open discard pile viewer
  await page.getByText('Discard8', { exact: true }).hover();

  // move card to exile
  await secondCardInGrid(page).click();
  setTimeout(() => {}, 50);
  await page.keyboard.press('s');
  await expect(page.getByText('Exile1')).toBeVisible();
});

test('testDiscardViewerCardToDeckTop', async ({ page }) => {
  // load discard with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('d');
  }

  await expect(page.getByText('Deck84')).toBeVisible();

  // open discard pile viewer
  await page.getByText('Discard8', { exact: true }).hover();

  // move 2 cards to deck top
  await secondCardInGrid(page).click();
  setTimeout(() => {}, 50);
  await page.keyboard.press('t');
  await page.keyboard.press('t');
  await expect(page.getByText('Deck86')).toBeVisible();
});

test('testDiscardViewerCardToDeckBottom', async ({ page }) => {
  // load discard with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('d');
  }

  await expect(page.getByText('Deck84')).toBeVisible();

  // open discard pile viewer
  await page.getByText('Discard8', { exact: true }).hover();

  // move 2 cards to deck bottom
  await secondCardInGrid(page).click();
  setTimeout(() => {}, 50);
  await page.keyboard.press('y');
  await page.keyboard.press('y');
  await expect(page.getByText('Deck86')).toBeVisible();
});

test('testDiscardViewerCardToHand', async ({ page }) => {
  // load discard with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('d');
  }

  await expect(page.getByText('Deck84')).toBeVisible();

  // open discard pile viewer
  await page.getByText('Discard8', { exact: true }).hover();

  // move card to hand
  await secondCardInGrid(page).click();
  setTimeout(() => {}, 50);
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
  await expect(page.getByText('Deck84')).toBeVisible();

  // open exile pile viewer
  await page.getByText('Exile8', { exact: true }).hover();

  // move card to discard
  await secondCardInGrid(page).click();
  setTimeout(() => {}, 50);
  await page.keyboard.press('d');
  await expect(page.getByText('Discard1')).toBeVisible();
});

test('testExileViewerCardToDeckTop', async ({ page }) => {
  // load exile with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('s');
  }

  await expect(page.getByText('Deck84')).toBeVisible();

  // open exile pile viewer
  await page.getByText('Exile8', { exact: true }).hover();

  // move 2 cards to deck top
  await secondCardInGrid(page).click();
  setTimeout(() => {}, 50);
  await page.keyboard.press('t');
  await page.keyboard.press('t');
  await expect(page.getByText('Deck86')).toBeVisible();
});

test('testExileViewerCardToDeckBottom', async ({ page }) => {
  // load exile with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('s');
  }

  await expect(page.getByText('Deck84')).toBeVisible();

  // open exile pile viewer
  await page.getByText('Exile8', { exact: true }).hover();

  // move 2 cards to deck bottom
  await secondCardInGrid(page).click();
  setTimeout(() => {}, 50);
  await page.keyboard.press('y');
  await page.keyboard.press('y');
  await expect(page.getByText('Deck86')).toBeVisible();
});

test('testExileViewerCardToHand', async ({ page }) => {
  // load exile with cards from deck
  await page.getByText('Deck92Draw', { exact: true }).hover();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('s');
  }

  await expect(page.getByText('Deck84')).toBeVisible();

  // open exile pile viewer
  await page.getByText('Exile8', { exact: true }).hover();

  // move card to hand
  await secondCardInGrid(page).click();
  setTimeout(() => {}, 50);
  const ninthBoardCard = page.locator('.hand-cards .hand-card').nth(8);
  await expect(ninthBoardCard).toBeHidden();
  await page.keyboard.press('h');
  await expect(ninthBoardCard).toBeVisible();
});
