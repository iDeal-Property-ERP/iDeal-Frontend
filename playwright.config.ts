import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ?? '3008';
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  testMatch: '*.@(integ|e2e).?(c|m)[jt]s?(x)',
  timeout: 30 * 1000,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',

  expect: {
    timeout: 15 * 1000,
  },

  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev:next',
    url: baseURL,
    timeout: 60 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      BROWSER_TO_TERMINAL_DISABLED: 'true',
      NEXT_PUBLIC_APP_URL: baseURL,
      PORT,
    },
  },

  use: {
    baseURL,
    trace: process.env.CI ? 'on' : 'retain-on-failure',
    video: process.env.CI ? 'retain-on-failure' : undefined,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(process.env.CI
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
        ]
      : []),
  ],
});
