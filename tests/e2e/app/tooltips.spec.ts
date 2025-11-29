import { test, expect } from '../fixtures';

test('testTooltipShowsOnDeck', async ({page}) => {
  await page.getByText('Deck', { exact: true }).hover();
  await expect(page.getByText('Mulligan', { exact: true })).toBeVisible();
});

test('testTooltipShowsOnExile', async ({page}) => {
  await page.getByText('Exile', { exact: true }).hover();
  await expect(page.getByText('Mulligan', { exact: true })).toBeHidden();
  await expect(page.locator('span').filter({ hasText: 'Exile' })).toBeHidden();
  await expect(page.locator('span').filter({ hasText: 'Discard' })).toBeVisible();
  await expect(page.getByText('To deck top', { exact: true })).toBeVisible();
  await expect(page.getByText('To deck bottom', { exact: true })).toBeVisible();
});

test('testTooltipShowsOnDiscard', async ({page}) => {
  await page.getByText('Discard', { exact: true }).hover();
  await expect(page.getByText('Mulligan', { exact: true })).toBeHidden();
  await expect(page.locator('span').filter({ hasText: 'Discard' })).toBeHidden();
  await expect(page.locator('span').filter({ hasText: 'Exile' })).toBeVisible();
  await expect(page.getByText('To deck top', { exact: true })).toBeVisible();
  await expect(page.getByText('To deck bottom', { exact: true })).toBeVisible();
});

test.skip('testTooltipDoesNotDisappearWhenHoveringSecondElement', async ({ page }) => {

});

