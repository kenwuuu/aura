import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Navigate to the app with a specific room
    await page.goto('http://localhost:5173/?room=playwright');

    // Check that health display is visible (indicates app is loaded)
    await expect(page.getByText('40')).toBeVisible();

    // Use the page in the test
    await use(page);
  },
});

export { expect };