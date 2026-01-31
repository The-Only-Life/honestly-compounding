# Playwright Integration Tests

This directory contains end-to-end integration tests for the Honestly Compounding application using Playwright.

## Setup

### Prerequisites
- Bun installed
- Application running locally on `http://localhost:8080`
- Test database with test users set up

### Installation
Playwright is already installed as a dev dependency. If you need to reinstall browsers:

```bash
bunx playwright install
```

## Running Tests

### Run all tests (headless)
```bash
bun test
```

### Run tests with UI mode (recommended for development)
```bash
bun test:ui
```

### Run tests in headed mode (see browser)
```bash
bun test:headed
```

### Run tests in debug mode
```bash
bun test:debug
```

### View test report
```bash
bun test:report
```

### Run specific test file
```bash
bunx playwright test tests/auth/login.spec.ts
```

### Run tests in specific browser
```bash
bunx playwright test --project=chromium
bunx playwright test --project=firefox
bunx playwright test --project=webkit
```

## Test Structure

```
tests/
├── auth/                 # Authentication tests
│   └── login.spec.ts    # Login/logout tests
├── utils/               # Test utilities and helpers
│   └── auth-helpers.ts  # Authentication helper functions
└── README.md            # This file
```

## Test Users

Before running tests, you need to set up test users in your test database. Update the credentials in `tests/utils/auth-helpers.ts`:

```typescript
export const TEST_USERS = {
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
```

## Environment Configuration

Tests use the base URL configured in `playwright.config.ts`:
- Default: `http://localhost:8080`
- Override with environment variable: `PLAYWRIGHT_BASE_URL=https://your-app.com`

## Writing New Tests

### Example test structure:
```typescript
import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from '../utils/auth-helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await login(page, TEST_USERS.admin);
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await page.goto('/some-page');
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

## Best Practices

1. **Use helper functions** - Reuse authentication, navigation, and common actions
2. **Use data-testid** - Add `data-testid` attributes to elements for stable selectors
3. **Wait for elements** - Use Playwright's auto-waiting, avoid arbitrary timeouts
4. **Clean state** - Clear cookies and storage between tests
5. **Test one thing** - Each test should verify one specific behavior
6. **Descriptive names** - Use clear test names that describe what's being tested

## Debugging Tips

1. **Use UI Mode**: `bun test:ui` - Best way to debug tests interactively
2. **Use Debug Mode**: `bun test:debug` - Step through tests
3. **Screenshots**: Automatically captured on failure in `test-results/`
4. **Videos**: Recorded on failure, available in `test-results/`
5. **Traces**: View in Playwright trace viewer after failure

## CI/CD Integration

Tests are configured to run in CI with:
- Retry on failure (2 retries)
- Single worker (no parallelization)
- HTML reporter for results

## Coverage

Refer to `TESTING.md` for the complete testing plan and checklist.

## Troubleshooting

### Tests fail with timeout
- Ensure dev server is running
- Increase timeout in `playwright.config.ts`
- Check network connectivity

### Authentication fails
- Verify test user credentials are correct
- Check that test users exist in database
- Ensure users have required permissions

### Selectors not found
- Check if UI has changed
- Use more stable selectors (data-testid)
- Use Playwright inspector to find correct selectors
