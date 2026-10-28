import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: 'list',
  webServer: process.env.CI ? [
    {
      command: 'npm start --prefix ../backend',
      url: 'http://127.0.0.1:8000/api/teachers',
      timeout: 30000,
      env: { ...process.env, NIMKAT_OTP_IP_LIMIT: process.env.NIMKAT_OTP_IP_LIMIT || '500' },
    },
    { command: 'npm start', url: 'http://localhost:5173', timeout: 60000 },
  ] : undefined,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.CHROMIUM_EXECUTABLE_PATH ? {
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
      // Only the test browser: allow the loopback cross-site iframe fixture. Cookie/security policy is not disabled.
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-features=LocalNetworkAccessChecks'],
    } : {},
  },
});
