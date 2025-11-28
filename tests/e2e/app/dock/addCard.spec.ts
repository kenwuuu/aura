import { test } from '../../fixtures';


test.beforeEach(async ({page, context}) => {
  await page.goto('/', {waitUntil: 'networkidle'});
  await page.evaluate(() => localStorage.clear());
});

test('testAddCardAddsACard', async ({page}) => {
  await page.getByRole('button', { name: 'Add Card' }).click();
  await page.getByRole('textbox', { name: 'Enter the exact card name' }).fill('The Ultimate Nightmare of Wizards of the Coast® Customer Service');
  await page.getByRole('button', { name: 'Add to Hand' }).click();
  await page.getByAltText('The Ultimate Nightmare of Wizards of the Coast® Customer Service').waitFor({state: 'visible'});
})

test('testAddCardAddsACardUsingEnterKey', async ({page}) => {
  await page.getByRole('button', { name: 'Add Card' }).click();
  await page.getByRole('textbox', { name: 'Enter the exact card name' }).fill('The Ultimate Nightmare of Wizards of the Coast® Customer Service');
  await page.getByRole('textbox', { name: 'Enter the exact card name' }).press('Enter');
  await page.getByAltText('The Ultimate Nightmare of Wizards of the Coast® Customer Service').waitFor({state: 'visible'});
})