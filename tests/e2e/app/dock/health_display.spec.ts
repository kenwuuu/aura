import { test, expect } from '../../fixtures';

test('testScryDoesNotDuplicateCards', async ({page}) => {
  await page.getByText('Deck92Draw').hover();
  await page.getByRole('button', { name: 'Scry' }).click();
  await page.getByRole('textbox').fill('10');
  await page.getByRole('button', { name: 'Scry' }).click();
  await page.getByRole('button', { name: '× Close' }).click();
  await page.getByText('Deck92Draw').hover();
});

test('testLoseHealthButton', async ({page}) => {
  await expect(page.getByText('40', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '-' }).first().click();
  await expect(page.getByText('39', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '-' }).first().click();
  await expect(page.getByText('38', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '-' }).first().click();
  await expect(page.getByText('37', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '-' }).first().click();
  await expect(page.getByText('36', { exact: true })).toBeVisible();
})

test('testLoseHealthHotkey1', async ({page}) => {
  await expect(page.getByText('40', { exact: true })).toBeVisible();
  await page.keyboard.press('-');
  await expect(page.getByText('39', { exact: true })).toBeVisible();
  await page.keyboard.press('_');
  await expect(page.getByText('38', { exact: true })).toBeVisible();
  await page.keyboard.press('-');
  await expect(page.getByText('37', { exact: true })).toBeVisible();
  await page.keyboard.press('-');
  await expect(page.getByText('36', { exact: true })).toBeVisible();
})

test('testLoseHealthHotkey2', async ({page}) => {
  await expect(page.getByText('40', { exact: true })).toBeVisible();
  await page.keyboard.press('_');
  await expect(page.getByText('39', { exact: true })).toBeVisible();
  await page.keyboard.press('_');
  await expect(page.getByText('38', { exact: true })).toBeVisible();
  await page.keyboard.press('_');
  await expect(page.getByText('37', { exact: true })).toBeVisible();
  await page.keyboard.press('_');
  await expect(page.getByText('36', { exact: true })).toBeVisible();
})

test('testGainHealthButton', async ({page}) => {
  await expect(page.getByText('40', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+' }).first().click();
  await expect(page.getByText('41', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+' }).first().click();
  await expect(page.getByText('42', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+' }).first().click();
  await expect(page.getByText('43', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '+' }).first().click();
  await expect(page.getByText('44', { exact: true })).toBeVisible();
})

test('testGainHealthHotkey', async ({page}) => {
  await expect(page.getByText('40', { exact: true })).toBeVisible();
  await page.keyboard.press('=');
  await expect(page.getByText('41', { exact: true })).toBeVisible();
  await page.keyboard.press('=');
  await expect(page.getByText('42', { exact: true })).toBeVisible();
  await page.keyboard.press('=');
  await expect(page.getByText('43', { exact: true })).toBeVisible();
  await page.keyboard.press('=');
  await expect(page.getByText('44', { exact: true })).toBeVisible();
})

test('testGainHealthHotkey2', async ({page}) => {
  await expect(page.getByText('40', { exact: true })).toBeVisible();
  await page.keyboard.press('+');
  await expect(page.getByText('41', { exact: true })).toBeVisible();
  await page.keyboard.press('+');
  await expect(page.getByText('42', { exact: true })).toBeVisible();
  await page.keyboard.press('+');
  await expect(page.getByText('43', { exact: true })).toBeVisible();
  await page.keyboard.press('+');
  await expect(page.getByText('44', { exact: true })).toBeVisible();
})
