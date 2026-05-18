import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('login page loads with all elements', async ({ page }) => {
        await expect(page).toHaveTitle(/Qomrade|Comrade/i);
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('login page shows error for empty fields', async ({ page }) => {
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Email is required')).toBeVisible();
        await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('login page shows error for invalid email', async ({ page }) => {
        await page.fill('input[name="email"]', 'not-an-email');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=valid email')).toBeVisible();
    });

    test('login requires terms acceptance', async ({ page }) => {
        await page.fill('input[name="email"]', 'user@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Terms of Service')).toBeVisible();
    });

    test('navigation to registration page', async ({ page }) => {
        await page.click('a[href*="register"], text=Sign up, text=Create account');
        await expect(page).toHaveURL(/register/);
    });

    test('navigation to forgot password page', async ({ page }) => {
        await page.click('a[href*="forgot-password"], text=Forgot, text=Reset');
        await expect(page).toHaveURL(/forgot-password/);
    });
});

test.describe('Registration Flow', () => {
    test('registration page loads', async ({ page }) => {
        await page.goto('/register');
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await expect(page.locator('input[name="first_name"]')).toBeVisible();
    });

    test('registration shows error for password mismatch', async ({ page }) => {
        await page.goto('/register');
        await page.fill('input[name="email"]', 'new@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.fill('input[name="password2"]', 'different');
        await page.fill('input[name="first_name"]', 'New');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=password')).toBeVisible();
    });
});

test.describe('Public Pages', () => {
    test('landing page loads', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Qomrade|Comrade/i);
    });

    test('privacy page loads', async ({ page }) => {
        await page.goto('/privacy');
        await expect(page.locator('text=privacy', { exact: false })).toBeVisible();
    });

    test('terms page loads', async ({ page }) => {
        await page.goto('/terms');
        await expect(page.locator('text=terms', { exact: false })).toBeVisible();
    });

    test('help page loads', async ({ page }) => {
        await page.goto('/help');
        await expect(page).toHaveURL(/help/);
    });
});

test.describe('Protected Routes Redirect', () => {
    test('dashboard redirects to login when not authenticated', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/login/);
    });

    test('settings redirects to login when not authenticated', async ({ page }) => {
        await page.goto('/settings');
        await expect(page).toHaveURL(/login/);
    });

    test('payments redirects to login when not authenticated', async ({ page }) => {
        await page.goto('/payments');
        await expect(page).toHaveURL(/login/);
    });
});

test.describe('Responsive Design', () => {
    test('login page is responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/login');
        await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('login page is responsive on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/login');
        await expect(page.locator('input[name="email"]')).toBeVisible();
    });
});
