import { Page } from 'playwright/test';
import {test, expect} from '../fixtures';

test('testPlayerDraws8CardsOnLoad', async ({page}) => {
  await page.getByText('92').waitFor({ state: 'visible', timeout: 5000})
  await expect(page.getByText('92')).toBeVisible();
});

test('testPlayerStartsWith40Health', async ({page}) => {
  await page.getByText('40').waitFor({ state: 'visible', timeout: 5000})
  await expect(page.getByText('40', {exact: true})).toBeVisible();
});

test('testChooseDeck', async ({page}) => {
  await page.getByRole('button', {name: '📚 Choose Deck'}).click();
  await page.getByText('Krenko100 cardsscryfallLast modified: 11/11/2025 04:21 AM🗑️').click();
  await expect(page.getByText('Krenko100 cardsscryfallLast modified: 11/11/2025 04:21 AM🗑️')).toBeHidden();
});

test('testDragCardToBoard', async ({page}) => {
  await page.locator('div').filter({hasText: '#'}).nth(4).dragTo(page.locator('#whiteboard'));
  await expect(page.locator('div').filter({hasText: '#'}).nth(3)).toBeVisible();
});

async function dragTokenToBoard(page: Page) {
  await page.locator('._hoverIndicator_1mn8f_33').hover();
  await page.locator('div:nth-child(20)').dragTo(page.locator('#whiteboard'));
}

test('testDragTokenToBoard', async ({ page }) => {
  await dragTokenToBoard(page);
  await expect(page.locator('div').filter({ hasText: '1' }).nth(3)).toBeVisible();
});

test('testIncrementTokenOnBoard', async ({ page }) => {
  await dragTokenToBoard(page);
  await expect(page.locator('div').filter({ hasText: '1' }).nth(3)).toBeVisible();
  await page.locator('div').filter({ hasText: '1' }).nth(3).click();
  await expect(page.locator('div').filter({ hasText: '2' }).nth(3)).toBeVisible();
  await page.locator('div').filter({ hasText: '1' }).nth(3).dblclick();
  await expect(page.locator('div').filter({ hasText: '4' }).nth(3)).toBeVisible();
});

test('testDecrementTokenOnBoard', async ({ page }) => {
  await dragTokenToBoard(page);
  await page.locator('div').filter({ hasText: '1' }).nth(3).click({button: 'right'});
  await expect(page.locator('div').filter({ hasText: '0' }).nth(3)).toBeVisible();
  await page.locator('div').filter({ hasText: '1' }).nth(3).click({button: 'right'});
  await expect(page.locator('div').filter({ hasText: '-' }).nth(3)).toBeVisible();
});

test('testCopyGameLink', async ({ page, context }) => {
  await page.getByRole('button', { name: 'COPY GAME LINK' }).click();
  await page.waitForTimeout(50);

  // Read from clipboard
  const clipboardText = await page.evaluate(async () => {
    return navigator.clipboard.readText();
  });

  const currentUrl = page.url();
  expect(clipboardText).toBe(currentUrl);
});
