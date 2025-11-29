import {expect, test} from "../../fixtures";
import {Page} from "playwright/test";
import {Locator} from "@playwright/test";

async function dragHandCardToLocator(locator: Locator, page: Page) {
  await page.locator('div').filter({hasText: '#'}).nth(4).dragTo(locator);
  await expect(page.locator('div').filter({hasText: '#'}).nth(3)).toBeVisible();
}

async function dragBoardCardToPile(pileName: string, page: Page) {
  const boardCard: Locator = page.locator('div').filter({ hasText: '#' }).nth(3);
  await boardCard.dragTo(page.locator('#local-dock').getByText(pileName));
}

async function dragPileToPile(fromPileName: string, toPileName: string, page: Page) {
  const originPile: Locator = page.locator('#local-dock').getByText(fromPileName);
  const destinationPile: Locator = page.locator('#local-dock').getByText(toPileName);
  await originPile.dragTo(destinationPile);
}

test('testDragBattlefieldCardToDeck', async ({ page }) => {
  await dragHandCardToLocator(page.locator('#whiteboard'), page);
  await expect(page.getByText('Deck92Draw')).toBeVisible();  // confirm 92 cards before drag
  await dragBoardCardToPile('Deck', page);
  await expect(page.getByText('Deck93Draw')).toBeVisible();  // confirm 93 cards after drag
});

test('testDragBattlefieldCardToExile', async ({ page }) => {
  await dragHandCardToLocator(page.locator('#whiteboard'), page);
  await expect(page.getByText('0').nth(1)).toBeVisible();
  await dragBoardCardToPile('Exile', page);
  await expect(page.getByText('1').nth(1)).toBeVisible();
});

test('testDragBattlefieldCardToDiscard', async ({ page }) => {
  await dragHandCardToLocator(page.locator('#whiteboard'), page);
  await expect(page.getByText('0').nth(2)).toBeVisible();
  await dragBoardCardToPile('Discard', page);
  await expect(page.getByText('1').nth(2)).toBeVisible();
});

test('testDragBattlefieldCardToHand', async ({ page }) => {
  const eighthBoardCard = page.locator('.hand-cards .hand-card').nth(7);

  await expect(eighthBoardCard).toBeVisible();
  await dragHandCardToLocator(page.locator('#whiteboard'), page);
  await expect(eighthBoardCard).toBeHidden();

  const boardCard: Locator = page.locator('div').filter({ hasText: '#' }).nth(3);
  await boardCard.dragTo(page.locator('.hand-cards'));

  await expect(eighthBoardCard).toBeVisible();
});

test.skip('testDragExileToDiscard', async ({ page }) => {
  // assert exile and discard both empty
  await expect(page.getByText('Exile0')).toBeVisible();
  await expect(page.getByText('Discard0')).toBeVisible();

  // load exile with a card
  await dragHandCardToLocator(page.getByText('Exile0'), page);
  await expect(page.getByText('Exile1')).toBeVisible();

  // drag exile card to discard
  await dragPileToPile('Exile', 'Discard', page);
  await expect(page.getByText('Exile0')).toBeVisible();
  await expect(page.getByText('Discard1')).toBeVisible();
});

test.skip('testDragDiscardToExile', async ({ page }) => {
  // assert exile and discard both empty
  await expect(page.getByText('Exile0')).toBeVisible();
  await expect(page.getByText('Discard0')).toBeVisible();

  await dragHandCardToLocator(page.getByText('Discard0'), page);
  await expect(page.getByText('Discard1')).toBeVisible();

  await dragPileToPile('Discard', 'Exile', page);
  await expect(page.getByText('Discard0')).toBeVisible();
  await expect(page.getByText('Exile1')).toBeVisible();
});

test.skip('testDragDeckToExile', async ({ page }) => {
  await expect(page.getByText('Deck92')).toBeVisible();
  await expect(page.getByText('Exile0')).toBeVisible();

  await dragPileToPile('Deck', 'Exile', page);
  await expect(page.getByText('Deck91')).toBeVisible();
  await expect(page.getByText('Exile1')).toBeVisible();
});

test.skip('testDragDeckToDiscard', async ({ page }) => {
  await expect(page.getByText('Deck92')).toBeVisible();
  await expect(page.getByText('Discard0')).toBeVisible();

  await dragPileToPile('Deck', 'Discard', page);
  await expect(page.getByText('Deck91')).toBeVisible();
  await expect(page.getByText('Discard1')).toBeVisible();
});

test.skip('testDragExileToDeck', async ({ page }) => {
  await expect(page.getByText('Deck92')).toBeVisible();
  await expect(page.getByText('Exile0')).toBeVisible();

  // load exile with a card
  await dragHandCardToLocator(page.getByText('Exile0'), page);
  await expect(page.getByText('Exile1')).toBeVisible();

  // drag exile card to deck
  await dragPileToPile('Exile', 'Deck', page);
  await expect(page.getByText('Exile0')).toBeVisible();
  await expect(page.getByText('Deck93')).toBeVisible();
});

test.skip('testDragDiscardToDeck', async ({ page }) => {
  await expect(page.getByText('Deck92')).toBeVisible();
  await expect(page.getByText('Discard0')).toBeVisible();

  // load discard with a card
  await dragHandCardToLocator(page.getByText('Discard0'), page);
  await expect(page.getByText('Discard1')).toBeVisible();

  // drag discard card to deck
  await dragPileToPile('Discard', 'Deck', page);
  await expect(page.getByText('Discard0')).toBeVisible();
  await expect(page.getByText('Deck93')).toBeVisible();
});
