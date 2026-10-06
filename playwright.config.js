import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'test', testMatch: /e2e\.spec\.js/,
  webServer: { command: 'python3 -m http.server 4173', url: 'http://localhost:4173', reuseExistingServer: true },
  use: { baseURL: 'http://localhost:4173' },
});
