import {expect, test} from "../fixtures";
import {Locator} from "@playwright/test";

test('testImportDeck', async ({ page }) => {
  // import deck
  await page.getByRole('button', { name: '📚 Choose Deck' }).click();
  await page.getByText('Import New Deck').click();
  await page.getByRole('textbox', { name: 'Deck Name' }).fill('1x Krenko');
  await page.getByRole('textbox', { name: 'Deck Name' }).press('ControlOrMeta+ArrowLeft');
  await page.getByRole('textbox', { name: 'Deck Name' }).fill('1x Krenko');
  await page.getByRole('textbox', { name: 'Deck List' }).click();
  await page.getByRole('textbox', { name: 'Deck List' }).fill('1 krenko, mob boss');
  await page.getByRole('button', { name: 'Import Deck' }).click();

  // Drag card to board
  await page.locator('div').filter({ hasText: '#' }).nth(5).dragTo(page.locator('#whiteboard'));

  const boardCard1: Locator = page.locator('div').filter({ hasText: '#' }).nth(3);
  const boardCard2: Locator = page.locator('div').filter({ hasText: '#' }).nth(5);
  const boardCard3: Locator = page.locator('div').filter({ hasText: /^#1$/ }).nth(2);
  const boardCard4: Locator = page.locator('div').filter({ hasText: /^#1$/ }).nth(4);

  // Confirm card exists. Confirm hotkey tooltip shows up
  await boardCard1.hover()
  await expect(page.getByText('+1 Counter')).toBeVisible()

  // Move mouse to remove preview and tooltip
  await page.mouse.move(200, 200);

  // Confirm that the card spawned its related token
  await boardCard2.click()

  // Confirm that cloning a card works. Clone twice to have 4 cards to drag to 4 dock piles
  await boardCard1.hover()
  await page.keyboard.press('k');
  await page.keyboard.press('k');
  await expect(boardCard3).toBeVisible()
  await expect(boardCard4).toBeVisible()

  // Confirm dragging card to exile places it in exile
  await boardCard2.click();
  await boardCard2.dragTo(page.locator('#local-dock').getByText('Exile'));
  await expect(page.getByText('1').nth(1)).toBeVisible();

  // Confirm dragging card to discard places it in discard
  await boardCard4.click();
  await boardCard4.dragTo(page.locator('#local-dock').getByText('Discard'));
  await expect(page.getByText('1').nth(2)).toBeVisible();

  // Confirm dragging card to hand places it in hand
  await boardCard3.click();
  await boardCard3.dragTo(page.locator('.hand-cards'));
  await expect(page.locator('div').filter({ hasText: '#' }).nth(5)).toBeVisible()

  // Confirm dragging card to deck places it in deck
  await boardCard1.dragTo(page.getByText('Deck', { exact: true }));
  await expect(page.getByText('1').nth(3)).toBeVisible();


});
