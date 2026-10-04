import { defineConfig, devices } from '@playwright/test';

// Overridable so several plugin repos' suites can run side by side without silently
// attaching to each other's already-running dev server (reuseExistingServer below).
const port = Number(process.env.EX_E2E_PORT ?? 4173);

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  // Software (swiftshader) rendering makes these GPU-bound; 2 workers balances speed vs.
  // stability - override with --workers if your machine has more headroom.
  workers: 2,
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    screenshot: 'off',
    trace: 'off'
  },
  webServer: {
    command: `npx vite sample --port ${port} --strictPort`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Match Excalibur core's e2e/visual suite rendering args so screenshots are
        // deterministic across machines/OSes.
        launchOptions: {
          ignoreDefaultArgs: ['--disable-render-backgrounding', '--disable-remote-fonts', '--font-render-hinting'],
          args: [
            '--no-default-browser-check',
            '--no-first-run',
            '--disable-default-apps',
            '--disable-popup-blocking',
            '--disable-translate',
            '--disable-background-timer-throttling',
            '--disable-dev-shm-usage',
            '--disable-renderer-backgrounding',
            '--disable-device-discovery-notifications',
            '--autoplay-policy=no-user-gesture-required',
            '--mute-audio',
            '--force-device-scale-factor=1',
            '--use-gl=swiftshader'
          ]
        }
      }
    }
  ]
});
