import { test, expect } from '@playwright/test';
import { login, logout, TEST_USERS, clearSession } from '../utils/auth-helpers';

test.describe('Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session before each test
    await clearSession(page);
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/auth');

    // Check page title
    await expect(page).toHaveTitle(/Honestly Compounding/);

    // Verify login form elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();

    // Verify waitlist section is present
    await expect(page.locator('text=/join.*waitlist/i')).toBeVisible();
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await page.goto('/auth');

    // Try to submit without filling fields
    await page.click('button:has-text("Sign In")');

    // Check for HTML5 validation or error messages
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth');

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Click sign in
    await page.click('button:has-text("Sign In")');

    // Wait for error message (toast or inline error)
    // Adjust selector based on your error display method
    await expect(page.locator('text=/invalid.*credentials|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login as admin user', async ({ page }) => {
    await login(page, TEST_USERS.admin);

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify admin-specific elements are visible
    await expect(page.locator('text=/admin/i')).toBeVisible();

    // Verify user menu or sidebar is visible
    await expect(page.locator('text=/user management|users/i')).toBeVisible();
  });

  test('should successfully login as sponsor user', async ({ page }) => {
    await login(page, TEST_USERS.sponsor);

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify sponsor role is displayed
    await expect(page.locator('text=/sponsor/i')).toBeVisible();
  });

  test('should successfully login as subscriber user', async ({ page }) => {
    await login(page, TEST_USERS.subscriber);

    // Verify we're on the dashboard or awaiting approval page
    await expect(page).toHaveURL(/\/dashboard|awaiting/);
  });

  test('should successfully logout', async ({ page }) => {
    // Login first
    await login(page, TEST_USERS.admin);

    // Logout
    await logout(page);

    // Verify we're back on the auth page
    await expect(page).toHaveURL(/\/auth/);

    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should persist session on page reload', async ({ page }) => {
    // Login
    await login(page, TEST_USERS.admin);

    // Reload the page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=/admin/i')).toBeVisible();
  });

  test('should redirect to dashboard if already logged in', async ({ page }) => {
    // Login
    await login(page, TEST_USERS.admin);

    // Try to access auth page
    await page.goto('/auth');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
