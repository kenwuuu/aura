import { test } from '../../fixtures';

test.beforeEach(async ({page, context}) => {
  await page.goto('/', {waitUntil: 'networkidle'});
  await page.evaluate(() => localStorage.clear());
});

test('testScryDoesNotDuplicateCards', async ({page}) => {
  await page.getByText('Deck92Draw').hover();
  await page.getByRole('button', { name: 'Scry' }).click();
  await page.getByRole('textbox').fill('10');
  await page.getByRole('button', { name: 'Scry' }).click();
  await page.getByRole('button', { name: '× Close' }).click();
  await page.getByText('Deck92Draw').hover();
});
