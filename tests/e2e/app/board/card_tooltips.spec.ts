import {expect, test} from "../../fixtures";
import {Page} from "playwright/test";
import {Locator} from "@playwright/test";

async function dragHandCardToLocator(locator: Locator, page: Page) {
  await page.locator('div').filter({hasText: '#'}).nth(4).dragTo(locator);
  await expect(page.locator('div').filter({hasText: '#'}).nth(3)).toBeVisible();
}

export async function getElementOrientation(
  locator: Locator
): Promise<"portrait" | "landscape" | "square"> {
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error("Element not found or not visible.");
  }

  const { width, height } = box;

  if (width > height) return "landscape";
  if (height > width) return "portrait";
  return "square";
}

test('testExileTooltip', async ({ page }) => {
  expect(page.getByText('Exile0'));

  await dragHandCardToLocator(page.locator('#whiteboard'), page);
  const boardCard = page.locator('div').filter({ hasText: '#' }).nth(3);
  await boardCard.click();
  const tooltipRow = page.getByText('SExile');
  await tooltipRow.waitFor({ state: 'visible' });
  await tooltipRow.click();
  await expect(page.getByText('Exile1')).toBeVisible();
});

test('testDiscardTooltip', async ({ page }) => {
  expect(page.getByText('Discard0'));

  await dragHandCardToLocator(page.locator('#whiteboard'), page);
  const boardCard = page.locator('div').filter({ hasText: '#' }).nth(3);
  await boardCard.click();
  const tooltipRow = page.getByText('DDiscard');
  await tooltipRow.waitFor({ state: 'visible' });
  await tooltipRow.click();
  await expect(page.getByText('Discard1')).toBeVisible();
});

test('testDeckTooltip', async ({ page }) => {
  expect(page.getByText('Deck92'));

  await dragHandCardToLocator(page.locator('#whiteboard'), page);
  const boardCard = page.locator('div').filter({ hasText: '#' }).nth(3);
  await boardCard.click();
  const tooltipRow = page.getByText('TTo deck top');
  await tooltipRow.waitFor({ state: 'visible' });
  await tooltipRow.click();

  await expect(page.getByText('Deck93')).toBeVisible();
});

test('testHandTooltip', async ({ page }) => {
  const eighthHandCard = page.locator('.hand-cards .hand-card').nth(7);
  await expect(eighthHandCard).toBeVisible();

  await dragHandCardToLocator(page.locator('#whiteboard'), page);
  await expect(eighthHandCard).toBeHidden();

  const boardCard = page.locator('div').filter({ hasText: '#' }).nth(3);
  await boardCard.click();
  const tooltipRow = page.getByText('HHand');
  await tooltipRow.waitFor({ state: 'visible' });
  await tooltipRow.click();

  await expect(eighthHandCard).toBeVisible();
});

test('testInteractiveTooltip', async ({ page }) => {
  const firstBoardCard = page.locator('.player-board .card').nth(0);
  const secondBoardCard = page.locator('.player-board .card').nth(1);
  const thirdBoardCard = page.locator('.player-board .card').nth(2);
  
  await dragHandCardToLocator(page.locator('#whiteboard'), page);
  
  expect(await getElementOrientation(firstBoardCard)).toBe('portrait');

  await firstBoardCard.click();
  await page.getByText('Tap/Untap').click();
  expect(await getElementOrientation(firstBoardCard)).toBe('landscape');

  await firstBoardCard.click();
  await page.getByText('XUntap all').click();
  expect(await getElementOrientation(firstBoardCard)).toBe('portrait');

  await firstBoardCard.click();
  await page.getByText('FFlip').click();
  const cardImgSrc = await firstBoardCard.locator('img').getAttribute('src');
  expect(cardImgSrc === '/assets/card-back.png')

  await firstBoardCard.click();
  await page.getByText('U+1 counter').click();
  await page.getByTitle('Decrease counter').waitFor({ state: 'visible' });
  await page.getByTitle('Decrease counter').click();

  await firstBoardCard.click();
  await page.getByText('I-1 counter').click();
  await page.getByTitle('Increase counter').waitFor({ state: 'visible' });
  await page.getByTitle('Increase counter').click();

  // copy first card to make second card.
  // copy second card to make third card
  await firstBoardCard.click();
  await page.getByText('KCopy/clone').click();
  await secondBoardCard.waitFor({ state: 'visible' });
  await secondBoardCard.click();
  await page.getByText('KCopy/clone').click();
  await thirdBoardCard.waitFor({ state: 'visible' });
  await expect(thirdBoardCard).toBeVisible();

  // delete third card
  await thirdBoardCard.click();
  await page.getByText('BackDelete').click();
  await expect(thirdBoardCard).toBeHidden();

  // move second card to hand
  await secondBoardCard.click();
  await page.getByText('HHand').click();
  await expect(secondBoardCard).toBeHidden();
});