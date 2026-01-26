import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  role: 'admin' | 'sponsor' | 'subscriber';
}

/**
 * Test user credentials for different roles
 * TODO: Replace with actual test user credentials from your test environment
 */
export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    email: 'admin@test.com',
    password: 'test123',
    role: 'admin',
  },
  sponsor: {
    email: 'sponsor@test.com',
    password: 'test123',
    role: 'sponsor',
  },
  subscriber: {
    email: 'subscriber@test.com',
    password: 'test123',
    role: 'subscriber',
  },
};

/**
 * Login helper function
 */
export async function login(page: Page, user: TestUser) {
  await page.goto('/auth');

  // Fill in login form
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Click sign in button
  await page.click('button:has-text("Sign In")');

  // Wait for navigation to complete
  await page.waitForURL('**/dashboard**', { timeout: 10000 });

  // Verify we're on the dashboard
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Click the sign out button in the sidebar
  await page.click('button:has-text("Sign Out")');

  // Wait for redirect to auth page
  await page.waitForURL('**/auth', { timeout: 5000 });

  // Verify we're on the auth page
  await expect(page).toHaveURL(/\/auth/);
}

/**
 * Wait for element to be visible
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Check if user is authenticated by verifying cookies
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some(cookie => cookie.name === 'sb-access-token' || cookie.name === 'sb-refresh-token');
}

/**
 * Clear all cookies and storage
 */
export async function clearSession(page: Page) {
  await page.context().clearCookies();
  // Navigate to the app first to avoid localStorage access errors
  try {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (e) {
    // Ignore errors if page isn't navigable yet
  }
}
