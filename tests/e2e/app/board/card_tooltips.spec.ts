import {expect, test} from "../../fixtures";
import {Page} from "playwright/test";
import {Locator} from "@playwright/test";

async function dragHandCardToLocator(locator: Locator, page: Page) {
  await page.locator('div').filter({hasText: '#'}).nth(4).dragTo(locator);
  await expect(page.locator('div').filter({hasText: '#'}).nth(3)).toBeVisible();
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
  const eighthBoardCard = page.locator('.hand-cards .hand-card').nth(7);
  await expect(eighthBoardCard).toBeVisible();

  await dragHandCardToLocator(page.locator('#whiteboard'), page);
  await expect(eighthBoardCard).toBeHidden();

  const boardCard = page.locator('div').filter({ hasText: '#' }).nth(3);
  await boardCard.click();
  const tooltipRow = page.getByText('HHand');
  await tooltipRow.waitFor({ state: 'visible' });
  await tooltipRow.click();

  await expect(eighthBoardCard).toBeVisible();
});
