import { defineConfig } from '@playwright/test';

/**
 * E2E de la distribución de la App Android y salud de la plataforma.
 * Por defecto apunta al servidor FastAPI (que sirve la Web compilada + la API,
 * igual que en producción). Sobrescribe con E2E_BASE_URL si usas otro origen.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:8000',
    locale: 'es-ES',
  },
});
