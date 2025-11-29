import {test as base, expect, Locator} from '@playwright/test';

async function closeIfVisible(locator: Locator) {
  // Only try the click if the locator exists in the DOM
  if (await locator.isVisible().catch(() => false)) {
    await locator.click({ trial: true }).catch(() => {});
    await locator.click();
    await locator.waitFor({ state: 'detached', timeout: 2000 }).catch(() => {});
  }
}

// Random string generator to avoid running into any real game rooms
function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export const test = base.extend({
  page: async ({ page }, use) => {

    await page.goto(`/?room=${generateRandomString(30)}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());

    // Close modals using your helper (in proper order)
    await closeIfVisible(page.getByRole('button', { name: '× Close' }));
    await closeIfVisible(page.getByRole('button', { name: 'Got it' }));

    // Optional: wait until the app is fully ready
    await expect(page.locator('#local-dock').getByText('40', { exact: true })).toBeVisible();

    // Provide the prepared page to the test
    await use(page);
  },
});

export { expect };